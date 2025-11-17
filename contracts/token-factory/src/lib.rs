#![no_std]

//! # Token Factory Contract V2 - Enterprise Grade
//!
//! This contract allows users to create meme tokens with bonding curves.
//! Features:
//! - Ultra-simple token creation (name, symbol, supply, metadata)
//! - Multiple bonding curve types (Linear, Exponential, Sigmoid)
//! - Comprehensive input validation and error handling
//! - Overflow protection with checked arithmetic
//! - Rate limiting and anti-spam measures
//! - Sell penalties to prevent pump-and-dump
//! - Emergency pause mechanism
//! - Low creation fee (0.01 XLM)
//! - Graduation to AMM at market cap threshold

use soroban_sdk::{
    contract, contractimpl, Address, Bytes, BytesN, Env, String, Vec,
};

mod bonding_curve;
mod bonding_curve_v2;
mod storage;
mod token;
mod events;
mod errors;
mod validation;

use bonding_curve_v2::{BondingCurveV2, CurveType};
use storage::{DataKey, TokenInfo};
use errors::Error;
use validation::*;

// Re-export validation constants (now centralized in validation module)
// No need to redefine - using validation::* imports

#[contract]
pub struct TokenFactory;

#[contractimpl]
impl TokenFactory {
    /// Initializes the factory contract
    ///
    /// # Arguments
    /// * `admin` - Address that will have admin privileges
    /// * `treasury` - Address that will receive creation fees
    ///
    /// # Errors
    /// * `Error::AlreadyInitialized` - Contract already initialized
    pub fn initialize(env: Env, admin: Address, treasury: Address) -> Result<(), Error> {
        if storage::has_admin(&env) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        // Validate addresses
        validate_address(&admin)?;
        validate_address(&treasury)?;

        storage::set_admin(&env, &admin);
        storage::set_treasury(&env, &treasury);
        storage::set_token_count(&env, 0);
        storage::set_paused(&env, false); // Initialize as not paused

        Ok(())
    }

    /// Creates a new meme token with bonding curve
    ///
    /// # Arguments
    /// * `creator` - Address creating the token (must auth)
    /// * `name` - Token name (3-32 characters)
    /// * `symbol` - Token symbol (2-12 characters)
    /// * `decimals` - Number of decimals (typically 7 for Stellar)
    /// * `initial_supply` - Initial supply to mint
    /// * `metadata_uri` - URI to token metadata (image, description) on IPFS
    /// * `curve_type` - Type of bonding curve (Linear, Exponential, Sigmoid)
    ///
    /// # Returns
    /// Address of the newly created token contract
    ///
    /// # Errors
    /// * `Error::ContractPaused` - Contract is paused
    /// * `Error::TooManyTokens` - User exceeded max tokens per creator
    /// * `Error::CreationCooldown` - User must wait before creating another token
    /// * Various validation errors
    pub fn create_token(
        env: Env,
        creator: Address,
        name: String,
        symbol: String,
        decimals: u32,
        initial_supply: i128,
        metadata_uri: String,
        curve_type: CurveType,
    ) -> Result<Address, Error> {
        creator.require_auth();

        // Check if contract is paused
        Self::require_not_paused(&env)?;

        // Validate all parameters
        validate_address(&creator)?;
        validate_name(&name)?;
        validate_symbol(&symbol)?;
        validate_decimals(decimals)?;
        validate_supply(initial_supply)?;
        validate_metadata_uri(&metadata_uri)?;

        // Rate limiting checks
        Self::check_rate_limits(&env, &creator)?;

        // Charge creation fee
        Self::charge_fee(&env, &creator)?;

        // Deploy new token contract using Stellar Asset Contract (SAC)
        let salt = Self::generate_salt(&env);
        let token_address = token::create_token(&env, &creator, &name, &symbol, decimals, &salt);

        // Mint initial supply to bonding curve contract (this contract)
        token::mint_to(&env, &token_address, &env.current_contract_address(), initial_supply);

        // Initialize bonding curve V2 with chosen curve type
        let bonding_curve = match curve_type {
            CurveType::Linear => BondingCurveV2::new_linear(initial_supply),
            CurveType::Exponential => BondingCurveV2::new_exponential(initial_supply),
            CurveType::Sigmoid => BondingCurveV2::new_sigmoid(initial_supply),
        };

        // Store token info
        let token_info = TokenInfo {
            creator: creator.clone(),
            token_address: token_address.clone(),
            name: name.clone(),
            symbol: symbol.clone(),
            decimals,
            total_supply: initial_supply,
            metadata_uri,
            created_at: env.ledger().timestamp(),
            bonding_curve,
            graduated: false,
            xlm_raised: 0,
        };

        storage::set_token_info(&env, &token_address, &token_info);
        storage::add_creator_token(&env, &creator, &token_address);
        storage::increment_token_count(&env);
        storage::set_last_creation_time(&env, &creator, env.ledger().timestamp());

        // Emit creation event
        events::token_created(&env, &creator, &token_address, &name, &symbol);

        Ok(token_address)
    }

