# Uniswap Web Application

An official-grade, full-featured Web3 decentralized exchange (DEX) interface built with React, Vite, Tailwind CSS, Reown AppKit (Web3Modal), Wagmi, and Viem. 

This application replicates the modern Uniswap Web interface experience, featuring live token swapping, off-chain EIP-712 Permit2 approvals, SIWE (Sign-In with Ethereum) authentication, real-time market data exploration with official token logos, multi-chain network switching, liquidity pool management, and portfolio tracking.

---

## 🌟 Key Features

### 1. Token Swapping Engine
- **Optimized Swap Router**: Live token-to-token swaps across Ethereum, Base, Arbitrum, Unichain, Optimism, Polygon, BNB Chain, and Avalanche.
- **Slippage & Deadline Controls**: Custom slippage tolerance settings (0.1%, 0.5%, 1.0%, or custom %) and transaction deadline timers.
- **Interactive Price Chart**: Integrated real-time price charts powered by Recharts with timeframe selectors (`1D`, `1W`, `1M`, `1Y`, `ALL`).
- **Token Selector**: Complete token selection modal with live balance display, search bar, and custom token import support.

### 2. Off-Chain & On-Chain Authentication
- **EIP-712 Permit2 Signatures**: Off-chain gasless permit approvals adhering to the EIP-712 standard for frictionless ERC-20 token allowances.
- **Sign-In with Ethereum (SIWE)**: Full EIP-4361 SIWE integration allowing users to authenticate via wallet signatures backed by Express session validation (`/api/siwe/*`).

### 3. Mobile First Design & Action Bar
- **Uniswap-Style Floating Action Menu**: Responsive mobile navigation bar anchored at the bottom for instant access to Swap, Explore, Pools, and Portfolio.
- **Reown AppKit (Web3Modal) Integration**: Sleek wallet connection dialog supporting MetaMask, Rainbow, Coinbase Wallet, WalletConnect, and 300+ Web3 wallets.

### 4. Explore & Market Hub
- **Real Branding & Logos**: Real token icons and official chain logos sourced from Coingecko and trustwallet repositories.
- **Market Data Tables**: Top gainers, top volume tokens, stock tokens, and protocol statistics.

### 5. Smart Contracts & Security
- Includes Solidity smart contracts in `src/contracts/`:
  - `MyToken.sol`: Standard ERC-20 token template.
  - `SignatoryManager.sol`: Multi-signature authorization logic.
  - `TokenVaultManager.sol`: Secure token locking and vault management.

---

## 📁 Project Structure

```
├── server.ts                  # Express backend proxy (Vite dev server & SIWE session API)
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx     # Desktop navigation & Reown wallet button
│   │   │   └── MobileActionMenu.tsx # Mobile floating action menu
│   │   ├── swap/
│   │   │   ├── SwapWidget.tsx # Core swap card component
│   │   │   └── TokenSelector.tsx Modal for selecting tokens
│   │   ├── charts/
│   │   │   └── PriceChart.tsx # Token price chart visualizer
│   │   └── SIWEAuthCard.tsx   # EIP-712 Permit & SIWE authentication widget
│   ├── contracts/             # Solidity smart contracts
│   │   ├── MyToken.sol
│   │   ├── SignatoryManager.sol
│   │   └── TokenVaultManager.sol
│   ├── hooks/
│   │   ├── usePermit2.ts      # EIP-712 Permit signature hook
│   │   ├── useSIWE.ts         # Sign-In with Ethereum hook
│   │   └── useTokenList.ts    # Multi-chain token list manager
│   ├── lib/
│   │   ├── web3Config.ts      # Reown AppKit & Wagmi configuration
│   │   └── utils.ts           # Utility functions
│   ├── pages/
│   │   ├── Trade.tsx          # Clean Swap landing page
│   │   ├── Explore.tsx        # Market explorer page
│   │   ├── Pools.tsx          # Liquidity pools page
│   │   └── Portfolio.tsx      # User portfolio page
│   ├── App.tsx                # Main app layout & routing
│   └── main.tsx               # App entrypoint
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Package Manager**: `npm` or `bun`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/leephil1907-lab/UNISWAP-.git
   cd UNISWAP-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   VITE_REOWN_PROJECT_ID=your_reown_project_id_here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## ⚡ Scripts

- `npm run dev`: Starts the Express + Vite server on port 3000.
- `npm run build`: Bundles client assets with Vite and compiles server code with esbuild.
- `npm run lint`: Runs TypeScript typechecks (`tsc --noEmit`).
- `npm start`: Runs the built production server (`dist/server.cjs`).

---

## 🔐 Security & License

- EIP-712 typed data signatures keep user private keys secure on their client wallet.
- All backend routes isolate session state.
- **License**: MIT
