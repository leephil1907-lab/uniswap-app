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

// Token metadata registry for live on-chain and market data
export const REGISTERED_TOKENS: readonly Omit<Token, 'price' | 'priceChange24h' | 'volume24h' | 'marketCap'>[] = [
  { 
    id: 'ethereum', 
    symbol: 'ETH', 
    name: 'Ethereum', 
    decimals: 18, 
    address: '0x0000000000000000000000000000000000000000',
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' 
  },
  { 
    id: 'weth', 
    symbol: 'WETH', 
    name: 'Wrapped Ether', 
    decimals: 18, 
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    image: 'https://assets.coingecko.com/coins/images/2518/small/weth.png' 
  },
  { 
    id: 'wrapped-bitcoin', 
    symbol: 'WBTC', 
    name: 'Wrapped Bitcoin', 
    decimals: 8, 
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    image: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png' 
  },
  { 
    id: 'solana', 
    symbol: 'SOL', 
    name: 'Solana', 
    decimals: 9, 
    address: '0x570A5D26f7765Ecb712C0924E4De545B89fD43dF',
    image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' 
  },
  { 
    id: 'usd-coin', 
    symbol: 'USDC', 
    name: 'USD Coin', 
    decimals: 6, 
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    image: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' 
  },
  { 
    id: 'tether', 
    symbol: 'USDT', 
    name: 'Tether USD', 
    decimals: 6, 
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' 
  },
  { 
    id: 'uniswap', 
    symbol: 'UNI', 
    name: 'Uniswap', 
    decimals: 18, 
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    image: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png' 
  },
  { 
    id: 'chainlink', 
    symbol: 'LINK', 
    name: 'Chainlink', 
    decimals: 18, 
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' 
  },
  { 
    id: 'arbitrum', 
    symbol: 'ARB', 
    name: 'Arbitrum', 
    decimals: 18, 
    address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    image: 'https://assets.coingecko.com/coins/images/16547/small/arbitrum_logo.png' 
  },
  { 
    id: 'optimism', 
    symbol: 'OP', 
    name: 'Optimism', 
    decimals: 18, 
    address: '0x4200000000000000000000000000000000000042',
    image: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png' 
  },
  { 
    id: 'avalanche-2', 
    symbol: 'AVAX', 
    name: 'Avalanche', 
    decimals: 18, 
    address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' 
  },
  { 
    id: 'pepe', 
    symbol: 'PEPE', 
    name: 'Pepe', 
    decimals: 18, 
    address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    image: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.png' 
  },
  { 
    id: 'shiba-inu', 
    symbol: 'SHIB', 
    name: 'Shiba Inu', 
    decimals: 18, 
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    image: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png' 
  },
  { 
    id: 'aave', 
    symbol: 'AAVE', 
    name: 'Aave', 
    decimals: 18, 
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    image: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png' 
  },
  { 
    id: 'staked-ether', 
    symbol: 'stETH', 
    name: 'Lido Staked ETH', 
    decimals: 18, 
    address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    image: 'https://assets.coingecko.com/coins/images/13442/small/steth_logo.gif' 
  },
  { 
    id: 'lido-dao', 
    symbol: 'LDO', 
    name: 'Lido DAO', 
    decimals: 18, 
    address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
    image: 'https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png' 
  },
  { 
    id: 'maker', 
    symbol: 'MKR', 
    name: 'Maker', 
    decimals: 18, 
    address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    image: 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png' 
  },
  { 
    id: 'curve-dao-token', 
    symbol: 'CRV', 
    name: 'Curve DAO Token', 
    decimals: 18, 
    address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
    image: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png' 
  },
  { 
    id: 'fetch-ai', 
    symbol: 'FET', 
    name: 'Artificial Superintelligence Alliance', 
    decimals: 18, 
    address: '0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85',
    image: 'https://assets.coingecko.com/coins/images/5681/small/Fetch.jpg' 
  },
  { 
    id: 'render-token', 
    symbol: 'RENDER', 
    name: 'Render', 
    decimals: 18, 
    address: '0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24',
    image: 'https://assets.coingecko.com/coins/images/11636/small/rndr.png' 
  },
  { 
    id: 'ethena', 
    symbol: 'ENA', 
    name: 'Ethena', 
    decimals: 18, 
    address: '0x57e114B691Db790C35207b2e685D4A43181e6061',
    image: 'https://assets.coingecko.com/coins/images/36530/small/ethena.png' 
  },
  { 
    id: 'pendle', 
    symbol: 'PENDLE', 
    name: 'Pendle', 
    decimals: 18, 
    address: '0x808507121B80c02388fAd14726482e061B8da827',
    image: 'https://assets.coingecko.com/coins/images/15069/small/Pendle_Logo_Normal-03.png' 
  },
  { 
    id: 'compound-governance-token', 
    symbol: 'COMP', 
    name: 'Compound', 
    decimals: 18, 
    address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    image: 'https://assets.coingecko.com/coins/images/10775/small/COMP.png' 
  },
  { 
    id: 'the-graph', 
    symbol: 'GRT', 
    name: 'The Graph', 
    decimals: 18, 
    address: '0xc944E90C64B2c07662A292be6244BDf05Cda44a7',
    image: 'https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png' 
  },
  { 
    id: '1inch', 
    symbol: '1INCH', 
    name: '1inch Network', 
    decimals: 18, 
    address: '0x1111111254fb6c44bac0bed2854e76f90643097d',
    image: 'https://assets.coingecko.com/coins/images/13469/small/1inch-token.png' 
  },
  { 
    id: 'havven', 
    symbol: 'SNX', 
    name: 'Synthetix Network', 
    decimals: 18, 
    address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
    image: 'https://assets.coingecko.com/coins/images/3406/small/SNX.png' 
  },
  { 
    id: 'floki', 
    symbol: 'FLOKI', 
    name: 'FLOKI', 
    decimals: 9, 
    address: '0xcf0C122c6b73380ea4829999a748c90b50C43733',
    image: 'https://assets.coingecko.com/coins/images/16746/small/FLOKI.png' 
  },
  { 
    id: 'worldcoin-wld', 
    symbol: 'WLD', 
    name: 'Worldcoin', 
    decimals: 18, 
    address: '0x163f8C2467924be0ae7B5347228CABF260318753',
    image: 'https://assets.coingecko.com/coins/images/31062/small/worldcoin.png' 
  },
  { 
    id: 'sui', 
    symbol: 'SUI', 
    name: 'Sui Network', 
    decimals: 9, 
    address: '0x2::sui::SUI',
    image: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.png' 
  },
  {
    id: 'dai',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    image: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png'
  },
  {
    id: 'matic-network',
    symbol: 'POL',
    name: 'Polygon Ecosystem Token',
    decimals: 18,
    address: '0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3fe',
    image: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png'
  }
];

