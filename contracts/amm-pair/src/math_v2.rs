//! Enhanced Math library for AMM calculations
//!
//! Features:
//! - Overflow protection with checked arithmetic
//! - Precise calculations for large numbers
//! - Multiple fee tier support
//! - Price impact calculations

use crate::errors::Error;

/// Fee in basis points (default 30 = 0.3%, like Uniswap V2)
pub const DEFAULT_FEE_BPS: i128 = 30;
pub const FEE_DENOMINATOR: i128 = 10_000;

/// Maximum price impact allowed (5% = 500 bps)
pub const MAX_PRICE_IMPACT_BPS: i128 = 500;

/// Calculate square root using Babylonian method with overflow protection
/// Used for initial liquidity calculation
pub fn sqrt(y: i128) -> Result<i128, Error> {
    if y < 0 {
        return Err(Error::InvalidAmount);
    }

    if y < 4 {
        return Ok(if y == 0 { 0 } else { 1 });
    }

    let mut z = y;
    let mut x = y.checked_div(2).ok_or(Error::DivisionByZero)?
        .checked_add(1).ok_or(Error::Overflow)?;

    while x < z {
        z = x;
        let y_div_x = y.checked_div(x).ok_or(Error::DivisionByZero)?;
        x = y_div_x.checked_add(x).ok_or(Error::Overflow)?
            .checked_div(2).ok_or(Error::DivisionByZero)?;
    }

    Ok(z)
}

/// Calculate quote amount based on reserves with overflow protection
///
/// # Arguments
/// * `amount_a` - Amount of token A
/// * `reserve_a` - Reserve of token A
/// * `reserve_b` - Reserve of token B
///
/// # Returns
/// Equivalent amount of token B
pub fn quote(amount_a: i128, reserve_a: i128, reserve_b: i128) -> Result<i128, Error> {
    if amount_a <= 0 {
        return Err(Error::InsufficientInputAmount);
    }
    if reserve_a <= 0 || reserve_b <= 0 {
        return Err(Error::InsufficientLiquidity);
    }

    let product = amount_a.checked_mul(reserve_b).ok_or(Error::Overflow)?;
    product.checked_div(reserve_a).ok_or(Error::DivisionByZero)
}

/// Calculate output amount for a swap with overflow protection
///
/// Formula: amount_out = (amount_in * (10000-fee) * reserve_out) / (reserve_in * 10000 + amount_in * (10000-fee))
///
/// # Arguments
/// * `amount_in` - Input amount
/// * `reserve_in` - Input token reserve
/// * `reserve_out` - Output token reserve
/// * `fee_bps` - Fee in basis points (optional, defaults to 30)
///
/// # Returns
/// Output amount after fee
pub fn get_amount_out(
    amount_in: i128,
    reserve_in: i128,
    reserve_out: i128,
    fee_bps: Option<i128>,
) -> Result<i128, Error> {
    if amount_in <= 0 {
        return Err(Error::InsufficientInputAmount);
    }
    if reserve_in <= 0 || reserve_out <= 0 {
        return Err(Error::InsufficientLiquidity);
    }

    let fee = fee_bps.unwrap_or(DEFAULT_FEE_BPS);
    let fee_multiplier = FEE_DENOMINATOR.checked_sub(fee).ok_or(Error::Underflow)?;

    let amount_in_with_fee = amount_in.checked_mul(fee_multiplier).ok_or(Error::Overflow)?;
    let numerator = amount_in_with_fee.checked_mul(reserve_out).ok_or(Error::Overflow)?;

    let reserve_product = reserve_in.checked_mul(FEE_DENOMINATOR).ok_or(Error::Overflow)?;
    let denominator = reserve_product.checked_add(amount_in_with_fee).ok_or(Error::Overflow)?;

    numerator.checked_div(denominator).ok_or(Error::DivisionByZero)
}

