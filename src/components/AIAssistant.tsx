import { useState, useEffect, useRef } from 'react';
import { X, Send, UserCheck, Sparkles, User, RefreshCw, ShieldAlert, CheckCircle2, MessageSquareText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UnicornLogo from './common/UnicornLogo';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: string;
}

interface SupportTicket {
  ticketId: string;
  userName: string;
  userAddress?: string;
  status: 'active' | 'escalated' | 'resolved';
  createdAt: string;
  messages: ChatMessage[];
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [ticketId, setTicketId] = useState<string>('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: "👋 Welcome to Uniswap Support! I'm your protocol specialist powered by Uniswap V4 intelligence. Ask me about swaps, concentrated liquidity, slippage settings, or wallet connections.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Sync ticket with localStorage & listen for Admin replies
  useEffect(() => {
    let currentTicketId = localStorage.getItem('uniswap_active_user_ticket_id');
    if (!currentTicketId) {
      currentTicketId = 'TICKET-' + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem('uniswap_active_user_ticket_id', currentTicketId);
    }
    setTicketId(currentTicketId);

    const checkAdminReplies = () => {
      try {
        const savedTicketsRaw = localStorage.getItem('uniswap_support_tickets');
        if (savedTicketsRaw) {
          const tickets: SupportTicket[] = JSON.parse(savedTicketsRaw);
          const myTicket = tickets.find(t => t.ticketId === currentTicketId);
          if (myTicket) {
            setMessages(myTicket.messages);
            if (myTicket.status === 'escalated') {
              setIsEscalated(true);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    };

    checkAdminReplies();
    const interval = setInterval(checkAdminReplies, 1500);
    window.addEventListener('storage', checkAdminReplies);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkAdminReplies);
    };
  }, []);

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Helper to persist ticket to localStorage so Admin Dashboard can view and respond
  const persistTicket = (updatedMessages: ChatMessage[], escalated: boolean) => {
    try {
      const savedTicketsRaw = localStorage.getItem('uniswap_support_tickets');
      let tickets: SupportTicket[] = savedTicketsRaw ? JSON.parse(savedTicketsRaw) : [];
      
      const existingIdx = tickets.findIndex(t => t.ticketId === ticketId);
      const updatedTicket: SupportTicket = {
        ticketId,
        userName: 'User ' + ticketId.slice(-4),
        status: escalated ? 'escalated' : 'active',
        createdAt: new Date().toLocaleDateString(),
        messages: updatedMessages
      };

      if (existingIdx >= 0) {
        tickets[existingIdx] = updatedTicket;
      } else {
        tickets.unshift(updatedTicket);
      }

      localStorage.setItem('uniswap_support_tickets', JSON.stringify(tickets));
      // Notify other tabs (like Admin Page)
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      // ignore
    }
  };

  // Immediate Knowledge Engine for Uniswap Queries
  const getUniswapKnowledgeResponse = (query: string): { reply: string; shouldEscalate: boolean } => {
    const q = query.toLowerCase();

    // Urgent Escalation Triggers
    if (q.includes('admin') || q.includes('human') || q.includes('agent') || q.includes('urgent') || q.includes('support') || q.includes('stuck') || q.includes('refund') || q.includes('lost') || q.includes('dispute') || q.includes('error')) {
      return {
        reply: "🚨 Requesting immediate attention! I have escalated your query directly to the Uniswap Admin Dashboard. An authorized Admin has been notified and will assist you directly in this live chat.",
        shouldEscalate: true
      };
    }

    if (q.includes('swap') || q.includes('trade') || q.includes('how to')) {
      return {
        reply: "🔄 **How to Swap on Uniswap:**\n1. Select your source token (e.g., ETH) and destination token (e.g., USDC).\n2. Enter the amount to trade.\n3. Click the Settings gear icon ⚙️ to adjust max slippage tolerance (0.1% to 1.0%).\n4. Click 'Swap' and sign the transaction in your connected wallet.",
        shouldEscalate: false
      };
    }

    if (q.includes('slippage') || q.includes('deadline')) {
      return {
        reply: "⚙️ **Slippage & Deadline Settings:**\n- **Slippage Tolerance**: The maximum percentage price change you're willing to accept (default is 0.5% auto).\n- **Transaction Deadline**: The maximum minutes a pending transaction can stay in the mempool before reverting to protect your funds.",
        shouldEscalate: false
      };
    }

    if (q.includes('pool') || q.includes('liquidity') || q.includes('v3') || q.includes('v4')) {
      return {
        reply: "💧 **Uniswap Concentrated Liquidity:**\n- **V3 Pools**: Provide liquidity within custom price bounds to earn up to 4000x higher capital efficiency.\n- **Fee Tiers**: 0.01% (Stablecoins), 0.05% (Major pairs), 0.3% (Volatile pairs), 1.0% (Exotic tokens).\n- **V4 Hooks**: Custom plugins enabling dynamic fees, limit orders, and automated liquidity rebalancing.",
        shouldEscalate: false
      };
    }

    if (q.includes('wallet') || q.includes('connect') || q.includes('metamask') || q.includes('siwe')) {
      return {
        reply: "👛 **Wallet Connection & SIWE Auth:**\n- Click 'Get started' in the top right header to connect via Reown AppKit (supports MetaMask, Coinbase Wallet, WalletConnect, and 300+ Web3 wallets).\n- In the Admin Console, click 'Sign EIP-4361 Admin Message' to authenticate cryptographic ownership.",
        shouldEscalate: false
      };
    }

    if (q.includes('fee') || q.includes('zero') || q.includes('cost')) {
      return {
        reply: "🎉 **Zero App Fees:**\n- Uniswap charges 0.00% protocol app fees for trading natively on our interface across 21+ EVM networks including Unichain, Base, Arbitrum, and Ethereum mainnet.",
        shouldEscalate: false
      };
    }

    return {
      reply: "🦄 **Uniswap Protocol Info:**\nUniswap is the world's leading decentralized automated market maker (AMM). You can trade top tokens, inspect concentrated liquidity pools in the Pools tab, or view token analytics in the Explore tab. If you need urgent assistance, click 'Transfer to Admin Support' below!",
      shouldEscalate: false
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // If already escalated to admin, save to ticket for admin to reply
    if (isEscalated) {
      persistTicket(newMessages, true);
      return;
    }

    setLoading(true);

    // Get immediate response
    setTimeout(() => {
      const { reply, shouldEscalate } = getUniswapKnowledgeResponse(userText);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      setLoading(false);

      if (shouldEscalate) {
        setIsEscalated(true);
        persistTicket(finalMessages, true);
      } else {
        persistTicket(finalMessages, false);
      }
    }, 400);
  };

  const handleManualEscalate = () => {
    setIsEscalated(true);
    const systemMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      text: "🚨 You have requested direct transfer to Admin Support. Your ticket has been dispatched to the Admin Dashboard. An admin will chat with you shortly!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...messages, systemMsg];
    setMessages(updated);
    persistTicket(updated, true);
  };

  return (
    <>
      {/* Floating Draggable UNICORN 🦄 Logo Chat Trigger Button */}
      <motion.button 
        drag
        dragMomentum={false}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 bg-gradient-to-tr from-accent to-pink-500 text-white rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(252,12,151,0.5)] z-50 cursor-grab active:cursor-grabbing border-2 border-white/20 group touch-none hover:scale-105 transition-transform"
        title="Uniswap AI & Live Support Chat (Drag to move)"
      >
        <div className="relative flex items-center justify-center pointer-events-none">
          {/* Unicorn 🦄 SVG Logo */}
          <UnicornLogo size={28} className="text-white drop-shadow-md" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-surface" />
        </div>
      </motion.button>

      {/* Main Chat Bot Modal */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] max-w-[380px] sm:w-[400px] h-[500px] bg-surface border border-border/80 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col font-body"
          >
            {/* Header with UNICORN 🦄 Logo Avatar & Status */}
            <div className="bg-gradient-to-r from-surface-2 to-surface p-4 border-b border-border/60 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {/* Unicorn Logo Avatar */}
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent to-pink-500 border border-white/20 flex items-center justify-center text-white shadow-md relative">
                  <UnicornLogo size={24} className="text-white drop-shadow-sm" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-surface" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                    Uniswap Support
                    {isEscalated && (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                        Admin Live
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isEscalated ? 'Transferred to Admin Console' : 'Uniswap Technical Assistant'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setOpen(false)} 
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-surface-2/30">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-text-tertiary">
                    {msg.sender === 'user' ? (
                      <span className="font-semibold text-text-secondary">You</span>
                    ) : msg.sender === 'admin' ? (
                      <span className="font-bold text-accent flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Admin Staff
                      </span>
                    ) : (
                      <span className="font-bold text-pink-400 flex items-center gap-1">
                        🦄 Uniswap Bot
                      </span>
                    )}
                    <span>• {msg.timestamp}</span>
                  </div>

                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-accent text-white rounded-br-none font-medium'
                      : msg.sender === 'admin'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-text-primary rounded-bl-none font-medium'
                      : 'bg-surface border border-border/80 text-text-primary rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-accent text-xs p-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Consulting protocol knowledge base...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Admin Escalation Bar & Input Form */}
            <div className="p-3 border-t border-border/60 bg-surface flex flex-col gap-2">
              {!isEscalated && (
                <button
                  onClick={handleManualEscalate}
                  className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold py-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Transfer to Admin Support Console
                </button>
              )}

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isEscalated ? "Type message to live Admin..." : "Ask Uniswap bot a question..."}
                  className="flex-1 bg-surface-2 border border-border/80 rounded-2xl px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent"
                />
                <button 
                  onClick={handleSendMessage} 
                  disabled={loading || !input.trim()}
                  className="bg-accent text-white p-2.5 rounded-2xl hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
