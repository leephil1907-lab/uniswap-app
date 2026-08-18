import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, KeyRound, Lock, ExternalLink, X } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useSIWE } from '../../hooks/useSIWE';

interface SignatureApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoTrigger?: boolean;
}

export function SignatureApprovalModal({ isOpen, onClose, autoTrigger = false }: SignatureApprovalModalProps) {
  const { address, isConnected } = useAppKitAccount();
  const { isAuthenticated, status, error, loading, signInWithEthereum } = useSIWE();
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

  useEffect(() => {
    if (isOpen && autoTrigger && !isAuthenticated && !hasAutoTriggered && isConnected && address) {
      setHasAutoTriggered(true);
      signInWithEthereum();
    }
  }, [isOpen, autoTrigger, isAuthenticated, hasAutoTriggered, isConnected, address, signInWithEthereum]);

  if (!isOpen) return null;

  const handleSign = async () => {
    const res = await signInWithEthereum();
    if (res.success) {
      setTimeout(() => {
        onClose();
      }, 1400);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          className="relative w-full max-w-[440px] bg-surface border border-border/80 rounded-3xl p-6 shadow-2xl overflow-hidden z-10 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-text-primary">Wallet Signature Request</h3>
                <p className="text-[11px] text-text-tertiary">Cryptographic Ownership Approval</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-xl hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="py-5 space-y-4">
            {/* Target Address Card */}
            <div className="p-3.5 bg-surface-2/70 border border-border/60 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-text-secondary font-medium flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-accent" />
                  Signing Wallet Address
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Connected
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-text-primary break-all bg-surface/80 p-2 rounded-xl border border-border/40">
                {address || 'No wallet connected'}
              </p>
            </div>

            {/* Explanation */}
            <div className="text-xs text-text-secondary leading-relaxed bg-surface-2/40 p-3.5 rounded-2xl border border-border/30 space-y-2">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p>
                  To secure your session and enable live swaps, liquidity management, and protected contract execution, please sign the request on your connected wallet.
                </p>
              </div>
              <div className="text-[11px] text-text-tertiary flex items-center gap-1.5 pl-6">
                <span>• Gasless request (0 ETH gas fee)</span>
                <span>• EIP-4361 standard</span>
              </div>
            </div>

            {/* Status Feedback */}
            {status === 'awaiting_wallet_signature' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-300 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                <div>
                  <span className="font-bold block">Signature Pending in Wallet</span>
                  <span className="text-[11px] text-amber-200/80">Please check your wallet extension or mobile app to approve.</span>
                </div>
              </div>
            )}

            {status === 'verifying' && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center gap-3 text-purple-300 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-purple-400" />
                <div>
                  <span className="font-bold block">Verifying Signature</span>
                  <span className="text-[11px] text-purple-200/80">Validating cryptographic proof and issuing JWT token...</span>
                </div>
              </div>
            )}

            {isAuthenticated && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <div>
                  <span className="font-bold block">Wallet Verified & Approved</span>
                  <span className="text-[11px] text-emerald-200/80">Session successfully authorized.</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <span className="font-bold block">Signature Failed / Rejected</span>
                  <span className="text-[11px] text-rose-200/80">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-border/50 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-border/80 text-text-secondary hover:text-text-primary hover:bg-surface-2 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSign}
              disabled={loading || !isConnected}
              className={`flex-2 py-3 px-4 rounded-2xl font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isAuthenticated
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-accent hover:bg-accent/90 shadow-[0_0_15px_rgba(252,12,151,0.3)] hover:scale-[1.02] active:scale-[0.98]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isAuthenticated ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified & Approved</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sign Request & Approve</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