    /// Buy tokens using the bonding curve
    ///
    /// # Arguments
    /// * `buyer` - Address buying tokens
    /// * `token` - Token address to buy
    /// * `xlm_amount` - Amount of XLM to spend (in stroops)
    /// * `min_tokens_out` - Minimum tokens to receive (slippage protection)
    ///
    /// # Returns
    /// Amount of tokens received
    ///
    /// # Errors
    /// * `Error::ContractPaused` - Contract is paused
    /// * `Error::TokenNotFound` - Token doesn't exist
    /// * `Error::AlreadyGraduated` - Token already moved to AMM
    /// * `Error::AmountTooSmall` - Buy amount below minimum
    /// * `Error::SlippageExceeded` - Slippage tolerance exceeded
    /// * `Error::PriceImpactTooHigh` - Price impact exceeds maximum allowed
    pub fn buy_tokens(
        env: Env,
        buyer: Address,
        token: Address,
        xlm_amount: i128,
        min_tokens_out: i128,
    ) -> Result<i128, Error> {
        buyer.require_auth();

        // Security checks
        Self::require_not_paused(&env)?;
        validate_address(&buyer)?;
        validate_buy_amount(xlm_amount)?;

        let mut token_info = storage::get_token_info(&env, &token)
            .ok_or(Error::TokenNotFound)?;

        if token_info.graduated {
            return Err(Error::AlreadyGraduated);
        }

        // Calculate tokens to receive using V2 bonding curve
        let old_price = token_info.bonding_curve.get_current_price();
        let tokens_out = token_info.bonding_curve.calculate_buy_amount(xlm_amount)?;

        // Check slippage protection
        if tokens_out < min_tokens_out {
            return Err(Error::SlippageExceeded);
        }

        // Get native XLM token
        let xlm_token = token::get_native_token(&env);

        // Transfer XLM from buyer to this contract (CHECK-EFFECTS-INTERACTIONS pattern)
        token::transfer(&env, &xlm_token, &buyer, &env.current_contract_address(), xlm_amount);

        // Update bonding curve state BEFORE external call
        token_info.bonding_curve.apply_buy(xlm_amount, tokens_out)?;

        let new_price = token_info.bonding_curve.get_current_price();

        // Validate price impact
        validate_price_impact(old_price, new_price)?;

        token_info.xlm_raised = token_info.xlm_raised
            .checked_add(xlm_amount)
            .ok_or(Error::Overflow)?;

        // Transfer tokens from this contract to buyer (LAST to prevent reentrancy)
        token::transfer(&env, &token, &env.current_contract_address(), &buyer, tokens_out);

        // Check if should graduate to AMM
        if token_info.xlm_raised >= GRADUATION_THRESHOLD {
            Self::graduate_to_amm(&env, &mut token_info)?;
        } else {
            storage::set_token_info(&env, &token, &token_info);
        }

        // Emit buy event
        events::tokens_bought(&env, &buyer, &token, xlm_amount, tokens_out);

        Ok(tokens_out)
    }

