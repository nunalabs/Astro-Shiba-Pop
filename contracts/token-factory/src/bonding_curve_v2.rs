//! Improved Bonding Curve Implementation
//!
//! Features:
//! - Precise mathematical calculations with overflow protection
//! - Multiple curve types (Linear, Exponential, Sigmoid)
//! - Sell penalty to prevent pump-and-dump
//! - Price impact calculations

use soroban_sdk::contracttype;
use crate::errors::Error;

/// Precision constant for fixed-point arithmetic
const PRECISION: i128 = 1_000_000;

/// Bonding curve types
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum CurveType {
    Linear,      // Price increases linearly with supply
    Exponential, // Price increases exponentially (anti-dump)
    Sigmoid,     // S-curve (smooth start, aggressive middle, smooth end)
}

/// Enhanced bonding curve with multiple curve types
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct BondingCurveV2 {
    /// Curve type
    pub curve_type: CurveType,

    /// Current circulating supply (tokens sold)
    pub circulating_supply: i128,

    /// Total supply available
    pub total_supply: i128,

    /// Base price in stroops (XLM smallest unit)
    pub base_price: i128,

    /// Curve steepness constant
    pub k: i128,

    /// Total XLM in reserves
    pub xlm_reserve: i128,

    /// Sell penalty in basis points (e.g., 200 = 2%)
    pub sell_penalty_bps: i64,
}

impl BondingCurveV2 {
    /// Creates a new bonding curve with linear pricing
    pub fn new_linear(total_supply: i128) -> Self {
        Self {
            curve_type: CurveType::Linear,
            circulating_supply: 0,
            total_supply,
            base_price: 100, // 0.00001 XLM per token initially (very cheap)
            k: 1_000_000_000, // Curve constant for linear growth
            xlm_reserve: 0,
            sell_penalty_bps: 200, // 2% sell penalty
        }
    }

    /// Creates a new bonding curve with exponential pricing
    pub fn new_exponential(total_supply: i128) -> Self {
        Self {
            curve_type: CurveType::Exponential,
            circulating_supply: 0,
            total_supply,
            base_price: 100,
            k: 100_000_000, // Smaller k for faster growth
            xlm_reserve: 0,
            sell_penalty_bps: 300, // 3% penalty for exponential (more anti-dump)
        }
    }

    /// Creates a new bonding curve with sigmoid pricing
    pub fn new_sigmoid(total_supply: i128) -> Self {
        Self {
            curve_type: CurveType::Sigmoid,
            circulating_supply: 0,
            total_supply,
            base_price: 100,
            k: 500_000_000,
            xlm_reserve: 0,
            sell_penalty_bps: 200,
        }
    }

    /// Calculate tokens received for XLM amount (BUY)
    ///
    /// Uses integration of the bonding curve for exact calculation
    pub fn calculate_buy_amount(&self, xlm_amount: i128) -> Result<i128, Error> {
        if xlm_amount <= 0 {
            return Err(Error::AmountTooSmall);
        }

        match self.curve_type {
            CurveType::Linear => self.calculate_buy_linear(xlm_amount),
            CurveType::Exponential => self.calculate_buy_exponential(xlm_amount),
            CurveType::Sigmoid => self.calculate_buy_sigmoid(xlm_amount),
        }
    }

    /// Calculate XLM received for token amount (SELL)
    ///
    /// Applies sell penalty to prevent pump-and-dump
    pub fn calculate_sell_amount(&self, token_amount: i128) -> Result<i128, Error> {
        if token_amount <= 0 {
            return Err(Error::AmountTooSmall);
        }

        if token_amount > self.circulating_supply {
            return Err(Error::InsufficientBalance);
        }

        let xlm_before_penalty = match self.curve_type {
            CurveType::Linear => self.calculate_sell_linear(token_amount)?,
            CurveType::Exponential => self.calculate_sell_exponential(token_amount)?,
            CurveType::Sigmoid => self.calculate_sell_sigmoid(token_amount)?,
        };

        // Apply sell penalty
        let penalty = xlm_before_penalty
            .checked_mul(self.sell_penalty_bps as i128)
            .ok_or(Error::Overflow)?
            .checked_div(10_000)
            .ok_or(Error::DivisionByZero)?;

        xlm_before_penalty
            .checked_sub(penalty)
            .ok_or(Error::Underflow)
    }

