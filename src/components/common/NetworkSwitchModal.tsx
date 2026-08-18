import { useState, useEffect } from 'react';
import { useAppKitNetwork } from '@reown/appkit/react';
import { mainnet, base, arbitrum, optimism, polygon } from '@reown/appkit/networks';
import { Network, AlertTriangle, ArrowRight, Check, Zap, Layers, ShieldCheck, Activity, Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NetworkSwitchEventDetail {
  requiredChainId: number;
  requiredChainName: string;
  tokenSymbol?: string;
  onConfirm?: () => void;
}

interface NetworkConfig {
  id: number;
  name: string;
  shortName: string;
  badge: string;
  color: string;
  borderActive: string;
  bgGradient: string;
  status: 'Operational' | 'High Traffic' | 'Maintenance';
  latency: string;
  networkObj: any;
  iconSvg: React.ReactNode;
}

const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    id: 1,
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    badge: '12 Gwei',
    color: 'text-blue-400',
    borderActive: 'border-blue-500 shadow-blue-500/20',
    bgGradient: 'from-blue-500/10 to-indigo-500/5',
    status: 'Operational',
    latency: '12ms',
    networkObj: mainnet,
    iconSvg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L4 12l8 4.5L20 12 12 2z" />
        <path d="M4 12l8 10 8-10-8-4.5L4 12z" />
      </svg>
    ),
  },
  {
    id: 8453,
    name: 'Base Network',
    shortName: 'Base',
    badge: 'L2 Fast',
    color: 'text-blue-500',
    borderActive: 'border-blue-600 shadow-blue-600/20',
    bgGradient: 'from-blue-600/10 to-sky-500/5',
    status: 'Operational',
    latency: '8ms',
    networkObj: base,
    iconSvg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    badge: '< $0.01',
    color: 'text-cyan-400',
    borderActive: 'border-cyan-500 shadow-cyan-500/20',
    bgGradient: 'from-cyan-500/10 to-blue-500/5',
    status: 'Operational',
    latency: '15ms',
    networkObj: arbitrum,
    iconSvg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 19h20L12 2z" />
        <path d="M12 8l4 7H8l4-7z" />
      </svg>
    ),
  },
  {
    id: 10,
    name: 'Optimism',
    shortName: 'Optimism',
    badge: 'OP Rollup',
    color: 'text-rose-400',
    borderActive: 'border-rose-500 shadow-rose-500/20',
    bgGradient: 'from-rose-500/10 to-red-500/5',
    status: 'Operational',
    latency: '10ms',
    networkObj: optimism,
    iconSvg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" />
      </svg>
    ),
  },
  {
    id: 137,
    name: 'Polygon PoS',
    shortName: 'Polygon',
    badge: 'Ultra Low Fee',
    color: 'text-purple-400',
    borderActive: 'border-purple-500 shadow-purple-500/20',
    bgGradient: 'from-purple-500/10 to-fuchsia-500/5',
    status: 'Operational',
    latency: '14ms',
    networkObj: polygon,
    iconSvg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l8.5 4.9v9.8L12 21.6l-8.5-4.9V6.9L12 2z" />
      </svg>
    ),
  },
];

