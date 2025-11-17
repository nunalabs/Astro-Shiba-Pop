/**
 * useTransaction Hook
 *
 * React hook for executing transactions with simulation,
 * signing, and status tracking.
 */

'use client';

import { useState } from 'react';
import { Operation } from '@stellar/stellar-sdk';
import {
  transactionService,
  SimulationResult,
  TransactionResult,
} from '@/lib/stellar/transactions';
import { useWallet } from '@/stores/wallet';
import { useToast } from './use-toast';

export interface UseTransactionOptions {
  onSuccess?: (result: TransactionResult) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export function useTransaction(options: UseTransactionOptions = {}) {
  const { showToast = true, onSuccess, onError } = options;

  const wallet = useWallet();
  const { toast } = useToast();

  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [result, setResult] = useState<TransactionResult | null>(null);

  /**
   * Execute a transaction
   */
  const executeTransaction = async (
    operations: Operation[],
    memo?: string
  ): Promise<TransactionResult> => {
    // Validate wallet is connected
    if (!wallet.isConnected || !wallet.address) {
      const error = new Error('Please connect your wallet first');

      if (showToast) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet to continue',
          variant: 'destructive',
        });
      }

      onError?.(error);
      throw error;
    }

    setIsExecuting(true);
    setSimulation(null);
    setResult(null);

    try {
      // Execute complete transaction flow
      const txResult = await transactionService.executeTransaction({
        sourceAddress: wallet.address,
        operations,
        signFn: wallet.signTransaction,
        memo,
      });

      setResult(txResult);

      // Handle result
      if (txResult.success) {
        if (showToast) {
          toast({
            title: 'Transaction Successful',
            description: `Transaction ${txResult.hash?.slice(0, 8)}... completed successfully`,
          });
        }

        onSuccess?.(txResult);
      } else {
        const error = new Error(txResult.error || 'Transaction failed');

        if (showToast && txResult.errorType !== 'USER_REJECTED') {
          toast({
            title: 'Transaction Failed',
            description: txResult.error || 'Unknown error occurred',
            variant: 'destructive',
          });
        }

        onError?.(error);
      }

      return txResult;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');

      if (showToast) {
        toast({
          title: 'Transaction Error',
          description: err.message,
          variant: 'destructive',
        });
      }

      setResult({
        success: false,
        error: err.message,
        errorType: 'UNKNOWN',
      });

      onError?.(err);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Simulate a transaction without executing
   */
  const simulateTransaction = async (
    operations: Operation[]
  ): Promise<SimulationResult> => {
    if (!wallet.isConnected || !wallet.address) {
      throw new Error('Please connect your wallet first');
    }

    setIsSimulating(true);

    try {
      // Build transaction
      const transaction = await transactionService.buildTransaction({
        sourceAddress: wallet.address,
        operations,
      });

      // Simulate
      const simResult = await transactionService.simulateTransaction(transaction);

      setSimulation(simResult);

      return simResult;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Simulation failed');

      setSimulation({
        success: false,
        estimatedFee: '0',
        minResourceFee: '0',
        error: err.message,
        errorType: 'UNKNOWN',
      });

      throw error;
    } finally {
      setIsSimulating(false);
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    setSimulation(null);
    setResult(null);
  };

  return {
    // Actions
    executeTransaction,
    simulateTransaction,
    reset,

    // State
    isSimulating,
    isExecuting,
    isLoading: isSimulating || isExecuting,
    simulation,
    result,

    // Derived state
    isSuccess: result?.success === true,
    isError: result?.success === false,
    error: result?.error,
    hash: result?.hash,
  };
}