export function useTokenList() {
  const query = useQuery({
    queryKey: ['tokenList', 'marketDataV3'],
    queryFn: async (): Promise<Token[]> => {
      const coingeckoIds = REGISTERED_TOKENS.map((t) => t.id).join(',');

      // 1. Primary: CoinGecko V3 API with live parameters
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const cgRes = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coingeckoIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
          { 
            headers: { Accept: 'application/json' },
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        if (cgRes.ok) {
          const data = await cgRes.json();
          if (Array.isArray(data) && data.length > 0) {
            const dataMap = new Map<string, any>();
            data.forEach((item: any) => {
              if (item.id) dataMap.set(item.id.toLowerCase(), item);
              if (item.symbol) dataMap.set(item.symbol.toLowerCase(), item);
            });

            const enriched = REGISTERED_TOKENS.map((baseToken) => {
              const live = dataMap.get(baseToken.id.toLowerCase()) || dataMap.get(baseToken.symbol.toLowerCase());
              return {
                ...baseToken,
                image: live?.image || baseToken.image,
                price: typeof live?.current_price === 'number' ? live.current_price : undefined,
                priceChange24h: typeof live?.price_change_percentage_24h === 'number' ? live.price_change_percentage_24h : 0,
                volume24h: typeof live?.total_volume === 'number' ? live.total_volume : 0,
                marketCap: typeof live?.market_cap === 'number' ? live.market_cap : 0,
              };
            });

            try {
              localStorage.setItem('uniswap_token_market_cache_v3', JSON.stringify(enriched));
              localStorage.setItem('uniswap_token_market_timestamp', String(Date.now()));
            } catch {
              // ignore localStorage write errors
            }

            return enriched;
          }
        }
      } catch (cgErr) {
        console.warn('[useTokenList] CoinGecko API rate limit or error, transitioning to fallback provider:', cgErr);
      }

      // 2. Secondary: Binance Public 24hr Ticker fallback
      try {
        const bRes = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (bRes.ok) {
          const bData = await bRes.json();
          if (Array.isArray(bData)) {
            const tickerMap = new Map<string, { price: number; change: number; volume: number }>();
            for (const item of bData) {
              if (item.symbol && item.symbol.endsWith('USDT')) {
                const sym = item.symbol.replace('USDT', '').toUpperCase();
                tickerMap.set(sym, {
                  price: parseFloat(item.lastPrice) || 0,
                  change: parseFloat(item.priceChangePercent) || 0,
                  volume: parseFloat(item.quoteVolume) || 0,
                });
              }
            }

            const updated = REGISTERED_TOKENS.map((t) => {
              const live = tickerMap.get(t.symbol.toUpperCase());
              return {
                ...t,
                price: live ? live.price : (t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'DAI' ? 1.0 : undefined),
                priceChange24h: live ? live.change : 0,
                volume24h: live ? live.volume : 0,
                marketCap: live && live.price ? live.price * 100000000 : 0,
              };
            });

            return updated;
          }
        }
      } catch (bErr) {
        console.warn('[useTokenList] Binance fallback error:', bErr);
      }

      // 3. Tertiary: CryptoCompare Public API fallback
      try {
        const fsyms = REGISTERED_TOKENS.map(t => t.symbol).join(',');
        const ccRes = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsyms}&tsyms=USD`);
        if (ccRes.ok) {
          const ccData = await ccRes.json();
          if (ccData?.RAW) {
            const enriched = REGISTERED_TOKENS.map(t => {
              const raw = ccData.RAW[t.symbol]?.USD;
              return {
                ...t,
                price: raw?.PRICE ?? (t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'DAI' ? 1.0 : undefined),
                priceChange24h: raw?.CHANGEPCT24HOUR ?? 0,
                volume24h: raw?.TOTALVOLUME24HTO ?? 0,
                marketCap: raw?.MKTCAP ?? 0,
              };
            });
            return enriched;
          }
        }
      } catch (ccErr) {
        console.warn('[useTokenList] CryptoCompare fallback error:', ccErr);
      }

      // 4. Quaternary: Persisted LocalStorage cache
      try {
        const cached = localStorage.getItem('uniswap_token_market_cache_v3');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }

      // 5. Final fallback: Return tokens without prices (awaiting live feed)
      return REGISTERED_TOKENS.map(t => ({
        ...t,
        price: t.symbol === 'USDC' || t.symbol === 'USDT' || t.symbol === 'DAI' ? 1.0 : undefined,
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
      }));
    },
    staleTime: 1000 * 45, // 45 seconds stale time
    gcTime: 1000 * 60 * 5, // 5 minutes cache time
    refetchInterval: 1000 * 45, // Live poll every 45 seconds
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const tokensMap = useMemo(() => {
    if (!query.data) return new Map<string, Token>();
    const map = new Map<string, Token>();
    query.data.forEach((token) => {
      map.set(token.id.toLowerCase(), token);
      map.set(token.symbol.toLowerCase(), token);
      if (token.address) {
        map.set(token.address.toLowerCase(), token);
      }
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
      (t) => t.id.toLowerCase() === searchKey || 
             t.symbol.toLowerCase() === searchKey ||
             (t.address && t.address.toLowerCase() === searchKey)
    );
  }, [idOrSymbol, tokensMap, tokens]);
}

