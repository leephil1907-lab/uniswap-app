import { fetchUserTransactionHistory, AlchemyTransactionItem, checkAlchemyTransactionReceipt } from './alchemy';

export interface UserActivity {
  id: string;
  type: 'Swap' | 'Send' | 'Deposit' | 'Stake' | 'Receive' | 'Approval';
  title: string;
  amount: string;
  tokenIn?: string;
  tokenOut?: string;
  hash?: string;
  network?: string;
  address?: string;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: number;
  blockNumber?: number;
  confirmations?: number;
  from?: string;
  to?: string;
  gasUsed?: string;
}

/**
 * Fetch real-time on-chain activities for user address via Alchemy SDK
 */
export async function fetchOnChainActivities(address?: string, chainId?: number): Promise<UserActivity[]> {
  if (!address) return [];

  const localActivities = getUserActivities(address);
  const alchemyTxs: AlchemyTransactionItem[] = await fetchUserTransactionHistory(address, chainId || 1, 40);

  const mergedMap = new Map<string, UserActivity>();

  // 1. Add local activities first (including pending ones)
  for (const act of localActivities) {
    if (act.hash) {
      mergedMap.set(act.hash.toLowerCase(), act);
    } else {
      mergedMap.set(act.id, act);
    }
  }

  // 2. Merge Alchemy on-chain activities
  for (const tx of alchemyTxs) {
    const existing = tx.hash ? mergedMap.get(tx.hash.toLowerCase()) : undefined;
    mergedMap.set(tx.hash?.toLowerCase() || tx.id, {
      id: tx.id,
      type: (tx.type === 'Contract' ? 'Swap' : tx.type) as UserActivity['type'],
      title: tx.title,
      amount: tx.value,
      tokenIn: tx.asset,
      hash: tx.hash,
      network: tx.network,
      address,
      from: tx.from,
      to: tx.to || undefined,
      status: existing?.status === 'failed' ? 'failed' : tx.status,
      timestamp: tx.timestamp,
      blockNumber: tx.blockNum,
    });
  }

  const allActivities = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  return allActivities;
}

/**
 * Record a freshly initiated client transaction and notify listeners.
 */
export function saveUserActivity(activity: Omit<UserActivity, 'id' | 'timestamp' | 'status'> & { status?: UserActivity['status'] }): UserActivity {
  const newActivity: UserActivity = {
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: Date.now(),
    status: activity.status || (activity.hash ? 'pending' : 'confirmed'),
    ...activity,
  };

  try {
    const existingStr = localStorage.getItem('uniswap_user_activities');
    const existing: UserActivity[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Check if duplicate hash exists
    const filtered = activity.hash 
      ? existing.filter(e => e.hash?.toLowerCase() !== activity.hash?.toLowerCase())
      : existing;

    const updated = [newActivity, ...filtered].slice(0, 50);
    localStorage.setItem('uniswap_user_activities', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('uniswap_activity_updated'));
    }
  } catch (err) {
    console.error('[Activities] Error saving transaction activity:', err);
  }

  // If pending, start monitoring receipt immediately
  if (newActivity.hash && newActivity.status === 'pending') {
    watchPendingTransaction(newActivity.hash);
  }

  return newActivity;
}

/**
 * Update transaction status by hash or id
 */
export function updateActivityStatus(hashOrId: string, updates: Partial<UserActivity>) {
  try {
    const existingStr = localStorage.getItem('uniswap_user_activities');
    if (!existingStr) return;
    const existing: UserActivity[] = JSON.parse(existingStr);
    
    let modified = false;
    const updated = existing.map(item => {
      if (item.id === hashOrId || (item.hash && item.hash.toLowerCase() === hashOrId.toLowerCase())) {
        modified = true;
        return { ...item, ...updates };
      }
      return item;
    });

    if (modified) {
      localStorage.setItem('uniswap_user_activities', JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('uniswap_activity_updated'));
      }
    }
  } catch (err) {
    console.error('[Activities] Error updating activity status:', err);
  }
}

/**
 * Actively poll Alchemy for receipt of a pending transaction
 */
export async function watchPendingTransaction(txHash: string, chainId: number = 1, maxAttempts: number = 20) {
  if (!txHash || !txHash.startsWith('0x')) return;

  let attempts = 0;
  const interval = setInterval(async () => {
    attempts++;
    try {
      const receipt = await checkAlchemyTransactionReceipt(txHash, chainId);
      if (receipt.status !== 'pending') {
        clearInterval(interval);
        updateActivityStatus(txHash, {
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          confirmations: receipt.confirmations || 1,
          gasUsed: receipt.gasUsed,
        });
      }
    } catch {
      // Continue polling
    }

    if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 3000);
}

/**
 * Synchronous accessor for UI components fallback
 */
export function getUserActivities(filterAddress?: string): UserActivity[] {
  try {
    const existingStr = localStorage.getItem('uniswap_user_activities');
    if (!existingStr) return [];
    const parsed: UserActivity[] = JSON.parse(existingStr);
    if (!Array.isArray(parsed)) return [];
    if (filterAddress) {
      return parsed.filter(a => !a.address || a.address.toLowerCase() === filterAddress.toLowerCase());
    }
    return parsed;
  } catch {
    return [];
  }
}

