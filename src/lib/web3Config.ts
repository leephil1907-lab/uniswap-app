import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, base, arbitrum, optimism, polygon, AppKitNetwork } from '@reown/appkit/networks';

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '7ee282b2996b54334564e0f64beebed1';

export const networks = [mainnet, base, arbitrum, optimism, polygon] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

export const metadata = {
  name: 'Uni-Swap Wallet',
  description: 'DeFi Wallet with Swap, Send, Receive & Buy',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://uni-swap.app',
  icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'https://uni-swap.app/icon.png'],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  features: {
    analytics: false,
    swaps: true,
    onramp: true,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#FC72FF',
    '--w3m-color-mix': '#0B0B0F',
    '--w3m-color-mix-strength': 40,
    '--w3m-font-family': 'Inter, sans-serif',
  },
});