    /// Sell tokens back to the bonding curve
    ///
    /// # Arguments
    /// * `seller` - Address selling tokens
    /// * `token` - Token address to sell
    /// * `token_amount` - Amount of tokens to sell
    /// * `min_xlm_out` - Minimum XLM to receive (slippage protection)
    ///
    /// # Returns
    /// Amount of XLM received (after sell penalty)
    ///
    /// # Errors
    /// * `Error::ContractPaused` - Contract is paused
    /// * `Error::TokenNotFound` - Token doesn't exist
    /// * `Error::AlreadyGraduated` - Token already moved to AMM
    /// * `Error::AmountTooSmall` - Sell amount below minimum
    /// * `Error::SlippageExceeded` - Slippage tolerance exceeded
    /// * `Error::InsufficientReserve` - Not enough XLM in reserves
    pub fn sell_tokens(
        env: Env,
        seller: Address,
        token: Address,
        token_amount: i128,
        min_xlm_out: i128,
    ) -> Result<i128, Error> {
        seller.require_auth();

        // Security checks
        Self::require_not_paused(&env)?;
        validate_address(&seller)?;
        validate_sell_amount(token_amount)?;

        let mut token_info = storage::get_token_info(&env, &token)
            .ok_or(Error::TokenNotFound)?;

        if token_info.graduated {
            return Err(Error::AlreadyGraduated);
        }

        // Calculate XLM to receive (includes sell penalty in V2)
        let xlm_out = token_info.bonding_curve.calculate_sell_amount(token_amount)?;

        // Check slippage protection
        if xlm_out < min_xlm_out {
            return Err(Error::SlippageExceeded);
        }

        // Ensure enough XLM in reserve
        if xlm_out > token_info.bonding_curve.xlm_reserve {
            return Err(Error::InsufficientReserve);
        }

        let xlm_token = token::get_native_token(&env);

        // Transfer tokens from seller to this contract (CHECK-EFFECTS-INTERACTIONS)
        token::transfer(&env, &token, &seller, &env.current_contract_address(), token_amount);

        // Update bonding curve state BEFORE external call
        token_info.bonding_curve.apply_sell(xlm_out, token_amount)?;

        token_info.xlm_raised = token_info.xlm_raised
            .checked_sub(xlm_out)
            .ok_or(Error::Underflow)?;

        storage::set_token_info(&env, &token, &token_info);

        // Transfer XLM from this contract to seller (LAST to prevent reentrancy)
        token::transfer(&env, &xlm_token, &env.current_contract_address(), &seller, xlm_out);

        // Emit sell event
        events::tokens_sold(&env, &seller, &token, token_amount, xlm_out);

        Ok(xlm_out)
    }

    /// Get current price for a token (in XLM per token)
    pub fn get_price(env: Env, token: Address) -> Result<i128, Error> {
        let token_info = storage::get_token_info(&env, &token)
            .ok_or(Error::TokenNotFound)?;

        Ok(token_info.bonding_curve.get_current_price())
    }

    /// Get market cap for a token
    pub fn get_market_cap(env: Env, token: Address) -> Result<i128, Error> {
        let token_info = storage::get_token_info(&env, &token)
            .ok_or(Error::TokenNotFound)?;

        token_info.bonding_curve.get_market_cap()
    }

    /// Get token info
    pub fn get_token_info(env: Env, token: Address) -> Option<TokenInfo> {
        storage::get_token_info(&env, &token)
    }

    /// Get all tokens created by an address
    pub fn get_creator_tokens(env: Env, creator: Address) -> Vec<Address> {
        storage::get_creator_tokens(&env, &creator)
    }

    /// Get total number of tokens created
    pub fn get_token_count(env: Env) -> u32 {
        storage::get_token_count(&env)
    }

    // ========== Admin Functions ==========

