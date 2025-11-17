/**
 * Transaction Utilities
 *
 * Helper functions for signing and submitting Stellar/Soroban transactions
 */

import {
  SorobanRpc,
  Transaction,
  TransactionBuilder,
  Operation,
  Asset,
  Account,
  BASE_FEE,
  Networks,
} from '@stellar/stellar-sdk';
import { getNetworkConfig, NETWORK, TRANSACTION_CONFIG } from './config';
import { getFreighter } from './freighter';

// ============================================================================
// Types
// ============================================================================

export interface TransactionResult {
  hash: string;
  status: 'success' | 'failed';
  result?: any;
  error?: string;
}

export interface SignTransactionParams {
  xdr: string;
  publicKey: string;
  network?: string;
}

// ============================================================================
// RPC Client
// ============================================================================

let rpcClient: SorobanRpc.Server | null = null;

export function getRpcClient(): SorobanRpc.Server {
  if (!rpcClient) {
    const config = getNetworkConfig();
    rpcClient = new SorobanRpc.Server(config.rpcUrl, {
      allowHttp: NETWORK === 'testnet',
    });
  }
  return rpcClient;
}

// ============================================================================
// Transaction Signing
// ============================================================================

/**
 * Sign a transaction using Freighter wallet
 */
export async function signTransaction({
  xdr,
  publicKey,
  network,
}: SignTransactionParams): Promise<string> {
  const freighter = await getFreighter();

  if (!freighter) {
    throw new Error('Freighter wallet not available');
  }

  try {
    const networkPassphrase = network || getNetworkConfig().networkPassphrase;

    const signedXdr = await freighter.signTransaction(xdr, {
      network: networkPassphrase,
      networkPassphrase,
      accountToSign: publicKey,
    });

    return signedXdr;
  } catch (error) {
    console.error('Failed to sign transaction:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to sign transaction'
    );
  }
}

// ============================================================================
// Transaction Submission
// ============================================================================

/**
 * Submit a signed transaction to the network
 */
export async function submitTransaction(
  signedXdr: string
): Promise<TransactionResult> {
  const rpc = getRpcClient();

  try {
    // Parse the signed transaction
    const transaction = TransactionBuilder.fromXDR(
      signedXdr,
      getNetworkConfig().networkPassphrase
    ) as Transaction;

    // Submit to network
    const response = await rpc.sendTransaction(transaction);

    // Check for immediate errors
    if (response.status === 'ERROR') {
      throw new Error(response.errorResult?.result().toString() || 'Transaction failed');
    }

    // Poll for result
    const result = await pollTransactionStatus(response.hash);

    return result;
  } catch (error) {
    console.error('Failed to submit transaction:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to submit transaction'
    );
  }
}

// ============================================================================
// Transaction Status Polling
// ============================================================================

/**
 * Poll for transaction status until it's finalized
 */
async function pollTransactionStatus(hash: string): Promise<TransactionResult> {
  const rpc = getRpcClient();
  let attempts = 0;
  const maxAttempts = TRANSACTION_CONFIG.maxRetries;
  const pollInterval = TRANSACTION_CONFIG.pollingInterval;

  while (attempts < maxAttempts) {
    try {
      const response = await rpc.getTransaction(hash);

      if (response.status === 'SUCCESS') {
        return {
          hash,
          status: 'success',
          result: response.resultMetaXdr,
        };
      }

      if (response.status === 'FAILED') {
        return {
          hash,
          status: 'failed',
          error: 'Transaction failed',
        };
      }

      // Still pending, wait and try again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      attempts++;
    } catch (error) {
      console.error('Error polling transaction:', error);
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error('Transaction polling timeout');
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error('Transaction timeout - status unknown');
}

// ============================================================================
// Contract Simulation
// ============================================================================

/**
 * Simulate a contract invocation to estimate fees and validate
 */
export async function simulateTransaction(
  transaction: Transaction
): Promise<SorobanRpc.Api.SimulateTransactionResponse> {
  const rpc = getRpcClient();

  try {
    const response = await rpc.simulateTransaction(transaction);

    if (SorobanRpc.Api.isSimulationError(response)) {
      throw new Error(`Simulation failed: ${response.error}`);
    }

    return response;
  } catch (error) {
    console.error('Failed to simulate transaction:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to simulate transaction'
    );
  }
}

// ============================================================================
// Prepare and Submit Contract Call
// ============================================================================

export interface ContractCallParams {
  contractId: string;
  method: string;
  args: any[];
  publicKey: string;
  memo?: string;
}

/**
 * Full workflow: Simulate -> Sign -> Submit
 */
/**
 * NOTE: This function is currently not used because the generated contract bindings
 * handle transaction building, signing, and submission automatically.
 * Keeping this for reference and potential future use.
 */
/*
export async function executeContractCall({
  contractId,
  method,
  args,
  publicKey,
  memo,
}: ContractCallParams): Promise<TransactionResult> {
  const rpc = getRpcClient();
  const config = getNetworkConfig();

  try {
    // 1. Get account details
    const account = await rpc.getAccount(publicKey);
    const stellarAccount = new Account(account.accountId(), account.sequenceNumber());

    // 2. Build transaction
    const contract = new Operation.invokeContractFunction({
      contract: contractId,
      function: method,
      args,
    });

    const txBuilder = new TransactionBuilder(stellarAccount, {
      fee: BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(contract)
      .setTimeout(TRANSACTION_CONFIG.timeout);

    if (memo) {
      txBuilder.addMemo(memo);
    }

    const transaction = txBuilder.build();

    // 3. Simulate to get resource estimates
    const simulation = await simulateTransaction(transaction);

    if (!SorobanRpc.Api.isSimulationSuccess(simulation)) {
      throw new Error('Simulation failed');
    }

    // 4. Prepare transaction with simulation results
    const preparedTransaction = SorobanRpc.assembleTransaction(
      transaction,
      simulation
    ).build();

    // 5. Sign with Freighter
    const signedXdr = await signTransaction({
      xdr: preparedTransaction.toXDR(),
      publicKey,
      network: config.networkPassphrase,
    });

    // 6. Submit to network
    const result = await submitTransaction(signedXdr);

    return result;
  } catch (error) {
    console.error('Contract call failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Contract call failed'
    );
  }
}
*/

// ============================================================================
// Get Transaction Fee Estimate
// ============================================================================

/**
 * Get estimated fee for a transaction
 */
export async function estimateFee(transaction: Transaction): Promise<string> {
  try {
    const simulation = await simulateTransaction(transaction);

    if (SorobanRpc.Api.isSimulationSuccess(simulation)) {
      // Fee from simulation includes resource fees
      return simulation.minResourceFee || BASE_FEE;
    }

    return BASE_FEE;
  } catch (error) {
    console.error('Fee estimation failed:', error);
    return BASE_FEE;
  }
}
