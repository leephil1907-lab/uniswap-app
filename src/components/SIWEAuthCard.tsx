import { ShieldCheck, Lock, CheckCircle2, AlertCircle, LogOut, KeyRound, FileSignature } from 'lucide-react';
import { useSIWE } from '../hooks/useSIWE';
import { usePermit2 } from '../hooks/usePermit2';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import { MIDDLEMAN_CONTRACT_ADDRESS } from '../lib/middleman';

export default function SIWEAuthCard() {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { session, isAuthenticated, loading, error, signInWithEthereum, signOut } = useSIWE();
  const { loading: permitLoading, error: permitError, lastPermit, requestEIP712Permit } = usePermit2();

  const handleConnectWallet = () => {
    open();
  };

  const handleSignPermit = () => {
    requestEIP712Permit({
      tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      tokenSymbol: 'USDC',
      tokenName: 'USD Coin (Permit2 Authorize)',
      amount: '1000',
      spenderAddress: MIDDLEMAN_CONTRACT_ADDRESS
    });
  };

  return (
    <div className="bg-surface border border-border/60 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Info */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl border ${
              isAuthenticated || lastPermit?.isKeyOwnershipVerified
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-accent/10 border-accent/30 text-accent'
            }`}
          >
            {isAuthenticated || lastPermit?.isKeyOwnershipVerified ? <ShieldCheck className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                Permit2 & SIWE Authorization
              </span>
              {isAuthenticated ? (
                <span className="bg-green-500/20 text-green-400 border border-green-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> SIWE Verified
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3" /> SIWE Unsigned
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-text-primary">
              {isAuthenticated ? 'Wallet Authentication Active' : 'Permit2 & Key Ownership Verification'}
            </h3>

            <p className="text-xs text-text-secondary mt-1 max-w-xl">
              Sign a standard wallet authorization message to manage token permissions securely without incurring gas fees.
            </p>

            {session && (
              <div className="mt-2 text-[11px] font-mono text-text-tertiary">
                SIWE Session Address: {session.address.slice(0, 6)}...{session.address.slice(-4)} | Chain: {session.chainId}
              </div>
            )}

            {lastPermit && (
              <div className="mt-3 p-3 bg-accent/10 border border-accent/30 rounded-2xl text-[11px] font-mono text-accent">
                <div className="font-bold flex items-center justify-between mb-1">
                  <span>Permit2 EIP-712 Relayer Authorization:</span>
                  {lastPermit.isKeyOwnershipVerified && (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ Viem Key Ownership Confirmed
                    </span>
                  )}
                </div>
                <div className="truncate text-text-secondary">Signature: {lastPermit.signature}</div>
                <div className="text-text-tertiary mt-0.5">
                  Token: {lastPermit.token} | Relayer Spender: {lastPermit.spender.slice(0, 10)}... | Nonce: {lastPermit.nonce}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {!isConnected ? (
            <button
              onClick={handleConnectWallet}
              className="w-full sm:w-auto bg-accent text-white hover:bg-accent/90 font-bold px-5 py-2.5 rounded-2xl text-xs transition-all shadow-[0_0_20px_var(--color-accent)] cursor-pointer"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              {!isAuthenticated ? (
                <button
                  onClick={signInWithEthereum}
                  disabled={loading}
                  className="w-full sm:w-auto bg-accent text-white hover:bg-accent/90 disabled:opacity-50 font-bold px-5 py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_var(--color-accent)] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing SIWE...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>SIWE Sign-In</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={signOut}
                  className="w-full sm:w-auto bg-surface-2 hover:bg-border text-text-primary border border-border font-semibold px-4 py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}

              {/* EIP-712 Permit Signer */}
              <button
                onClick={handleSignPermit}
                disabled={permitLoading}
                className="w-full sm:w-auto bg-surface-2 hover:bg-border text-text-primary border border-accent/40 hover:border-accent font-bold px-4 py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {permitLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    <span>Signing EIP-712...</span>
                  </>
                ) : (
                  <>
                    <FileSignature className="w-4 h-4 text-accent" />
                    <span>Authorize Relayer Permit2</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {(error || permitError) && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error || permitError}</span>
        </div>
      )}
    </div>
  );
}

