/**
 * Token Factory Query Hooks
 *
 * React Query hooks for Token Factory contract operations
 * Provides caching, automatic refetching, and optimistic updates
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTokenFactoryContract } from './useTokenFactoryContract';
import { useWallet } from '@/stores/wallet';
import type { CurveType } from '@/lib/contracts/token-factory/dist';

// ============================================================================
// Query Keys
// ============================================================================

export const tokenFactoryKeys = {
  all: ['tokenFactory'] as const,
  paused: () => [...tokenFactoryKeys.all, 'paused'] as const,
  tokenCount: () => [...tokenFactoryKeys.all, 'tokenCount'] as const,
  tokenInfo: (tokenId: string) => [...tokenFactoryKeys.all, 'tokenInfo', tokenId] as const,
  tokenPrice: (tokenId: string) => [...tokenFactoryKeys.all, 'price', tokenId] as const,
  marketCap: (tokenId: string) => [...tokenFactoryKeys.all, 'marketCap', tokenId] as const,
  creatorTokens: (creator: string) => [...tokenFactoryKeys.all, 'creatorTokens', creator] as const,
};

// ============================================================================
// Read Queries
// ============================================================================

/**
 * Check if contract is paused
 */
export function useIsPaused() {
  const { contract, isReady } = useTokenFactoryContract();

  return useQuery({
    queryKey: tokenFactoryKeys.paused(),
    queryFn: async () => {
      if (!contract) throw new Error('Contract not ready');
      const result = await contract.is_paused();
      return result.result;
    },
    enabled: isReady,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Get total token count
 */
export function useTokenCount() {
  const { contract, isReady } = useTokenFactoryContract();

  return useQuery({
    queryKey: tokenFactoryKeys.tokenCount(),
    queryFn: async () => {
      if (!contract) throw new Error('Contract not ready');
      const result = await contract.get_token_count();
      return result.result;
    },
    enabled: isReady,
    staleTime: 10 * 1000, // 10 seconds
  });
}

/**
 * Get token information
 */
export function useTokenInfo(tokenId: string | undefined) {
  const { contract, isReady } = useTokenFactoryContract();

  return useQuery({
    queryKey: tokenFactoryKeys.tokenInfo(tokenId || ''),
    queryFn: async () => {
      if (!contract || !tokenId) throw new Error('Contract or token ID not ready');
      const result = await contract.get_token_info({ token: tokenId });
      return result.result;
    },
    enabled: isReady && !!tokenId,
    staleTime: 30 * 1000,
  });
}

/**
 * Get token price
 */
export function useTokenPrice(tokenId: string | undefined) {
  const { contract, isReady } = useTokenFactoryContract();

  return useQuery({
    queryKey: tokenFactoryKeys.tokenPrice(tokenId || ''),
    queryFn: async () => {
      if (!contract || !tokenId) throw new Error('Contract or token ID not ready');
      const result = await contract.get_price({ token: tokenId });
      return result.result;
    },
    enabled: isReady && !!tokenId,
    staleTime: 5 * 1000, // Price updates frequently
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}

/**
 * Get token market cap
 */
export function useTokenMarketCap(tokenId: string | undefined) {
  const { contract, isReady } = useTokenFactoryContract();

  return useQuery({
    queryKey: tokenFactoryKeys.marketCap(tokenId || ''),
    queryFn: async () => {
      if (!contract || !tokenId) throw new Error('Contract or token ID not ready');
      const result = await contract.get_market_cap({ token: tokenId });
      return result.result;
    },
    enabled: isReady && !!tokenId,
    staleTime: 15 * 1000,
  });
}

/**
 * Get tokens created by an address
 */
export function useCreatorTokens(creator: string | undefined) {
  const { contract, isReady } = useTokenFactoryContract();

  return useQuery({
    queryKey: tokenFactoryKeys.creatorTokens(creator || ''),
    queryFn: async () => {
      if (!contract || !creator) throw new Error('Contract or creator not ready');
      const result = await contract.get_creator_tokens({ creator });
      return result.result;
    },
    enabled: isReady && !!creator,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Write Mutations
// ============================================================================

export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: bigint;
  metadataUri: string;
  curveType: CurveType;
}

/**
 * Create a new token
 */
export function useCreateToken() {
  const { contract } = useTokenFactoryContract();
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTokenParams) => {
      if (!contract) throw new Error('Contract not ready');
      if (!publicKey) throw new Error('Wallet not connected');

      // Build and execute the transaction
      const tx = await contract.create_token({
        creator: publicKey,
        name: params.name,
        symbol: params.symbol,
        decimals: params.decimals,
        initial_supply: params.initialSupply,
        metadata_uri: params.metadataUri,
        curve_type: params.curveType,
      });

      // The contract binding handles simulation, signing, and submission
      return tx;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: tokenFactoryKeys.tokenCount() });
      queryClient.invalidateQueries({ queryKey: tokenFactoryKeys.all });
    },
  });
}

export interface BuyTokensParams {
  tokenId: string;
  xlmAmount: bigint;
  minTokensOut: bigint;
}

/**
 * Buy tokens via bonding curve
 */
export function useBuyTokens() {
  const { contract } = useTokenFactoryContract();
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: BuyTokensParams) => {
      if (!contract) throw new Error('Contract not ready');
      if (!publicKey) throw new Error('Wallet not connected');

      const tx = await contract.buy_tokens({
        buyer: publicKey,
        token: params.tokenId,
        xlm_amount: params.xlmAmount,
        min_tokens_out: params.minTokensOut,
      });

      return tx;
    },
    onSuccess: (_, variables) => {
      // Invalidate token-specific queries
      queryClient.invalidateQueries({
        queryKey: tokenFactoryKeys.tokenInfo(variables.tokenId),
      });
      queryClient.invalidateQueries({
        queryKey: tokenFactoryKeys.tokenPrice(variables.tokenId),
      });
      queryClient.invalidateQueries({
        queryKey: tokenFactoryKeys.marketCap(variables.tokenId),
      });
    },
  });
}

