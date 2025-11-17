/**
 * Token Factory Contract Hook
 *
 * Provides typed access to Token Factory contract methods
 * using generated TypeScript bindings.
 */

'use client';

import { useMemo } from 'react';
import { Client as TokenFactoryClient, networks } from '@/lib/contracts/token-factory/dist';
import { useWallet } from '@/stores/wallet';
import { NETWORK } from '@/lib/stellar/config';

export interface TokenFactoryContract {
  contract: TokenFactoryClient | null;
  isReady: boolean;
  contractId: string;
}

/**
 * Hook to access Token Factory contract
 *
 * @example
 * const { contract, isReady } = useTokenFactoryContract();
 *
 * if (isReady && contract) {
 *   const paused = await contract.is_paused();
 *   console.log('Contract paused:', paused.result);
 * }
 */
export function useTokenFactoryContract(): TokenFactoryContract {
  const { publicKey } = useWallet();

  const contractId = useMemo(() => {
    // Only testnet is supported for now
    const networkConfig = NETWORK === 'testnet' ? networks.testnet : null;
    return networkConfig?.contractId || '';
  }, []);

  const contract = useMemo(() => {
    if (!publicKey || !contractId) return null;

    try {
      // Only testnet is supported for now
      const networkConfig = NETWORK === 'testnet' ? networks.testnet : null;
      if (!networkConfig) {
        throw new Error('Mainnet not yet supported');
      }

      return new TokenFactoryClient({
        contractId,
        networkPassphrase: networkConfig.networkPassphrase,
        rpcUrl: 'https://soroban-testnet.stellar.org',
        publicKey,
        // Wallet signing is handled by the client
      });
    } catch (error) {
      console.error('Failed to initialize Token Factory contract:', error);
      return null;
    }
  }, [publicKey, contractId]);

  return {
    contract,
    isReady: contract !== null,
    contractId,
  };
}
