//! Enhanced storage for AMM Pair contract
//!
//! Features:
//! - Price oracle (TWAP)
//! - Pause mechanism
//! - Reentrancy guard

use soroban_sdk::{contracttype, Address, Env};
use crate::oracle::Oracle;

/// Storage keys
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Pair configuration and state
    PairInfo,
    /// LP token balance for an address
    Balance(Address),
    /// Price oracle
    Oracle,
    /// Pause state
    Paused,
    /// Reentrancy guard
    ReentrancyGuard,
}

/// Pair information and state
#[contracttype]
#[derive(Clone, Debug)]
pub struct PairInfo {
    /// First token (always sorted A < B)
    pub token_0: Address,
    /// Second token
    pub token_1: Address,
    /// Factory that created this pair
    pub factory: Address,
    /// Address to receive protocol fees
    pub fee_to: Address,
    /// Reserve of token 0
    pub reserve_0: i128,
    /// Reserve of token 1
    pub reserve_1: i128,
    /// Total LP token supply
    pub total_supply: i128,
    /// Last K value (for protocol fee calculation)
    pub k_last: i128,
    /// Last update timestamp
    pub last_update: u64,
}

// Pair info functions
pub fn set_pair_info(env: &Env, info: &PairInfo) {
    env.storage().instance().set(&DataKey::PairInfo, info);
}

pub fn get_pair_info(env: &Env) -> Option<PairInfo> {
    env.storage().instance().get(&DataKey::PairInfo)
}

pub fn has_pair_info(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::PairInfo)
}

// Balance functions (LP tokens)
pub fn get_balance(env: &Env, address: &Address) -> i128 {
    let key = DataKey::Balance(address.clone());
    env.storage().persistent().get(&key).unwrap_or(0)
}

pub fn set_balance(env: &Env, address: &Address, balance: i128) {
    let key = DataKey::Balance(address.clone());
    env.storage().persistent().set(&key, &balance);
}

pub fn increase_balance(env: &Env, address: &Address, amount: i128) {
    let balance = get_balance(env, address);
    set_balance(env, address, balance + amount);
}

pub fn decrease_balance(env: &Env, address: &Address, amount: i128) -> Result<(), crate::errors::Error> {
    let balance = get_balance(env, address);
    if balance < amount {
        return Err(crate::errors::Error::InsufficientLPBalance);
    }
    set_balance(env, address, balance - amount);
    Ok(())
}

// Oracle functions
pub fn set_oracle(env: &Env, oracle: &Oracle) {
    env.storage().instance().set(&DataKey::Oracle, oracle);
}

pub fn get_oracle(env: &Env) -> Option<Oracle> {
    env.storage().instance().get(&DataKey::Oracle)
}

// Pause functions
pub fn set_paused(env: &Env, paused: bool) {
    env.storage().instance().set(&DataKey::Paused, &paused);
}

pub fn is_paused(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
}

// Reentrancy guard functions
pub fn set_reentrancy_guard(env: &Env, locked: bool) {
    env.storage().instance().set(&DataKey::ReentrancyGuard, &locked);
}

pub fn is_reentrancy_locked(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::ReentrancyGuard)
        .unwrap_or(false)
}

/// Reentrancy guard helper
pub fn check_reentrancy(env: &Env) -> Result<(), crate::errors::Error> {
    if is_reentrancy_locked(env) {
        return Err(crate::errors::Error::Reentrancy);
    }
    set_reentrancy_guard(env, true);
    Ok(())
}

/// Release reentrancy lock
pub fn release_reentrancy(env: &Env) {
    set_reentrancy_guard(env, false);
}
