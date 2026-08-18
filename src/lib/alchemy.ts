import { Alchemy, Network, AssetTransfersCategory, SortingOrder, AssetTransfersWithMetadataResult } from 'alchemy-sdk';
import { ethers } from 'ethers';

export interface AlchemyTransactionItem {
  id: string;
  hash: string;
  from: string;
  to: string | null;
  value: string;
  asset: string;
  category: string;
  blockNum: number;
  timestamp: number;
  type: 'Swap' | 'Send' | 'Receive' | 'Deposit' | 'Stake' | 'Approval' | 'Contract';
  title: string;
  status: 'confirmed' | 'pending' | 'failed';
  network: string;
  rawContract?: {
    address?: string;
    decimal?: string;
  };
}

// Map chainId to Alchemy Network
export function getAlchemyNetwork(chainId?: number): Network {
  switch (chainId) {
    case 1:
      return Network.ETH_MAINNET;
    case 11155111:
      return Network.ETH_SEPOLIA;
    case 42161:
      return Network.ARB_MAINNET;
    case 10:
      return Network.OPT_MAINNET;
    case 8453:
      return Network.BASE_MAINNET;
    case 137:
      return Network.MATIC_MAINNET;
    default:
      return Network.ETH_MAINNET;
  }
}

// Cache Alchemy instances
const alchemyInstances = new Map<Network, Alchemy>();

export function getAlchemyClient(network: Network = Network.ETH_MAINNET): Alchemy {
  if (alchemyInstances.has(network)) {
    return alchemyInstances.get(network)!;
  }

  const apiKey = (import.meta as any).env?.VITE_ALCHEMY_API_KEY || 'demo';
  const config = {
    apiKey,
    network,
  };

  const client = new Alchemy(config);
  alchemyInstances.set(network, client);
  return client;
}

// In-memory cache for transaction histories per address & network
const txHistoryCache = new Map<string, { timestamp: number; data: AlchemyTransactionItem[] }>();
const CACHE_TTL_MS = 20 * 1000; // 20 seconds

/**
 * Fetch real-time verified on-chain transaction history using Alchemy SDK
 */
export async function fetchUserTransactionHistory(
  address?: string,
  chainId: number = 1,
  limit: number = 30
): Promise<AlchemyTransactionItem[]> {
  if (!address || !ethers.isAddress(address)) {
    return [];
  }

  const normalizedAddress = address.toLowerCase();
  const network = getAlchemyNetwork(chainId);
  const cacheKey = `${normalizedAddress}-${network}`;

  const cached = txHistoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const alchemy = getAlchemyClient(network);
  const results: AlchemyTransactionItem[] = [];

  try {
    // 1. Fetch transfers received (toAddress) and sent (fromAddress)
    const [transfersTo, transfersFrom] = await Promise.allSettled([
      alchemy.core.getAssetTransfers({
        fromBlock: '0x0',
        toBlock: 'latest',
        toAddress: address,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155,
        ],
        maxCount: limit,
        order: SortingOrder.DESCENDING,
        withMetadata: true,
      }),
      alchemy.core.getAssetTransfers({
        fromBlock: '0x0',
        toBlock: 'latest',
        fromAddress: address,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155,
        ],
        maxCount: limit,
        order: SortingOrder.DESCENDING,
        withMetadata: true,
      }),
    ]);

    const rawTransfers: AssetTransfersWithMetadataResult[] = [];
    if (transfersTo.status === 'fulfilled' && transfersTo.value.transfers) {
      rawTransfers.push(...transfersTo.value.transfers);
    }
    if (transfersFrom.status === 'fulfilled' && transfersFrom.value.transfers) {
      rawTransfers.push(...transfersFrom.value.transfers);
    }

    // Deduplicate by hash + uniqueId / category
    const seenHashes = new Set<string>();

    for (const tx of rawTransfers) {
      const key = `${tx.hash}-${tx.uniqueId || tx.category}-${tx.from}-${tx.to}`;
      if (seenHashes.has(key)) continue;
      seenHashes.add(key);

      const isSender = tx.from?.toLowerCase() === normalizedAddress;
      const isDEXRouter =
        (tx.to && [
          '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', // Uniswap Router
          '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3 Router
          '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', // Uniswap Universal Router
          '0xc36442b4a4522e871399cd717abd847ab11fe88', // Uniswap V3 Position Manager
        ].includes(tx.to.toLowerCase()));

      let type: AlchemyTransactionItem['type'] = isSender ? 'Send' : 'Receive';
      if (isDEXRouter) {
        type = 'Swap';
      }

      const valueFormatted = tx.value !== null && tx.value !== undefined ? tx.value.toFixed(4) : '0';
      const assetSymbol = tx.asset || 'ETH';
      const parsedTimestamp = tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).getTime() : Date.now();

      let title = '';
      if (type === 'Swap') {
        title = `Swapped ${valueFormatted} ${assetSymbol} on Uniswap`;
      } else if (type === 'Send') {
        title = `Sent ${valueFormatted} ${assetSymbol}`;
      } else {
        title = `Received ${valueFormatted} ${assetSymbol}`;
      }

      results.push({
        id: tx.hash + '-' + (tx.uniqueId || Math.random().toString(36).substring(2, 5)),
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: valueFormatted,
        asset: assetSymbol,
        category: tx.category,
        blockNum: tx.blockNum ? parseInt(tx.blockNum, 16) : 0,
        timestamp: parsedTimestamp,
        type,
        title,
        status: 'confirmed',
        network: network.replace('_', ' ').toUpperCase(),
        rawContract: tx.rawContract,
      });
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp - a.timestamp);

  } catch (err) {
    console.warn('[Alchemy SDK] Error fetching asset transfers:', err);
  }

  // Fallback to JSON-RPC query via Ethers if Alchemy returns empty (e.g. demo key limitations)
  if (results.length === 0) {
    try {
      const publicRpc = 'https://eth.llamarpc.com';
      const provider = new ethers.JsonRpcProvider(publicRpc, undefined, { staticNetwork: true });
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 2000);

      const erc20Interface = new ethers.Interface([
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ]);
      const topicTransfer = erc20Interface.getEvent('Transfer')?.topicHash;
      const addressTopic = ethers.zeroPadValue(address, 32);

      const logs = await provider.getLogs({
        fromBlock: ethers.toBeHex(fromBlock),
        toBlock: 'latest',
        topics: [topicTransfer!, null, addressTopic],
      });

      for (const log of logs.slice(0, 15)) {
        try {
          const parsed = erc20Interface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed) {
            const formatted = parseFloat(ethers.formatUnits(parsed.args.value || 0, 18)).toFixed(4);
            results.push({
              id: `${log.transactionHash}-${log.index}`,
              hash: log.transactionHash,
              from: parsed.args.from,
              to: parsed.args.to,
              value: formatted,
              asset: 'Token',
              category: 'erc20',
              blockNum: log.blockNumber,
              timestamp: Date.now() - (currentBlock - log.blockNumber) * 12000,
              type: 'Receive',
              title: `Received ${formatted} Token`,
              status: 'confirmed',
              network: 'Ethereum Mainnet',
            });
          }
        } catch {
          // ignore
        }
      }
    } catch (fallbackErr) {
      console.warn('[Alchemy SDK] Fallback provider query note:', fallbackErr);
    }
  }

  // Cache final sorted result
  txHistoryCache.set(cacheKey, {
    timestamp: Date.now(),
    data: results.slice(0, limit),
  });

  return results.slice(0, limit);
}