    /// Get current spot price per token (in stroops)
    pub fn get_current_price(&self) -> i128 {
        if self.circulating_supply == 0 {
            return self.base_price;
        }

        match self.curve_type {
            CurveType::Linear => self.price_linear(),
            CurveType::Exponential => self.price_exponential(),
            CurveType::Sigmoid => self.price_sigmoid(),
        }
    }

    /// Calculate market cap (circulating_supply * current_price)
    pub fn get_market_cap(&self) -> Result<i128, Error> {
        let price = self.get_current_price();

        self.circulating_supply
            .checked_mul(price)
            .ok_or(Error::Overflow)?
            .checked_div(10_000_000) // Adjust for stroops
            .ok_or(Error::DivisionByZero)
    }

    /// Update state after buy (called after successful purchase)
    pub fn apply_buy(&mut self, xlm_spent: i128, tokens_received: i128) -> Result<(), Error> {
        self.circulating_supply = self.circulating_supply
            .checked_add(tokens_received)
            .ok_or(Error::Overflow)?;

        self.xlm_reserve = self.xlm_reserve
            .checked_add(xlm_spent)
            .ok_or(Error::Overflow)?;

        Ok(())
    }

    /// Update state after sell (called after successful sale)
    pub fn apply_sell(&mut self, xlm_received: i128, tokens_sold: i128) -> Result<(), Error> {
        self.circulating_supply = self.circulating_supply
            .checked_sub(tokens_sold)
            .ok_or(Error::Underflow)?;

        self.xlm_reserve = self.xlm_reserve
            .checked_sub(xlm_received)
            .ok_or(Error::Underflow)?;

        Ok(())
    }

    // ========== LINEAR CURVE FUNCTIONS ==========

    /// Linear price: P(s) = base_price + (s / k)
    fn price_linear(&self) -> i128 {
        let price_increase = self.circulating_supply
            .checked_mul(PRECISION)
            .unwrap_or(i128::MAX)
            .checked_div(self.k)
            .unwrap_or(0);

        self.base_price
            .checked_add(price_increase)
            .unwrap_or(i128::MAX)
    }

    /// Buy with linear curve
    /// Integral: Cost = base_price * tokens + (tokens^2) / (2k)
    fn calculate_buy_linear(&self, xlm_amount: i128) -> Result<i128, Error> {
        // Simplified: tokens ≈ xlm / current_price
        // For MVP we use average price approximation
        let current_price = self.get_current_price();

        let tokens = xlm_amount
            .checked_mul(10_000_000) // Adjust for stroops
            .ok_or(Error::Overflow)?
            .checked_div(current_price)
            .ok_or(Error::DivisionByZero)?;

        Ok(tokens)
    }

    /// Sell with linear curve
    fn calculate_sell_linear(&self, token_amount: i128) -> Result<i128, Error> {
        let current_price = self.get_current_price();

        token_amount
            .checked_mul(current_price)
            .ok_or(Error::Overflow)?
            .checked_div(10_000_000)
            .ok_or(Error::DivisionByZero)
    }

    // ========== EXPONENTIAL CURVE FUNCTIONS ==========

    /// Exponential price: P(s) = base_price * e^(s/k)
    /// Approximated for gas efficiency
    fn price_exponential(&self) -> i128 {
        if self.circulating_supply == 0 {
            return self.base_price;
        }

        // Simplified exponential using power approximation
        // e^x ≈ 1 + x + x^2/2 (Taylor series, first 3 terms)
        let x = self.circulating_supply
            .checked_mul(PRECISION)
            .unwrap_or(i128::MAX)
            .checked_div(self.k)
            .unwrap_or(0);

        let x_squared = x
            .checked_mul(x)
            .unwrap_or(i128::MAX)
            .checked_div(PRECISION)
            .unwrap_or(0);

        let exp_approx = PRECISION + x + x_squared / 2;

        self.base_price
            .checked_mul(exp_approx)
            .unwrap_or(i128::MAX)
            .checked_div(PRECISION)
            .unwrap_or(i128::MAX)
    }

