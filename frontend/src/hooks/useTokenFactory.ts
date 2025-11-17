/**
 * useTokenFactory Hook
 *
 * React hook for interacting with the Token Factory contract.
 * Provides methods for creating tokens, buying, selling, and querying.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  tokenFactoryService,
  TokenInfo,
  CreateTokenParams,
} from '@/lib/stellar/services';
import { useTransaction } from './useTransaction';
import { useWallet } from '@/stores/wallet';
import { useToast } from './use-toast';

/**
 * Query key factory for token data
 */
const tokenKeys = {
  all: ['tokens'] as const,
  lists: () => [...tokenKeys.all, 'list'] as const,
  list: (filters: string) => [...tokenKeys.lists(), { filters }] as const,
  details: () => [...tokenKeys.all, 'detail'] as const,
  detail: (id: string) => [...tokenKeys.details(), id] as const,
  byCreator: (address: string) => [...tokenKeys.all, 'creator', address] as const,
  balance: (tokenId: string, address: string) =>
    [...tokenKeys.all, 'balance', tokenId, address] as const,
};

/**
 * Hook for token factory operations
 */
export function useTokenFactory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wallet = useWallet();

  /**
   * Get all tokens
   */
  const useAllTokens = () => {
    return useQuery({
      queryKey: tokenKeys.lists(),
      queryFn: () => tokenFactoryService.getAllTokens(),
      staleTime: 30_000, // 30 seconds
      refetchInterval: 60_000, // Refetch every minute
    });
  };

  /**
   * Get specific token info
   */
  const useTokenInfo = (tokenId: string | null) => {
    return useQuery({
      queryKey: tokenKeys.detail(tokenId || ''),
      queryFn: () =>
        tokenId ? tokenFactoryService.getTokenInfo(tokenId) : null,
      enabled: !!tokenId,
      staleTime: 30_000,
    });
  };

  /**
   * Get tokens by creator
   */
  const useTokensByCreator = (creatorAddress: string | null) => {
    return useQuery({
      queryKey: tokenKeys.byCreator(creatorAddress || ''),
      queryFn: () =>
        creatorAddress
          ? tokenFactoryService.getTokensByCreator(creatorAddress)
          : [],
      enabled: !!creatorAddress,
      staleTime: 30_000,
    });
  };

  /**
   * Get user's token balance
   */
  const useTokenBalance = (tokenId: string | null) => {
    return useQuery({
      queryKey: tokenKeys.balance(tokenId || '', wallet.address || ''),
      queryFn: () =>
        tokenId && wallet.address
          ? tokenFactoryService.getTokenBalance(tokenId, wallet.address)
          : BigInt(0),
      enabled: !!tokenId && !!wallet.address,
      staleTime: 15_000, // More frequent updates for balances
    });
  };

  /**
   * Calculate buy price
   */
  const useBuyPrice = (tokenId: string | null, amount: bigint) => {
    return useQuery({
      queryKey: ['buy-price', tokenId, amount.toString()],
      queryFn: () =>
        tokenId
          ? tokenFactoryService.calculateBuyPrice(tokenId, amount)
          : BigInt(0),
      enabled: !!tokenId && amount > 0,
      staleTime: 5_000, // Prices change frequently
    });
  };

  /**
   * Calculate sell price
   */
  const useSellPrice = (tokenId: string | null, amount: bigint) => {
    return useQuery({
      queryKey: ['sell-price', tokenId, amount.toString()],
      queryFn: () =>
        tokenId
          ? tokenFactoryService.calculateSellPrice(tokenId, amount)
          : BigInt(0),
      enabled: !!tokenId && amount > 0,
      staleTime: 5_000,
    });
  };

  /**
   * Create a new token
   */
  const useCreateToken = () => {
    const { executeTransaction } = useTransaction({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: tokenKeys.all });

        toast({
          title: 'Token Created!',
          description: 'Your token has been successfully created',
        });
      },
    });

    return useMutation({
      mutationFn: async (params: CreateTokenParams) => {
        const operation = tokenFactoryService.buildCreateTokenOperation(params) as any;
        return executeTransaction([operation]);
      },
    });
  };

  /**
   * Buy tokens
   */
  const useBuyTokens = () => {
    const { executeTransaction } = useTransaction({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: tokenKeys.all });

        toast({
          title: 'Purchase Successful!',
          description: 'Tokens have been added to your wallet',
        });
      },
    });

    return useMutation({
      mutationFn: async (params: {
        tokenId: string;
        amount: bigint;
        maxPrice: bigint;
      }) => {
        const operation = tokenFactoryService.buildBuyTokensOperation(
          params.tokenId,
          params.amount,
          params.maxPrice
        ) as any;
        return executeTransaction([operation]);
      },
    });
  };

  /**
   * Sell tokens
   */
  const useSellTokens = () => {
    const { executeTransaction } = useTransaction({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: tokenKeys.all });

        toast({
          title: 'Sale Successful!',
          description: 'Tokens have been sold',
        });
      },
    });

    return useMutation({
      mutationFn: async (params: {
        tokenId: string;
        amount: bigint;
        minPrice: bigint;
      }) => {
        const operation = tokenFactoryService.buildSellTokensOperation(
          params.tokenId,
          params.amount,
          params.minPrice
        ) as any;
        return executeTransaction([operation]);
      },
    });
  };

  return {
    // Queries
    useAllTokens,
    useTokenInfo,
    useTokensByCreator,
    useTokenBalance,
    useBuyPrice,
    useSellPrice,

    // Mutations
    useCreateToken,
    useBuyTokens,
    useSellTokens,
  };
}
