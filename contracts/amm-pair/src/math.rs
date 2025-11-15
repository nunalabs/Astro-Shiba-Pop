/// Math library for AMM calculations
/// Based on Uniswap V2 math

/// Fee in basis points (30 = 0.3%)
const FEE_BPS: i128 = 30;
const FEE_DENOMINATOR: i128 = 10000;

/// Calculate square root using Babylonian method
/// Used for initial liquidity calculation
pub fn sqrt(y: i128) -> i128 {
    if y < 4 {
        if y == 0 {
            return 0;
        }
        return 1;
    }

    let mut z = y;
    let mut x = y / 2 + 1;

    while x < z {
        z = x;
        x = (y / x + x) / 2;
    }

    z
}

/// Calculate quote amount based on reserves
/// Used for calculating optimal liquidity amounts
///
/// # Arguments
/// * `amount_a` - Amount of token A
/// * `reserve_a` - Reserve of token A
/// * `reserve_b` - Reserve of token B
///
/// # Returns
/// Equivalent amount of token B
pub fn quote(amount_a: i128, reserve_a: i128, reserve_b: i128) -> i128 {
    if amount_a <= 0 {
        panic!("insufficient amount");
    }
    if reserve_a <= 0 || reserve_b <= 0 {
        panic!("insufficient liquidity");
    }

    (amount_a * reserve_b) / reserve_a
}

/// Calculate output amount for a swap
/// Formula: amount_out = (amount_in * 997 * reserve_out) / (reserve_in * 1000 + amount_in * 997)
///
/// # Arguments
/// * `amount_in` - Input amount
/// * `reserve_in` - Input token reserve
/// * `reserve_out` - Output token reserve
///
/// # Returns
/// Output amount after fee
pub fn get_amount_out(amount_in: i128, reserve_in: i128, reserve_out: i128) -> i128 {
    if amount_in <= 0 {
        panic!("insufficient input amount");
    }
    if reserve_in <= 0 || reserve_out <= 0 {
        panic!("insufficient liquidity");
    }

    // Calculate fee multiplier (10000 - 30 = 9970)
    let fee_multiplier = FEE_DENOMINATOR - FEE_BPS;

    let amount_in_with_fee = amount_in * fee_multiplier;
    let numerator = amount_in_with_fee * reserve_out;
    let denominator = (reserve_in * FEE_DENOMINATOR) + amount_in_with_fee;

    numerator / denominator
}

/// Calculate input amount needed for a desired output
/// Formula: amount_in = (reserve_in * amount_out * 1000) / ((reserve_out - amount_out) * 997) + 1
///
/// # Arguments
/// * `amount_out` - Desired output amount
/// * `reserve_in` - Input token reserve
/// * `reserve_out` - Output token reserve
///
/// # Returns
/// Required input amount (including fee)
pub fn get_amount_in(amount_out: i128, reserve_in: i128, reserve_out: i128) -> i128 {
    if amount_out <= 0 {
        panic!("insufficient output amount");
    }
    if reserve_in <= 0 || reserve_out <= 0 {
        panic!("insufficient liquidity");
    }
    if amount_out >= reserve_out {
        panic!("insufficient reserve");
    }

    let fee_multiplier = FEE_DENOMINATOR - FEE_BPS;

    let numerator = reserve_in * amount_out * FEE_DENOMINATOR;
    let denominator = (reserve_out - amount_out) * fee_multiplier;

    (numerator / denominator) + 1
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sqrt() {
        assert_eq!(sqrt(0), 0);
        assert_eq!(sqrt(1), 1);
        assert_eq!(sqrt(4), 2);
        assert_eq!(sqrt(9), 3);
        assert_eq!(sqrt(16), 4);
        assert_eq!(sqrt(100), 10);
        assert_eq!(sqrt(10000), 100);
    }

    #[test]
    fn test_quote() {
        // 1:1 ratio
        assert_eq!(quote(100, 1000, 1000), 100);

        // 1:2 ratio
        assert_eq!(quote(100, 1000, 2000), 200);

        // 2:1 ratio
        assert_eq!(quote(100, 2000, 1000), 50);
    }

    #[test]
    fn test_get_amount_out() {
        // With 1000 reserve each, swapping 100 should give ~90 (due to 0.3% fee)
        let reserve_in = 10_000_000;
        let reserve_out = 10_000_000;
        let amount_in = 1_000_000;

        let amount_out = get_amount_out(amount_in, reserve_in, reserve_out);

        // Should be less than input due to fee and price impact
        assert!(amount_out < amount_in);
        assert!(amount_out > 0);

        // Verify approximately 0.3% fee
        // Expected: ~996,981 (0.3% fee + price impact)
        assert!(amount_out > 900_000 && amount_out < 1_000_000);
    }

    #[test]
    fn test_get_amount_in() {
        let reserve_in = 10_000_000;
        let reserve_out = 10_000_000;
        let amount_out = 900_000;

        let amount_in = get_amount_in(amount_out, reserve_in, reserve_out);

        // Should be more than output due to fee
        assert!(amount_in > amount_out);
    }

    #[test]
    fn test_roundtrip() {
        let reserve_in = 10_000_000;
        let reserve_out = 10_000_000;
        let amount_in = 1_000_000;

        let amount_out = get_amount_out(amount_in, reserve_in, reserve_out);
        let amount_in_required = get_amount_in(amount_out, reserve_in, reserve_out);

        // Should be approximately equal (within 1 due to rounding)
        assert!(
            (amount_in - amount_in_required).abs() <= 1,
            "amount_in: {}, amount_in_required: {}",
            amount_in,
            amount_in_required
        );
    }

    #[test]
    #[should_panic(expected = "insufficient input amount")]
    fn test_get_amount_out_zero_input() {
        get_amount_out(0, 1000, 1000);
    }

    #[test]
    #[should_panic(expected = "insufficient liquidity")]
    fn test_get_amount_out_zero_reserve() {
        get_amount_out(100, 0, 1000);
    }

    #[test]
    #[should_panic(expected = "insufficient reserve")]
    fn test_get_amount_in_exceeds_reserve() {
        get_amount_in(1001, 1000, 1000);
    }
}