    /// Update creation fee (admin only)
    pub fn set_creation_fee(env: Env, admin: Address, new_fee: i128) -> Result<(), Error> {
        Self::require_admin(&env, &admin)?;

        if new_fee < 0 {
            return Err(Error::AmountTooSmall);
        }

        storage::set_creation_fee(&env, new_fee);
        Ok(())
    }

    /// Withdraw accumulated fees (admin only)
    pub fn withdraw_fees(env: Env, admin: Address) -> Result<i128, Error> {
        Self::require_admin(&env, &admin)?;

        let treasury = storage::get_treasury(&env);
        let xlm_token = token::get_native_token(&env);
        let balance = token::balance(&env, &xlm_token, &env.current_contract_address());

        if balance > 0 {
            token::transfer(&env, &xlm_token, &env.current_contract_address(), &treasury, balance);
        }

        Ok(balance)
    }

    /// Emergency pause (admin only)
    pub fn pause(env: Env, admin: Address) -> Result<(), Error> {
        Self::require_admin(&env, &admin)?;
        storage::set_paused(&env, true);
        Ok(())
    }

    /// Unpause contract (admin only)
    pub fn unpause(env: Env, admin: Address) -> Result<(), Error> {
        Self::require_admin(&env, &admin)?;
        storage::set_paused(&env, false);
        Ok(())
    }

    /// Check if contract is paused
    pub fn is_paused(env: Env) -> bool {
        storage::is_paused(&env)
    }

    // ========== Internal Functions ==========

    /// Check rate limits for token creation
    fn check_rate_limits(env: &Env, creator: &Address) -> Result<(), Error> {
        // Check max tokens per user
        let creator_tokens = storage::get_creator_tokens(env, creator);
        if creator_tokens.len() >= MAX_TOKENS_PER_USER {
            return Err(Error::TooManyTokens);
        }

        // Check creation cooldown
        if let Some(last_creation) = storage::get_last_creation_time(env, creator) {
            let current_time = env.ledger().timestamp();
            let time_elapsed = current_time.checked_sub(last_creation).unwrap_or(0);

            if time_elapsed < TOKEN_CREATION_COOLDOWN {
                return Err(Error::CreationCooldown);
            }
        }

        Ok(())
    }

    fn charge_fee(env: &Env, from: &Address) -> Result<(), Error> {
        let treasury = storage::get_treasury(env);
        let xlm_token = token::get_native_token(env);
        let fee = storage::get_creation_fee(env).unwrap_or(CREATION_FEE);

        token::transfer(env, &xlm_token, from, &treasury, fee);
        Ok(())
    }

    fn generate_salt(env: &Env) -> BytesN<32> {
        let count = storage::get_token_count(env);
        let timestamp = env.ledger().timestamp();

        // Combine count and timestamp for uniqueness
        let mut salt_data = Bytes::new(env);
        salt_data.append(&Bytes::from_array(env, &count.to_be_bytes()));
        salt_data.append(&Bytes::from_array(env, &timestamp.to_be_bytes()));

        // Hash to get 32 bytes
        env.crypto().sha256(&salt_data)
    }

    fn graduate_to_amm(env: &Env, token_info: &mut TokenInfo) -> Result<(), Error> {
        // Mark as graduated
        token_info.graduated = true;
        storage::set_token_info(env, &token_info.token_address, token_info);

        // TODO: In production, this would:
        // 1. Create AMM pool with accumulated XLM
        // 2. Add all remaining tokens as liquidity
        // 3. Burn LP tokens or send to treasury
        // 4. Emit graduation event

        events::token_graduated(env, &token_info.token_address, token_info.xlm_raised);

        Ok(())
    }

    fn require_admin(env: &Env, addr: &Address) -> Result<(), Error> {
        let admin = storage::get_admin(env);
        if addr != &admin {
            return Err(Error::NotAdmin);
        }
        addr.require_auth();
        Ok(())
    }

    fn require_not_paused(env: &Env) -> Result<(), Error> {
        if storage::is_paused(env) {
            return Err(Error::ContractPaused);
        }
        Ok(())
    }
}
