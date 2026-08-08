import { Contract, JsonRpcProvider, BrowserProvider } from 'ethers';
import { CONTRACT_ADDRESS, OWNER_ADDRESS } from './contract';

export const MIDDLEMAN_CONTRACT_ADDRESS = "0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091";
export const MIDDLEMAN_OWNER_ADDRESS = "0xEfc5859335A58d64A5e8E01d02c5241c852CBD40";

export const MIDDLEMAN_ABI = [
  {
    "type": "function",
    "name": "getContractVersion",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isValidSignature",
    "inputs": [
      { "name": "signer", "type": "address" },
      { "name": "msgHash", "type": "bytes32" },
      { "name": "v", "type": "uint8" },
      { "name": "r", "type": "bytes32" },
      { "name": "s", "type": "bytes32" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "relayCall",
    "inputs": [
      { "name": "target", "type": "address" },
      { "name": "data", "type": "bytes" }
    ],
    "outputs": [{ "name": "success", "type": "bool" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "executeRelay",
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "from", "type": "address" },
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "success", "type": "bool" }],
    "stateMutability": "nonpayable"
  }
] as const;

/**
 * Creates an ethers Contract instance for Middleman Relayer
 */
export function getMiddlemanEthersContract(signerOrProvider?: any): Contract {
  let runner = signerOrProvider;
  if (!runner) {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        runner = new BrowserProvider((window as any).ethereum);
      } catch (err) {
        runner = new JsonRpcProvider("https://eth.llamarpc.com");
      }
    } else {
      runner = new JsonRpcProvider("https://eth.llamarpc.com");
    }
  }
  return new Contract(MIDDLEMAN_CONTRACT_ADDRESS, MIDDLEMAN_ABI, runner);
}

export const middlemanEthersContract = getMiddlemanEthersContract();

/**
 * Execute relay operation on Middleman contract 0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091
 */
export async function executeMiddlemanRelay(params: {
  target?: string;
  data?: string;
  token?: string;
  from?: string;
  to?: string;
  amount?: string;
  value?: string;
}) {
  console.log(`[MiddlemanRelayer] Executing relay call on ${MIDDLEMAN_CONTRACT_ADDRESS}`, params);
  
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const userAccount = accounts[0];

      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: userAccount,
          to: MIDDLEMAN_CONTRACT_ADDRESS,
          value: params.value ? '0x' + BigInt(params.value).toString(16) : '0x0',
          data: params.data || '0x'
        }]
      });
      console.log(`[MiddlemanRelayer] Relay transaction submitted: ${txHash}`);
      return { success: true, txHash };
    } catch (err: any) {
      console.error('[MiddlemanRelayer] Relay call failed:', err);
      throw err;
    }
  }

  throw new Error('Web3 wallet provider not found. Please connect your Web3 wallet to execute middleman relay transactions.');
}

export const middlemanContract = {
  address: MIDDLEMAN_CONTRACT_ADDRESS,
  owner: MIDDLEMAN_OWNER_ADDRESS,
  abi: MIDDLEMAN_ABI,
  ethersContract: middlemanEthersContract,
  executeRelay: executeMiddlemanRelay,
};

// Attach to window object for global script access
if (typeof window !== 'undefined') {
  (window as any).middlemanContract = middlemanContract;
  (window as any).middlemanEthersContract = middlemanEthersContract;
  (window as any).MIDDLEMAN_CONTRACT_ADDRESS = MIDDLEMAN_CONTRACT_ADDRESS;
  (window as any).MIDDLEMAN_OWNER_ADDRESS = MIDDLEMAN_OWNER_ADDRESS;
}

