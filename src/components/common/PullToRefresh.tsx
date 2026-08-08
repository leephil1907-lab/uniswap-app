import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 70; // pixels to pull before triggering refresh

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || refreshing) return;
    
    // Check if scrolled to top
    const scrollTop = window.scrollY || document.documentElement.scrollTop || containerRef.current?.scrollTop || 0;
    if (scrollTop <= 2) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || disabled || refreshing) return;

    const currentY = e.touches[0].clientY;
    const dy = currentY - touchStartY.current;

    if (dy > 0) {
      // Add rubber-band effect
      const distance = Math.min(dy * 0.45, 110);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);

      try {
        await Promise.resolve(onRefresh());
        setRefreshed(true);
        setTimeout(() => setRefreshed(false), 1500);
      } catch (err) {
        console.error('Pull to refresh failed', err);
      } finally {
        setTimeout(() => {
          setRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full w-full overflow-hidden"
    >
      {/* Pull To Refresh Top Indicator Banner */}
      <AnimatePresence>
        {(pullDistance > 0 || refreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            style={{ height: `${Math.max(pullDistance, refreshing ? 50 : 0)}px` }}
            className="flex items-center justify-center bg-surface-2/90 border-b border-border/60 backdrop-blur-md overflow-hidden text-xs font-mono font-bold text-text-primary transition-all shadow-inner"
          >
            <div className="flex items-center gap-2 py-2 px-4 rounded-full bg-surface border border-accent/30 shadow-md">
              {refreshed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-sans">Live Balances & Prices Updated!</span>
                </>
              ) : refreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 text-accent animate-spin" />
                  <span className="text-accent font-sans">Updating live on-chain balances...</span>
                </>
              ) : pullDistance >= THRESHOLD ? (
                <>
                  <RefreshCw className="w-4 h-4 text-accent transition-transform duration-200 rotate-180" />
                  <span className="text-text-primary font-sans">Release to refresh</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 text-text-tertiary animate-bounce" />
                  <span className="text-text-tertiary font-sans">Pull down to refresh</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : 'none',
          transition: isPulling.current ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
