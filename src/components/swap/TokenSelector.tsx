import * as Dialog from '@radix-ui/react-dialog';
import { Search, X, Flame, Clock, Sparkles, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TokenListSkeleton } from '../common/SkeletonLoader';
import { useTokenList, Token } from '../../hooks/useTokenList';
import { cn } from '../../lib/utils';
import { useAppKitAccount } from '@reown/appkit/react';
import { useBalance } from 'wagmi';

interface TokenSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
}

export default function TokenSelector({ open, onOpenChange, onSelect, selectedToken }: TokenSelectorProps) {
  const { data: tokens, isLoading } = useTokenList();
  const { isConnected } = useAppKitAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'popular' | 'recent'>('all');
  const [recentTokens, setRecentTokens] = useState<Token[]>([]);

  // Load recent tokens from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('uniswap_recent_tokens');
      if (saved) {
        setRecentTokens(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSelectToken = (token: Token) => {
    // Save to recent tokens
    try {
      const updated = [token, ...recentTokens.filter(t => t.id !== token.id)].slice(0, 6);
      setRecentTokens(updated);
      localStorage.setItem('uniswap_recent_tokens', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }

    onSelect(token);
    onOpenChange(false);
  };

  // Popular Tokens List
  const popularTokenSymbols = ['ETH', 'USDC', 'USDT', 'WBTC', 'UNI', 'LINK', 'DAI', 'SOL'];
  const popularTokens = tokens?.filter(t => popularTokenSymbols.includes(t.symbol)) || [];

  // Filter logic
  const filteredTokens = tokens?.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.address && t.address.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeCategory === 'popular') {
      return popularTokenSymbols.includes(t.symbol);
    }
    if (activeCategory === 'recent') {
      return recentTokens.some(r => r.id === t.id);
    }
    return true;
  }) ?? [];

  const { address } = useAppKitAccount();
  const { data: ethBalanceData } = useBalance({ address: address as `0x${string}` | undefined });

  // Live balance based strictly on connected wallet
  const getMockBalance = (symbol: string) => {
    if (!isConnected || !address) return '0.00';
    if (symbol.toUpperCase() === 'ETH' && ethBalanceData) {
      const val = Number(ethBalanceData.value) / (10 ** ethBalanceData.decimals);
      return val > 0 ? val.toFixed(4) : '0.00';
    }
    return '0.00';
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        {/* Full-Screen Modal Container */}
        <Dialog.Content className="fixed inset-0 sm:inset-4 md:inset-8 lg:inset-x-24 lg:inset-y-12 z-[100] flex flex-col bg-surface border border-border/80 shadow-2xl rounded-none sm:rounded-3xl p-4 sm:p-6 md:p-8 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-w-5xl mx-auto overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold font-display text-text-primary">
                  Select a token
                </Dialog.Title>
                <Dialog.Description className="text-xs text-text-secondary mt-0.5">
                  Search verified tokens across Ethereum, Unichain, Base, and multi-chain networks
                </Dialog.Description>
              </div>
            </div>

            <Dialog.Close className="rounded-2xl p-2.5 hover:bg-surface-2 transition-colors text-text-secondary hover:text-text-primary border border-border/40 cursor-pointer">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Search Bar Input */}
          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search by name, symbol, or paste contract address (0x...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-surface-2/90 border border-border/80 rounded-2xl py-4 pl-12 pr-12 text-base font-medium text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent shadow-inner transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-1 rounded-lg hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Select Popular Pills */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap mr-1">
              Popular:
            </span>
            {popularTokens.slice(0, 7).map(token => (
              <button 
                key={`quick-${token.id}`}
                onClick={() => handleSelectToken(token)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all text-xs font-bold whitespace-nowrap cursor-pointer hover:scale-105",
                  selectedToken?.id === token.id 
                    ? "bg-accent/20 border-accent text-accent" 
                    : "bg-surface-2 border-border/60 hover:bg-surface-2/80 text-text-primary"
                )}
              >
                {token.image ? (
                  <img 
                    src={token.image} 
                    alt={token.symbol} 
                    className="w-4 h-4 rounded-full object-cover" 
                  />
                ) : null}
                <span>{token.symbol}</span>
              </button>
            ))}
          </div>

          {/* Category Tabs: All, Popular, Recent */}
          <div className="mt-3 flex items-center justify-between border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  activeCategory === 'all' 
                    ? "bg-surface-2 text-text-primary border border-border/80 shadow-sm" 
                    : "text-text-tertiary hover:text-text-primary"
                )}
              >
                <span>All Tokens</span>
                <span className="text-[10px] font-mono font-bold bg-accent/20 text-accent px-1.5 py-0.2 rounded-md">
                  {tokens?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('popular')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  activeCategory === 'popular' 
                    ? "bg-surface-2 text-text-primary border border-border/80 shadow-sm" 
                    : "text-text-tertiary hover:text-text-primary"
                )}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Popular</span>
              </button>

              <button
                onClick={() => setActiveCategory('recent')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  activeCategory === 'recent' 
                    ? "bg-surface-2 text-text-primary border border-border/80 shadow-sm" 
                    : "text-text-tertiary hover:text-text-primary"
                )}
              >
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>Recent</span>
                {recentTokens.length > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-surface border border-border/60 text-text-secondary px-1.5 py-0.2 rounded-md">
                    {recentTokens.length}
                  </span>
                )}
              </button>
            </div>

            <span className="text-xs text-text-tertiary hidden sm:inline-block">
              Click token to select
            </span>
          </div>

          {/* Categorized Token List */}
          <div className="mt-4 flex-1 overflow-y-auto pr-1 divide-y divide-border/30">
            {isLoading ? (
              <TokenListSkeleton />
            ) : filteredTokens.length > 0 ? (
              filteredTokens.map((token) => {
                const isSelected = selectedToken?.id === token.id;
                const isPositive = (token.priceChange24h || 0) >= 0;
                const balance = getMockBalance(token.symbol);

                return (
                  <button
                    key={token.id}
                    onClick={() => handleSelectToken(token)}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer group hover:bg-surface-2/80 my-0.5",
                      isSelected && "bg-accent/10 border border-accent/30"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        {token.image ? (
                          <img 
                            src={token.image} 
                            alt={token.symbol} 
                            className="w-10 h-10 rounded-full object-cover border border-border/40 shadow-sm" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold text-sm flex items-center justify-center">
                            {token.symbol?.[0] || 'T'}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-text-primary group-hover:text-accent transition-colors">
                            {token.symbol}
                          </span>
                          {isSelected && (
                            <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Selected
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-tertiary">{token.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-sm text-text-primary">
                        ${token.price ? token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '1.00'}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isConnected && parseFloat(balance.replace(',', '')) > 0 && (
                          <span className="text-xs text-accent font-mono font-medium">
                            Bal: {balance}
                          </span>
                        )}
                        <div className={cn(
                          "flex items-center text-xs font-semibold font-mono",
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                          <span>{Math.abs(token.priceChange24h || 0).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-text-tertiary gap-2">
                <Search className="w-8 h-8 opacity-40 mb-1" />
                <span className="text-sm font-semibold text-text-secondary">No tokens found</span>
                <span className="text-xs">Try searching for "ETH", "USDC", or "WBTC"</span>
              </div>
            )}
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