/**
 * Check real-time on-chain receipt status of a specific transaction using Alchemy
 */
export async function checkAlchemyTransactionReceipt(
  txHash: string,
  chainId: number = 1
): Promise<{
  status: 'confirmed' | 'pending' | 'failed';
  blockNumber?: number;
  confirmations?: number;
  gasUsed?: string;
}> {
  if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
    return { status: 'confirmed' };
  }

  try {
    const network = getAlchemyNetwork(chainId);
    const alchemy = getAlchemyClient(network);

    const receipt = await alchemy.core.getTransactionReceipt(txHash);
    if (!receipt) {
      return { status: 'pending' };
    }

    if (receipt.status === 1) {
      return {
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        confirmations: receipt.confirmations || 1,
        gasUsed: receipt.gasUsed?.toString(),
      };
    } else if (receipt.status === 0) {
      return {
        status: 'failed',
        blockNumber: receipt.blockNumber,
        confirmations: receipt.confirmations || 1,
      };
    }

    return { status: 'pending' };
  } catch (err) {
    // Fallback using public JSON-RPC if Alchemy rate limit or demo key
    try {
      const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) return { status: 'pending' };
      return {
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
      };
    } catch {
      return { status: 'pending' };
    }
  }
}

/**
 * Subscribe to Alchemy WebSocket or polling for pending transactions
 */
export function subscribeToAlchemyPending(
  address: string,
  chainId: number = 1,
  onTxUpdate: (hash: string, status: 'pending' | 'confirmed' | 'failed') => void
): () => void {
  const network = getAlchemyNetwork(chainId);
  const alchemy = getAlchemyClient(network);
  let isSubscribed = true;

  try {
    // Alchemy WebSocket pending transactions listener
    const filter = {
      method: 'alchemy_pendingTransactions',
      fromAddress: address,
    };

    alchemy.ws.on(filter as any, (tx: any) => {
      if (!isSubscribed) return;
      if (tx?.hash) {
        onTxUpdate(tx.hash, 'pending');
      }
    });
  } catch (wsErr) {
    console.warn('[Alchemy WS] Fallback to poll monitoring:', wsErr);
  }

  return () => {
    isSubscribed = false;
    try {
      alchemy.ws.removeAllListeners();
    } catch {
      // ignore
    }
  };
}

