import UnicornLogo from './UnicornLogo';

interface SkeletonProps {
  className?: string;
  showUnicorn?: boolean;
}

export function Skeleton({ className = "h-4 w-full", showUnicorn = false }: SkeletonProps) {
  if (showUnicorn) {
    return (
      <div className={`relative overflow-hidden bg-surface-2/80 rounded-2xl flex items-center justify-center p-6 border border-border/40 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent animate-shimmer -translate-x-full" />
        <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
          <UnicornLogo size={40} className="text-accent opacity-75 animate-bounce" />
          <span className="text-xs font-medium text-text-tertiary">Loading live market data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-surface-2/70 rounded-xl animate-pulse ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer -translate-x-full" />
    </div>
  );
}

export function TokenListSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-4 w-full">
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-3 p-4 bg-surface-2/60 rounded-2xl border border-border/40">
          <UnicornLogo size={32} className="text-accent animate-pulse" />
          <span className="text-sm font-semibold text-text-secondary">Fetching verified tokens...</span>
        </div>
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-2/40 animate-pulse">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-20 h-4 rounded" />
              <Skeleton className="w-28 h-3 rounded" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="w-16 h-4 rounded" />
            <Skeleton className="w-12 h-3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
