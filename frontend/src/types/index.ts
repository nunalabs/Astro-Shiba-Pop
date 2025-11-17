/**
 * Global TypeScript types for AstroShibaPop
 */

// ============================================================================
// Stellar Types
// ============================================================================

export type StellarNetwork = 'testnet' | 'mainnet';

export interface StellarConfig {
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl: string;
}

// ============================================================================
// Wallet Types
// ============================================================================

export type WalletType = 'freighter' | 'albedo' | 'xbull';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
  walletType: WalletType | null;
  isConnecting: boolean;
  error: string | null;
}

// ============================================================================
// Token Types
// ============================================================================

export interface Token {
  id: string;
  address: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  creator: string;
  totalSupply: string;
  marketCap: string;
  price: string;
  priceChange24h: number;
  volume24h: string;
  holders: number;
  createdAt: string;
  isGraduated: boolean;
}

export interface TokenCreationParams {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
}

// ============================================================================
// AMM/Pool Types
// ============================================================================

export interface Pool {
  id: string;
  address: string;
  token0: Token;
  token1: Token;
  reserve0: string;
  reserve1: string;
  totalLiquidity: string;
  volume24h: string;
  fee: number;
  apr: number;
  createdAt: string;
}

export interface LiquidityPosition {
  id: string;
  pool: Pool;
  user: string;
  liquidity: string;
  token0Amount: string;
  token1Amount: string;
  createdAt: string;
}

// ============================================================================
// Transaction Types
// ============================================================================

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface Transaction {
  id: string;
  hash: string;
  type: string;
  status: TransactionStatus;
  from: string;
  to?: string;
  amount?: string;
  fee: string;
  timestamp: string;
  error?: string;
}

export interface SimulationResult {
  success: boolean;
  estimatedFee: string;
  changes: {
    account: string;
    asset: string;
    change: string;
  }[];
  error?: string;
}

// ============================================================================
// Gamification Types
// ============================================================================

export interface User {
  address: string;
  username?: string;
  avatar?: string;
  points: number;
  level: number;
  tokensCreated: number;
  totalVolume: string;
  joinedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  score: number;
  change?: number;
}

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorCode {
  // Wallet errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  WALLET_USER_REJECTED = 'WALLET_USER_REJECTED',

  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  SIMULATION_FAILED = 'SIMULATION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',

  // Contract errors
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
  }

  getUserMessage(): string {
    return this.userMessage || this.getDefaultUserMessage();
  }

  private getDefaultUserMessage(): string {
    switch (this.code) {
      case ErrorCode.WALLET_NOT_CONNECTED:
        return 'Please connect your wallet to continue';
      case ErrorCode.WALLET_NOT_INSTALLED:
        return 'Please install Freighter wallet extension';
      case ErrorCode.WALLET_USER_REJECTED:
        return 'Transaction was rejected';
      case ErrorCode.INSUFFICIENT_BALANCE:
        return 'Insufficient balance for this transaction';
      case ErrorCode.SLIPPAGE_EXCEEDED:
        return 'Price changed too much. Please try again';
      default:
        return 'An unexpected error occurred';
    }
  }
}
