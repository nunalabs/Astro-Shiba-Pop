/**
 * DEPRECATED: Legacy Wallet Provider
 *
 * This file is kept for backwards compatibility with existing pages.
 * Please use the new Zustand store instead: @/stores/wallet
 *
 * Migration guide:
 * Old: import { useWallet } from '@/lib/wallet/wallet-provider'
 * New: import { useWallet } from '@/stores/wallet'
 */

'use client';

/**
 * For backwards compatibility, re-export the new Zustand-based wallet hooks
 */
export { useWallet } from '@/stores/wallet';

/**
 * WalletProvider is no longer needed with Zustand
 * This is a no-op component for backwards compatibility
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
