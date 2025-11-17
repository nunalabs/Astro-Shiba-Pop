import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDPQKJHEIHTJ7BRYJHHG55ECXTFCTO3DUGSJ6US3GVASN6FTRIZJX6C2",
  }
} as const

/**
 * Storage keys
 */
export type DataKey = {tag: "PairInfo", values: void} | {tag: "Balance", values: readonly [string]};


/**
 * Pair information and state
 */
export interface PairInfo {
  /**
 * Factory that created this pair
 */
factory: string;
  /**
 * Address to receive protocol fees
 */
fee_to: string;
  /**
 * Last K value (for protocol fee calculation)
 */
k_last: i128;
  /**
 * Reserve of token 0
 */
reserve_0: i128;
  /**
 * Reserve of token 1
 */
reserve_1: i128;
  /**
 * First token (always sorted A < B)
 */
token_0: string;
  /**
 * Second token
 */
token_1: string;
  /**
 * Total LP token supply
 */
total_supply: i128;
}

export interface Client {
  /**
   * Construct and simulate a swap transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Swap exact tokens for tokens
   * 
   * # Arguments
   * * `sender` - Address performing the swap
   * * `amount_in` - Exact amount of input token
   * * `amount_out_min` - Minimum amount of output token (slippage protection)
   * * `token_in` - Address of input token
   * 
   * # Returns
   * Amount of output tokens received
   */
  swap: ({sender, amount_in, amount_out_min, token_in}: {sender: string, amount_in: i128, amount_out_min: i128, token_in: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a balance_of transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get LP token balance for an address
   */
  balance_of: ({address}: {address: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the pair contract
   * 
   * # Arguments
   * * `token_a` - Address of first token
   * * `token_b` - Address of second token
   * * `factory` - Address of factory contract
   * * `fee_to` - Address to send protocol fees
   */
  initialize: ({token_a, token_b, factory, fee_to}: {token_a: string, token_b: string, factory: string, fee_to: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_reserves transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current reserves
   * 
   * # Returns
   * Tuple of (reserve0, reserve1, timestamp)
   */
  get_reserves: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [i128, i128, u64]>>

  /**
   * Construct and simulate a total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total LP token supply
   */
  total_supply: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a add_liquidity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add liquidity to the pair
   * 
   * # Arguments
   * * `sender` - Address adding liquidity
   * * `amount_0_desired` - Desired amount of token0
   * * `amount_1_desired` - Desired amount of token1
   * * `amount_0_min` - Minimum amount of token0 (slippage protection)
   * * `amount_1_min` - Minimum amount of token1 (slippage protection)
   * 
   * # Returns
   * Tuple of (amount0, amount1, liquidity_minted)
   */
  add_liquidity: ({sender, amount_0_desired, amount_1_desired, amount_0_min, amount_1_min}: {sender: string, amount_0_desired: i128, amount_1_desired: i128, amount_0_min: i128, amount_1_min: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [i128, i128, i128]>>

  /**
   * Construct and simulate a get_amount_in transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculate input amount needed for a desired output (without executing swap)
   */
  get_amount_in: ({amount_out, token_out}: {amount_out: i128, token_out: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_pair_info transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get pair information
   */
  get_pair_info: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<PairInfo>>

  /**
   * Construct and simulate a get_amount_out transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculate output amount for a given input (without executing swap)
   */
  get_amount_out: ({amount_in, token_in}: {amount_in: i128, token_in: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a remove_liquidity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Remove liquidity from the pair
   * 
   * # Arguments
   * * `sender` - Address removing liquidity
   * * `liquidity` - Amount of LP tokens to burn
   * * `amount_0_min` - Minimum amount of token0 to receive
   * * `amount_1_min` - Minimum amount of token1 to receive
   * 
   * # Returns
   * Tuple of (amount0, amount1)
   */
  remove_liquidity: ({sender, liquidity, amount_0_min, amount_1_min}: {sender: string, liquidity: i128, amount_0_min: i128, amount_1_min: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [i128, i128]>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAARpTd2FwIGV4YWN0IHRva2VucyBmb3IgdG9rZW5zCgojIEFyZ3VtZW50cwoqIGBzZW5kZXJgIC0gQWRkcmVzcyBwZXJmb3JtaW5nIHRoZSBzd2FwCiogYGFtb3VudF9pbmAgLSBFeGFjdCBhbW91bnQgb2YgaW5wdXQgdG9rZW4KKiBgYW1vdW50X291dF9taW5gIC0gTWluaW11bSBhbW91bnQgb2Ygb3V0cHV0IHRva2VuIChzbGlwcGFnZSBwcm90ZWN0aW9uKQoqIGB0b2tlbl9pbmAgLSBBZGRyZXNzIG9mIGlucHV0IHRva2VuCgojIFJldHVybnMKQW1vdW50IG9mIG91dHB1dCB0b2tlbnMgcmVjZWl2ZWQAAAAAAARzd2FwAAAABAAAAAAAAAAGc2VuZGVyAAAAAAATAAAAAAAAAAlhbW91bnRfaW4AAAAAAAALAAAAAAAAAA5hbW91bnRfb3V0X21pbgAAAAAACwAAAAAAAAAIdG9rZW5faW4AAAATAAAAAQAAAAs=",
        "AAAAAAAAACNHZXQgTFAgdG9rZW4gYmFsYW5jZSBmb3IgYW4gYWRkcmVzcwAAAAAKYmFsYW5jZV9vZgAAAAAAAQAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAMlJbml0aWFsaXplIHRoZSBwYWlyIGNvbnRyYWN0CgojIEFyZ3VtZW50cwoqIGB0b2tlbl9hYCAtIEFkZHJlc3Mgb2YgZmlyc3QgdG9rZW4KKiBgdG9rZW5fYmAgLSBBZGRyZXNzIG9mIHNlY29uZCB0b2tlbgoqIGBmYWN0b3J5YCAtIEFkZHJlc3Mgb2YgZmFjdG9yeSBjb250cmFjdAoqIGBmZWVfdG9gIC0gQWRkcmVzcyB0byBzZW5kIHByb3RvY29sIGZlZXMAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABAAAAAAAAAAHdG9rZW5fYQAAAAATAAAAAAAAAAd0b2tlbl9iAAAAABMAAAAAAAAAB2ZhY3RvcnkAAAAAEwAAAAAAAAAGZmVlX3RvAAAAAAATAAAAAA==",
        "AAAAAAAAAEhHZXQgY3VycmVudCByZXNlcnZlcwoKIyBSZXR1cm5zClR1cGxlIG9mIChyZXNlcnZlMCwgcmVzZXJ2ZTEsIHRpbWVzdGFtcCkAAAAMZ2V0X3Jlc2VydmVzAAAAAAAAAAEAAAPtAAAAAwAAAAsAAAALAAAABg==",
        "AAAAAAAAABlHZXQgdG90YWwgTFAgdG9rZW4gc3VwcGx5AAAAAAAADHRvdGFsX3N1cHBseQAAAAAAAAABAAAACw==",
        "AAAAAAAAAWlBZGQgbGlxdWlkaXR5IHRvIHRoZSBwYWlyCgojIEFyZ3VtZW50cwoqIGBzZW5kZXJgIC0gQWRkcmVzcyBhZGRpbmcgbGlxdWlkaXR5CiogYGFtb3VudF8wX2Rlc2lyZWRgIC0gRGVzaXJlZCBhbW91bnQgb2YgdG9rZW4wCiogYGFtb3VudF8xX2Rlc2lyZWRgIC0gRGVzaXJlZCBhbW91bnQgb2YgdG9rZW4xCiogYGFtb3VudF8wX21pbmAgLSBNaW5pbXVtIGFtb3VudCBvZiB0b2tlbjAgKHNsaXBwYWdlIHByb3RlY3Rpb24pCiogYGFtb3VudF8xX21pbmAgLSBNaW5pbXVtIGFtb3VudCBvZiB0b2tlbjEgKHNsaXBwYWdlIHByb3RlY3Rpb24pCgojIFJldHVybnMKVHVwbGUgb2YgKGFtb3VudDAsIGFtb3VudDEsIGxpcXVpZGl0eV9taW50ZWQpAAAAAAAADWFkZF9saXF1aWRpdHkAAAAAAAAFAAAAAAAAAAZzZW5kZXIAAAAAABMAAAAAAAAAEGFtb3VudF8wX2Rlc2lyZWQAAAALAAAAAAAAABBhbW91bnRfMV9kZXNpcmVkAAAACwAAAAAAAAAMYW1vdW50XzBfbWluAAAACwAAAAAAAAAMYW1vdW50XzFfbWluAAAACwAAAAEAAAPtAAAAAwAAAAsAAAALAAAACw==",
        "AAAAAAAAAEtDYWxjdWxhdGUgaW5wdXQgYW1vdW50IG5lZWRlZCBmb3IgYSBkZXNpcmVkIG91dHB1dCAod2l0aG91dCBleGVjdXRpbmcgc3dhcCkAAAAADWdldF9hbW91bnRfaW4AAAAAAAACAAAAAAAAAAphbW91bnRfb3V0AAAAAAALAAAAAAAAAAl0b2tlbl9vdXQAAAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAABRHZXQgcGFpciBpbmZvcm1hdGlvbgAAAA1nZXRfcGFpcl9pbmZvAAAAAAAAAAAAAAEAAAfQAAAACFBhaXJJbmZv",
        "AAAAAAAAAEJDYWxjdWxhdGUgb3V0cHV0IGFtb3VudCBmb3IgYSBnaXZlbiBpbnB1dCAod2l0aG91dCBleGVjdXRpbmcgc3dhcCkAAAAAAA5nZXRfYW1vdW50X291dAAAAAAAAgAAAAAAAAAJYW1vdW50X2luAAAAAAAACwAAAAAAAAAIdG9rZW5faW4AAAATAAAAAQAAAAs=",
        "AAAAAAAAARRSZW1vdmUgbGlxdWlkaXR5IGZyb20gdGhlIHBhaXIKCiMgQXJndW1lbnRzCiogYHNlbmRlcmAgLSBBZGRyZXNzIHJlbW92aW5nIGxpcXVpZGl0eQoqIGBsaXF1aWRpdHlgIC0gQW1vdW50IG9mIExQIHRva2VucyB0byBidXJuCiogYGFtb3VudF8wX21pbmAgLSBNaW5pbXVtIGFtb3VudCBvZiB0b2tlbjAgdG8gcmVjZWl2ZQoqIGBhbW91bnRfMV9taW5gIC0gTWluaW11bSBhbW91bnQgb2YgdG9rZW4xIHRvIHJlY2VpdmUKCiMgUmV0dXJucwpUdXBsZSBvZiAoYW1vdW50MCwgYW1vdW50MSkAAAAQcmVtb3ZlX2xpcXVpZGl0eQAAAAQAAAAAAAAABnNlbmRlcgAAAAAAEwAAAAAAAAAJbGlxdWlkaXR5AAAAAAAACwAAAAAAAAAMYW1vdW50XzBfbWluAAAACwAAAAAAAAAMYW1vdW50XzFfbWluAAAACwAAAAEAAAPtAAAAAgAAAAsAAAAL",
        "AAAAAgAAAAxTdG9yYWdlIGtleXMAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAAAAAAcUGFpciBjb25maWd1cmF0aW9uIGFuZCBzdGF0ZQAAAAhQYWlySW5mbwAAAAEAAAAfTFAgdG9rZW4gYmFsYW5jZSBmb3IgYW4gYWRkcmVzcwAAAAAHQmFsYW5jZQAAAAABAAAAEw==",
        "AAAAAQAAABpQYWlyIGluZm9ybWF0aW9uIGFuZCBzdGF0ZQAAAAAAAAAAAAhQYWlySW5mbwAAAAgAAAAeRmFjdG9yeSB0aGF0IGNyZWF0ZWQgdGhpcyBwYWlyAAAAAAAHZmFjdG9yeQAAAAATAAAAIEFkZHJlc3MgdG8gcmVjZWl2ZSBwcm90b2NvbCBmZWVzAAAABmZlZV90bwAAAAAAEwAAACtMYXN0IEsgdmFsdWUgKGZvciBwcm90b2NvbCBmZWUgY2FsY3VsYXRpb24pAAAAAAZrX2xhc3QAAAAAAAsAAAASUmVzZXJ2ZSBvZiB0b2tlbiAwAAAAAAAJcmVzZXJ2ZV8wAAAAAAAACwAAABJSZXNlcnZlIG9mIHRva2VuIDEAAAAAAAlyZXNlcnZlXzEAAAAAAAALAAAAIUZpcnN0IHRva2VuIChhbHdheXMgc29ydGVkIEEgPCBCKQAAAAAAAAd0b2tlbl8wAAAAABMAAAAMU2Vjb25kIHRva2VuAAAAB3Rva2VuXzEAAAAAEwAAABVUb3RhbCBMUCB0b2tlbiBzdXBwbHkAAAAAAAAMdG90YWxfc3VwcGx5AAAACw==" ]),
      options
    )
  }
  public readonly fromJSON = {
    swap: this.txFromJSON<i128>,
        balance_of: this.txFromJSON<i128>,
        initialize: this.txFromJSON<null>,
        get_reserves: this.txFromJSON<readonly [i128, i128, u64]>,
        total_supply: this.txFromJSON<i128>,
        add_liquidity: this.txFromJSON<readonly [i128, i128, i128]>,
        get_amount_in: this.txFromJSON<i128>,
        get_pair_info: this.txFromJSON<PairInfo>,
        get_amount_out: this.txFromJSON<i128>,
        remove_liquidity: this.txFromJSON<readonly [i128, i128]>
  }
}