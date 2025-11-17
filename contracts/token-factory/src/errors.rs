//! Error types for Token Factory contract
//!
//! Comprehensive error handling for better debugging and security

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    // Initialization errors (1-10)
    AlreadyInitialized = 1,
    NotInitialized = 2,

    // Authorization errors (11-20)
    Unauthorized = 11,
    NotAdmin = 12,

    // Validation errors (21-40)
    InvalidNameLength = 21,
    InvalidSymbolLength = 22,
    InvalidSupply = 23,
    InvalidDecimals = 24,
    InvalidMetadataUri = 25,
    AmountTooSmall = 26,
    AmountTooLarge = 27,

    // State errors (41-60)
    TokenNotFound = 41,
    AlreadyGraduated = 42,
    InsufficientReserve = 43,
    InsufficientBalance = 44,

    // Slippage errors (61-70)
    SlippageExceeded = 61,
    PriceImpactTooHigh = 62,

    // Rate limiting errors (71-80)
    RateLimitExceeded = 71,
    TooManyTokens = 72,
    CreationCooldown = 73,

    // Math errors (81-90)
    Overflow = 81,
    Underflow = 82,
    DivisionByZero = 83,

    // Security errors (91-100)
    ContractPaused = 91,
    Blacklisted = 92,
    InvalidCaller = 93,
}
