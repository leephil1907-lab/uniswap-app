import { useState, useCallback } from 'react';
import { useUniswapToast } from '../components/common/UniswapToast';
import { parseWalletError, verifyTypedDataSignature } from '../lib/web3Utils';
import { useAppKitAccount } from '@reown/appkit/react';

export interface ContractInteractionState {
  isPending: boolean;
  statusMessage: string | null;
  error: string | null;
}

export function useWalletContractInteraction() {
  const { showToast } = useUniswapToast();
  const { address } = useAppKitAccount();

  const [state, setState] = useState<ContractInteractionState>({
    isPending: false,
    statusMessage: null,
    error: null,
  });

  const setStatus = useCallback((message: string | null) => {
    setState((prev) => ({ ...prev, statusMessage: message }));
  }, []);

  /**
   * Execute a contract transaction or wallet action with standard handling,
   * error parsing, and toast feedback.
   */
  const executeInteraction = useCallback(
    async <T>(
      actionName: string,
      fn: () => Promise<T>,
      options?: {
        successTitle?: string;
        successMessage?: string;
        tokenInSymbol?: string;
        tokenOutSymbol?: string;
        showSuccessToast?: boolean;
      }
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
      setState({
        isPending: true,
        statusMessage: `Executing ${actionName}...`,
        error: null,
      });

      try {
        const result = await fn();

        setState({
          isPending: false,
          statusMessage: `${actionName} completed successfully!`,
          error: null,
        });

        if (options?.showSuccessToast !== false) {
          const txHash = typeof result === 'string' ? result : (result as any)?.hash || (result as any)?.txHash;
          showToast({
            type: 'success',
            title: options?.successTitle || `${actionName} Successful`,
            message: options?.successMessage || `${actionName} completed on-chain.`,
            txHash,
            tokenInSymbol: options?.tokenInSymbol,
            tokenOutSymbol: options?.tokenOutSymbol,
          });
        }

        return { success: true, data: result };
      } catch (rawError: any) {
        console.error(`[WalletInteraction] Error in ${actionName}:`, rawError);
        const parsedError = parseWalletError(rawError);

        setState({
          isPending: false,
          statusMessage: null,
          error: parsedError,
        });

        showToast({
          type: 'error',
          title: `${actionName} Failed`,
          message: parsedError,
        });

        return { success: false, error: parsedError };
      }
    },
    [showToast]
  );

  /**
   * Verify an off-chain EIP-712 typed data signature before acting on it.
   */
  const verifySignaturePayload = useCallback(
    async (
      domain: Record<string, any>,
      types: Record<string, Array<{ name: string; type: string }>>,
      value: Record<string, any>,
      signature: string
    ) => {
      const result = await verifyTypedDataSignature(
        domain,
        types,
        value,
        signature,
        address
      );

      if (!result.isValid) {
        showToast({
          type: 'error',
          title: 'Signature Integrity Check Failed',
          message: result.error || 'The recovered address does not match your connected wallet.',
        });
      }

      return result;
    },
    [address, showToast]
  );

  return {
    ...state,
    setStatus,
    executeInteraction,
    verifySignaturePayload,
  };
}
