#![no_std]

//! # Token Factory Contract
//!
//! This contract allows users to create meme tokens with bonding curves.
//! Features:
//! - Ultra-simple token creation (name, symbol, supply, metadata)
//! - Automatic bonding curve for initial price discovery
//! - Low creation fee (0.01 XLM)
//! - Graduation to AMM at market cap threshold

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Bytes, BytesN, Env, String, Symbol, Vec,
};

mod bonding_curve;
mod storage;
mod token;
mod events;

use bonding_curve::BondingCurve;
use storage::{DataKey, TokenInfo};

/// Minimum and maximum allowed values for token parameters
const MIN_NAME_LENGTH: u32 = 3;
const MAX_NAME_LENGTH: u32 = 32;
const MIN_SYMBOL_LENGTH: u32 = 2;
const MAX_SYMBOL_LENGTH: u32 = 12;
const MIN_SUPPLY: i128 = 1_000_000; // 1M minimum
const MAX_SUPPLY: i128 = 1_000_000_000_000_000; // 1 quadrillion max
const CREATION_FEE: i128 = 100_000; // 0.01 XLM (in stroops)

/// Market cap threshold for graduation to AMM (in XLM stroops)
const GRADUATION_THRESHOLD: i128 = 1_000_000_000_000; // 100k XLM

#[contract]
pub struct TokenFactory;

