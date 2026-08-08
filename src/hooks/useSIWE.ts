import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';

export interface SiweSession {
  address: string;
  chainId: number;
  verifiedAt: number;
}

export function useSIWE() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { signMessageAsync } = useSignMessage();

  const [session, setSession] = useState<SiweSession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check existing SIWE session from server
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/siwe/logout', { method: 'GET' }).catch(() => null);
      const data = await fetch('/api/siwe/me').then(r => r.json());
      if (data.authenticated && data.session) {
        setSession(data.session);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.warn('SIWE session check error:', err);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession, address]);

  // Trigger Sign In With Ethereum
  const signInWithEthereum = useCallback(async () => {
    if (!isConnected || !address) {
      setError('Please connect your Reown / Wagmi wallet first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Get nonce from server
      const nonceRes = await fetch('/api/siwe/nonce');
      const { nonce } = await nonceRes.json();

      const chainId = caipNetwork?.id ? Number(caipNetwork.id) : 1;
      const domain = window.location.host;
      const origin = window.location.origin;

      // 2. Create SIWE Message
      const siweMessage = new SiweMessage({
        domain,
        address,
        statement: 'Sign in with Ethereum to verify wallet ownership on UniswapX Vault & Signatory.',
        uri: origin,
        version: '1',
        chainId,
        nonce,
      });

      const messageToSign = siweMessage.prepareMessage();

      // 3. Request signature from wallet
      const signature = await signMessageAsync({
        account: address as `0x${string}`,
        message: messageToSign,
      });

      // 4. Send signature to backend server for verification
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

      // 5. Update session state
      setSession({
        address: verifyData.address,
        chainId: verifyData.chainId,
        verifiedAt: verifyData.verifiedAt,
      });
    } catch (err: any) {
      console.error('SIWE Error:', err);
      setError(err.message || 'Signature request was rejected or failed verification.');
    } finally {
      setLoading(false);
    }
  }, [address, caipNetwork?.id, isConnected, signMessageAsync]);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/siwe/logout', { method: 'POST' });
      setSession(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  return {
    session,
    isAuthenticated: !!session && session.address.toLowerCase() === (address?.toLowerCase() || ''),
    loading,
    error,
    signInWithEthereum,
    signOut,
  };
}
