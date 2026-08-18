import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { SiweMessage, generateNonce } from "siwe";

// Lazy-initialized Gemini instance
let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.error("Failed to initialize Gemini AI", e);
    }
  }
  return ai;
}

// JWT Secret with fallback
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "uniswapx-secure-session-key-v3-prod";
const JWT_EXPIRY = "7d";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Persistent Session Record Schema
export interface UserSessionRecord {
  sessionId: string;
  address: string;
  chainId: number;
  jwtToken?: string;
  verifiedAt: number;
  expiresAt: number;
  lastActiveAt: number;
  userAgent?: string;
  ip?: string;
}

// Persistent File-backed / In-Memory Session Store for multi-user isolation
class PersistentSessionStore {
  private sessions: Map<string, UserSessionRecord> = new Map();
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), '.sessions.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data: Record<string, UserSessionRecord> = JSON.parse(raw);
        const now = Date.now();
        for (const [id, session] of Object.entries(data)) {
          if (session && session.expiresAt > now) {
            this.sessions.set(id, session);
          }
        }
      }
    } catch (err) {
      console.warn('[SessionStore] Could not load persisted sessions from disk, using fresh in-memory store:', err);
    }
  }

  private saveToDisk() {
    try {
      const obj: Record<string, UserSessionRecord> = {};
      for (const [id, session] of this.sessions.entries()) {
        obj[id] = session;
      }
      fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[SessionStore] Could not persist sessions to disk:', err);
    }
  }

  public set(sessionId: string, session: UserSessionRecord) {
    this.sessions.set(sessionId, session);
    this.saveToDisk();
  }

  public get(sessionId: string): UserSessionRecord | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      this.saveToDisk();
      return undefined;
    }
    // Update lastActiveAt
    session.lastActiveAt = Date.now();
    return session;
  }

  public getByAddress(address: string): UserSessionRecord[] {
    const now = Date.now();
    const result: UserSessionRecord[] = [];
    for (const session of this.sessions.values()) {
      if (session.address.toLowerCase() === address.toLowerCase() && session.expiresAt > now) {
        result.push(session);
      }
    }
    return result;
  }

  public delete(sessionId: string) {
    this.sessions.delete(sessionId);
    this.saveToDisk();
  }

  public prune() {
    const now = Date.now();
    let modified = false;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        modified = true;
      }
    }
    if (modified) this.saveToDisk();
  }
}

const sessionStore = new PersistentSessionStore();
setInterval(() => sessionStore.prune(), 10 * 60 * 1000);

// Nonce store with TTL
interface NonceEntry {
  createdAt: number;
  expiresAt: number;
}
const activeNonces = new Map<string, NonceEntry>();
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function pruneExpiredNonces() {
  const now = Date.now();
  for (const [nonce, data] of activeNonces.entries()) {
    if (now > data.expiresAt) {
      activeNonces.delete(nonce);
    }
  }
}
setInterval(pruneExpiredNonces, 60 * 1000);

// Helper to extract session token / JWT from request
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const customHeader = req.headers["x-session-id"] as string;
  if (customHeader) {
    return customHeader.trim();
  }
  const jwtHeader = req.headers["x-jwt-token"] as string;
  if (jwtHeader) {
    return jwtHeader.trim();
  }
  if (typeof req.query.sessionId === "string") {
    return req.query.sessionId.trim();
  }
  if (typeof req.query.token === "string") {
    return req.query.token.trim();
  }
  return null;
}

export const app = express();

// Trust reverse proxy (Cloud Run / Nginx) so client IP is accurately extracted
app.set("trust proxy", 1);

// Rate limiting with express-rate-limit
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  message: {
    error: "Too many requests from this IP, please try again later."
  }
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  message: {
    error: "Too many authentication attempts, please try again later."
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  message: {
    error: "AI rate limit reached. Please wait a moment before sending more queries."
  }
});

// Security Configuration - Compatible with AI Studio iframe preview and Web3 wallets
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Vite dev tooling and custom Web3 RPCs
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false, // Managed below to allow Web3 wallet popups
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: true },
    frameguard: false, // Required for iframe rendering in AI Studio preview
    hidePoweredBy: true,
    hsts: false,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  })
);

