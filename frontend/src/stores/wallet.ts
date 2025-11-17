/**
 * Wallet Store (Zustand)
 *
 * Manages wallet connection state, address, and wallet operations.
 * Uses Zustand for better performance and simpler API than Context.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  isConnected,
  getPublicKey,
  signTransaction as freighterSignTransaction,
  getNetwork,
} from '@stellar/freighter-api';
import { getNetworkConfig } from '@/lib/stellar/config';

/**
 * Supported wallet types
 */
export type WalletType = 'freighter' | 'albedo' | 'xbull';

/**
 * Wallet connection state
 */
export interface WalletState {
  // Connection state
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
  walletType: WalletType | null;

  // Loading states
  isConnecting: boolean;
  isDisconnecting: boolean;
  isSigningTransaction: boolean;

  // Error state
  error: string | null;

  // Actions
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
  clearError: () => void;

  // Utils
  checkConnection: () => Promise<void>;
}

/**
 * Wallet store with persistence
 */
export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      address: null,
      publicKey: null,
      walletType: null,
      isConnecting: false,
      isDisconnecting: false,
      isSigningTransaction: false,
      error: null,

      /**
       * Connect to wallet
       */
      connect: async (walletType: WalletType) => {
        set({ isConnecting: true, error: null });

        try {
          if (walletType === 'freighter') {
            // Check if Freighter is installed
            const connected = await isConnected();

            if (!connected) {
              throw new Error(
                'Freighter wallet is not installed. Please install it from https://www.freighter.app/'
              );
            }

            // Request public key (triggers permission request)
            const publicKey = await getPublicKey();

            // Verify network matches our config
            const network = await getNetwork();
            const expectedNetwork = getNetworkConfig().networkPassphrase;

            if (network !== expectedNetwork) {
              console.warn(
                `Wallet is on ${network}, but app expects ${expectedNetwork}. ` +
                `Please switch your wallet network.`
              );
            }

            set({
              isConnected: true,
              address: publicKey,
              publicKey,
              walletType: 'freighter',
              isConnecting: false,
              error: null,
            });
          } else {
            // Future: Support for Albedo and xBull
            throw new Error(`${walletType} wallet is not yet supported`);
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to connect wallet';

          set({
            error: message,
            isConnecting: false,
            isConnected: false,
          });

          throw error;
        }
      },

      /**
       * Disconnect wallet
       */
      disconnect: () => {
        set({ isDisconnecting: true });

        try {
          set({
            isConnected: false,
            address: null,
            publicKey: null,
            walletType: null,
            error: null,
            isDisconnecting: false,
          });
        } catch (error) {
          set({ isDisconnecting: false });
        }
      },

      /**
       * Sign transaction with connected wallet
       */
      signTransaction: async (xdr: string): Promise<string> => {
        const { walletType, isConnected } = get();

        if (!isConnected) {
          throw new Error('Wallet not connected');
        }

        set({ isSigningTransaction: true, error: null });

        try {
          let signedXdr: string;

          if (walletType === 'freighter') {
            const networkPassphrase = getNetworkConfig().networkPassphrase;

            signedXdr = await freighterSignTransaction(xdr, {
              networkPassphrase,
            });
          } else {
            throw new Error(`Signing with ${walletType} is not yet supported`);
          }

          set({ isSigningTransaction: false });
          return signedXdr;
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to sign transaction';

          set({
            error: message,
            isSigningTransaction: false,
          });

          throw error;
        }
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Check if wallet is still connected (auto-reconnect)
       */
      checkConnection: async () => {
        const { walletType } = get();

        if (!walletType) return;

        try {
          if (walletType === 'freighter') {
            const connected = await isConnected();

            if (connected) {
              const publicKey = await getPublicKey();

              set({
                isConnected: true,
                address: publicKey,
                publicKey,
              });
            } else {
              // Wallet disconnected externally
              set({
                isConnected: false,
                address: null,
                publicKey: null,
              });
            }
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
          // Silently fail - don't show error to user
        }
      },
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist wallet type preference
      partialize: (state) => ({
        walletType: state.walletType,
      }),
    }
  )
);

/**
 * Hook to access wallet store
 * Use this in components instead of useWalletStore directly
 */
export function useWallet() {
  return useWalletStore();
}
