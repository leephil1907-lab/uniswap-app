import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ArrowLeftRight, Compass, Layers, Wallet, Sparkles, GripVertical } from 'lucide-react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useBalance } from 'wagmi';
import { motion, Reorder } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function MobileActionMenu() {
  const location = useLocation();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { data: balanceData } = useBalance({ address: address as `0x${string}` | undefined });

  const [navItems, setNavItems] = useState([
    {
      name: 'Swap',
      path: '/trade',
      icon: ArrowLeftRight,
    },
    {
      name: 'Explore',
      path: '/explore',
      icon: Compass,
    },
    {
      name: 'Pools',
      path: '/pools',
      icon: Layers,
    },
    {
      name: 'Portfolio',
      path: '/portfolio',
      icon: Wallet,
    },
  ]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md lg:hidden">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-surface/90 backdrop-blur-xl border border-border/80 shadow-[0_12px_40px_rgba(0,0,0,0.4)] rounded-3xl p-1.5 flex items-center justify-between"
      >
        {/* Reorderable Navigation Tabs (Drag-to-Reorder Mobile Action Menu) */}
        <Reorder.Group 
          axis="x" 
          values={navItems} 
          onReorder={setNavItems}
          className="flex items-center justify-around flex-1 gap-1 touch-none"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Reorder.Item
                key={item.name}
                value={item}
                className="relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
              >
                <NavLink
                  to={item.path}
                  className={cn(
                    'relative flex flex-col items-center justify-center py-2 px-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none',
                    isActive 
                      ? 'text-accent' 
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="mobileActiveTab"
                      className="absolute inset-0 bg-accent/10 rounded-2xl border border-accent/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={cn('w-4 h-4 mb-0.5 relative z-10 transition-transform', isActive && 'scale-110')} />
                  <span className="relative z-10 text-[10px] font-bold tracking-tight">{item.name}</span>
                </NavLink>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>

        {/* Divider */}
        <div className="w-[1px] h-8 bg-border/60 mx-1" />

        {/* Quick Wallet Action Button */}
        <button
          onClick={() => open()}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-sm relative overflow-hidden shrink-0',
            isConnected
              ? 'bg-surface-2 hover:bg-surface-2/80 text-text-primary border border-border/80'
              : 'bg-accent hover:bg-accent/90 text-white shadow-[0_0_15px_rgba(252,12,151,0.4)]'
          )}
        >
          {isConnected ? (
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{address ? `${address.slice(0, 4)}...${address.slice(-2)}` : 'Wallet'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Connect</span>
            </div>
          )}
        </button>
      </motion.div>
    </div>
  );
}

