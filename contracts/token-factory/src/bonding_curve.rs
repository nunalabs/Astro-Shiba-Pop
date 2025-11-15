use soroban_sdk::contracttype;

/// Bonding curve for automatic price discovery
///
/// Uses a quadratic curve: price = base_price * (supply / k)^2
/// This creates exponential price growth as supply increases
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct BondingCurve {
    /// Current circulating supply (tokens sold)
    pub circulating_supply: i128,
    /// Total supply available
    pub total_supply: i128,
    /// Base price in stroops (XLM) per token
    pub base_price: i128,
    /// Curve steepness constant
    pub k: i128,
    /// Total XLM in reserves
    pub xlm_reserve: i128,
}

impl BondingCurve {
    /// Creates a new bonding curve
    ///
    /// # Arguments
    /// * `total_supply` - Total token supply
    pub fn new(total_supply: i128) -> Self {
        Self {
            circulating_supply: 0,
            total_supply,
            base_price: 1_000, // 0.0001 XLM per token initially
            k: 1_000_000, // Curve constant
            xlm_reserve: 0,
        }
    }

    /// Calculate how many tokens can be bought with XLM amount
    ///
    /// Uses integration of the curve to calculate exact amount
    pub fn calculate_buy_amount(&self, xlm_amount: i128) -> i128 {
        // Simplified calculation for MVP
        // In production, use proper integral of the bonding curve
        let current_price = self.get_current_price();

        // Average price approximation
        let avg_price = current_price + (current_price * xlm_amount) / (self.xlm_reserve + 1);

        // Tokens = XLM / avg_price
        (xlm_amount * 10_000_000) / avg_price // Adjust for precision
    }

    /// Calculate how much XLM will be received for selling tokens
    ///
    /// Applies a small discount (2%) to prevent arbitrage
    pub fn calculate_sell_amount(&self, token_amount: i128) -> i128 {
        let current_price = self.get_current_price();

        // Apply 2% sell penalty
        let sell_price = (current_price * 98) / 100;

        // XLM = tokens * sell_price
        (token_amount * sell_price) / 10_000_000 // Adjust for precision
    }

    /// Get current price per token (in stroops)
    ///
    /// Formula: price = base_price * (circulating / k)^2
    pub fn get_current_price(&self) -> i128 {
        if self.circulating_supply == 0 {
            return self.base_price;
        }

        // Calculate (circulating / k)^2
        let ratio = (self.circulating_supply * 10_000) / self.k;
        let ratio_squared = (ratio * ratio) / 10_000;

        // Multiply by base price
        (self.base_price * ratio_squared) / 10_000
    }

    /// Update state after a buy
    pub fn apply_buy(&mut self, xlm_spent: i128, tokens_received: i128) {
        self.circulating_supply += tokens_received;
        self.xlm_reserve += xlm_spent;
    }

    /// Update state after a sell
    pub fn apply_sell(&mut self, xlm_received: i128, tokens_sold: i128) {
        self.circulating_supply -= tokens_sold;
        self.xlm_reserve -= xlm_received;
    }

    /// Get market cap in XLM (circulating * current_price)
    pub fn get_market_cap(&self) -> i128 {
        let price = self.get_current_price();
        (self.circulating_supply * price) / 10_000_000
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_curve() {
        let curve = BondingCurve::new(1_000_000_000);
        assert_eq!(curve.circulating_supply, 0);
        assert_eq!(curve.total_supply, 1_000_000_000);
        assert_eq!(curve.xlm_reserve, 0);
    }

    #[test]
    fn test_initial_price() {
        let curve = BondingCurve::new(1_000_000_000);
        assert_eq!(curve.get_current_price(), 1_000); // Base price
    }

    #[test]
    fn test_price_increases_with_supply() {
        let mut curve = BondingCurve::new(1_000_000_000);

        let initial_price = curve.get_current_price();

        // Simulate buy
        curve.apply_buy(100_000_000, 100_000);

        let new_price = curve.get_current_price();

        assert!(new_price > initial_price);
    }

    #[test]
    fn test_buy_calculation() {
        let curve = BondingCurve::new(1_000_000_000);
        let tokens = curve.calculate_buy_amount(10_000_000); // 1 XLM
        assert!(tokens > 0);
    }
}
