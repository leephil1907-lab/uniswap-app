import { useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ExternalLink, X, Copy, Check, Info } from 'lucide-react';
import UnicornLogo from './UnicornLogo';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  txHash?: string;
  tokenInSymbol?: string;
  tokenOutSymbol?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastData = { ...toast, id };
    
    setToasts((prev) => [newToast, ...prev].slice(0, 4)); // keep max 4

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-20 right-4 sm:right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <SingleToast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function SingleToast({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopyTx = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toast.txHash) {
      navigator.clipboard.writeText(toast.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="pointer-events-auto w-full p-4 rounded-2xl bg-surface/90 dark:bg-surface/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_10px_35px_rgba(252,12,151,0.2)] flex items-start gap-3.5 relative overflow-hidden"
    >
      {/* Subtle top ambient bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          toast.type === 'success'
            ? 'bg-gradient-to-r from-emerald-500 via-accent to-pink-500'
            : toast.type === 'error'
            ? 'bg-gradient-to-r from-red-500 to-amber-500'
            : 'bg-gradient-to-r from-accent to-purple-500'
        }`}
      />

      {/* Icon */}
      <div className="mt-0.5 shrink-0">
        {toast.type === 'success' ? (
          <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        ) : toast.type === 'error' ? (
          <div className="p-2 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        ) : (
          <div className="p-2 bg-accent/15 border border-accent/30 rounded-xl text-accent">
            <UnicornLogo size={20} useSvgOnly />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-text-primary tracking-tight">{toast.title}</h4>
          {toast.tokenInSymbol && toast.tokenOutSymbol && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
              {toast.tokenInSymbol} → {toast.tokenOutSymbol}
            </span>
          )}
        </div>

        {toast.message && (
          <p className="text-xs text-text-secondary mt-1 leading-relaxed break-words">
            {toast.message}
          </p>
        )}

        {toast.txHash && (
          <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-border/40 text-[11px] font-mono">
            <span className="text-text-tertiary">Tx:</span>
            <span className="text-accent font-semibold truncate">
              {toast.txHash.slice(0, 10)}...{toast.txHash.slice(-6)}
            </span>
            <button
              onClick={handleCopyTx}
              className="p-1 hover:bg-surface-2 rounded-lg text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              title="Copy Tx Hash"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={`https://etherscan.io/tx/${toast.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:bg-surface-2 rounded-lg text-text-tertiary hover:text-accent transition-colors cursor-pointer"
              title="View on Etherscan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="p-1 hover:bg-surface-2 rounded-xl text-text-tertiary hover:text-text-primary transition-colors cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function useUniswapToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useUniswapToast must be used within a ToastProvider');
  }
  return context;
}
