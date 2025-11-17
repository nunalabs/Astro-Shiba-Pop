/**
 * Transaction Layer
 *
 * Handles transaction building, simulation, signing, and submission.
 * Provides robust error handling and transaction status tracking.
 */

import {
  Transaction,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  SorobanRpc,
  Account,
  xdr,
  Memo,
} from '@stellar/stellar-sdk';
import { stellarClient } from './client';
import { getNetworkConfig, TRANSACTION_CONFIG } from './config';
import { sleep } from './utils';

/**
 * Simulation result with detailed information
 */
export interface SimulationResult {
  success: boolean;
  estimatedFee: string;
  minResourceFee: string;
  simulatedTransaction?: Transaction;
  error?: string;
  errorType?: 'SIMULATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
}

/**
 * Transaction submission result
 */
export interface TransactionResult {
  success: boolean;
  hash?: string;
  status?: SorobanRpc.Api.GetTransactionStatus;
  result?: any;
  error?: string;
  errorType?: 'SUBMISSION_ERROR' | 'USER_REJECTED' | 'NETWORK_ERROR' | 'UNKNOWN';
}

/**
 * Transaction Service
 */
export class TransactionService {
  /**
   * Build a transaction with one or more operations
   */
  async buildTransaction(params: {
    sourceAddress: string;
    operations: Operation[];
    memo?: string;
  }): Promise<Transaction> {
    try {
      const horizon = stellarClient.getHorizon();

      // Load source account
      const sourceAccount = await horizon.loadAccount(params.sourceAddress);

      // Get current base fee
      const baseFee = await horizon.fetchBaseFee();

      // Calculate fee (higher for Soroban operations)
      const fee = (
        baseFee * TRANSACTION_CONFIG.sorobanFeeMultiplier
      ).toString();

      // Build transaction
      const txBuilder = new TransactionBuilder(sourceAccount, {
        fee,
        networkPassphrase: getNetworkConfig().networkPassphrase,
      });

      // Add operations
      params.operations.forEach((op) => txBuilder.addOperation(op as any));

      // Add memo if provided
      if (params.memo) {
        txBuilder.addMemo(Memo.text(params.memo));
      }

      // Set timeout and build
      return txBuilder.setTimeout(TRANSACTION_CONFIG.timeout).build();
    } catch (error) {
      console.error('Error building transaction:', error);
      throw new Error(
        `Failed to build transaction: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Simulate a transaction before signing
   * CRITICAL: Always call this before submitting a transaction
   */
  async simulateTransaction(
    transaction: Transaction
  ): Promise<SimulationResult> {
    try {
      const soroban = stellarClient.getSoroban();
      const server = soroban.getServer();

      // Simulate the transaction
      const simulation = await server.simulateTransaction(transaction);

      // Handle successful simulation
      if (SorobanRpc.Api.isSimulationSuccess(simulation)) {
        // Prepare transaction with simulation data
        const preparedTx = SorobanRpc.assembleTransaction(
          transaction,
          simulation
        ).build();

        return {
          success: true,
          estimatedFee: preparedTx.fee,
          minResourceFee: simulation.minResourceFee || '0',
          simulatedTransaction: preparedTx,
        };
      }

      // Handle simulation error
      if (SorobanRpc.Api.isSimulationError(simulation)) {
        return {
          success: false,
          estimatedFee: '0',
          minResourceFee: '0',
          error: simulation.error,
          errorType: 'SIMULATION_ERROR',
        };
      }

      // Handle restoration needed
      if (SorobanRpc.Api.isSimulationRestore(simulation)) {
        return {
          success: false,
          estimatedFee: '0',
          minResourceFee: '0',
          error: 'Contract state needs restoration. Please restore and try again.',
          errorType: 'SIMULATION_ERROR',
        };
      }

      // Unexpected response
      return {
        success: false,
        estimatedFee: '0',
        minResourceFee: '0',
        error: 'Unexpected simulation response',
        errorType: 'UNKNOWN',
      };
    } catch (error) {
      console.error('Error simulating transaction:', error);

      return {
        success: false,
        estimatedFee: '0',
        minResourceFee: '0',
        error:
          error instanceof Error ? error.message : 'Simulation failed',
        errorType: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Sign transaction with connected wallet
   */
  async signTransaction(
    transaction: Transaction,
    signFn: (xdr: string) => Promise<string>
  ): Promise<Transaction> {
    try {
      // Convert transaction to XDR
      const xdr = transaction.toXDR();

      // Sign with wallet
      const signedXdr = await signFn(xdr);

      // Parse signed transaction
      const signedTx = TransactionBuilder.fromXDR(
        signedXdr,
        getNetworkConfig().networkPassphrase
      ) as Transaction;

      return signedTx;
    } catch (error) {
      console.error('Error signing transaction:', error);

      // Check if user rejected
      const errorMessage = error instanceof Error ? error.message : '';
      if (
        errorMessage.toLowerCase().includes('user') &&
        (errorMessage.toLowerCase().includes('reject') ||
          errorMessage.toLowerCase().includes('denied') ||
          errorMessage.toLowerCase().includes('cancel'))
      ) {
        throw new Error('USER_REJECTED');
      }

      throw error;
    }
  }

  /**
   * Submit a signed transaction to the network
   */
  async submitTransaction(
    transaction: Transaction
  ): Promise<TransactionResult> {
    try {
      const soroban = stellarClient.getSoroban();
      const server = soroban.getServer();

      // Send transaction
      const sendResponse = await server.sendTransaction(transaction);

      if (sendResponse.status === 'ERROR') {
        return {
          success: false,
          error: 'Transaction was rejected by the network',
          errorType: 'SUBMISSION_ERROR',
        };
      }

      // Poll for transaction status
      const result = await this.pollTransactionStatus(sendResponse.hash);

      return result;
    } catch (error) {
      console.error('Error submitting transaction:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to submit transaction',
        errorType: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Poll transaction status until it's finalized
   */
  private async pollTransactionStatus(
    hash: string
  ): Promise<TransactionResult> {
    const soroban = stellarClient.getSoroban();
    const server = soroban.getServer();

    let retries = 0;

    while (retries < TRANSACTION_CONFIG.maxRetries) {
      try {
        const txResponse = await server.getTransaction(hash);

        // Transaction successful
        if (txResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
          return {
            success: true,
            hash,
            status: txResponse.status,
            result: txResponse.resultMetaXdr,
          };
        }

        // Transaction failed
        if (txResponse.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
          return {
            success: false,
            hash,
            status: txResponse.status,
            error: 'Transaction failed on-chain',
            errorType: 'SUBMISSION_ERROR',
          };
        }

        // Still pending or not found - wait and retry
        if (
          txResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND ||
          (txResponse as any).status === 'PENDING'
        ) {
          await sleep(TRANSACTION_CONFIG.pollingInterval);
          retries++;
          continue;
        }

        // Unexpected status
        return {
          success: false,
          hash,
          status: (txResponse as any).status,
          error: `Unexpected transaction status: ${(txResponse as any).status}`,
          errorType: 'UNKNOWN',
        };
      } catch (error) {
        console.error('Error polling transaction status:', error);
        retries++;
        await sleep(TRANSACTION_CONFIG.pollingInterval);
      }
    }

    // Max retries reached
    return {
      success: false,
      hash,
      error: 'Transaction status polling timeout',
      errorType: 'NETWORK_ERROR',
    };
  }

  /**
   * Execute a complete transaction flow:
   * 1. Build transaction
   * 2. Simulate transaction
   * 3. Sign transaction
   * 4. Submit transaction
   * 5. Poll for result
   */
  async executeTransaction(params: {
    sourceAddress: string;
    operations: Operation[];
    signFn: (xdr: string) => Promise<string>;
    memo?: string;
  }): Promise<TransactionResult> {
    try {
      // 1. Build transaction
      const transaction = await this.buildTransaction({
        sourceAddress: params.sourceAddress,
        operations: params.operations,
        memo: params.memo,
      });

      // 2. Simulate transaction
      const simulation = await this.simulateTransaction(transaction);

      if (!simulation.success) {
        return {
          success: false,
          error: simulation.error || 'Simulation failed',
          errorType: simulation.errorType as any,
        };
      }

      if (!simulation.simulatedTransaction) {
        return {
          success: false,
          error: 'No simulated transaction returned',
          errorType: 'UNKNOWN',
        };
      }

      // 3. Sign transaction
      let signedTx: Transaction;
      try {
        signedTx = await this.signTransaction(
          simulation.simulatedTransaction,
          params.signFn
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';

        if (errorMessage === 'USER_REJECTED') {
          return {
            success: false,
            error: 'Transaction was rejected by user',
            errorType: 'USER_REJECTED',
          };
        }

        throw error;
      }

      // 4. Submit transaction
      const result = await this.submitTransaction(signedTx);

      return result;
    } catch (error) {
      console.error('Error executing transaction:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to execute transaction',
        errorType: 'UNKNOWN',
      };
    }
  }
}

/**
 * Singleton instance of the Transaction Service
 */
export const transactionService = new TransactionService();
