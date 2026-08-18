import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import UnicornLogo from './UnicornLogo';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export default function SplashScreen({ onFinish, duration = 1800 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0d0e12] text-white selection:bg-pink-500/30 overflow-hidden"
        >
          {/* Ambient 3D Glowing Background Gradients */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-pink-600/30 via-purple-600/20 to-blue-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse" />
          
          <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-sm">
            {/* 3D Rotating Pink Uniswap Unicorn Logo */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-8 perspective-[1000px]">
              
              {/* Outer Pulsing Pink Aura Ring */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.4, 0.8, 0.4],
                  rotateZ: [0, 180, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full border border-pink-500/40 bg-pink-500/10 blur-md shadow-[0_0_50px_rgba(252,12,151,0.5)]"
              />

              {/* Inner 3D Rotating Pink Unicorn Head Vector */}
              <motion.div
                animate={{
                  rotateY: [0, 360],
                  scale: [0.95, 1.08, 0.95],
                }}
                transition={{
                  rotateY: { duration: 2.2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                }}
                className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center drop-shadow-[0_0_35px_rgba(252,12,151,0.85)] filter"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <UnicornLogo size={120} className="w-full h-full text-[#fc0c97]" />
              </motion.div>
            </div>

            {/* Title & Boot status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-2"
            >
              <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                <span>Uniswap App</span>
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-pink-400/90">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                <span>Connecting to EVM Node & Relayer...</span>
              </div>
            </motion.div>

            {/* Progress bar */}
            <div className="w-48 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: duration / 1000, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-[0_0_10px_#fc0c97]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
