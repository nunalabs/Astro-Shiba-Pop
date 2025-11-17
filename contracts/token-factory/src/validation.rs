//! Input validation functions
//!
//! All validation logic centralized here for security and maintainability

use soroban_sdk::{Address, Env, String};
use crate::errors::Error;

/// Constants for validation
pub const MIN_NAME_LENGTH: u32 = 3;
pub const MAX_NAME_LENGTH: u32 = 32;
pub const MIN_SYMBOL_LENGTH: u32 = 2;
pub const MAX_SYMBOL_LENGTH: u32 = 12;
pub const MIN_SUPPLY: i128 = 1_000_000; // 1M minimum (0.1 with 7 decimals)
pub const MAX_SUPPLY: i128 = 1_000_000_000_000_000; // 1 quadrillion max
pub const MIN_DECIMALS: u32 = 0;
pub const MAX_DECIMALS: u32 = 18;
pub const MAX_METADATA_URI_LENGTH: u32 = 256;

/// Fee constants
pub const CREATION_FEE: i128 = 100_000; // 0.01 XLM in stroops
pub const MIN_BUY_AMOUNT: i128 = 1_000_000; // 0.1 XLM minimum buy
pub const MIN_SELL_AMOUNT: i128 = 100_000; // 0.01 XLM minimum sell

/// Rate limiting constants
pub const MAX_TOKENS_PER_USER: u32 = 10; // Max tokens per creator
pub const TOKEN_CREATION_COOLDOWN: u64 = 3600; // 1 hour between creates
pub const MAX_PRICE_IMPACT_BPS: i128 = 500; // 5% max price impact

/// Market cap thresholds
pub const GRADUATION_THRESHOLD: i128 = 1_000_000_000_000; // 100k XLM
pub const MIN_GRADUATION_LIQUIDITY: i128 = 500_000_000_000; // 50k XLM min for AMM

/// Validate token name
pub fn validate_name(name: &String) -> Result<(), Error> {
    let len = name.len();

    if len < MIN_NAME_LENGTH {
        return Err(Error::InvalidNameLength);
    }

    if len > MAX_NAME_LENGTH {
        return Err(Error::InvalidNameLength);
    }

    // TODO: Add check for special characters if needed

    Ok(())
}

/// Validate token symbol
pub fn validate_symbol(symbol: &String) -> Result<(), Error> {
    let len = symbol.len();

    if len < MIN_SYMBOL_LENGTH {
        return Err(Error::InvalidSymbolLength);
    }

    if len > MAX_SYMBOL_LENGTH {
        return Err(Error::InvalidSymbolLength);
    }

    // TODO: Add check for uppercase only if needed

    Ok(())
}

/// Validate initial supply
pub fn validate_supply(supply: i128) -> Result<(), Error> {
    if supply < MIN_SUPPLY {
        return Err(Error::InvalidSupply);
    }

    if supply > MAX_SUPPLY {
        return Err(Error::InvalidSupply);
    }

    Ok(())
}

/// Validate decimals
pub fn validate_decimals(decimals: u32) -> Result<(), Error> {
    if decimals < MIN_DECIMALS || decimals > MAX_DECIMALS {
        return Err(Error::InvalidDecimals);
    }

    Ok(())
}

/// Validate metadata URI
pub fn validate_metadata_uri(uri: &String) -> Result<(), Error> {
    if uri.len() > MAX_METADATA_URI_LENGTH {
        return Err(Error::InvalidMetadataUri);
    }

    // Basic check for ipfs:// or https://
    // In production, you might want more strict validation

    Ok(())
}

/// Validate buy amount
pub fn validate_buy_amount(amount: i128) -> Result<(), Error> {
    if amount < MIN_BUY_AMOUNT {
        return Err(Error::AmountTooSmall);
    }

    Ok(())
}

/// Validate sell amount
pub fn validate_sell_amount(amount: i128) -> Result<(), Error> {
    if amount < MIN_SELL_AMOUNT {
        return Err(Error::AmountTooSmall);
    }

    Ok(())
}

/// Check if price impact is acceptable
pub fn validate_price_impact(
    old_price: i128,
    new_price: i128,
) -> Result<(), Error> {
    if old_price == 0 {
        return Ok(()); // First trade
    }

    // Calculate price impact in basis points
    let price_change = if new_price > old_price {
        new_price - old_price
    } else {
        old_price - new_price
    };

    let impact_bps = (price_change * 10_000) / old_price;

    if impact_bps > MAX_PRICE_IMPACT_BPS {
        return Err(Error::PriceImpactTooHigh);
    }

    Ok(())
}

/// Validate an address is not zero/invalid
pub fn validate_address(_addr: &Address) -> Result<(), Error> {
    // Soroban SDK handles this internally, but good to have
    // as a placeholder for future checks (e.g., blacklist)
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{Env, String as SorobanString};

    #[test]
    fn test_validate_name() {
        let env = Env::default();

        // Valid names
        assert!(validate_name(&SorobanString::from_str(&env, "ABC")).is_ok());
        assert!(validate_name(&SorobanString::from_str(&env, "Test Token")).is_ok());

        // Too short
        assert_eq!(
            validate_name(&SorobanString::from_str(&env, "AB")),
            Err(Error::InvalidNameLength)
        );

        // Too long
        let long_name = "This is a very long token name that exceeds maximum";
        assert_eq!(
            validate_name(&SorobanString::from_str(&env, long_name)),
            Err(Error::InvalidNameLength)
        );
    }

    #[test]
    fn test_validate_supply() {
        // Valid
        assert!(validate_supply(1_000_000).is_ok());
        assert!(validate_supply(1_000_000_000).is_ok());

        // Too small
        assert_eq!(validate_supply(999_999), Err(Error::InvalidSupply));

        // Too large
        assert_eq!(
            validate_supply(2_000_000_000_000_000),
            Err(Error::InvalidSupply)
        );
    }

    #[test]
    fn test_validate_decimals() {
        assert!(validate_decimals(7).is_ok());
        assert!(validate_decimals(18).is_ok());
        assert_eq!(validate_decimals(19), Err(Error::InvalidDecimals));
    }

    #[test]
    fn test_price_impact() {
        // Small impact - OK
        assert!(validate_price_impact(1000, 1040).is_ok()); // 4%

        // Large impact - Error
        assert_eq!(
            validate_price_impact(1000, 1060),
            Err(Error::PriceImpactTooHigh)
        ); // 6%
    }
}