// Explicitly set COOP header to unsafe-none for Coinbase Smart Wallet and Base Account popups
app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use("/api/", generalApiLimiter);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    uptime: process.uptime(),
    multiUserAuth: "jwt-database-backed"
  });
});

// SIWE - Generate Nonce
app.get("/api/siwe/nonce", authLimiter, (_req, res) => {
  const nonce = generateNonce();
  const now = Date.now();
  activeNonces.set(nonce, {
    createdAt: now,
    expiresAt: now + NONCE_TTL_MS,
  });
  res.json({ nonce });
});

// SIWE - Verify Signature, issue JWT & Create Database-backed Multi-User Session
app.post("/api/siwe/verify", authLimiter, async (req, res) => {
  try {
    const { message, signature } = req.body;
    if (!message || !signature) {
      return res.status(400).json({ error: "Missing message or signature in request body" });
    }

    const siweMessage = new SiweMessage(message);
    const nonce = siweMessage.nonce;

    // Validate nonce existence & TTL
    const nonceEntry = activeNonces.get(nonce);
    if (!nonceEntry || Date.now() > nonceEntry.expiresAt) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired SIWE nonce. Please request a fresh nonce.",
      });
    }

    // Single-use nonce: delete after consumption
    activeNonces.delete(nonce);

    // Verify cryptographic signature
    const result = await siweMessage.verify({
      signature,
    });

    if (!result.success) {
      return res.status(401).json({ error: "SIWE signature verification failed", success: false });
    }

    const address = result.data.address;
    const chainId = result.data.chainId;
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + SESSION_TTL_MS;

    // Generate signed JWT token
    const token = jwt.sign(
      {
        sub: address,
        address,
        chainId,
        sessionId,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRY,
        issuer: "uniswapx-dex",
      }
    );

    const sessionRecord: UserSessionRecord = {
      sessionId,
      address,
      chainId,
      jwtToken: token,
      verifiedAt: now,
      expiresAt,
      lastActiveAt: now,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.socket.remoteAddress,
    };

    sessionStore.set(sessionId, sessionRecord);

    res.json({
      success: true,
      token,
      sessionId,
      address,
      chainId,
      verifiedAt: sessionRecord.verifiedAt,
      expiresAt: sessionRecord.expiresAt,
    });
  } catch (error: any) {
    console.error("SIWE Verification Error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to verify SIWE signature",
    });
  }
});

// SIWE - Verify JWT / Session Status for Requesting Client
app.get("/api/siwe/me", (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.json({ authenticated: false });
  }

  // 1. First attempt JWT verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.sessionId) {
      const session = sessionStore.get(decoded.sessionId);
      if (session) {
        return res.json({
          authenticated: true,
          session: {
            address: session.address,
            chainId: session.chainId,
            verifiedAt: session.verifiedAt,
            expiresAt: session.expiresAt,
          },
        });
      }
    }
  } catch (jwtErr) {
    // If not a JWT, fallback to raw session ID lookup
  }

  // 2. Direct session ID lookup fallback
  const session = sessionStore.get(token);
  if (!session) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    session: {
      address: session.address,
      chainId: session.chainId,
      verifiedAt: session.verifiedAt,
      expiresAt: session.expiresAt,
    },
  });
});

// SIWE - Logout Client Session
const handleLogout = (req: Request, res: Response) => {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.sessionId) {
        sessionStore.delete(decoded.sessionId);
      }
    } catch {
      // ignore
    }
    sessionStore.delete(token);
  }
  res.json({ success: true });
};

app.post("/api/siwe/logout", handleLogout);
app.get("/api/siwe/logout", handleLogout);

// API route for AI assistant
app.post("/api/ask", aiLimiter, async (req, res) => {
  try {
    const aiInstance = getAI();
    if (!aiInstance) {
      return res.status(500).json({ error: "Gemini API key not configured on server." });
    }

    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        thinkingConfig: {
          thinkingBudget: 1024,
        },
        systemInstruction: 'You are a DeFi trading assistant on UniswapX. Help users with complex crypto trading strategies, token analysis, and DEX mechanics. Be concise and professional.',
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || "Failed to process request" });
  }
});

export default app;

