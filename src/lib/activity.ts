export interface UserActivity {
  id: string;
  type: 'Swap' | 'Send' | 'Deposit' | 'Stake';
  title: string;
  amount: string;
  tokenIn?: string;
  tokenOut?: string;
  hash?: string;
  network?: string;
  timestamp: number;
}

export function saveUserActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>) {
  try {
    const existingStr = localStorage.getItem('uniswap_user_activities');
    const existing: UserActivity[] = existingStr ? JSON.parse(existingStr) : [];
    const newActivity: UserActivity = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      ...activity
    };
    const updated = [newActivity, ...existing];
    localStorage.setItem('uniswap_user_activities', JSON.stringify(updated));
    window.dispatchEvent(new Event('uniswap_activity_updated'));
    return newActivity;
  } catch (err) {
    console.error('Error saving activity:', err);
    return null;
  }
}

export function getUserActivities(): UserActivity[] {
  try {
    const existingStr = localStorage.getItem('uniswap_user_activities');
    if (!existingStr) return [];
    return JSON.parse(existingStr);
  } catch (err) {
    console.error('Error loading activities:', err);
    return [];
  }
}
