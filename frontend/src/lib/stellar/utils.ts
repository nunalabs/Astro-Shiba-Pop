/**
 * Stellar Utility Functions
 *
 * Helper functions for common Stellar operations, formatting,
 * and validation tasks.
 */

import { Address, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';

/**
 * Address Validation
 */

/**
 * Validate a Stellar public key (G address)
 */
export function isValidStellarAddress(address: string): boolean {
  try {
    // Stellar public keys start with 'G' and are 56 characters
    if (!address || typeof address !== 'string') return false;
    if (!address.startsWith('G') || address.length !== 56) return false;

    // Use Stellar SDK to validate
    Address.fromString(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a Stellar contract ID (C address)
 */
export function isValidContractId(contractId: string): boolean {
  try {
    // Contract IDs start with 'C' and are 56 characters
    if (!contractId || typeof contractId !== 'string') return false;
    if (!contractId.startsWith('C') || contractId.length !== 56) return false;

    // Use Stellar SDK to validate
    Address.fromString(contractId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Amount Formatting
 */

/**
 * Convert stroops to XLM
 * 1 XLM = 10,000,000 stroops
 */
export function stroopsToXlm(stroops: string | number): string {
  const amount = typeof stroops === 'string' ? parseInt(stroops) : stroops;
  return (amount / 10_000_000).toFixed(7);
}

/**
 * Convert XLM to stroops
 */
export function xlmToStroops(xlm: string | number): string {
  const amount = typeof xlm === 'string' ? parseFloat(xlm) : xlm;
  return Math.floor(amount * 10_000_000).toString();
}

/**
 * Format amount with proper decimals
 */
export function formatAmount(
  amount: string | number,
  decimals: number = 7
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return '0';

  // Format with specified decimals and remove trailing zeros
  return num.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Format amount as currency (with thousands separators)
 */
export function formatCurrency(
  amount: string | number,
  decimals: number = 2
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return '0';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format large numbers (K, M, B)
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  return `${(num / 1_000_000_000).toFixed(1)}B`;
}

/**
 * Address Formatting
 */

/**
 * Truncate address for display (shows first 4 and last 4 chars)
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;

  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Truncate with custom start/end length
 */
export function truncateString(
  str: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!str) return '';
  if (str.length <= startChars + endChars) return str;

  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
}

/**
 * Soroban ScVal Utilities
 */

/**
 * Convert JavaScript value to Soroban ScVal
 */
export function toScVal(value: any, type?: xdr.ScValType): xdr.ScVal {
  return nativeToScVal(value, type ? { type } : undefined);
}

/**
 * Convert Soroban ScVal to JavaScript value
 */
export function fromScVal(scVal: xdr.ScVal): any {
  return scValToNative(scVal);
}

/**
 * Create Address ScVal from string
 */
export function addressToScVal(address: string): xdr.ScVal {
  return Address.fromString(address).toScVal();
}

/**
 * Transaction Hash Utilities
 */

/**
 * Validate transaction hash format
 */
export function isValidTransactionHash(hash: string): boolean {
  // Transaction hashes are 64 character hex strings
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Time Utilities
 */

/**
 * Get Unix timestamp for current time
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get Unix timestamp for a future time (seconds from now)
 */
export function getFutureTimestamp(secondsFromNow: number): number {
  return getCurrentTimestamp() + secondsFromNow;
}

/**
 * Format timestamp to human-readable date
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Get time ago string (e.g., "2 hours ago")
 */
export function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}

/**
 * Validation Utilities
 */

/**
 * Validate amount is positive and within safe range
 */
export function isValidAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0 && num < Number.MAX_SAFE_INTEGER;
}

/**
 * Validate amount doesn't exceed maximum
 */
export function isAmountWithinLimit(
  amount: string | number,
  max: number
): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isValidAmount(num) && num <= max;
}

/**
 * Sanitize user input (trim and limit length)
 */
export function sanitizeInput(input: string, maxLength: number = 100): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Error Utilities
 */

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Check if error is a user rejection (wallet)
 */
export function isUserRejection(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('user cancelled')
  );
}

/**
 * Delay Utilities
 */

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Percentage Calculations
 */

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Apply slippage to amount
 */
export function applySlippage(
  amount: number,
  slippagePercent: number,
  isMinimum: boolean = true
): number {
  const multiplier = isMinimum
    ? (100 - slippagePercent) / 100
    : (100 + slippagePercent) / 100;

  return amount * multiplier;
}

/**
 * Parse percentage string to number
 */
export function parsePercentage(percentageStr: string): number {
  return parseFloat(percentageStr.replace('%', ''));
}
