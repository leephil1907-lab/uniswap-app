import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface Token {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  address?: string;
  decimals: number;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
}

const TOP_TOKENS: Token[] = [
  { 
    id: 'ethereum', 
    symbol: 'ETH', 
    name: 'Ethereum', 
    decimals: 18, 
    price: 3350.00, 
    priceChange24h: 2.45, 
    volume24h: 18500000000, 
    marketCap: 402000000000,
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' 
  },
  { 
    id: 'wrapped-bitcoin', 
    symbol: 'WBTC', 
    name: 'Wrapped Bitcoin', 
    decimals: 8, 
    price: 64339.00, 
    priceChange24h: 0.99, 
    volume24h: 73060000, 
    marketCap: 7470000000,
    image: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png' 
  },
  { 
    id: 'solana', 
    symbol: 'SOL', 
    name: 'Solana', 
    decimals: 9, 
    price: 154.20, 
    priceChange24h: 3.85, 
    volume24h: 3800000000, 
    marketCap: 71000000000,
    image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' 
  },
  { 
    id: 'usd-coin', 
    symbol: 'USDC', 
    name: 'USD Coin', 
    decimals: 6, 
    price: 1.00, 
    priceChange24h: 0.01, 
    volume24h: 6200000000, 
    marketCap: 34000000000,
    image: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' 
  },
  { 
    id: 'tether', 
    symbol: 'USDT', 
    name: 'Tether', 
    decimals: 6, 
    price: 1.00, 
    priceChange24h: 0.00, 
    volume24h: 45000000000, 
    marketCap: 114000000000,
    image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' 
  },
  { 
    id: 'uniswap', 
    symbol: 'UNI', 
    name: 'Uniswap', 
    decimals: 18, 
    price: 8.50, 
    priceChange24h: 4.12, 
    volume24h: 210000000, 
    marketCap: 5100000000,
    image: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png' 
  },
  { 
    id: 'chainlink', 
    symbol: 'LINK', 
    name: 'Chainlink', 
    decimals: 18, 
    price: 16.20, 
    priceChange24h: 1.80, 
    volume24h: 380000000, 
    marketCap: 9500000000,
    image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' 
  },
  { 
    id: 'arbitrum', 
    symbol: 'ARB', 
    name: 'Arbitrum', 
    decimals: 18, 
    price: 0.82, 
    priceChange24h: 5.20, 
    volume24h: 240000000, 
    marketCap: 2700000000,
    image: 'https://assets.coingecko.com/coins/images/16547/small/arbitrum_logo.png' 
  },
  { 
    id: 'optimism', 
    symbol: 'OP', 
    name: 'Optimism', 
    decimals: 18, 
    price: 1.95, 
    priceChange24h: 3.10, 
    volume24h: 180000000, 
    marketCap: 2200000000,
    image: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png' 
  },
  { 
    id: 'avalanche-2', 
    symbol: 'AVAX', 
    name: 'Avalanche', 
    decimals: 18, 
    price: 26.40, 
    priceChange24h: 2.15, 
    volume24h: 310000000, 
    marketCap: 10400000000,
    image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' 
  },
  { 
    id: 'pepe', 
    symbol: 'PEPE', 
    name: 'Pepe', 
    decimals: 18, 
    price: 0.0000105, 
    priceChange24h: 8.40, 
    volume24h: 920000000, 
    marketCap: 4400000000,
    image: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.png' 
  },
  { 
    id: 'aave', 
    symbol: 'AAVE', 
    name: 'Aave', 
    decimals: 18, 
    price: 112.50, 
    priceChange24h: 6.30, 
    volume24h: 140000000, 
    marketCap: 1680000000,
    image: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png' 
  },
  { 
    id: 'lido-dao', 
    symbol: 'LDO', 
    name: 'Lido DAO', 
    decimals: 18, 
    price: 1.68, 
    priceChange24h: 1.90, 
    volume24h: 85000000, 
    marketCap: 1500000000,
    image: 'https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png' 
  },
  { 
    id: 'sui', 
    symbol: 'SUI', 
    name: 'Sui Network', 
    decimals: 9, 
    price: 1.15, 
    priceChange24h: 7.20, 
    volume24h: 420000000, 
    marketCap: 3100000000,
    image: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.png' 
  }
];

export function useTokenList() {
  const query = useQuery({
    queryKey: ['tokenList'],
    queryFn: async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`);
        
        if (!res.ok) {
          // If rate-limited or error, attempt reading cached tokens from localStorage
          const cached = localStorage.getItem('coingecko_token_cache');
          if (cached) {
            try { return JSON.parse(cached); } catch (e) { /* ignore */ }
          }
          return TOP_TOKENS;
        }
        
        const data = await res.json();
        const tokensList = data.map((coin: any) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          image: coin.image,
          decimals: coin.id === 'usd-coin' || coin.id === 'tether' ? 6 : 18,
          price: coin.current_price,
          priceChange24h: coin.price_change_percentage_24h,
          volume24h: coin.total_volume,
          marketCap: coin.market_cap
        })) as (Token & { price: number; priceChange24h: number; volume24h: number; marketCap: number })[];

        localStorage.setItem('coingecko_token_cache', JSON.stringify(tokensList));
        return tokensList;
      } catch (err) {
        const cached = localStorage.getItem('coingecko_token_cache');
        if (cached) {
          try { return JSON.parse(cached); } catch (e) { /* ignore */ }
        }
        return TOP_TOKENS;
      }
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Auto live update every 30s
    initialData: () => {
      const cached = localStorage.getItem('coingecko_token_cache');
      if (cached) {
        try { return JSON.parse(cached); } catch (e) { /* ignore */ }
      }
      return TOP_TOKENS;
    },
  });

  const tokensMap = useMemo(() => {
    if (!query.data) return new Map<string, Token>();
    const map = new Map<string, Token>();
    query.data.forEach((token) => {
      map.set(token.id.toLowerCase(), token);
      map.set(token.symbol.toLowerCase(), token);
    });
    return map;
  }, [query.data]);

  return {
    ...query,
    tokensMap,
  };
}

export function useTokenById(idOrSymbol?: string) {
  const { data: tokens, tokensMap } = useTokenList();
  
  return useMemo(() => {
    if (!idOrSymbol) return undefined;
    const searchKey = idOrSymbol.toLowerCase();
    if (tokensMap.has(searchKey)) {
      return tokensMap.get(searchKey);
    }
    return tokens?.find(
      (t) => t.id.toLowerCase() === searchKey || t.symbol.toLowerCase() === searchKey
    );
  }, [idOrSymbol, tokensMap, tokens]);
}