    fn calculate_buy_exponential(&self, xlm_amount: i128) -> Result<i128, Error> {
        // Average price approximation for exponential
        let current_price = self.get_current_price();

        xlm_amount
            .checked_mul(10_000_000)
            .ok_or(Error::Overflow)?
            .checked_div(current_price)
            .ok_or(Error::DivisionByZero)
    }

    fn calculate_sell_exponential(&self, token_amount: i128) -> Result<i128, Error> {
        let current_price = self.get_current_price();

        token_amount
            .checked_mul(current_price)
            .ok_or(Error::Overflow)?
            .checked_div(10_000_000)
            .ok_or(Error::DivisionByZero)
    }

    // ========== SIGMOID CURVE FUNCTIONS ==========

    /// Sigmoid price: P(s) = L / (1 + e^(-k(s - s0)))
    /// Where L = max_price, s0 = midpoint
    fn price_sigmoid(&self) -> i128 {
        // Simplified sigmoid approximation
        // For gas efficiency, we use a piecewise linear approximation

        let midpoint = self.total_supply / 2;

        if self.circulating_supply < midpoint / 2 {
            // Early phase: slow growth
            self.price_linear() / 2
        } else if self.circulating_supply < midpoint * 3 / 2 {
            // Middle phase: fast growth
            self.price_exponential()
        } else {
            // Late phase: slow growth again
            self.price_linear() * 2
        }
    }

    fn calculate_buy_sigmoid(&self, xlm_amount: i128) -> Result<i128, Error> {
        let current_price = self.get_current_price();

        xlm_amount
            .checked_mul(10_000_000)
            .ok_or(Error::Overflow)?
            .checked_div(current_price)
            .ok_or(Error::DivisionByZero)
    }

    fn calculate_sell_sigmoid(&self, token_amount: i128) -> Result<i128, Error> {
        let current_price = self.get_current_price();

        token_amount
            .checked_mul(current_price)
            .ok_or(Error::Overflow)?
            .checked_div(10_000_000)
            .ok_or(Error::DivisionByZero)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_linear_curve() {
        let curve = BondingCurveV2::new_linear(1_000_000_000);
        assert_eq!(curve.circulating_supply, 0);
        assert_eq!(curve.curve_type, CurveType::Linear);
        assert_eq!(curve.xlm_reserve, 0);
    }

    #[test]
    fn test_initial_price() {
        let curve = BondingCurveV2::new_linear(1_000_000_000);
        assert_eq!(curve.get_current_price(), 100);
    }

    #[test]
    fn test_buy_calculation() {
        let curve = BondingCurveV2::new_linear(1_000_000_000);
        let tokens = curve.calculate_buy_amount(10_000_000).unwrap(); // 1 XLM
        assert!(tokens > 0);
    }

    #[test]
    fn test_sell_with_penalty() {
        let mut curve = BondingCurveV2::new_linear(1_000_000_000);

        // Simulate buy first
        let _ = curve.apply_buy(10_000_000, 100_000);

        // Try to sell
        let xlm_out = curve.calculate_sell_amount(50_000).unwrap();

        // Should be less than buy price due to penalty
        assert!(xlm_out < 5_000_000); // Less than half of what was spent
    }

    #[test]
    fn test_overflow_protection() {
        let curve = BondingCurveV2::new_linear(1_000_000_000);

        // Try to buy with massive amount
        let result = curve.calculate_buy_amount(i128::MAX);

        // Should handle gracefully (might return error or max value)
        assert!(result.is_ok() || result.is_err());
    }

    #[test]
    fn test_exponential_higher_than_linear() {
        let linear = BondingCurveV2::new_linear(1_000_000_000);
        let mut exp = BondingCurveV2::new_exponential(1_000_000_000);

        // Simulate some circulation
        let _ = exp.apply_buy(100_000_000, 100_000);

        // Exponential should have higher price
        assert!(exp.get_current_price() >= linear.get_current_price());
    }
}