export function NetworkSwitchListener() {
  const { caipNetwork, switchNetwork } = useAppKitNetwork();
  const [activeRequest, setActiveRequest] = useState<NetworkSwitchEventDetail | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<number>(1);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const handleSwitchRequest = (e: CustomEvent<NetworkSwitchEventDetail>) => {
      const detail = e.detail;
      const currentChainId = caipNetwork?.id ? Number(caipNetwork.id) : 1;

      // Trigger modal if requested chain differs from connected chain
      if (detail.requiredChainId && currentChainId !== detail.requiredChainId) {
        setActiveRequest(detail);
        setSelectedChainId(detail.requiredChainId);
      } else if (detail.onConfirm) {
        detail.onConfirm();
      }
    };

    window.addEventListener('request_network_switch' as any, handleSwitchRequest as any);
    return () => {
      window.removeEventListener('request_network_switch' as any, handleSwitchRequest as any);
    };
  }, [caipNetwork]);

  if (!activeRequest) return null;

  const currentChainId = caipNetwork?.id ? Number(caipNetwork.id) : 1;
  const currentNetworkConfig = SUPPORTED_NETWORKS.find((n) => n.id === currentChainId) || {
    name: caipNetwork?.name || 'Current Network',
    shortName: caipNetwork?.name || 'Network',
  };

  const targetConfig = SUPPORTED_NETWORKS.find((n) => n.id === selectedChainId) || SUPPORTED_NETWORKS[0];

  const handleConfirmSwitch = async () => {
    setSwitching(true);
    try {
      if (targetConfig.networkObj) {
        await switchNetwork(targetConfig.networkObj);
      }
      if (activeRequest.onConfirm) {
        activeRequest.onConfirm();
      }
      setActiveRequest(null);
    } catch (err) {
      console.error('Network switch rejected', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="bg-surface border border-border/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden"
        >
          {/* Top ambient highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-purple-500 to-cyan-500" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/15 border border-accent/30 rounded-2xl text-accent">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary font-display">Switch Blockchain Network</h3>
                <p className="text-xs text-text-tertiary">Select destination network to process smart contract calls</p>
              </div>
            </div>
            <button
              onClick={() => setActiveRequest(null)}
              className="p-1.5 text-text-tertiary hover:text-text-primary bg-surface-2 hover:bg-border rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current vs Target Network Bar */}
          <div className="bg-surface-2 p-3.5 rounded-2xl border border-border/60 mb-5 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Connected</span>
              <span className="text-xs font-bold text-text-primary truncate">{currentNetworkConfig.name}</span>
            </div>

            <div className="p-2 bg-surface rounded-xl border border-border/60 text-accent">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Selected Target</span>
              <span className="text-xs font-bold text-accent truncate">{targetConfig.name}</span>
            </div>
          </div>

          {/* VISUAL GRID OF SUPPORTED CHAINS */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Supported Chains</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> All Systems Operational
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SUPPORTED_NETWORKS.map((net) => {
                const isSelected = selectedChainId === net.id;
                const isCurrent = currentChainId === net.id;

                return (
                  <button
                    key={net.id}
                    onClick={() => setSelectedChainId(net.id)}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? `bg-surface border-2 ${net.borderActive} shadow-lg`
                        : 'bg-surface-2/60 border-border/60 hover:bg-surface-2 hover:border-border'
                    }`}
                  >
                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 p-0.5 bg-accent rounded-full text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${net.bgGradient} border border-border/50 ${net.color}`}>
                        {net.iconSvg}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-text-primary truncate">{net.shortName}</span>
                        <span className="text-[10px] text-text-tertiary font-mono">{net.badge}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-border/30">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {net.latency}
                      </span>
                      {isCurrent ? (
                        <span className="text-accent font-bold">Active</span>
                      ) : (
                        <span className="text-text-tertiary group-hover:text-text-secondary">Select</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-text-tertiary leading-relaxed mb-6 bg-surface-2/40 p-3 rounded-2xl border border-border/40">
            Switching network automatically updates your Web3 provider session to <strong>{targetConfig.name}</strong> to execute your pending operation securely.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveRequest(null)}
              className="flex-1 py-3 px-4 rounded-2xl border border-border/80 bg-surface-2 hover:bg-border text-xs font-bold text-text-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSwitch}
              disabled={switching}
              className="flex-1 py-3 px-4 rounded-2xl bg-accent hover:bg-accent/90 text-white text-xs font-bold transition-all shadow-[0_0_20px_var(--color-accent)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {switching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Switching...</span>
                </>
              ) : (
                <>
                  <Network className="w-4 h-4" />
                  <span>Switch to {targetConfig.shortName}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Utility helper function to trigger automated global network switch prompt
 */
export function triggerNetworkSwitchPrompt(requiredChainId: number, requiredChainName: string, onConfirm?: () => void) {
  const event = new CustomEvent<NetworkSwitchEventDetail>('request_network_switch', {
    detail: {
      requiredChainId,
      requiredChainName,
      onConfirm,
    },
  });
  window.dispatchEvent(event);
}
