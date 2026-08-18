import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, base, arbitrum, optimism, polygon, AppKitNetwork } from '@reown/appkit/networks';
import { http } from 'viem';

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '7ee282b2996b54334564e0f64beebed1';

export const networks = [mainnet, base, arbitrum, optimism, polygon] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  transports: {
    [mainnet.id]: http('https://cloudflare-eth.com'),
    [base.id]: http('https://mainnet.base.org'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [optimism.id]: http('https://mainnet.optimism.io'),
    [polygon.id]: http('https://polygon-rpc.com'),
  },
  ssr: false,
});

export const metadata = {
  name: 'Uniswap Protocol',
  description: 'Swap, earn, and build on the leading decentralized crypto trading protocol',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://app.uniswap.org',
  icons: ['https://app.uniswap.org/favicon.ico'],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: mainnet,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: false,
  enableEIP6963: true,
  allWallets: 'SHOW',
  features: {
    analytics: false,
    email: false,
    socials: false,
    swaps: false,
    onramp: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#FC72FF',
    '--w3m-color-mix': '#0B0B0F',
    '--w3m-color-mix-strength': 40,
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-border-radius-master': '16px',
    '--w3m-z-index': 99999,
  },
});


