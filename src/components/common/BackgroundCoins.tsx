import React from 'react';
import bgCoinsImage from '../../assets/images/coins_blurred_background_1786100290845.jpg';

export function BackgroundCoins() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none">
      {/* High Quality Blurred Coins Image Background */}
      <div className="absolute inset-0 transition-opacity duration-700 opacity-35 [.light_&]:opacity-5 dark:opacity-35">
        <img
          src={bgCoinsImage}
          alt="Blurred coins background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter blur-[2px] scale-105 [.light_&]:brightness-150"
        />
      </div>

      {/* Radial overlay for contrast & glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background/95 [.light_&]:from-background/95 [.light_&]:via-background/90 [.light_&]:to-background/98 backdrop-blur-[1px]" />

      {/* Floating Animated Coin Tokens with depth and blur */}
      <div className="absolute inset-0">
        {/* Floating ETH Coin - Top Left */}
        <div className="absolute top-[12%] left-[8%] animate-pulse duration-10000 opacity-30 dark:opacity-40 filter blur-[1px]">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <span className="text-3xl font-bold text-blue-400">Ξ</span>
          </div>
        </div>

        {/* Floating UNI Coin - Top Right */}
        <div className="absolute top-[18%] right-[10%] animate-pulse duration-7000 opacity-40 dark:opacity-50 filter blur-[1px]">
          <div className="w-24 h-24 rounded-full bg-pink-500/15 border border-pink-500/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(252,12,151,0.4)]">
            <span className="text-4xl">🦄</span>
          </div>
        </div>

        {/* Floating BTC Coin - Bottom Left */}
        <div className="absolute bottom-[20%] left-[6%] animate-pulse duration-9000 opacity-25 dark:opacity-35 filter blur-[2px]">
          <div className="w-28 h-28 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.25)]">
            <span className="text-4xl font-bold text-amber-400">₿</span>
          </div>
        </div>

        {/* Floating SOL Coin - Bottom Right */}
        <div className="absolute bottom-[15%] right-[8%] animate-pulse duration-8000 opacity-30 dark:opacity-40 filter blur-[1px]">
          <div className="w-22 h-22 rounded-full bg-purple-500/15 border border-purple-500/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.3)]">
            <span className="text-3xl font-bold text-purple-300">◎</span>
          </div>
        </div>

        {/* Center-Top Ambient Orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/15 rounded-full filter blur-[100px] pointer-events-none" />
      </div>
    </div>
  );
}

export default BackgroundCoins;