export interface SellTokensParams {
  tokenId: string;
  tokenAmount: bigint;
  minXlmOut: bigint;
}

/**
 * Sell tokens back to bonding curve
 */
export function useSellTokens() {
  const { contract } = useTokenFactoryContract();
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SellTokensParams) => {
      if (!contract) throw new Error('Contract not ready');
      if (!publicKey) throw new Error('Wallet not connected');

      const tx = await contract.sell_tokens({
        seller: publicKey,
        token: params.tokenId,
        token_amount: params.tokenAmount,
        min_xlm_out: params.minXlmOut,
      });

      return tx;
    },
    onSuccess: (_, variables) => {
      // Invalidate token-specific queries
      queryClient.invalidateQueries({
        queryKey: tokenFactoryKeys.tokenInfo(variables.tokenId),
      });
      queryClient.invalidateQueries({
        queryKey: tokenFactoryKeys.tokenPrice(variables.tokenId),
      });
      queryClient.invalidateQueries({
        queryKey: tokenFactoryKeys.marketCap(variables.tokenId),
      });
    },
  });
}

// ============================================================================
// Admin Mutations
// ============================================================================

/**
 * Pause contract (admin only)
 */
export function usePauseContract() {
  const { contract } = useTokenFactoryContract();
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!contract) throw new Error('Contract not ready');
      if (!publicKey) throw new Error('Wallet not connected');

      const tx = await contract.pause({
        admin: publicKey,
      });

      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenFactoryKeys.paused() });
    },
  });
}

/**
 * Unpause contract (admin only)
 */
export function useUnpauseContract() {
  const { contract } = useTokenFactoryContract();
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!contract) throw new Error('Contract not ready');
      if (!publicKey) throw new Error('Wallet not connected');

      const tx = await contract.unpause({
        admin: publicKey,
      });

      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenFactoryKeys.paused() });
    },
  });
}
