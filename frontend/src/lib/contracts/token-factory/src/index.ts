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
    contractId: "CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6",
  }
} as const


/**
 * Bonding curve for automatic price discovery
 * 
 * Uses a quadratic curve: price = base_price * (supply / k)^2
 * This creates exponential price growth as supply increases
 */
export interface BondingCurve {
  /**
 * Base price in stroops (XLM) per token
 */
base_price: i128;
  /**
 * Current circulating supply (tokens sold)
 */
circulating_supply: i128;
  /**
 * Curve steepness constant
 */
k: i128;
  /**
 * Total supply available
 */
total_supply: i128;
  /**
 * Total XLM in reserves
 */
xlm_reserve: i128;
}

/**
 * Bonding curve types
 */
export type CurveType = {tag: "Linear", values: void} | {tag: "Exponential", values: void} | {tag: "Sigmoid", values: void};


/**
 * Enhanced bonding curve with multiple curve types
 */
export interface BondingCurveV2 {
  /**
 * Base price in stroops (XLM smallest unit)
 */
base_price: i128;
  /**
 * Current circulating supply (tokens sold)
 */
circulating_supply: i128;
  /**
 * Curve type
 */
curve_type: CurveType;
  /**
 * Curve steepness constant
 */
k: i128;
  /**
 * Sell penalty in basis points (e.g., 200 = 2%)
 */
sell_penalty_bps: i64;
  /**
 * Total supply available
 */
total_supply: i128;
  /**
 * Total XLM in reserves
 */
xlm_reserve: i128;
}

export const Errors = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  11: {message:"Unauthorized"},
  12: {message:"NotAdmin"},
  21: {message:"InvalidNameLength"},
  22: {message:"InvalidSymbolLength"},
  23: {message:"InvalidSupply"},
  24: {message:"InvalidDecimals"},
  25: {message:"InvalidMetadataUri"},
  26: {message:"AmountTooSmall"},
  27: {message:"AmountTooLarge"},
  41: {message:"TokenNotFound"},
  42: {message:"AlreadyGraduated"},
  43: {message:"InsufficientReserve"},
  44: {message:"InsufficientBalance"},
  61: {message:"SlippageExceeded"},
  62: {message:"PriceImpactTooHigh"},
  71: {message:"RateLimitExceeded"},
  72: {message:"TooManyTokens"},
  73: {message:"CreationCooldown"},
  81: {message:"Overflow"},
  82: {message:"Underflow"},
  83: {message:"DivisionByZero"},
  91: {message:"ContractPaused"},
  92: {message:"Blacklisted"},
  93: {message:"InvalidCaller"}
}

/**
 * Storage keys for the contract
 */
export type DataKey = {tag: "Admin", values: void} | {tag: "Treasury", values: void} | {tag: "TokenCount", values: void} | {tag: "CreationFee", values: void} | {tag: "TokenInfo", values: readonly [string]} | {tag: "CreatorTokens", values: readonly [string]} | {tag: "Paused", values: void} | {tag: "LastCreationTime", values: readonly [string]};


/**
 * Information about a created token
 */
export interface TokenInfo {
  /**
 * Bonding curve V2 state (with multiple curve types)
 */
bonding_curve: BondingCurveV2;
  /**
 * Creation timestamp
 */
created_at: u64;
  /**
 * Creator address
 */
creator: string;
  /**
 * Token decimals
 */
decimals: u32;
  /**
 * Whether token has graduated to AMM
 */
graduated: boolean;
  /**
 * Metadata URI (IPFS)
 */
metadata_uri: string;
  /**
 * Token name
 */
name: string;
  /**
 * Token symbol
 */
symbol: string;
  /**
 * Token contract address
 */
token_address: string;
  /**
 * Total supply
 */
total_supply: i128;
  /**
 * Total XLM raised
 */
xlm_raised: i128;
}

