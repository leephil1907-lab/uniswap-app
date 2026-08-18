import { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Lock, CheckCircle2, Users, Plus, Trash2,
  MessageSquare, Send, ArrowUpRight, BarChart3, Layers, Compass, Wallet, Zap, RefreshCw, Sparkles
} from 'lucide-react';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import { useBalance } from 'wagmi';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';


interface Signatory {
  id: string;
  address: string;
  label: string;
  addedAt: string;
}

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

export default function AdminPage() {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { data: balanceData } = useBalance({ address: address as `0x${string}` | undefined });

  const [activeTab, setActiveTab] = useState<'support' | 'signatories' | 'protocol'>('support');
  const [copied, setCopied] = useState(false);
  const [newSignatoryAddress, setNewSignatoryAddress] = useState('');
  const [newSignatoryLabel, setNewSignatoryLabel] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Signatory list
  const [signatories, setSignatories] = useState<Signatory[]>(() => {
    const saved = localStorage.getItem('admin_signatories_list');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const DEPLOYER_ADDRESS = "0xEfc5859335A58d64A5e8E01d02c5241c852CBD40";
  const isDeployer = Boolean(address && address.toLowerCase() === DEPLOYER_ADDRESS.toLowerCase());
  const isSignatory = Boolean(address && signatories.some(s => s.address.toLowerCase() === address.toLowerCase()));
  const isAuthorized = isDeployer || isSignatory;


  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReplyInput, setAdminReplyInput] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync tickets from localStorage
  const loadTickets = () => {
    try {
      const saved = localStorage.getItem('uniswap_support_tickets');
      if (saved) {
        const parsed: SupportTicket[] = JSON.parse(saved);
        setTickets(parsed);
        if (parsed.length > 0 && !selectedTicketId) {
          setSelectedTicketId(parsed[0].ticketId);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    localStorage.setItem('admin_signatories_list', JSON.stringify(signatories));
  }, [signatories]);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 1500);
    window.addEventListener('storage', loadTickets);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadTickets);
    };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tickets, selectedTicketId]);

  const activeTicket = tickets.find(t => t.ticketId === selectedTicketId) || tickets[0];

  const handleSendAdminReply = () => {
    if (!adminReplyInput.trim() || !activeTicket) return;

    const replyMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'admin',
      text: adminReplyInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedTickets = tickets.map(t => {
      if (t.ticketId === activeTicket.ticketId) {
        return {
          ...t,
          status: 'escalated' as const,
          messages: [...t.messages, replyMsg]
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    localStorage.setItem('uniswap_support_tickets', JSON.stringify(updatedTickets));
    window.dispatchEvent(new Event('storage'));
    setAdminReplyInput('');
    setStatusMessage(`Replied to ticket ${activeTicket.ticketId}`);
  };

  const handleResolveTicket = (tId: string) => {
    const updatedTickets = tickets.map(t => {
      if (t.ticketId === tId) {
        return { ...t, status: 'resolved' as const };
      }
      return t;
    });
    setTickets(updatedTickets);
    localStorage.setItem('uniswap_support_tickets', JSON.stringify(updatedTickets));
    window.dispatchEvent(new Event('storage'));
    setStatusMessage(`Ticket ${tId} marked as resolved.`);
  };

  const handleAddSignatory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignatoryAddress.trim().startsWith('0x') || newSignatoryAddress.trim().length !== 42) {
      setStatusMessage('Error: Please enter a valid EVM wallet address (0x...)');
      return;
    }

    const newSig: Signatory = {
      id: Date.now().toString(),
      address: newSignatoryAddress.trim(),
      label: newSignatoryLabel.trim() || 'Authorized Signatory',
      addedAt: new Date().toLocaleDateString(),
    };

    setSignatories(prev => [...prev, newSig]);
    setNewSignatoryAddress('');
    setNewSignatoryLabel('');
    setStatusMessage(`Added signatory ${newSig.address.slice(0, 6)}...${newSig.address.slice(-4)} successfully.`);
  };

  const handleRemoveSignatory = (id: string) => {
    setSignatories(prev => prev.filter(s => s.id !== id));
    setStatusMessage('Signatory removed.');
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-12 pb-24 font-body flex flex-col items-center justify-center text-center">
        <div className="bg-surface border border-red-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden max-w-xl w-full">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <span className="text-xs font-bold text-red-400 uppercase tracking-widest px-3.5 py-1 bg-red-500/10 rounded-full border border-red-500/20">
            403 Access Denied
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary mt-4">
            Restricted Admin Console
          </h1>

          <p className="text-text-secondary text-sm mt-2 leading-relaxed">
            This administrative control panel is strictly reserved for the protocol deployer address (<code className="text-accent font-mono text-xs bg-surface-2 px-1.5 py-0.5 rounded border border-border/60">0xEfc5859335A58d64A5e8E01d02c5241c852CBD40</code>).
          </p>

          <div className="mt-6 flex flex-col gap-3 w-full max-w-md mx-auto">
            {!isConnected ? (
              <button
                onClick={() => open()}
                className="w-full bg-accent text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-accent/90 transition-all text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                Connect Deployer Wallet
              </button>
            ) : (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-300 font-mono">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)} (Unauthorized)
              </div>
            )}

            <NavLink
              to="/trade"
              className="mt-4 bg-surface-2 hover:bg-surface border border-border/80 text-text-primary px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              ← Return to Trade / Swap
            </NavLink>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-6 pb-24 font-body">
      
      {/* Admin Hero Header */}
      <div className="bg-surface border border-border/60 rounded-3xl p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Access Admin Management Console</span>
            </div>
            <h1 className="text-3xl font-bold font-display text-text-primary">Master Protocol & Support Control</h1>
            <p className="text-text-secondary text-sm max-w-2xl mt-1">
              Complete administrative authority over live customer support chats, multi-sig signatories, and protocol parameters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={() => open()}
                className="bg-accent text-white font-bold px-6 py-3 rounded-2xl hover:bg-accent/90 transition-all text-sm shadow-md cursor-pointer"
              >
                Connect Admin Wallet
              </button>
            ) : (
              <div className="bg-surface-2/80 px-4 py-3 rounded-2xl border border-border/60 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-tertiary font-semibold uppercase">Super Admin Connected</span>
                  <span className="font-mono text-xs font-bold text-text-primary">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Access Website Shortcuts Bar */}
        <div className="mt-6 pt-5 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <NavLink 
            to="/trade"
            className="p-3 bg-surface-2/60 hover:bg-surface-2 border border-border/60 rounded-2xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-text-primary">Trade / Swap</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-text-tertiary group-hover:text-accent" />
          </NavLink>

          <NavLink 
            to="/explore"
            className="p-3 bg-surface-2/60 hover:bg-surface-2 border border-border/60 rounded-2xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-text-primary">Explore Markets</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-text-tertiary group-hover:text-purple-400" />
          </NavLink>

          <NavLink 
            to="/pools"
            className="p-3 bg-surface-2/60 hover:bg-surface-2 border border-border/60 rounded-2xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-text-primary">Liquidity Pools</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-text-tertiary group-hover:text-blue-400" />
          </NavLink>

          <NavLink 
            to="/portfolio"
            className="p-3 bg-surface-2/60 hover:bg-surface-2 border border-border/60 rounded-2xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-text-primary">User Portfolio</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-text-tertiary group-hover:text-emerald-400" />
          </NavLink>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-2xl text-text-primary text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs text-text-tertiary hover:text-text-primary cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 bg-surface-2/80 p-1.5 rounded-2xl border border-border/60 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('support')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'support' 
              ? "bg-surface text-accent shadow-md border border-border/40" 
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Live User Support Chat</span>
          {tickets.filter(t => t.status === 'escalated').length > 0 && (
            <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.2 rounded-md">
              {tickets.filter(t => t.status === 'escalated').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('signatories')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'signatories' 
              ? "bg-surface text-accent shadow-md border border-border/40" 
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Signatory Whitelist ({signatories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('protocol')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'protocol' 
              ? "bg-surface text-accent shadow-md border border-border/40" 
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Protocol Metrics</span>
        </button>
      </div>

      {/* TAB 1: LIVE USER SUPPORT CHAT CONSOLE */}
      {activeTab === 'support' && (
        <div className="bg-surface border border-border/60 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6">
            <div>
              <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-accent" />
                Live User Chat Support Console
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Monitor incoming support requests escalated from the chatbot and respond directly to users in real time.
              </p>
            </div>
            <button 
              onClick={loadTickets}
              className="px-3.5 py-2 rounded-xl bg-surface-2 border border-border/60 text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Tickets
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-16 bg-surface-2/30 rounded-2xl border border-dashed border-border/60 text-text-secondary text-sm flex flex-col items-center gap-2">
              <Sparkles className="w-8 h-8 text-text-tertiary" />
              <span className="font-bold text-text-primary">No active support tickets</span>
              <span className="text-xs text-text-tertiary">When users ask for admin help in the chatbot, their chats will appear here.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
              
              {/* Ticket Sidebar List */}
              <div className="lg:col-span-1 bg-surface-2/60 border border-border/60 rounded-2xl p-3 flex flex-col gap-2 overflow-y-auto">
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider px-2 py-1">
                  Active Conversations ({tickets.length})
                </span>
                {tickets.map(t => {
                  const isSelected = t.ticketId === (activeTicket?.ticketId);
                  const lastMsg = t.messages[t.messages.length - 1];
                  return (
                    <button
                      key={t.ticketId}
                      onClick={() => setSelectedTicketId(t.ticketId)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1",
                        isSelected
                          ? "bg-surface border-accent shadow-sm"
                          : "bg-surface/50 border-border/40 hover:bg-surface"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-text-primary">{t.userName}</span>
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase",
                          t.status === 'escalated' ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"
                        )}>
                          {t.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-text-tertiary font-mono truncate">
                        {lastMsg ? lastMsg.text : 'No messages'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Chat Conversation & Reply Window */}
              {activeTicket && (
                <div className="lg:col-span-2 bg-surface-2/30 border border-border/60 rounded-2xl flex flex-col overflow-hidden">
                  
                  {/* Active Chat Header */}
                  <div className="bg-surface p-4 border-b border-border/60 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                        <span>{activeTicket.userName}</span>
                        <span className="font-mono text-xs text-text-tertiary">({activeTicket.ticketId})</span>
                      </h3>
                      <span className="text-[11px] text-text-tertiary">Started on {activeTicket.createdAt}</span>
                    </div>

                    <button
                      onClick={() => handleResolveTicket(activeTicket.ticketId)}
                      className="px-3 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Mark as Resolved
                    </button>
                  </div>

                  {/* Messages History Stream */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {activeTicket.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-text-tertiary">
                          <span className="font-bold">
                            {m.sender === 'admin' ? 'Admin Staff (You)' : m.sender === 'user' ? activeTicket.userName : 'Bot'}
                          </span>
                          <span>• {m.timestamp}</span>
                        </div>
                        <div className={cn(
                          "p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed shadow-sm",
                          m.sender === 'admin'
                            ? "bg-accent text-white rounded-br-none font-medium"
                            : "bg-surface border border-border/60 text-text-primary rounded-bl-none"
                        )}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Admin Direct Reply Box */}
                  <div className="p-3 bg-surface border-t border-border/60 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type direct response to user..."
                      value={adminReplyInput}
                      onChange={(e) => setAdminReplyInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendAdminReply()}
                      className="flex-1 bg-surface-2 border border-border/80 rounded-xl px-4 py-2.5 text-xs text-text-primary outline-none focus:border-accent"
                    />
                    <button
                      onClick={handleSendAdminReply}
                      className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-accent/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" /> Send Reply
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIGNATORY WHITELIST */}
      {activeTab === 'signatories' && (
        <div className="bg-surface border border-border/60 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-text-primary font-bold text-xl">
                <Users className="w-5 h-5 text-accent" />
                <span>Authorized Signatory Whitelist</span>
              </div>
              <p className="text-text-secondary text-xs mt-1">
                Manage trusted multi-sig admin wallet addresses allowed to authorize vault actions.
              </p>
            </div>
            <div className="text-xs font-semibold bg-surface-2 px-3.5 py-2 rounded-xl border border-border/40 text-text-secondary self-start sm:self-auto">
              Total Signatories: <span className="text-text-primary font-bold">{signatories.length}</span>
            </div>
          </div>

          <form onSubmit={handleAddSignatory} className="bg-surface-2/60 p-4 rounded-2xl border border-border/40 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary block mb-3">
              Add New Signatory Address
            </span>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="EVM Address (0x...)"
                value={newSignatoryAddress}
                onChange={(e) => setNewSignatoryAddress(e.target.value)}
                className="flex-1 bg-surface border border-border/60 rounded-xl px-4 py-2.5 font-mono text-xs text-text-primary outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="Label (e.g. Primary Treasury)"
                value={newSignatoryLabel}
                onChange={(e) => setNewSignatoryLabel(e.target.value)}
                className="sm:w-64 bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-xs text-text-primary outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="bg-accent text-white font-bold px-5 py-2.5 rounded-xl hover:bg-accent/90 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Signatory
              </button>
            </div>
          </form>

          {signatories.length === 0 ? (
            <div className="text-center py-10 bg-surface-2/30 rounded-2xl border border-dashed border-border/60 text-text-secondary text-sm">
              No signatories added yet. Use the form above to register an authorized admin wallet address.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {signatories.map((sig) => (
                <div
                  key={sig.id}
                  className="bg-surface-2 p-4 rounded-2xl border border-border/40 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold text-xs flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text-primary truncate">{sig.label}</span>
                        <span className="text-[10px] text-text-tertiary bg-surface px-2 py-0.5 rounded-full border border-border/40">
                          Added {sig.addedAt}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-text-secondary truncate block">{sig.address}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveSignatory(sig.id)}
                    className="p-2 text-text-tertiary hover:text-error hover:bg-surface rounded-xl transition-colors cursor-pointer"
                    title="Remove signatory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROTOCOL METRICS */}
      {activeTab === 'protocol' && (
        <div className="bg-surface border border-border/60 rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-bold font-display text-text-primary mb-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Protocol Live Metrics & Contract Parameters
          </h2>
          <p className="text-xs text-text-secondary mb-6">
            Real-time telemetry across standard Uniswap V3 concentrated liquidity routers and V4 hooks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-surface-2 p-4 rounded-2xl border border-border/40">
              <span className="text-xs text-text-tertiary uppercase font-semibold">Universal Router</span>
              <p className="text-xs font-mono font-bold text-accent mt-1">0xF02D24...C091</p>
            </div>
            <div className="bg-surface-2 p-4 rounded-2xl border border-border/40">
              <span className="text-xs text-text-tertiary uppercase font-semibold">Active Fee Tier</span>
              <p className="text-base font-bold text-emerald-400 mt-1">0.00% App Fee</p>
            </div>
            <div className="bg-surface-2 p-4 rounded-2xl border border-border/40">
              <span className="text-xs text-text-tertiary uppercase font-semibold">Liquidity Pool Vault</span>
              <p className="text-xs font-mono font-bold text-purple-400 mt-1">0x3fC91A...1012</p>
            </div>
            <div className="bg-surface-2 p-4 rounded-2xl border border-border/40">
              <span className="text-xs text-text-tertiary uppercase font-semibold">Health Index</span>
              <p className="text-base font-bold text-green-400 mt-1">100% Operational</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
