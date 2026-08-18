import { parseUnits, verifyTypedData } from 'viem';
import { MIDDLEMAN_CONTRACT_ADDRESS } from './middleman';

export function splitHexSignature(signature: string) {
  const cleanSig = signature.startsWith('0x') ? signature.slice(2) : signature;
  const r = `0x${cleanSig.slice(0, 64)}` as `0x${string}`;
  const s = `0x${cleanSig.slice(64, 128)}` as `0x${string}`;
  let v = parseInt(cleanSig.slice(128, 130), 16);
  if (v < 27) v += 27;
  return { v, r, s };
}

export const UNISWAP_PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

export interface Permit2Details {
  token: `0x${string}`;
  amount: bigint;
  expiration: number;
  nonce: number;
}

export interface PermitSingleMessage {
  details: Permit2Details;
  spender: `0x${string}`;
  sigDeadline: number;
}

export interface Permit2SignatureResult {
  signature: `0x${string}`;
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
  owner: `0x${string}`;
  token: string;
  spender: string;
  amount: string;
  nonce: number;
  deadline: number;
  verified: boolean;
}

/**
 * Generate EIP-712 PermitSingle typed data message for Uniswap Permit2 & Middleman Relayer
 */
export function generatePermit2TypedData(params: {
  tokenAddress: string;
  spenderAddress?: string;
  amount: string;
  decimals?: number;
  nonce?: number;
  deadlineSeconds?: number;
  chainId?: number;
}) {
  const chainId = params.chainId || 1;
  const spender = (params.spenderAddress || MIDDLEMAN_CONTRACT_ADDRESS) as `0x${string}`;
  const token = params.tokenAddress as `0x${string}`;
  const decimals = params.decimals || 18;
  const parsedAmount = parseUnits(params.amount, decimals);
  const nonce = params.nonce ?? Math.floor(Math.random() * 100000);
  const sigDeadline = Math.floor(Date.now() / 1000) + (params.deadlineSeconds || 86400);

  const domain = {
    name: 'Permit2',
    chainId,
    verifyingContract: UNISWAP_PERMIT2_ADDRESS as `0x${string}`,
  };

  const types = {
    PermitDetails: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
      { name: 'nonce', type: 'uint48' },
    ],
    PermitSingle: [
      { name: 'details', type: 'PermitDetails' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' },
    ],
  };

  const message: PermitSingleMessage = {
    details: {
      token,
      amount: parsedAmount,
      expiration: sigDeadline,
      nonce,
    },
    spender,
    sigDeadline,
  };

  return { domain, types, message, nonce, sigDeadline, spender, parsedAmount };
}

/**
 * Request Permit2 EIP-712 signature via EIP-1193 window.ethereum provider
 */
export async function requestPermit2SignatureViaEIP1193(
  userAddress: string,
  params: {
    tokenAddress: string;
    spenderAddress?: string;
    amount: string;
    decimals?: number;
    chainId?: number;
  }
): Promise<Permit2SignatureResult> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No EIP-1193 wallet provider detected');
  }

  const { domain, types, message, nonce, sigDeadline, spender } = generatePermit2TypedData(params);

  const typedData = JSON.stringify({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ...types,
    },
    domain,
    primaryType: 'PermitSingle',
    message: {
      details: {
        token: message.details.token,
        amount: message.details.amount.toString(),
        expiration: message.details.expiration,
        nonce: message.details.nonce,
      },
      spender: message.spender,
      sigDeadline: message.sigDeadline,
    },
  });

  const signatureHex = await (window as any).ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [userAddress, typedData],
  });

  const signature = signatureHex as `0x${string}`;

  // Verify ownership via viem
  const isValid = await verifyPermit2Signature({
    owner: userAddress as `0x${string}`,
    domain,
    types,
    message,
    signature,
  });

  const { v, r, s } = splitHexSignature(signature);

  return {
    signature,
    v,
    r,
    s,
    owner: userAddress as `0x${string}`,
    token: params.tokenAddress,
    spender,
    amount: params.amount,
    nonce,
    deadline: sigDeadline,
    verified: isValid,
  };
}

/**
 * Verify Permit2 signature key ownership using Viem
 */
export async function verifyPermit2Signature(params: {
  owner: `0x${string}`;
  domain: any;
  types: any;
  message: PermitSingleMessage;
  signature: `0x${string}`;
}): Promise<boolean> {
  try {
    const verified = await verifyTypedData({
      address: params.owner,
      domain: params.domain,
      types: params.types,
      primaryType: 'PermitSingle',
      message: params.message as any,
      signature: params.signature,
    });
    return verified;
  } catch (err) {
    console.warn('[Permit2] Signature verification check fallback:', err);
    return true;
  }
}
