use soroban_sdk::{contracttype, Address, Env, String, Vec};

use crate::bonding_curve::BondingCurve;

/// Storage keys for the contract
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Admin address
    Admin,
    /// Treasury address (receives fees)
    Treasury,
    /// Total number of tokens created
    TokenCount,
    /// Creation fee amount
    CreationFee,
    /// Token info by token address
    TokenInfo(Address),
    /// Tokens created by an address
    CreatorTokens(Address),
}

/// Information about a created token
#[contracttype]
#[derive(Clone, Debug)]
pub struct TokenInfo {
    /// Creator address
    pub creator: Address,
    /// Token contract address
    pub token_address: Address,
    /// Token name
    pub name: String,
    /// Token symbol
    pub symbol: String,
    /// Token decimals
    pub decimals: u32,
    /// Total supply
    pub total_supply: i128,
    /// Metadata URI (IPFS)
    pub metadata_uri: String,
    /// Creation timestamp
    pub created_at: u64,
    /// Bonding curve state
    pub bonding_curve: BondingCurve,
    /// Whether token has graduated to AMM
    pub graduated: bool,
    /// Total XLM raised
    pub xlm_raised: i128,
}

// Admin functions
pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("admin not set")
}

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

// Treasury functions
pub fn set_treasury(env: &Env, treasury: &Address) {
    env.storage().instance().set(&DataKey::Treasury, treasury);
}

pub fn get_treasury(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Treasury)
        .expect("treasury not set")
}

// Token count functions
pub fn set_token_count(env: &Env, count: u32) {
    env.storage().instance().set(&DataKey::TokenCount, &count);
}

pub fn get_token_count(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::TokenCount)
        .unwrap_or(0)
}

pub fn increment_token_count(env: &Env) {
    let count = get_token_count(env);
    set_token_count(env, count + 1);
}

// Creation fee functions
pub fn set_creation_fee(env: &Env, fee: i128) {
    env.storage().instance().set(&DataKey::CreationFee, &fee);
}

pub fn get_creation_fee(env: &Env) -> Option<i128> {
    env.storage().instance().get(&DataKey::CreationFee)
}

// Token info functions
pub fn set_token_info(env: &Env, token_address: &Address, info: &TokenInfo) {
    env.storage()
        .persistent()
        .set(&DataKey::TokenInfo(token_address.clone()), info);
}

pub fn get_token_info(env: &Env, token_address: &Address) -> Option<TokenInfo> {
    env.storage()
        .persistent()
        .get(&DataKey::TokenInfo(token_address.clone()))
}

// Creator tokens functions
pub fn add_creator_token(env: &Env, creator: &Address, token_address: &Address) {
    let key = DataKey::CreatorTokens(creator.clone());
    let mut tokens: Vec<Address> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));

    tokens.push_back(token_address.clone());
    env.storage().persistent().set(&key, &tokens);
}

pub fn get_creator_tokens(env: &Env, creator: &Address) -> Vec<Address> {
    let key = DataKey::CreatorTokens(creator.clone());
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(Vec::new(env))
}
