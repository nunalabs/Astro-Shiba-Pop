use soroban_sdk::{Address, Env, String, Symbol, symbol_short};

/// Emit event when a token is created
pub fn token_created(
    env: &Env,
    creator: &Address,
    token_address: &Address,
    name: &String,
    symbol: &String,
) {
    env.events().publish(
        (symbol_short!("created"), creator, token_address),
        (name.clone(), symbol.clone()),
    );
}

/// Emit event when tokens are bought
pub fn tokens_bought(
    env: &Env,
    buyer: &Address,
    token: &Address,
    xlm_amount: i128,
    tokens_received: i128,
) {
    env.events().publish(
        (symbol_short!("buy"),),
        (buyer, token, xlm_amount, tokens_received),
    );
}

/// Emit event when tokens are sold
pub fn tokens_sold(
    env: &Env,
    seller: &Address,
    token: &Address,
    tokens_sold: i128,
    xlm_received: i128,
) {
    env.events().publish(
        (symbol_short!("sell"),),
        (seller, token, tokens_sold, xlm_received),
    );
}

/// Emit event when a token graduates to AMM
pub fn token_graduated(env: &Env, token: &Address, xlm_raised: i128) {
    env.events().publish(
        (symbol_short!("graduate"),),
        (token, xlm_raised),
    );
}
