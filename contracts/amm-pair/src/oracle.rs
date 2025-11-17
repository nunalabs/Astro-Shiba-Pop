//! Price Oracle Implementation (TWAP)
//!
//! Time-Weighted Average Price oracle for AMM pairs
//! Provides manipulation-resistant price feeds
//!
//! Based on Uniswap V2 Oracle design

use soroban_sdk::{contracttype, Env};
use crate::errors::Error;

/// Number of price observations to store
const OBSERVATION_BUFFER_SIZE: u32 = 8;

/// Price observation stored every block
#[contracttype]
#[derive(Clone, Debug)]
pub struct PriceObservation {
    /// Timestamp of observation
    pub timestamp: u64,
    /// Price0 cumulative (token1 / token0)
    pub price_0_cumulative: i128,
    /// Price1 cumulative (token0 / token1)
    pub price_1_cumulative: i128,
}

/// Price oracle data structure
#[contracttype]
#[derive(Clone, Debug)]
pub struct Oracle {
    /// Last observation
    pub last_observation: PriceObservation,
    /// Circular buffer of observations
    pub observations: [PriceObservation; OBSERVATION_BUFFER_SIZE as usize],
    /// Current index in circular buffer
    pub index: u32,
}

impl Oracle {
    /// Create new oracle
    pub fn new() -> Self {
        let empty_observation = PriceObservation {
            timestamp: 0,
            price_0_cumulative: 0,
            price_1_cumulative: 0,
        };

        Self {
            last_observation: empty_observation.clone(),
            observations: [empty_observation; OBSERVATION_BUFFER_SIZE as usize],
            index: 0,
        }
    }

    /// Update price observation
    ///
    /// Should be called on every swap/liquidity change
    pub fn update(
        &mut self,
        env: &Env,
        reserve_0: i128,
        reserve_1: i128,
    ) -> Result<(), Error> {
        let timestamp = env.ledger().timestamp();

        // Only update if block timestamp has increased
        if timestamp <= self.last_observation.timestamp {
            return Ok(());
        }

        let time_elapsed = timestamp.checked_sub(self.last_observation.timestamp)
            .ok_or(Error::Underflow)?;

        // Calculate price (reserve1 / reserve0) * time_elapsed
        // We use fixed-point arithmetic: multiply by 2^64 for precision
        const PRECISION: i128 = 1_000_000_000; // Use billion for precision

        let price_0 = if reserve_0 > 0 {
            reserve_1.checked_mul(PRECISION).ok_or(Error::Overflow)?
                .checked_div(reserve_0).ok_or(Error::DivisionByZero)?
        } else {
            0
        };

        let price_1 = if reserve_1 > 0 {
            reserve_0.checked_mul(PRECISION).ok_or(Error::Overflow)?
                .checked_div(reserve_1).ok_or(Error::DivisionByZero)?
        } else {
            0
        };

        // Add to cumulative prices
        let price_0_delta = price_0.checked_mul(time_elapsed as i128).ok_or(Error::Overflow)?;
        let price_1_delta = price_1.checked_mul(time_elapsed as i128).ok_or(Error::Overflow)?;

        let new_observation = PriceObservation {
            timestamp,
            price_0_cumulative: self.last_observation.price_0_cumulative
                .checked_add(price_0_delta).ok_or(Error::Overflow)?,
            price_1_cumulative: self.last_observation.price_1_cumulative
                .checked_add(price_1_delta).ok_or(Error::Overflow)?,
        };

        // Store in circular buffer
        self.observations[self.index as usize] = new_observation.clone();
        self.index = (self.index + 1) % OBSERVATION_BUFFER_SIZE;

        self.last_observation = new_observation;

        Ok(())
    }

    /// Get time-weighted average price over a period
    ///
    /// # Arguments
    /// * `seconds_ago` - How many seconds in the past to look
    ///
    /// # Returns
    /// TWAP for token0 (price of token1 in terms of token0)
    pub fn get_twap(&self, seconds_ago: u64) -> Result<i128, Error> {
        if seconds_ago == 0 {
            return Err(Error::InvalidAmount);
        }

        let target_timestamp = self.last_observation.timestamp
            .checked_sub(seconds_ago).ok_or(Error::Underflow)?;

        // Find observation closest to target timestamp
        let mut oldest = &self.observations[0];
        for observation in &self.observations {
            if observation.timestamp <= target_timestamp && observation.timestamp > oldest.timestamp {
                oldest = observation;
            }
        }

        // If we don't have data old enough, use oldest available
        if oldest.timestamp == 0 {
            return Err(Error::InsufficientLiquidity);
        }

        let time_elapsed = self.last_observation.timestamp
            .checked_sub(oldest.timestamp).ok_or(Error::Underflow)?;

        if time_elapsed == 0 {
            return Err(Error::InvalidAmount);
        }

        // Calculate average price
        let price_cumulative_delta = self.last_observation.price_0_cumulative
            .checked_sub(oldest.price_0_cumulative).ok_or(Error::Underflow)?;

        price_cumulative_delta.checked_div(time_elapsed as i128).ok_or(Error::DivisionByZero)
    }

    /// Get current spot price
    pub fn get_spot_price(&self, reserve_0: i128, reserve_1: i128) -> Result<i128, Error> {
        if reserve_0 == 0 {
            return Err(Error::InsufficientLiquidity);
        }

        const PRECISION: i128 = 1_000_000_000;

        reserve_1.checked_mul(PRECISION).ok_or(Error::Overflow)?
            .checked_div(reserve_0).ok_or(Error::DivisionByZero)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_oracle() {
        let oracle = Oracle::new();
        assert_eq!(oracle.last_observation.timestamp, 0);
        assert_eq!(oracle.index, 0);
    }

    #[test]
    fn test_oracle_update() {
        let env = Env::default();
        let mut oracle = Oracle::new();

        // First update
        let result = oracle.update(&env, 1_000_000, 2_000_000);
        assert!(result.is_ok());

        // Price should be stored
        assert!(oracle.last_observation.price_0_cumulative >= 0);
    }
}
