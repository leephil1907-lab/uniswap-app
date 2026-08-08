import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { SiweMessage, generateNonce } from "siwe";

// Initialize Gemini with server-side environment variable
// Do NOT use VITE_ prefix for this secret key
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.error("Failed to initialize Gemini AI", e);
}

// In-memory SIWE sessions and active nonces
const activeNonces = new Set<string>();
let activeSiweSession: {
  address: string;
  chainId: number;
  verifiedAt: number;
} | null = null;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check endpoint for Cloud Run container probes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // SIWE - Generate Nonce
  app.get("/api/siwe/nonce", (req, res) => {
    const nonce = generateNonce();
    activeNonces.add(nonce);
    res.json({ nonce });
  });

  // SIWE - Verify Signature
  app.post("/api/siwe/verify", async (req, res) => {
    try {
      const { message, signature } = req.body;
      if (!message || !signature) {
        return res.status(400).json({ error: "Missing message or signature in request body" });
      }

      const siweMessage = new SiweMessage(message);
      
      // Verify signature and nonce
      const result = await siweMessage.verify({
        signature,
      });

      if (!result.success) {
        return res.status(401).json({ error: "SIWE signature verification failed", success: false });
      }

      // Record verified session
      activeSiweSession = {
        address: result.data.address,
        chainId: result.data.chainId,
        verifiedAt: Date.now(),
      };

      res.json({
        success: true,
        address: result.data.address,
        chainId: result.data.chainId,
        verifiedAt: activeSiweSession.verifiedAt,
      });
    } catch (error: any) {
      console.error("SIWE Verification Error:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to verify SIWE signature",
      });
    }
  });

  // SIWE - Current Session Status
  app.get("/api/siwe/me", (req, res) => {
    if (activeSiweSession) {
      res.json({
        authenticated: true,
        session: activeSiweSession,
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // SIWE - Logout
  app.post("/api/siwe/logout", (req, res) => {
    activeSiweSession = null;
    res.json({ success: true });
  });

  // API route to handle AI assistant requests securely
  app.post("/api/ask", async (req, res) => {
    try {
      if (!ai) {
         return res.status(500).json({ error: "Gemini API key not configured on server." });
      }
      
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const response = await ai.models.generateContent({
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
