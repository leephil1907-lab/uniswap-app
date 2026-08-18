import SwapWidget from '../components/swap/SwapWidget';
import { PullToRefresh } from '../components/common/PullToRefresh';
import { useTokenList } from '../hooks/useTokenList';

export default function Trade() {
  const { refetch } = useTokenList();

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center relative min-h-[calc(100vh-120px)] overflow-x-hidden">
        {/* Background Ambient Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-accent/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        
        {/* Top Display Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center text-text-primary mb-6 font-display">
          Swap anytime, anywhere.
        </h1>

        {/* Center Swap Widget */}
        <div className="w-full max-w-[480px]">
          <SwapWidget />
        </div>

        {/* Bottom Caption */}
        <p className="mt-6 max-w-[480px] text-center text-sm sm:text-base text-text-secondary leading-relaxed px-2">
          Buy and sell crypto with <span className="text-accent font-bold">zero app fees</span> on 21+ networks including Ethereum, Unichain, and Base.
        </p>
      </div>
    </PullToRefresh>
  );
}