/// Calculate input amount needed for a desired output with overflow protection
///
/// Formula: amount_in = (reserve_in * amount_out * 10000) / ((reserve_out - amount_out) * (10000-fee)) + 1
///
/// # Arguments
/// * `amount_out` - Desired output amount
/// * `reserve_in` - Input token reserve
/// * `reserve_out` - Output token reserve
/// * `fee_bps` - Fee in basis points (optional, defaults to 30)
///
/// # Returns
/// Required input amount (including fee)
pub fn get_amount_in(
    amount_out: i128,
    reserve_in: i128,
    reserve_out: i128,
    fee_bps: Option<i128>,
) -> Result<i128, Error> {
    if amount_out <= 0 {
        return Err(Error::InsufficientOutputAmount);
    }
    if reserve_in <= 0 || reserve_out <= 0 {
        return Err(Error::InsufficientLiquidity);
    }
    if amount_out >= reserve_out {
        return Err(Error::InsufficientReserve);
    }

    let fee = fee_bps.unwrap_or(DEFAULT_FEE_BPS);
    let fee_multiplier = FEE_DENOMINATOR.checked_sub(fee).ok_or(Error::Underflow)?;

    let reserve_product = reserve_in.checked_mul(amount_out).ok_or(Error::Overflow)?;
    let numerator = reserve_product.checked_mul(FEE_DENOMINATOR).ok_or(Error::Overflow)?;

    let reserve_diff = reserve_out.checked_sub(amount_out).ok_or(Error::Underflow)?;
    let denominator = reserve_diff.checked_mul(fee_multiplier).ok_or(Error::Overflow)?;

    let base_amount = numerator.checked_div(denominator).ok_or(Error::DivisionByZero)?;
    base_amount.checked_add(1).ok_or(Error::Overflow)
}

/// Calculate price impact in basis points
///
/// # Arguments
/// * `amount_in` - Input amount
/// * `reserve_in` - Input token reserve
/// * `reserve_out` - Output token reserve
///
/// # Returns
/// Price impact in basis points (e.g., 500 = 5%)
pub fn calculate_price_impact(
    amount_in: i128,
    reserve_in: i128,
    reserve_out: i128,
) -> Result<i128, Error> {
    if reserve_in == 0 || reserve_out == 0 {
        return Err(Error::InsufficientLiquidity);
    }

    // Spot price before: reserve_out / reserve_in
    // Spot price after: (reserve_out - amount_out) / (reserve_in + amount_in)

    let amount_out = get_amount_out(amount_in, reserve_in, reserve_out, None)?;

    let new_reserve_in = reserve_in.checked_add(amount_in).ok_or(Error::Overflow)?;
    let new_reserve_out = reserve_out.checked_sub(amount_out).ok_or(Error::Underflow)?;

    // Calculate price change percentage
    // price_impact = abs((new_price - old_price) / old_price) * 10000

    let old_price_numerator = reserve_out.checked_mul(FEE_DENOMINATOR).ok_or(Error::Overflow)?;
    let old_price = old_price_numerator.checked_div(reserve_in).ok_or(Error::DivisionByZero)?;

    let new_price_numerator = new_reserve_out.checked_mul(FEE_DENOMINATOR).ok_or(Error::Overflow)?;
    let new_price = new_price_numerator.checked_div(new_reserve_in).ok_or(Error::DivisionByZero)?;

    let price_diff = if old_price > new_price {
        old_price.checked_sub(new_price).ok_or(Error::Underflow)?
    } else {
        new_price.checked_sub(old_price).ok_or(Error::Underflow)?
    };

    let impact = price_diff.checked_mul(FEE_DENOMINATOR).ok_or(Error::Overflow)?;
    impact.checked_div(old_price).ok_or(Error::DivisionByZero)
}

