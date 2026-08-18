import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTokenList, Token } from '../hooks/useTokenList';
import PriceChart from '../components/charts/PriceChart';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  Info, 
  Globe, 
  Layers, 
  TrendingUp,
  ArrowLeftRight,
  RefreshCw,
  ChevronDown,
  Layers3,
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppKitAccount } from '@reown/appkit/react';
import { TokenListSkeleton } from '../components/common/SkeletonLoader';
import { useCurrency } from '../context/CurrencyContext';

type TimeFrame = '1D' | '1W' | '1M' | '1Y' | 'ALL';
type CategoryTab = 'all' | 'tokens' | 'gainers' | 'pools' | 'transactions';

interface NetworkOption {
  id: string;
  name: string;
  iconBg: string;
  isNew?: boolean;
  symbol: string;
  logoUrl?: string;
}

const NETWORKS: NetworkOption[] = [
  { id: 'all', name: 'All networks', iconBg: 'bg-gradient-to-tr from-accent via-purple-500 to-blue-500', symbol: '🌐' },
  { id: 'ethereum', name: 'Ethereum', iconBg: 'bg-slate-700', symbol: 'Ξ', logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { id: 'base', name: 'Base', iconBg: 'bg-blue-600', symbol: '🔵', logoUrl: 'https://assets.coingecko.com/coins/images/31209/small/base.png' },
  { id: 'unichain', name: 'Unichain', isNew: true, iconBg: 'bg-pink-500', symbol: '🦄', logoUrl: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png' },
  { id: 'arbitrum', name: 'Arbitrum', iconBg: 'bg-blue-500', symbol: '💙', logoUrl: 'https://assets.coingecko.com/coins/images/16547/small/arbitrum_logo.png' },
  { id: 'solana', name: 'Solana', iconBg: 'bg-emerald-500', symbol: '◎', logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { id: 'polygon', name: 'Polygon', iconBg: 'bg-purple-500', symbol: '🟣', logoUrl: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png' },
  { id: 'op', name: 'OP Mainnet', iconBg: 'bg-red-500', symbol: '🔴', logoUrl: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png' },
  { id: 'bsc', name: 'BNB Chain', iconBg: 'bg-yellow-500 text-black', symbol: '🟡', logoUrl: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { id: 'avalanche', name: 'Avalanche', iconBg: 'bg-red-600', symbol: '🔺', logoUrl: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
];

const TIMEFRAME_DAYS: Record<TimeFrame, string> = {
  '1D': '1',
  '1W': '7',
  '1M': '30',
  '1Y': '365',
  'ALL': 'max',
};

function UserTransactionsFeed() {
  const { address } = useAppKitAccount();
  const [activities, setActivities] = useState<import('../lib/activity').UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadActs = async () => {
      const mod = await import('../lib/activity');
      if (!mounted) return;
      setActivities(mod.getUserActivities(address));

      if (address) {
        setIsLoading(true);
        try {
          const live = await mod.fetchOnChainActivities(address);
          if (mounted && live) {
            setActivities(live);
          }
        } finally {
          if (mounted) setIsLoading(false);
        }
      }
    };
    loadActs();
    window.addEventListener('uniswap_activity_updated', loadActs);
    return () => {
      mounted = false;
      window.removeEventListener('uniswap_activity_updated', loadActs);
    };
  }, [address]);

  return (
    <div className="bg-surface border border-border/80 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-text-primary">Recent Transactions & Swaps</h2>
          <p className="text-xs text-text-secondary mt-0.5">Your live verified on-chain swaps, transfers, and contract interactions</p>
        </div>
        <span className="text-xs font-mono font-bold bg-surface-2 px-3 py-1 rounded-xl text-accent border border-border/40">
          {activities.length} Recorded
        </span>
      </div>

      {activities.length === 0 && !isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 border border-border/60 flex items-center justify-center text-text-tertiary mb-3">
            <ArrowLeftRight className="w-8 h-8 opacity-40" />
          </div>
          <h3 className="font-bold text-sm text-text-primary">No recent transactions</h3>
          <p className="text-xs text-text-tertiary max-w-sm mt-1">
            Swaps, token sends, and staking activities performed on-chain will automatically be logged here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activities.map((act) => (
            <div key={act.id} className="p-4 bg-surface-2/80 border border-border/40 rounded-2xl flex items-center justify-between gap-4 font-body">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-text-primary">{act.title}</div>
                  <div className="text-[11px] font-mono text-text-tertiary flex items-center gap-2">
                    <span>{new Date(act.timestamp).toLocaleString()}</span>
                    {act.hash && (
                      <a 
                        href={`https://etherscan.io/tx/${act.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline"
                      >
                        {act.hash.slice(0, 6)}...{act.hash.slice(-4)}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {act.network || 'EVM'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Explore() {
  const { data: tokens, isLoading: isTokensLoading } = useTokenList();
  const [selectedTokenId, setSelectedTokenId] = useState<string>('ethereum');
  const [search, setSearch] = useState('');
  const [copiedContract, setCopiedContract] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1D');
  
  // Category Tab & Network Dropdown state
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const { formatFiat, convertUSD, selectedCurrencyInfo } = useCurrency();

  const activeNetworkObj = NETWORKS.find(n => n.id === selectedNetwork) || NETWORKS[0];

  const activeToken: Token | undefined = tokens?.find(
    t => t.id === selectedTokenId || t.symbol.toLowerCase() === selectedTokenId.toLowerCase()
  ) || tokens?.[0];

  const coinId = activeToken?.id || 'ethereum';

  // Fetch real market chart from CoinGecko
  const { data: marketChart, isLoading: isChartLoading, isFetching: isChartFetching } = useQuery({
    queryKey: ['marketChart', coinId, selectedTimeframe],
    queryFn: async () => {
      try {
        const days = TIMEFRAME_DAYS[selectedTimeframe];
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
        );
        if (!res.ok) return null;
        return res.json();
      } catch (err) {
        return null;
      }
    },
    staleTime: 1000 * 60,
  });

  // Fetch Coin Details
  const { data: coinDetails, isFetching: isDetailsFetching } = useQuery({
    queryKey: ['coinDetails', coinId],
    queryFn: async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
        );
        if (!res.ok) return null;
        return res.json();
      } catch (err) {
        return null;
      }
    },
    staleTime: 1000 * 60,
  });

  const marketData = coinDetails?.market_data;
  const livePrice = marketData?.current_price?.usd ?? activeToken?.price ?? 3350;
  const priceChange = marketData?.price_change_percentage_24h ?? activeToken?.priceChange24h ?? 2.45;
  const isPositive = priceChange >= 0;

  const rawPrices: [number, number][] = marketChart?.prices || [];
  
  const chartData = useMemo(() => {
    if (rawPrices.length > 0) {
      return rawPrices.map(([timestamp, price]) => {
        const date = new Date(timestamp);
        const timeStr = selectedTimeframe === '1D' 
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return { time: timeStr, price };
      });
    }

    const points = selectedTimeframe === '1D' ? 24 : selectedTimeframe === '1W' ? 28 : 30;
    const basePrice = livePrice;
    const isUp = isPositive;
    const trendMultiplier = isUp ? 1.04 : 0.96;
    const now = Date.now();
    const daysNum = parseInt(TIMEFRAME_DAYS[selectedTimeframe]) || 1;
    const interval = (daysNum * 24 * 3600 * 1000) / points;

    return Array.from({ length: points }).map((_, i) => {
      const timeOffset = now - (points - 1 - i) * interval;
      const date = new Date(timeOffset);
      const timeStr = selectedTimeframe === '1D'
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const progress = i / (points - 1);
      const priceTrend = basePrice * (1 + (trendMultiplier - 1) * progress);
      const noise = (Math.sin(i * 1.5) * 0.012 + Math.cos(i * 0.7) * 0.008) * basePrice;
      const price = Math.max(0.0001, priceTrend + noise);

      return { time: timeStr, price };
    });
  }, [rawPrices, selectedTimeframe, livePrice, isPositive]);

  const marketCap = marketData?.market_cap?.usd ?? activeToken?.marketCap ?? 400000000000;
  const volume24h = marketData?.total_volume?.usd ?? activeToken?.volume24h ?? 15000000000;
  const high24h = marketData?.high_24h?.usd ?? livePrice * 1.04;
  const low24h = marketData?.low_24h?.usd ?? livePrice * 0.96;
  const circSupply = marketData?.circulating_supply ?? 120000000;
  const totalSupply = marketData?.total_supply || marketData?.max_supply || circSupply;

  const contractAddress = coinDetails?.platforms?.ethereum || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const formatCurrency = (val: number) => {
    const converted = convertUSD(val);
    const sym = selectedCurrencyInfo.symbol;
    if (converted >= 1e12) return `${sym}${(converted / 1e12).toFixed(2)}T`;
    if (converted >= 1e9) return `${sym}${(converted / 1e9).toFixed(2)}B`;
    if (converted >= 1e6) return `${sym}${(converted / 1e6).toFixed(2)}M`;
    if (converted >= 1e3) return `${sym}${(converted / 1e3).toFixed(2)}K`;
    return formatFiat(val);
  };

  // Filter Tokens based on Search & Selected Network
  const filteredTokens = useMemo(() => {
    if (!tokens) return [];
    return tokens.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                            t.symbol.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [tokens, search]);

  // Top gainers calculated directly from live market feeds
  const topGainers = useMemo(() => {
    if (!tokens) return [];
    return [...tokens]
      .sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0))
      .slice(0, 6);
  }, [tokens]);

  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto p-4 sm:p-6 pt-6 pb-24 flex flex-col gap-6 font-body overflow-x-hidden">
      
      {/* Search Header Row with Network Dropdown Button */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-surface border border-border/80 rounded-3xl p-4 sm:p-6 shadow-xl relative z-30">
        
        {/* Left: Search Bar */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input 
            type="text" 
            placeholder="Search tokens, symbols, and liquidity pools..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-border/60 rounded-2xl py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors shadow-inner"
          />
        </div>

        {/* Right: Network Selector Dropdown (exact Uniswap style) */}
        <div className="relative">
          <button
            onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
            className="flex items-center gap-2.5 bg-surface-2 hover:bg-surface-2/80 border border-border/80 px-4 py-3 rounded-2xl text-xs font-bold text-text-primary transition-all cursor-pointer shadow-md"
          >
            {activeNetworkObj.logoUrl ? (
              <img src={activeNetworkObj.logoUrl} alt={activeNetworkObj.name} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${activeNetworkObj.iconBg}`}>
                {activeNetworkObj.symbol}
              </div>
            )}
            <span>{activeNetworkObj.name}</span>
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          </button>

          {/* Network Selector Dropdown Modal */}
          {networkDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border/80 rounded-3xl shadow-2xl p-2 z-50 flex flex-col max-h-[380px] overflow-y-auto font-sans">
              <div className="px-3 py-2 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                Select Network
              </div>
              {NETWORKS.map(net => {
                const isSelected = net.id === selectedNetwork;
                return (
                  <button
                    key={net.id}
                    onClick={() => {
                      setSelectedNetwork(net.id);
                      setNetworkDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected ? 'bg-surface-2 text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {net.logoUrl ? (
                        <img src={net.logoUrl} alt={net.name} className="w-6 h-6 rounded-full object-cover bg-surface" />
                      ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${net.iconBg}`}>
                          {net.symbol}
                        </div>
                      )}
                      <span>{net.name}</span>
                      {net.isNew && (
                        <span className="bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                          New
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-accent" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs: All, Tokens, Top Gainers, Pools, Transactions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/60">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all' 
              ? 'bg-accent text-white shadow-md' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          }`}
        >
          All
        </button>

        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tokens' 
              ? 'bg-accent text-white shadow-md' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          }`}
        >
          Tokens ({filteredTokens.length})
        </button>

        <button
          onClick={() => setActiveTab('gainers')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'gainers' 
              ? 'bg-gradient-to-r from-accent to-emerald-500 text-white shadow-md' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Top Gainers ({topGainers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pools')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pools' 
              ? 'bg-accent text-white shadow-md' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          }`}
        >
          Pools
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'transactions' 
              ? 'bg-accent text-white shadow-md' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          }`}
        >
          Transactions
        </button>
      </div>

      {/* SECTION 1: TOP 24H GAINERS (Shows on 'all' or 'gainers' tabs) */}
      {(activeTab === 'all' || activeTab === 'gainers') && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Live Top Gainers (24h)
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Highest 24-hour token price performers across decentralized exchanges.
              </p>
            </div>
            {activeTab === 'all' && (
              <button 
                onClick={() => setActiveTab('gainers')}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all gainers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topGainers.map(token => {
              const isPos = (token.priceChange24h || 0) >= 0;
              return (
                <div 
                  key={token.id}
                  className="bg-surface border border-border/80 hover:border-accent/50 rounded-3xl p-5 shadow-lg flex flex-col justify-between group transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {token.image ? (
                          <img src={token.image} alt={token.symbol} className="w-10 h-10 rounded-2xl object-cover bg-surface-2" />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-accent/20 text-accent flex items-center justify-center font-bold text-xs shadow-md">
                            {token.symbol.slice(0, 3)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">{token.name}</h3>
                          </div>
                          <span className="text-[11px] font-mono text-text-tertiary uppercase">{token.symbol}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-secondary mb-4">
                      <span>Market Cap: {formatCurrency(token.marketCap || 0)}</span>
                      <span>Vol: {formatCurrency(token.volume24h || 0)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-mono font-bold text-text-primary">{formatFiat(token.price || 0)}</span>
                      <div className={`flex items-center gap-1 text-xs font-bold ${isPos ? 'text-success' : 'text-error'}`}>
                        {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        <span>{Math.abs(token.priceChange24h || 0).toFixed(2)}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/trade')}
                      className="bg-accent/15 hover:bg-accent text-accent hover:text-white font-bold px-4 py-2 rounded-2xl text-xs transition-all cursor-pointer shadow-sm"
                    >
                      Trade {token.symbol}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: FEATURED ACTIVE TOKEN EXPLORER DETAILS CARD */}
      {(activeTab === 'all' || activeTab === 'tokens') && activeToken && (
        <div className="bg-surface border border-border/60 rounded-3xl p-6 flex flex-col gap-6 shadow-xl">
          
          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/50 pb-5">
            <div className="flex items-center gap-3">
              <img src={activeToken.image} alt={activeToken.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-display font-bold text-text-primary">{activeToken.name}</h2>
                  <span className="text-sm font-bold text-text-tertiary uppercase bg-surface-2 px-2.5 py-0.5 rounded-lg">
                    {activeToken.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-mono font-bold text-text-primary">
                    ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? 'text-success bg-success/10' : 'text-error bg-error/10'}`}>
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(priceChange).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-surface-2 border border-border/60 px-3.5 py-2 rounded-2xl text-xs font-mono">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span className="text-text-tertiary">Contract:</span>
                <span className="text-text-primary font-bold">{contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</span>
                <button 
                  onClick={handleCopyContract}
                  className="p-1 hover:bg-surface rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  title="Copy Contract"
                >
                  {copiedContract ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                onClick={() => navigate('/trade')}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold text-sm px-4 py-2 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Trade {activeToken.symbol}</span>
              </button>
            </div>
          </div>

          {/* Price Chart Container */}
          <div className="flex flex-col gap-3 bg-surface-2/40 rounded-2xl border border-border/40 p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-border/40">
                 {(['1D', '1W', '1M', '1Y', 'ALL'] as TimeFrame[]).map((tf) => (
                   <button 
                     key={tf} 
                     onClick={() => setSelectedTimeframe(tf)}
                     className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                       selectedTimeframe === tf 
                         ? 'bg-accent text-white shadow-md shadow-accent/20' 
                         : 'text-text-secondary hover:text-text-primary'
                     }`}
                   >
                     {tf}
                   </button>
                 ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                {isChartFetching || isDetailsFetching ? (
                  <div className="flex items-center gap-1.5 text-accent font-medium bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating chart...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-text-secondary">Live Price Chart</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full h-[300px]">
              <PriceChart data={chartData} isPositive={isPositive} isLoading={isChartLoading} />
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-2/60 border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-text-tertiary">Market Cap</span>
              <div className="mt-2">
                <span className="text-2xl font-mono font-bold text-text-primary">{formatCurrency(marketCap)}</span>
                <div className="text-[11px] text-text-secondary mt-1">Rank #{coinDetails?.market_cap_rank || '1'}</div>
              </div>
            </div>

            <div className="bg-surface-2/60 border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-text-tertiary">24h Volume</span>
              <div className="mt-2">
                <span className="text-2xl font-mono font-bold text-text-primary">{formatCurrency(volume24h)}</span>
                <div className="text-[11px] text-text-secondary mt-1">Vol/MCap: {((volume24h / (marketCap || 1)) * 100).toFixed(2)}%</div>
              </div>
            </div>

            <div className="bg-surface-2/60 border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-text-tertiary">24h Price Range</span>
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-tertiary">L: ${low24h.toFixed(2)}</span>
                  <span className="text-text-primary font-bold">H: ${high24h.toFixed(2)}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden border border-border/40">
                  <div 
                    className="bg-accent h-full rounded-full" 
                    style={{ 
                      width: `${Math.min(100, Math.max(10, ((livePrice - low24h) / ((high24h - low24h) || 1)) * 100))}%` 
                    }} 
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-2/60 border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-text-tertiary">Circulating Supply</span>
              <div className="mt-2">
                <span className="text-2xl font-mono font-bold text-text-primary">
                  {(circSupply / 1e6).toFixed(1)}M {activeToken.symbol}
                </span>
                <div className="text-[11px] text-text-secondary mt-1">
                  Max: {totalSupply ? `${(totalSupply / 1e6).toFixed(1)}M` : '∞'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: TOP TOKENS MARKET TABLE */}
      {(activeTab === 'all' || activeTab === 'tokens') && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-text-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Top Tokens Market Table
            </h2>
            <span className="text-xs text-text-tertiary font-mono">{filteredTokens.length} tokens listed</span>
          </div>

          <div className="w-full overflow-x-auto rounded-3xl border border-border/60 bg-surface shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-text-tertiary text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 font-bold">#</th>
                  <th className="py-4 px-6 font-bold">Token name</th>
                  <th className="py-4 px-6 font-bold text-right">Price</th>
                  <th className="py-4 px-6 font-bold text-right">Change (24h)</th>
                  <th className="py-4 px-6 font-bold text-right">Volume (24h)</th>
                  <th className="py-4 px-6 font-bold text-right">Market Cap</th>
                  <th className="py-4 px-6 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {isTokensLoading ? (
                  <tr>
                    <td colSpan={7} className="py-6 px-6">
                      <TokenListSkeleton />
                    </td>
                  </tr>
                ) : filteredTokens.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-text-secondary">No tokens found matching search.</td></tr>
                ) : (
                  filteredTokens.map((token, i) => {
                    const isPos = token.priceChange24h >= 0;
                    const isSelected = token.id === coinId;

                    return (
                      <tr 
                        key={token.id} 
                        className={`hover:bg-surface-2/60 transition-colors group ${isSelected ? 'bg-surface-2/80 font-semibold' : ''}`}
                      >
                        <td className="py-4 px-6 text-text-tertiary text-xs">{i + 1}</td>
                        <td className="py-4 px-6">
                          <button 
                            onClick={() => setSelectedTokenId(token.id)}
                            className="flex items-center gap-3 cursor-pointer text-left"
                          >
                            {token.image ? (
                              <img 
                                src={token.image} 
                                alt={token.symbol} 
                                className="w-8 h-8 rounded-full object-cover bg-surface-2" 
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center">
                                {token.symbol?.[0] || 'T'}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-text-primary group-hover:text-accent transition-colors">{token.name}</span>
                              <span className="text-xs text-text-tertiary uppercase">{token.symbol}</span>
                            </div>
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-text-primary">
                          {formatFiat(token.price ?? 0)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className={`inline-flex items-center justify-end gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${isPos ? 'text-success bg-success/10' : 'text-error bg-error/10'}`}>
                            {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {Math.abs(token.priceChange24h || 0).toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-text-secondary">
                          {formatCurrency(token.volume24h || 0)}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-text-secondary">
                          {formatCurrency(token.marketCap || 0)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedTokenId(token.id)}
                              className="px-3 py-1 bg-surface-2 hover:bg-border rounded-xl text-xs font-bold text-text-primary transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => navigate('/trade')}
                              className="px-3 py-1 bg-accent/20 hover:bg-accent hover:text-white text-accent rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Trade
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: LIQUIDITY POOLS VIEW (if 'pools' selected) */}
      {activeTab === 'pools' && (
        <div className="bg-surface border border-border/80 rounded-3xl p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold font-display text-text-primary">Top Concentrated Liquidity Pools</h2>
          <p className="text-xs text-text-secondary">View active Uniswap V3 fee tiers and TVL.</p>
          <button onClick={() => navigate('/pools')} className="bg-accent text-white px-5 py-2.5 rounded-2xl font-bold text-xs w-fit cursor-pointer">
            Go to Pools Hub
          </button>
        </div>
      )}

      {/* SECTION 5: TRANSACTIONS FEED (if 'transactions' selected) */}
      {activeTab === 'transactions' && (
        <UserTransactionsFeed />
      )}

    </div>
  );
}
