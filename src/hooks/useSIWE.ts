import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';

export interface SiweSession {
  address: string;
  chainId: number;
  verifiedAt: number;
  token?: string;
}

export type SignatureFlowStatus = 'idle' | 'requesting_nonce' | 'awaiting_wallet_signature' | 'verifying' | 'success' | 'rejected' | 'error';

export function useSIWE() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { signMessageAsync } = useSignMessage();

  const [session, setSession] = useState<SiweSession | null>(() => {
    try {
      const saved = localStorage.getItem('uniswap_siwe_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [status, setStatus] = useState<SignatureFlowStatus>('idle');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check existing SIWE session from server
  const checkSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('uniswap_auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/siwe/me', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.session) {
          const currentAddress = address?.toLowerCase();
          const sessionAddress = data.session.address?.toLowerCase();
          if (!currentAddress || currentAddress === sessionAddress) {
            setSession(data.session);
            localStorage.setItem('uniswap_siwe_session', JSON.stringify(data.session));
            return;
          }
        }
      }
      
      // If address changed or not authenticated
      if (address && session && session.address.toLowerCase() !== address.toLowerCase()) {
        setSession(null);
        localStorage.removeItem('uniswap_siwe_session');
        localStorage.removeItem('uniswap_auth_token');
      }
    } catch (err) {
      console.warn('SIWE session check error:', err);
    }
  }, [address, session]);

  useEffect(() => {
    checkSession();
  }, [address]);

  // Trigger Sign In With Ethereum
  const signInWithEthereum = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isConnected || !address) {
      const err = 'Please connect your Web3 wallet first.';
      setError(err);
      setStatus('error');
      return { success: false, error: err };
    }

    try {
      setLoading(true);
      setError(null);
      setStatus('requesting_nonce');

      // 1. Get single-use nonce from server
      const nonceRes = await fetch('/api/siwe/nonce');
      if (!nonceRes.ok) {
        throw new Error('Failed to generate secure signing nonce.');
      }
      const { nonce } = await nonceRes.json();

      const chainId = caipNetwork?.id ? Number(caipNetwork.id) : 1;
      const domain = window.location.host;
      const origin = window.location.origin;

      // 2. Create SIWE Message for connected wallet address
      const siweMessage = new SiweMessage({
        domain,
        address,
        statement: 'Sign in to authorize Uniswap app session and verify wallet ownership.',
        uri: origin,
        version: '1',
        chainId,
        nonce,
      });

      const messageToSign = siweMessage.prepareMessage();

      // 3. Request signature from connected wallet
      setStatus('awaiting_wallet_signature');
      const signature = await signMessageAsync({
        account: address as `0x${string}`,
        message: messageToSign,
      });

      // 4. Send signature to backend server for verification
      setStatus('verifying');
      const verifyRes = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSign,
          signature,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'SIWE Signature Verification Failed.');
      }

      // 5. Save verified JWT & update session state
      if (verifyData.token) {
        localStorage.setItem('uniswap_auth_token', verifyData.token);
      }

      const newSession: SiweSession = {
        address: verifyData.address,
        chainId: verifyData.chainId,
        verifiedAt: verifyData.verifiedAt || Date.now(),
        token: verifyData.token,
      };

      setSession(newSession);
      localStorage.setItem('uniswap_siwe_session', JSON.stringify(newSession));
      setStatus('success');

      // Dispatch global authentication event
      window.dispatchEvent(new CustomEvent('uniswap_wallet_authenticated', { detail: newSession }));

      return { success: true };
    } catch (err: any) {
      console.error('SIWE Error:', err);
      const isRejected = err?.message?.includes('User rejected') || err?.name === 'UserRejectedRequestError' || err?.code === 4001;
      const errorMsg = isRejected 
        ? 'Signature request was rejected in wallet.' 
        : (err.message || 'Signature request failed.');
      
      setError(errorMsg);
      setStatus(isRejected ? 'rejected' : 'error');
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [address, caipNetwork?.id, isConnected, signMessageAsync]);

  const signOut = useCallback(async () => {
    try {
      const token = localStorage.getItem('uniswap_auth_token');
      await fetch('/api/siwe/logout', { 
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      }).catch(() => null);
    } finally {
      localStorage.removeItem('uniswap_auth_token');
      localStorage.removeItem('uniswap_siwe_session');
      setSession(null);
      setStatus('idle');
      window.dispatchEvent(new Event('uniswap_wallet_logged_out'));
    }
  }, []);

  const isCurrentAddressAuthenticated = Boolean(
    isConnected &&
    address &&
    session &&
    session.address.toLowerCase() === address.toLowerCase()
  );

  return {
    session,
    isAuthenticated: isCurrentAddressAuthenticated,
    status,
    loading,
    error,
    signInWithEthereum,
    signOut,
  };
}