/// Validate price impact is within acceptable limits
pub fn validate_price_impact(
    amount_in: i128,
    reserve_in: i128,
    reserve_out: i128,
    max_impact_bps: Option<i128>,
) -> Result<(), Error> {
    let impact = calculate_price_impact(amount_in, reserve_in, reserve_out)?;
    let max_impact = max_impact_bps.unwrap_or(MAX_PRICE_IMPACT_BPS);

    if impact > max_impact {
        return Err(Error::PriceImpactTooHigh);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sqrt() {
        assert_eq!(sqrt(0).unwrap(), 0);
        assert_eq!(sqrt(1).unwrap(), 1);
        assert_eq!(sqrt(4).unwrap(), 2);
        assert_eq!(sqrt(9).unwrap(), 3);
        assert_eq!(sqrt(16).unwrap(), 4);
        assert_eq!(sqrt(100).unwrap(), 10);
        assert_eq!(sqrt(10000).unwrap(), 100);
    }

    #[test]
    fn test_sqrt_negative() {
        assert!(sqrt(-1).is_err());
    }

    #[test]
    fn test_quote() {
        // 1:1 ratio
        assert_eq!(quote(100, 1000, 1000).unwrap(), 100);

        // 1:2 ratio
        assert_eq!(quote(100, 1000, 2000).unwrap(), 200);

        // 2:1 ratio
        assert_eq!(quote(100, 2000, 1000).unwrap(), 50);
    }

    #[test]
    fn test_get_amount_out() {
        let reserve_in = 10_000_000;
        let reserve_out = 10_000_000;
        let amount_in = 1_000_000;

        let amount_out = get_amount_out(amount_in, reserve_in, reserve_out, None).unwrap();

        // Should be less than input due to fee and price impact
        assert!(amount_out < amount_in);
        assert!(amount_out > 0);

        // Verify approximately 0.3% fee
        assert!(amount_out > 900_000 && amount_out < 1_000_000);
    }

    #[test]
    fn test_get_amount_in() {
        let reserve_in = 10_000_000;
        let reserve_out = 10_000_000;
        let amount_out = 900_000;

        let amount_in = get_amount_in(amount_out, reserve_in, reserve_out, None).unwrap();

        // Should be more than output due to fee
        assert!(amount_in > amount_out);
    }

    #[test]
    fn test_price_impact() {
        let reserve_in = 10_000_000;
        let reserve_out = 10_000_000;
        let amount_in = 100_000; // 1% of reserve

        let impact = calculate_price_impact(amount_in, reserve_in, reserve_out).unwrap();

        // Should have small price impact for 1% trade
        assert!(impact < 200); // Less than 2%
    }

    #[test]
    fn test_large_trade_price_impact() {
        let reserve_in = 10_000_000;
        let reserve_out = 10_000_000;
        let amount_in = 1_000_000; // 10% of reserve

        let impact = calculate_price_impact(amount_in, reserve_in, reserve_out).unwrap();

        // Larger trade should have higher impact
        assert!(impact > 500); // More than 5%
    }

    #[test]
    fn test_validate_price_impact() {
        let reserve_in = 10_000_000;
        let reserve_out = 10_000_000;

        // Small trade should pass
        let small_amount = 100_000;
        assert!(validate_price_impact(small_amount, reserve_in, reserve_out, None).is_ok());

        // Large trade should fail
        let large_amount = 2_000_000;
        assert!(validate_price_impact(large_amount, reserve_in, reserve_out, None).is_err());
    }

    #[test]
    fn test_get_amount_out_zero_input() {
        assert_eq!(
            get_amount_out(0, 1000, 1000, None).unwrap_err(),
            Error::InsufficientInputAmount
        );
    }

    #[test]
    fn test_get_amount_out_zero_reserve() {
        assert_eq!(
            get_amount_out(100, 0, 1000, None).unwrap_err(),
            Error::InsufficientLiquidity
        );
    }

    #[test]
    fn test_get_amount_in_exceeds_reserve() {
        assert_eq!(
            get_amount_in(1001, 1000, 1000, None).unwrap_err(),
            Error::InsufficientReserve
        );
    }
}