export interface Client {
  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Emergency pause (admin only)
   */
  pause: ({admin}: {admin: string}, options?: {
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
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a unpause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Unpause contract (admin only)
   */
  unpause: ({admin}: {admin: string}, options?: {
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
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current price for a token (in XLM per token)
   */
  get_price: ({token}: {token: string}, options?: {
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
  }) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a is_paused transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if contract is paused
   */
  is_paused: (options?: {
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
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a buy_tokens transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Buy tokens using the bonding curve
   * 
   * # Arguments
   * * `buyer` - Address buying tokens
   * * `token` - Token address to buy
   * * `xlm_amount` - Amount of XLM to spend (in stroops)
   * * `min_tokens_out` - Minimum tokens to receive (slippage protection)
   * 
   * # Returns
   * Amount of tokens received
   * 
   * # Errors
   * * `Error::ContractPaused` - Contract is paused
   * * `Error::TokenNotFound` - Token doesn't exist
   * * `Error::AlreadyGraduated` - Token already moved to AMM
   * * `Error::AmountTooSmall` - Buy amount below minimum
   * * `Error::SlippageExceeded` - Slippage tolerance exceeded
   * * `Error::PriceImpactTooHigh` - Price impact exceeds maximum allowed
   */
  buy_tokens: ({buyer, token, xlm_amount, min_tokens_out}: {buyer: string, token: string, xlm_amount: i128, min_tokens_out: i128}, options?: {
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
  }) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initializes the factory contract
   * 
   * # Arguments
   * * `admin` - Address that will have admin privileges
   * * `treasury` - Address that will receive creation fees
   * 
   * # Errors
   * * `Error::AlreadyInitialized` - Contract already initialized
   */
  initialize: ({admin, treasury}: {admin: string, treasury: string}, options?: {
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
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a sell_tokens transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sell tokens back to the bonding curve
   * 
   * # Arguments
   * * `seller` - Address selling tokens
   * * `token` - Token address to sell
   * * `token_amount` - Amount of tokens to sell
   * * `min_xlm_out` - Minimum XLM to receive (slippage protection)
   * 
   * # Returns
   * Amount of XLM received (after sell penalty)
   * 
   * # Errors
   * * `Error::ContractPaused` - Contract is paused
   * * `Error::TokenNotFound` - Token doesn't exist
   * * `Error::AlreadyGraduated` - Token already moved to AMM
   * * `Error::AmountTooSmall` - Sell amount below minimum
   * * `Error::SlippageExceeded` - Slippage tolerance exceeded
   * * `Error::InsufficientReserve` - Not enough XLM in reserves
   */
  sell_tokens: ({seller, token, token_amount, min_xlm_out}: {seller: string, token: string, token_amount: i128, min_xlm_out: i128}, options?: {
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
  }) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a create_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Creates a new meme token with bonding curve
   * 
   * # Arguments
   * * `creator` - Address creating the token (must auth)
   * * `name` - Token name (3-32 characters)
   * * `symbol` - Token symbol (2-12 characters)
   * * `decimals` - Number of decimals (typically 7 for Stellar)
   * * `initial_supply` - Initial supply to mint
   * * `metadata_uri` - URI to token metadata (image, description) on IPFS
   * * `curve_type` - Type of bonding curve (Linear, Exponential, Sigmoid)
   * 
   * # Returns
   * Address of the newly created token contract
   * 
   * # Errors
   * * `Error::ContractPaused` - Contract is paused
   * * `Error::TooManyTokens` - User exceeded max tokens per creator
   * * `Error::CreationCooldown` - User must wait before creating another token
   * * Various validation errors
   */
  create_token: ({creator, name, symbol, decimals, initial_supply, metadata_uri, curve_type}: {creator: string, name: string, symbol: string, decimals: u32, initial_supply: i128, metadata_uri: string, curve_type: CurveType}, options?: {
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
  }) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a withdraw_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw accumulated fees (admin only)
   */
  withdraw_fees: ({admin}: {admin: string}, options?: {
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
  }) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_market_cap transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get market cap for a token
   */
  get_market_cap: ({token}: {token: string}, options?: {
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
  }) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_token_info transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get token info
   */
  get_token_info: ({token}: {token: string}, options?: {
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
  }) => Promise<AssembledTransaction<Option<TokenInfo>>>

  /**
   * Construct and simulate a get_token_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total number of tokens created
   */
  get_token_count: (options?: {
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
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set_creation_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update creation fee (admin only)
   */
  set_creation_fee: ({admin, new_fee}: {admin: string, new_fee: i128}, options?: {
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
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_creator_tokens transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get all tokens created by an address
   */
  get_creator_tokens: ({creator}: {creator: string}, options?: {
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
  }) => Promise<AssembledTransaction<Array<string>>>

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
      new ContractSpec([ "AAAAAQAAAKJCb25kaW5nIGN1cnZlIGZvciBhdXRvbWF0aWMgcHJpY2UgZGlzY292ZXJ5CgpVc2VzIGEgcXVhZHJhdGljIGN1cnZlOiBwcmljZSA9IGJhc2VfcHJpY2UgKiAoc3VwcGx5IC8gayleMgpUaGlzIGNyZWF0ZXMgZXhwb25lbnRpYWwgcHJpY2UgZ3Jvd3RoIGFzIHN1cHBseSBpbmNyZWFzZXMAAAAAAAAAAAAMQm9uZGluZ0N1cnZlAAAABQAAACVCYXNlIHByaWNlIGluIHN0cm9vcHMgKFhMTSkgcGVyIHRva2VuAAAAAAAACmJhc2VfcHJpY2UAAAAAAAsAAAAoQ3VycmVudCBjaXJjdWxhdGluZyBzdXBwbHkgKHRva2VucyBzb2xkKQAAABJjaXJjdWxhdGluZ19zdXBwbHkAAAAAAAsAAAAYQ3VydmUgc3RlZXBuZXNzIGNvbnN0YW50AAAAAWsAAAAAAAALAAAAFlRvdGFsIHN1cHBseSBhdmFpbGFibGUAAAAAAAx0b3RhbF9zdXBwbHkAAAALAAAAFVRvdGFsIFhMTSBpbiByZXNlcnZlcwAAAAAAAAt4bG1fcmVzZXJ2ZQAAAAAL",
        "AAAAAgAAABNCb25kaW5nIGN1cnZlIHR5cGVzAAAAAAAAAAAJQ3VydmVUeXBlAAAAAAAAAwAAAAAAAAAAAAAABkxpbmVhcgAAAAAAAAAAAAAAAAALRXhwb25lbnRpYWwAAAAAAAAAAAAAAAAHU2lnbW9pZAA=",
        "AAAAAQAAADBFbmhhbmNlZCBib25kaW5nIGN1cnZlIHdpdGggbXVsdGlwbGUgY3VydmUgdHlwZXMAAAAAAAAADkJvbmRpbmdDdXJ2ZVYyAAAAAAAHAAAAKUJhc2UgcHJpY2UgaW4gc3Ryb29wcyAoWExNIHNtYWxsZXN0IHVuaXQpAAAAAAAACmJhc2VfcHJpY2UAAAAAAAsAAAAoQ3VycmVudCBjaXJjdWxhdGluZyBzdXBwbHkgKHRva2VucyBzb2xkKQAAABJjaXJjdWxhdGluZ19zdXBwbHkAAAAAAAsAAAAKQ3VydmUgdHlwZQAAAAAACmN1cnZlX3R5cGUAAAAAB9AAAAAJQ3VydmVUeXBlAAAAAAAAGEN1cnZlIHN0ZWVwbmVzcyBjb25zdGFudAAAAAFrAAAAAAAACwAAAC1TZWxsIHBlbmFsdHkgaW4gYmFzaXMgcG9pbnRzIChlLmcuLCAyMDAgPSAyJSkAAAAAAAAQc2VsbF9wZW5hbHR5X2JwcwAAAAcAAAAWVG90YWwgc3VwcGx5IGF2YWlsYWJsZQAAAAAADHRvdGFsX3N1cHBseQAAAAsAAAAVVG90YWwgWExNIGluIHJlc2VydmVzAAAAAAAAC3hsbV9yZXNlcnZlAAAAAAs=",
        "AAAAAAAAABxFbWVyZ2VuY3kgcGF1c2UgKGFkbWluIG9ubHkpAAAABXBhdXNlAAAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAAAM=",
        "AAAAAAAAAB1VbnBhdXNlIGNvbnRyYWN0IChhZG1pbiBvbmx5KQAAAAAAAAd1bnBhdXNlAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAAD",
        "AAAAAAAAADBHZXQgY3VycmVudCBwcmljZSBmb3IgYSB0b2tlbiAoaW4gWExNIHBlciB0b2tlbikAAAAJZ2V0X3ByaWNlAAAAAAAAAQAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAQAAA+kAAAALAAAAAw==",
        "AAAAAAAAABtDaGVjayBpZiBjb250cmFjdCBpcyBwYXVzZWQAAAAACWlzX3BhdXNlZAAAAAAAAAAAAAABAAAAAQ==",
        "AAAAAAAAAmZCdXkgdG9rZW5zIHVzaW5nIHRoZSBib25kaW5nIGN1cnZlCgojIEFyZ3VtZW50cwoqIGBidXllcmAgLSBBZGRyZXNzIGJ1eWluZyB0b2tlbnMKKiBgdG9rZW5gIC0gVG9rZW4gYWRkcmVzcyB0byBidXkKKiBgeGxtX2Ftb3VudGAgLSBBbW91bnQgb2YgWExNIHRvIHNwZW5kIChpbiBzdHJvb3BzKQoqIGBtaW5fdG9rZW5zX291dGAgLSBNaW5pbXVtIHRva2VucyB0byByZWNlaXZlIChzbGlwcGFnZSBwcm90ZWN0aW9uKQoKIyBSZXR1cm5zCkFtb3VudCBvZiB0b2tlbnMgcmVjZWl2ZWQKCiMgRXJyb3JzCiogYEVycm9yOjpDb250cmFjdFBhdXNlZGAgLSBDb250cmFjdCBpcyBwYXVzZWQKKiBgRXJyb3I6OlRva2VuTm90Rm91bmRgIC0gVG9rZW4gZG9lc24ndCBleGlzdAoqIGBFcnJvcjo6QWxyZWFkeUdyYWR1YXRlZGAgLSBUb2tlbiBhbHJlYWR5IG1vdmVkIHRvIEFNTQoqIGBFcnJvcjo6QW1vdW50VG9vU21hbGxgIC0gQnV5IGFtb3VudCBiZWxvdyBtaW5pbXVtCiogYEVycm9yOjpTbGlwcGFnZUV4Y2VlZGVkYCAtIFNsaXBwYWdlIHRvbGVyYW5jZSBleGNlZWRlZAoqIGBFcnJvcjo6UHJpY2VJbXBhY3RUb29IaWdoYCAtIFByaWNlIGltcGFjdCBleGNlZWRzIG1heGltdW0gYWxsb3dlZAAAAAAACmJ1eV90b2tlbnMAAAAAAAQAAAAAAAAABWJ1eWVyAAAAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAp4bG1fYW1vdW50AAAAAAALAAAAAAAAAA5taW5fdG9rZW5zX291dAAAAAAACwAAAAEAAAPpAAAACwAAAAM=",
        "AAAAAAAAAN9Jbml0aWFsaXplcyB0aGUgZmFjdG9yeSBjb250cmFjdAoKIyBBcmd1bWVudHMKKiBgYWRtaW5gIC0gQWRkcmVzcyB0aGF0IHdpbGwgaGF2ZSBhZG1pbiBwcml2aWxlZ2VzCiogYHRyZWFzdXJ5YCAtIEFkZHJlc3MgdGhhdCB3aWxsIHJlY2VpdmUgY3JlYXRpb24gZmVlcwoKIyBFcnJvcnMKKiBgRXJyb3I6OkFscmVhZHlJbml0aWFsaXplZGAgLSBDb250cmFjdCBhbHJlYWR5IGluaXRpYWxpemVkAAAAAAppbml0aWFsaXplAAAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACHRyZWFzdXJ5AAAAEwAAAAEAAAPpAAAD7QAAAAAAAAAD",
        "AAAAAAAAAmdTZWxsIHRva2VucyBiYWNrIHRvIHRoZSBib25kaW5nIGN1cnZlCgojIEFyZ3VtZW50cwoqIGBzZWxsZXJgIC0gQWRkcmVzcyBzZWxsaW5nIHRva2VucwoqIGB0b2tlbmAgLSBUb2tlbiBhZGRyZXNzIHRvIHNlbGwKKiBgdG9rZW5fYW1vdW50YCAtIEFtb3VudCBvZiB0b2tlbnMgdG8gc2VsbAoqIGBtaW5feGxtX291dGAgLSBNaW5pbXVtIFhMTSB0byByZWNlaXZlIChzbGlwcGFnZSBwcm90ZWN0aW9uKQoKIyBSZXR1cm5zCkFtb3VudCBvZiBYTE0gcmVjZWl2ZWQgKGFmdGVyIHNlbGwgcGVuYWx0eSkKCiMgRXJyb3JzCiogYEVycm9yOjpDb250cmFjdFBhdXNlZGAgLSBDb250cmFjdCBpcyBwYXVzZWQKKiBgRXJyb3I6OlRva2VuTm90Rm91bmRgIC0gVG9rZW4gZG9lc24ndCBleGlzdAoqIGBFcnJvcjo6QWxyZWFkeUdyYWR1YXRlZGAgLSBUb2tlbiBhbHJlYWR5IG1vdmVkIHRvIEFNTQoqIGBFcnJvcjo6QW1vdW50VG9vU21hbGxgIC0gU2VsbCBhbW91bnQgYmVsb3cgbWluaW11bQoqIGBFcnJvcjo6U2xpcHBhZ2VFeGNlZWRlZGAgLSBTbGlwcGFnZSB0b2xlcmFuY2UgZXhjZWVkZWQKKiBgRXJyb3I6Okluc3VmZmljaWVudFJlc2VydmVgIC0gTm90IGVub3VnaCBYTE0gaW4gcmVzZXJ2ZXMAAAAAC3NlbGxfdG9rZW5zAAAAAAQAAAAAAAAABnNlbGxlcgAAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAx0b2tlbl9hbW91bnQAAAALAAAAAAAAAAttaW5feGxtX291dAAAAAALAAAAAQAAA+kAAAALAAAAAw==",
        "AAAAAAAAAsxDcmVhdGVzIGEgbmV3IG1lbWUgdG9rZW4gd2l0aCBib25kaW5nIGN1cnZlCgojIEFyZ3VtZW50cwoqIGBjcmVhdG9yYCAtIEFkZHJlc3MgY3JlYXRpbmcgdGhlIHRva2VuIChtdXN0IGF1dGgpCiogYG5hbWVgIC0gVG9rZW4gbmFtZSAoMy0zMiBjaGFyYWN0ZXJzKQoqIGBzeW1ib2xgIC0gVG9rZW4gc3ltYm9sICgyLTEyIGNoYXJhY3RlcnMpCiogYGRlY2ltYWxzYCAtIE51bWJlciBvZiBkZWNpbWFscyAodHlwaWNhbGx5IDcgZm9yIFN0ZWxsYXIpCiogYGluaXRpYWxfc3VwcGx5YCAtIEluaXRpYWwgc3VwcGx5IHRvIG1pbnQKKiBgbWV0YWRhdGFfdXJpYCAtIFVSSSB0byB0b2tlbiBtZXRhZGF0YSAoaW1hZ2UsIGRlc2NyaXB0aW9uKSBvbiBJUEZTCiogYGN1cnZlX3R5cGVgIC0gVHlwZSBvZiBib25kaW5nIGN1cnZlIChMaW5lYXIsIEV4cG9uZW50aWFsLCBTaWdtb2lkKQoKIyBSZXR1cm5zCkFkZHJlc3Mgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgdG9rZW4gY29udHJhY3QKCiMgRXJyb3JzCiogYEVycm9yOjpDb250cmFjdFBhdXNlZGAgLSBDb250cmFjdCBpcyBwYXVzZWQKKiBgRXJyb3I6OlRvb01hbnlUb2tlbnNgIC0gVXNlciBleGNlZWRlZCBtYXggdG9rZW5zIHBlciBjcmVhdG9yCiogYEVycm9yOjpDcmVhdGlvbkNvb2xkb3duYCAtIFVzZXIgbXVzdCB3YWl0IGJlZm9yZSBjcmVhdGluZyBhbm90aGVyIHRva2VuCiogVmFyaW91cyB2YWxpZGF0aW9uIGVycm9ycwAAAAxjcmVhdGVfdG9rZW4AAAAHAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAZzeW1ib2wAAAAAABAAAAAAAAAACGRlY2ltYWxzAAAABAAAAAAAAAAOaW5pdGlhbF9zdXBwbHkAAAAAAAsAAAAAAAAADG1ldGFkYXRhX3VyaQAAABAAAAAAAAAACmN1cnZlX3R5cGUAAAAAB9AAAAAJQ3VydmVUeXBlAAAAAAAAAQAAA+kAAAATAAAAAw==",
        "AAAAAAAAACZXaXRoZHJhdyBhY2N1bXVsYXRlZCBmZWVzIChhZG1pbiBvbmx5KQAAAAAADXdpdGhkcmF3X2ZlZXMAAAAAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAABAAAD6QAAAAsAAAAD",
        "AAAAAAAAABpHZXQgbWFya2V0IGNhcCBmb3IgYSB0b2tlbgAAAAAADmdldF9tYXJrZXRfY2FwAAAAAAABAAAAAAAAAAV0b2tlbgAAAAAAABMAAAABAAAD6QAAAAsAAAAD",
        "AAAAAAAAAA5HZXQgdG9rZW4gaW5mbwAAAAAADmdldF90b2tlbl9pbmZvAAAAAAABAAAAAAAAAAV0b2tlbgAAAAAAABMAAAABAAAD6AAAB9AAAAAJVG9rZW5JbmZvAAAA",
        "AAAAAAAAACJHZXQgdG90YWwgbnVtYmVyIG9mIHRva2VucyBjcmVhdGVkAAAAAAAPZ2V0X3Rva2VuX2NvdW50AAAAAAAAAAABAAAABA==",
        "AAAAAAAAACBVcGRhdGUgY3JlYXRpb24gZmVlIChhZG1pbiBvbmx5KQAAABBzZXRfY3JlYXRpb25fZmVlAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAduZXdfZmVlAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAAAw==",
        "AAAAAAAAACRHZXQgYWxsIHRva2VucyBjcmVhdGVkIGJ5IGFuIGFkZHJlc3MAAAASZ2V0X2NyZWF0b3JfdG9rZW5zAAAAAAABAAAAAAAAAAdjcmVhdG9yAAAAABMAAAABAAAD6gAAABM=",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAGgAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAAMVW5hdXRob3JpemVkAAAACwAAAAAAAAAITm90QWRtaW4AAAAMAAAAAAAAABFJbnZhbGlkTmFtZUxlbmd0aAAAAAAAABUAAAAAAAAAE0ludmFsaWRTeW1ib2xMZW5ndGgAAAAAFgAAAAAAAAANSW52YWxpZFN1cHBseQAAAAAAABcAAAAAAAAAD0ludmFsaWREZWNpbWFscwAAAAAYAAAAAAAAABJJbnZhbGlkTWV0YWRhdGFVcmkAAAAAABkAAAAAAAAADkFtb3VudFRvb1NtYWxsAAAAAAAaAAAAAAAAAA5BbW91bnRUb29MYXJnZQAAAAAAGwAAAAAAAAANVG9rZW5Ob3RGb3VuZAAAAAAAACkAAAAAAAAAEEFscmVhZHlHcmFkdWF0ZWQAAAAqAAAAAAAAABNJbnN1ZmZpY2llbnRSZXNlcnZlAAAAACsAAAAAAAAAE0luc3VmZmljaWVudEJhbGFuY2UAAAAALAAAAAAAAAAQU2xpcHBhZ2VFeGNlZWRlZAAAAD0AAAAAAAAAElByaWNlSW1wYWN0VG9vSGlnaAAAAAAAPgAAAAAAAAARUmF0ZUxpbWl0RXhjZWVkZWQAAAAAAABHAAAAAAAAAA1Ub29NYW55VG9rZW5zAAAAAAAASAAAAAAAAAAQQ3JlYXRpb25Db29sZG93bgAAAEkAAAAAAAAACE92ZXJmbG93AAAAUQAAAAAAAAAJVW5kZXJmbG93AAAAAAAAUgAAAAAAAAAORGl2aXNpb25CeVplcm8AAAAAAFMAAAAAAAAADkNvbnRyYWN0UGF1c2VkAAAAAABbAAAAAAAAAAtCbGFja2xpc3RlZAAAAABcAAAAAAAAAA1JbnZhbGlkQ2FsbGVyAAAAAAAAXQ==",
        "AAAAAgAAAB1TdG9yYWdlIGtleXMgZm9yIHRoZSBjb250cmFjdAAAAAAAAAAAAAAHRGF0YUtleQAAAAAIAAAAAAAAAA1BZG1pbiBhZGRyZXNzAAAAAAAABUFkbWluAAAAAAAAAAAAACBUcmVhc3VyeSBhZGRyZXNzIChyZWNlaXZlcyBmZWVzKQAAAAhUcmVhc3VyeQAAAAAAAAAeVG90YWwgbnVtYmVyIG9mIHRva2VucyBjcmVhdGVkAAAAAAAKVG9rZW5Db3VudAAAAAAAAAAAABNDcmVhdGlvbiBmZWUgYW1vdW50AAAAAAtDcmVhdGlvbkZlZQAAAAABAAAAG1Rva2VuIGluZm8gYnkgdG9rZW4gYWRkcmVzcwAAAAAJVG9rZW5JbmZvAAAAAAAAAQAAABMAAAABAAAAHFRva2VucyBjcmVhdGVkIGJ5IGFuIGFkZHJlc3MAAAANQ3JlYXRvclRva2VucwAAAAAAAAEAAAATAAAAAAAAABVDb250cmFjdCBwYXVzZWQgc3RhdGUAAAAAAAAGUGF1c2VkAAAAAAABAAAAI0xhc3QgdG9rZW4gY3JlYXRpb24gdGltZSBieSBjcmVhdG9yAAAAABBMYXN0Q3JlYXRpb25UaW1lAAAAAQAAABM=",
        "AAAAAQAAACFJbmZvcm1hdGlvbiBhYm91dCBhIGNyZWF0ZWQgdG9rZW4AAAAAAAAAAAAACVRva2VuSW5mbwAAAAAAAAsAAAAyQm9uZGluZyBjdXJ2ZSBWMiBzdGF0ZSAod2l0aCBtdWx0aXBsZSBjdXJ2ZSB0eXBlcykAAAAAAA1ib25kaW5nX2N1cnZlAAAAAAAH0AAAAA5Cb25kaW5nQ3VydmVWMgAAAAAAEkNyZWF0aW9uIHRpbWVzdGFtcAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAPQ3JlYXRvciBhZGRyZXNzAAAAAAdjcmVhdG9yAAAAABMAAAAOVG9rZW4gZGVjaW1hbHMAAAAAAAhkZWNpbWFscwAAAAQAAAAiV2hldGhlciB0b2tlbiBoYXMgZ3JhZHVhdGVkIHRvIEFNTQAAAAAACWdyYWR1YXRlZAAAAAAAAAEAAAATTWV0YWRhdGEgVVJJIChJUEZTKQAAAAAMbWV0YWRhdGFfdXJpAAAAEAAAAApUb2tlbiBuYW1lAAAAAAAEbmFtZQAAABAAAAAMVG9rZW4gc3ltYm9sAAAABnN5bWJvbAAAAAAAEAAAABZUb2tlbiBjb250cmFjdCBhZGRyZXNzAAAAAAANdG9rZW5fYWRkcmVzcwAAAAAAABMAAAAMVG90YWwgc3VwcGx5AAAADHRvdGFsX3N1cHBseQAAAAsAAAAQVG90YWwgWExNIHJhaXNlZAAAAAp4bG1fcmFpc2VkAAAAAAAL" ]),
      options
    )
  }
  public readonly fromJSON = {
    pause: this.txFromJSON<Result<void>>,
        unpause: this.txFromJSON<Result<void>>,
        get_price: this.txFromJSON<Result<i128>>,
        is_paused: this.txFromJSON<boolean>,
        buy_tokens: this.txFromJSON<Result<i128>>,
        initialize: this.txFromJSON<Result<void>>,
        sell_tokens: this.txFromJSON<Result<i128>>,
        create_token: this.txFromJSON<Result<string>>,
        withdraw_fees: this.txFromJSON<Result<i128>>,
        get_market_cap: this.txFromJSON<Result<i128>>,
        get_token_info: this.txFromJSON<Option<TokenInfo>>,
        get_token_count: this.txFromJSON<u32>,
        set_creation_fee: this.txFromJSON<Result<void>>,
        get_creator_tokens: this.txFromJSON<Array<string>>
  }
}