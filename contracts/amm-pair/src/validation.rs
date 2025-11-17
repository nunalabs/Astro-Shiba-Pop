//! Input validation for AMM operations
//!
//! Centralized validation logic for security

use crate::errors::Error;

/// Minimum liquidity to lock permanently (prevents division by zero attacks)
pub const MINIMUM_LIQUIDITY: i128 = 1000;

/// Minimum amounts for trades
pub const MIN_SWAP_AMOUNT: i128 = 100; // Minimum swap amount
pub const MIN_LIQUIDITY_AMOUNT: i128 = 1000; // Minimum liquidity to add

/// Maximum price impact allowed (default 5%)
pub const MAX_PRICE_IMPACT_BPS: i128 = 500;

/// Validate swap amount
pub fn validate_swap_amount(amount: i128) -> Result<(), Error> {
    if amount < MIN_SWAP_AMOUNT {
        return Err(Error::InsufficientInputAmount);
    }
    Ok(())
}

/// Validate liquidity amount
pub fn validate_liquidity_amount(amount: i128) -> Result<(), Error> {
    if amount < MIN_LIQUIDITY_AMOUNT {
        return Err(Error::InsufficientLiquidity);
    }
    Ok(())
}

/// Validate reserves are non-zero
pub fn validate_reserves(reserve_0: i128, reserve_1: i128) -> Result<(), Error> {
    if reserve_0 <= 0 || reserve_1 <= 0 {
        return Err(Error::InsufficientLiquidity);
    }
    Ok(())
}

/// Validate K invariant (x * y = k)
/// K should increase or stay the same after trades (due to fees)
pub fn validate_k_invariant(
    reserve_0_before: i128,
    reserve_1_before: i128,
    reserve_0_after: i128,
    reserve_1_after: i128,
) -> Result<(), Error> {
    let k_before = reserve_0_before.checked_mul(reserve_1_before)
        .ok_or(Error::Overflow)?;
    let k_after = reserve_0_after.checked_mul(reserve_1_after)
        .ok_or(Error::Overflow)?;

    if k_after < k_before {
        return Err(Error::KInvariantViolated);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_swap_amount() {
        assert!(validate_swap_amount(100).is_ok());
        assert!(validate_swap_amount(1000).is_ok());
        assert_eq!(validate_swap_amount(50).unwrap_err(), Error::InsufficientInputAmount);
    }

    #[test]
    fn test_validate_reserves() {
        assert!(validate_reserves(1000, 2000).is_ok());
        assert_eq!(validate_reserves(0, 1000).unwrap_err(), Error::InsufficientLiquidity);
        assert_eq!(validate_reserves(1000, 0).unwrap_err(), Error::InsufficientLiquidity);
    }

    #[test]
    fn test_k_invariant() {
        // K should increase after trade (due to fees)
        assert!(validate_k_invariant(1000, 1000, 1100, 1000).is_ok());

        // K should not decrease
        assert_eq!(
            validate_k_invariant(1000, 1000, 900, 900).unwrap_err(),
            Error::KInvariantViolated
        );
    }
}