#[contractimpl]
impl TokenFactory {
    /// Initializes the factory contract
    ///
    /// # Arguments
    /// * `admin` - Address that will have admin privileges
    /// * `treasury` - Address that will receive creation fees
    pub fn initialize(env: Env, admin: Address, treasury: Address) {
        if storage::has_admin(&env) {
            panic!("already initialized");
        }

        admin.require_auth();

        storage::set_admin(&env, &admin);
        storage::set_treasury(&env, &treasury);
        storage::set_token_count(&env, 0);
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
    ///
    /// # Returns
    /// Address of the newly created token contract
    pub fn create_token(
        env: Env,
        creator: Address,
        name: String,
        symbol: String,
        decimals: u32,
        initial_supply: i128,
        metadata_uri: String,
    ) -> Address {
        creator.require_auth();

        // Validate parameters
        Self::validate_params(&env, &name, &symbol, initial_supply);

        // Charge creation fee
        Self::charge_fee(&env, &creator);

        // Deploy new token contract using Stellar Asset Contract (SAC)
        let salt = Self::generate_salt(&env);
        let token_address = token::create_token(&env, &creator, &name, &symbol, decimals, &salt);

        // Mint initial supply to bonding curve contract (this contract)
        token::mint_to(&env, &token_address, &env.current_contract_address(), initial_supply);

        // Initialize bonding curve
        let bonding_curve = BondingCurve::new(initial_supply);

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

        // Emit creation event
        events::token_created(&env, &creator, &token_address, &name, &symbol);

        token_address
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
    pub fn buy_tokens(
        env: Env,
        buyer: Address,
        token: Address,
        xlm_amount: i128,
        min_tokens_out: i128,
    ) -> i128 {
        buyer.require_auth();

        let mut token_info = storage::get_token_info(&env, &token)
            .unwrap_or_else(|| panic!("token not found"));

        if token_info.graduated {
            panic!("token already graduated to AMM");
        }

        // Calculate tokens to receive
        let tokens_out = token_info.bonding_curve.calculate_buy_amount(xlm_amount);

        // Check slippage
        if tokens_out < min_tokens_out {
            panic!("slippage too high");
        }

        // Get native XLM token
        let xlm_token = token::get_native_token(&env);

        // Transfer XLM from buyer to this contract
        token::transfer(&env, &xlm_token, &buyer, &env.current_contract_address(), xlm_amount);

        // Transfer tokens from this contract to buyer
        token::transfer(&env, &token, &env.current_contract_address(), &buyer, tokens_out);

        // Update bonding curve state
        token_info.bonding_curve.apply_buy(xlm_amount, tokens_out);
        token_info.xlm_raised += xlm_amount;

        // Check if should graduate to AMM
        if token_info.xlm_raised >= GRADUATION_THRESHOLD {
            Self::graduate_to_amm(&env, &mut token_info);
        } else {
            storage::set_token_info(&env, &token, &token_info);
        }

        // Emit buy event
        events::tokens_bought(&env, &buyer, &token, xlm_amount, tokens_out);

        tokens_out
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
    /// Amount of XLM received
    pub fn sell_tokens(
        env: Env,
        seller: Address,
        token: Address,
        token_amount: i128,
        min_xlm_out: i128,
    ) -> i128 {
        seller.require_auth();

        let mut token_info = storage::get_token_info(&env, &token)
            .unwrap_or_else(|| panic!("token not found"));

        if token_info.graduated {
            panic!("token already graduated to AMM");
        }

        // Calculate XLM to receive
        let xlm_out = token_info.bonding_curve.calculate_sell_amount(token_amount);

        // Check slippage
        if xlm_out < min_xlm_out {
            panic!("slippage too high");
        }

        let xlm_token = token::get_native_token(&env);

        // Transfer tokens from seller to this contract
        token::transfer(&env, &token, &seller, &env.current_contract_address(), token_amount);

        // Transfer XLM from this contract to seller
        token::transfer(&env, &xlm_token, &env.current_contract_address(), &seller, xlm_out);

        // Update bonding curve state
        token_info.bonding_curve.apply_sell(xlm_out, token_amount);
        token_info.xlm_raised -= xlm_out;

        storage::set_token_info(&env, &token, &token_info);

        // Emit sell event
        events::tokens_sold(&env, &seller, &token, token_amount, xlm_out);

        xlm_out
    }

    /// Get current price for a token (in XLM per token)
    pub fn get_price(env: Env, token: Address) -> i128 {
        let token_info = storage::get_token_info(&env, &token)
            .unwrap_or_else(|| panic!("token not found"));

        token_info.bonding_curve.get_current_price()
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
    pub fn set_creation_fee(env: Env, admin: Address, new_fee: i128) {
        Self::require_admin(&env, &admin);
        storage::set_creation_fee(&env, new_fee);
    }

    /// Withdraw accumulated fees (admin only)
    pub fn withdraw_fees(env: Env, admin: Address) -> i128 {
        Self::require_admin(&env, &admin);

        let treasury = storage::get_treasury(&env);
        let xlm_token = token::get_native_token(&env);
        let balance = token::balance(&env, &xlm_token, &env.current_contract_address());

        if balance > 0 {
            token::transfer(&env, &xlm_token, &env.current_contract_address(), &treasury, balance);
        }

        balance
    }

    // ========== Internal Functions ==========

    fn validate_params(env: &Env, name: &String, symbol: &String, supply: i128) {
        let name_len = name.len();
        let symbol_len = symbol.len();

        if name_len < MIN_NAME_LENGTH || name_len > MAX_NAME_LENGTH {
            panic!("invalid name length");
        }

        if symbol_len < MIN_SYMBOL_LENGTH || symbol_len > MAX_SYMBOL_LENGTH {
            panic!("invalid symbol length");
        }

        if supply < MIN_SUPPLY || supply > MAX_SUPPLY {
            panic!("invalid supply");
        }
    }

    fn charge_fee(env: &Env, from: &Address) {
        let treasury = storage::get_treasury(env);
        let xlm_token = token::get_native_token(env);
        let fee = storage::get_creation_fee(env).unwrap_or(CREATION_FEE);

        token::transfer(env, &xlm_token, from, &treasury, fee);
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

    fn graduate_to_amm(env: &Env, token_info: &mut TokenInfo) {
        // Mark as graduated
        token_info.graduated = true;
        storage::set_token_info(env, &token_info.token_address, token_info);

        // TODO: In production, this would:
        // 1. Create AMM pool with accumulated XLM
        // 2. Add all remaining tokens as liquidity
        // 3. Burn LP tokens or send to treasury
        // 4. Emit graduation event

        events::token_graduated(env, &token_info.token_address, token_info.xlm_raised);
    }

    fn require_admin(env: &Env, addr: &Address) {
        let admin = storage::get_admin(env);
        if addr != &admin {
            panic!("unauthorized");
        }
        addr.require_auth();
    }
}
