use soroban_sdk::{token, Address, BytesN, Env, String};

/// Creates a new Stellar Asset Contract (SAC) token
pub fn create_token(
    env: &Env,
    admin: &Address,
    name: &String,
    symbol: &String,
    decimals: u32,
    salt: &BytesN<32>,
) -> Address {
    // Deploy a new token contract
    let token_wasm_hash = env.deployer().upload_contract_wasm(token::StellarAssetClient::WASM);

    let token_address = env
        .deployer()
        .with_current_contract(salt.clone())
        .deploy(token_wasm_hash);

    // Initialize the token
    let token_client = token::Client::new(env, &token_address);
    token_client.initialize(admin, &decimals, name, symbol);

    token_address
}

/// Mint tokens to an address
pub fn mint_to(env: &Env, token_address: &Address, to: &Address, amount: i128) {
    let token_client = token::Client::new(env, token_address);
    token_client.mint(to, &amount);
}

/// Transfer tokens
pub fn transfer(env: &Env, token_address: &Address, from: &Address, to: &Address, amount: i128) {
    let token_client = token::Client::new(env, token_address);
    token_client.transfer(from, to, &amount);
}

/// Get token balance
pub fn balance(env: &Env, token_address: &Address, address: &Address) -> i128 {
    let token_client = token::Client::new(env, token_address);
    token_client.balance(address)
}

/// Get the native XLM token address
pub fn get_native_token(env: &Env) -> Address {
    // On Stellar, native XLM is represented by a specific contract address
    // This is a placeholder - in production, use the actual native token contract
    Address::from_string(&String::from_str(
        env,
        "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    ))
}
