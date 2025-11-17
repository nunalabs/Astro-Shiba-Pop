# 🏆 AstroShibaPop - Premium Roadmap to TOP TIER

> Plan completo para crear una plataforma DeFi de clase mundial en Stellar Testnet

**Objetivo:** Ser la plataforma #1 de memecoins en Soroban con contratos seguros, escalables, innovadores, modulares y fluidos.

---

## 🎯 Visión: Qué hace una web TOP TIER

### **Características de una plataforma Premium:**

✅ **Seguridad de grado institucional**
- Contratos auditados con mejores prácticas
- Protection contra reentrancy, overflow, frontrunning
- Emergency pause mechanisms
- Rate limiting y anti-spam

✅ **Innovación técnica**
- Bonding curves dinámicas (como Pump.fun)
- AMM ultra-optimizado (inspirado en Phoenix Protocol)
- Staking con rewards múltiples
- Router para multi-hop swaps

✅ **UX excepcional**
- Transacciones en <2 segundos
- Feedback inmediato en cada acción
- Price impact warnings
- Slippage protection automático
- Mobile-first responsive

✅ **Performance óptimo**
- Bundle size < 200KB
- First Contentful Paint < 1.5s
- Real-time updates sin lag
- Infinite scroll optimizado

✅ **Developer Experience**
- Contratos modulares y reutilizables
- Tests E2E completos (>80% coverage)
- CI/CD automatizado
- Monitoring y alertas

---

## 📋 ROADMAP PREMIUM - 7 Fases

---

## **FASE 1: Smart Contracts de Clase Mundial** ⭐⭐⭐

### **1.1 Token Factory con Bonding Curve**

**Inspiración:** Pump.fun (Solana) - El mejor launchpad de memecoins

**Características:**

```rust
// contracts/token-factory/src/bonding_curve.rs

#[derive(Clone)]
pub enum CurveType {
    Linear,      // P = k * S
    Exponential, // P = k * e^(a*S)
    Sigmoid,     // P = L / (1 + e^(-k(S-S0)))
}

pub struct BondingCurve {
    pub token: Address,
    pub reserve: i128,        // XLM en el pool
    pub supply: i128,         // Tokens minted
    pub curve_type: CurveType,
    pub k: i128,              // Constante de pricing
    pub created_at: u64,
    pub creator: Address,

    // Graduación automática a AMM
    pub graduation_threshold: i128, // Ej: 100,000 XLM
    pub graduated: bool,
    pub amm_pool: Option<Address>,
}

#[contractimpl]
impl TokenFactory {
    /// Crear token con bonding curve
    pub fn create_token(
        env: Env,
        creator: Address,
        name: String,
        symbol: String,
        curve_type: CurveType,
        initial_buy: Option<i128>,
    ) -> Result<Address, Error> {
        creator.require_auth();

        // 1. Validaciones de seguridad
        Self::validate_params(&env, &name, &symbol)?;
        Self::check_rate_limit(&env, &creator)?; // Max 1 token/hora
        Self::check_blacklist(&env, &creator)?;

        // 2. Deploy token contract
        let token = Self::deploy_token_contract(&env, &name, &symbol)?;

        // 3. Inicializar bonding curve
        let curve = BondingCurve {
            token: token.clone(),
            reserve: 0,
            supply: 0,
            curve_type,
            k: Self::calculate_k(&curve_type), // Constante óptima
            created_at: env.ledger().timestamp(),
            creator: creator.clone(),
            graduation_threshold: 100_000_0000000, // 100k XLM
            graduated: false,
            amm_pool: None,
        };

        env.storage().persistent().set(
            &DataKey::Curve(token.clone()),
            &curve
        );

        // 4. Initial buy opcional
        if let Some(amount) = initial_buy {
            Self::buy_exact_tokens_in(env.clone(), creator.clone(), token.clone(), amount)?;
        }

        // 5. Emit event
        env.events().publish((
            Symbol::new(&env, "token_created"),
            token.clone(),
            creator,
            curve_type,
        ));

        Ok(token)
    }

    /// Comprar tokens (precio según bonding curve)
    pub fn buy_exact_tokens_in(
        env: Env,
        buyer: Address,
        token: Address,
        tokens_out: i128,
    ) -> Result<i128, Error> {
        buyer.require_auth();

        let mut curve = Self::get_curve(&env, &token)?;

        // Check si está graduated
        if curve.graduated {
            return Err(Error::AlreadyGraduated);
        }

        // Calcular XLM necesario
        let xlm_cost = Self::calculate_buy_cost(&curve, tokens_out)?;

        // Anti-whale: Max 5% del supply por transacción
        let max_per_tx = curve.supply / 20;
        if tokens_out > max_per_tx && curve.supply > 0 {
            return Err(Error::ExceedsMaxPerTx);
        }

        // Actualizar estado ANTES de transfers (reentrancy protection)
        curve.reserve += xlm_cost;
        curve.supply += tokens_out;

        // Check si debe graduarse
        if curve.reserve >= curve.graduation_threshold {
            Self::graduate_to_amm(&env, &mut curve)?;
        }

        env.storage().persistent().set(
            &DataKey::Curve(token.clone()),
            &curve
        );

        // Transfers (DESPUÉS de state updates)
        Self::transfer_xlm(&env, &buyer, &env.current_contract_address(), xlm_cost)?;
        Self::mint_tokens(&env, &token, &buyer, tokens_out)?;

        // Emit event
        env.events().publish((
            Symbol::new(&env, "tokens_bought"),
            buyer,
            token,
            tokens_out,
            xlm_cost,
        ));

        Ok(xlm_cost)
    }

    /// Graduación automática a AMM cuando alcanza threshold
    fn graduate_to_amm(env: &Env, curve: &mut BondingCurve) -> Result<(), Error> {
        // 1. Crear pool en Phoenix AMM
        let pool_address = Self::create_amm_pool(
            env,
            curve.token.clone(),
            curve.reserve,
            curve.supply,
        )?;

        // 2. Marcar como graduated
        curve.graduated = true;
        curve.amm_pool = Some(pool_address.clone());

        // 3. Transferir liquidez al AMM
        // 80% de reserve + tokens al AMM
        // 20% de reserve al creador (reward por exitoso launch)
        let amm_reserve = curve.reserve * 80 / 100;
        let creator_reward = curve.reserve * 20 / 100;

        Self::transfer_xlm(env, &env.current_contract_address(), &pool_address, amm_reserve)?;
        Self::transfer_xlm(env, &env.current_contract_address(), &curve.creator, creator_reward)?;

        // 4. Emit event
        env.events().publish((
            Symbol::new(&env, "graduated_to_amm"),
            curve.token.clone(),
            pool_address,
            curve.reserve,
        ));

        Ok(())
    }

    /// Cálculo de precio según bonding curve
    fn calculate_buy_cost(curve: &BondingCurve, tokens_out: i128) -> Result<i128, Error> {
        match curve.curve_type {
            CurveType::Linear => {
                // Integral: Cost = k * (S2^2 - S1^2) / 2
                let s1 = curve.supply;
                let s2 = curve.supply.checked_add(tokens_out)
                    .ok_or(Error::Overflow)?;

                let cost = curve.k
                    .checked_mul(s2.checked_mul(s2)?.checked_sub(s1.checked_mul(s1)?)?)?
                    .checked_div(2_000_000)?;

                Ok(cost)
            },
            CurveType::Exponential => {
                // Más agresivo para anti-dump
                // P = k * e^(a*S) donde a = 0.001
                Self::calculate_exponential_cost(curve, tokens_out)
            },
            CurveType::Sigmoid => {
                // Suave al inicio, agresivo en medio, suave al final
                Self::calculate_sigmoid_cost(curve, tokens_out)
            }
        }
    }
}
```

**Por qué esto es INNOVADOR:**

✅ **Liquidez instantánea** - No necesitas crear pool ni aportar liquidez
✅ **Price discovery orgánico** - El mercado determina el valor
✅ **Anti-dump mechanism** - Vender muchos tokens mueve el precio significativamente
✅ **Graduación automática** - Tokens exitosos van a AMM automáticamente
✅ **Creator rewards** - 20% del reserve al creador cuando gradúa
✅ **Anti-whale** - Máximo 5% del supply por transacción

---

### **1.2 AMM Ultra-Optimizado (Phoenix-inspired)**

**Inspiración:** Phoenix Protocol - Top DEX en Soroban

**Arquitectura:**

```rust
// contracts/amm/src/lib.rs

#[contract]
pub struct LiquidityPool;

#[contractimpl]
impl LiquidityPool {
    /// Inicializar pool
    pub fn initialize(
        env: Env,
        init_info: LiquidityPoolInitInfo,
    ) -> Result<(), Error> {
        // Config
        let config = Config {
            admin: init_info.admin,
            swap_fee_bps: init_info.swap_fee_bps, // 30 bps = 0.3%
            fee_recipient: init_info.fee_recipient,
            max_allowed_slippage_bps: init_info.max_allowed_slippage_bps, // 1% máx
            default_slippage_bps: init_info.default_slippage_bps, // 0.5%
            max_allowed_spread_bps: init_info.max_allowed_spread_bps, // 2%
            paused: false,
        };

        env.storage().instance().set(&DataKey::Config, &config);

        // Deploy LP token
        let lp_token = Self::deploy_lp_token(&env)?;
        env.storage().instance().set(&DataKey::LPToken, &lp_token);

        // Deploy staking contract
        let stake = Self::deploy_stake_contract(&env, init_info.stake_init_info)?;
        env.storage().instance().set(&DataKey::StakeContract, &stake);

        Ok(())
    }

    /// Provide liquidity (add to pool)
    pub fn provide_liquidity(
        env: Env,
        sender: Address,
        desired_a: i128,
        min_a: Option<i128>,
        desired_b: i128,
        min_b: Option<i128>,
        custom_slippage_bps: Option<i64>,
    ) -> Result<i128, Error> {
        sender.require_auth();

        let config = Self::get_config(&env)?;

        // Check pause
        if config.paused {
            return Err(Error::PoolPaused);
        }

        // Get current reserves
        let (reserve_a, reserve_b) = Self::get_reserves(&env)?;

        // Calculate optimal amounts
        let (amount_a, amount_b) = if reserve_a == 0 || reserve_b == 0 {
            // First liquidity provision
            (desired_a, desired_b)
        } else {
            // Subsequent provisions - maintain ratio
            let optimal_b = Self::quote(desired_a, reserve_a, reserve_b)?;

            if optimal_b <= desired_b {
                // Use desired_a and optimal_b
                (desired_a, optimal_b)
            } else {
                let optimal_a = Self::quote(desired_b, reserve_b, reserve_a)?;
                (optimal_a, desired_b)
            }
        };

        // Slippage protection
        let slippage_bps = custom_slippage_bps
            .unwrap_or(config.default_slippage_bps);

        if let Some(min_a) = min_a {
            if amount_a < min_a {
                return Err(Error::SlippageExceeded);
            }
        }
        if let Some(min_b) = min_b {
            if amount_b < min_b {
                return Err(Error::SlippageExceeded);
            }
        }

        // Calculate LP tokens to mint
        let lp_tokens = if reserve_a == 0 {
            // First provision: sqrt(amount_a * amount_b)
            Self::sqrt(amount_a.checked_mul(amount_b)?)?
        } else {
            // Subsequent: min(amount_a/reserve_a, amount_b/reserve_b) * total_supply
            let total_supply = Self::get_lp_total_supply(&env)?;
            let lp_a = amount_a.checked_mul(total_supply)?.checked_div(reserve_a)?;
            let lp_b = amount_b.checked_mul(total_supply)?.checked_div(reserve_b)?;
            min(lp_a, lp_b)
        };

        // Update reserves BEFORE transfers
        Self::update_reserves(&env, reserve_a + amount_a, reserve_b + amount_b)?;

        // Transfers
        Self::transfer_token_a(&env, &sender, &env.current_contract_address(), amount_a)?;
        Self::transfer_token_b(&env, &sender, &env.current_contract_address(), amount_b)?;

        // Mint LP tokens
        Self::mint_lp_tokens(&env, &sender, lp_tokens)?;

        // Emit event
        env.events().publish((
            Symbol::new(&env, "liquidity_added"),
            sender,
            amount_a,
            amount_b,
            lp_tokens,
        ));

        Ok(lp_tokens)
    }

    /// Swap tokens
    pub fn swap(
        env: Env,
        sender: Address,
        offer_asset: Address,
        offer_amount: i128,
        ask_asset_min_amount: Option<i128>,
        max_spread_bps: Option<i64>,
    ) -> Result<i128, Error> {
        sender.require_auth();

        let config = Self::get_config(&env)?;

        if config.paused {
            return Err(Error::PoolPaused);
        }

        // Get reserves
        let (reserve_a, reserve_b) = Self::get_reserves(&env)?;
        let (reserve_offer, reserve_ask) = if offer_asset == Self::get_token_a(&env)? {
            (reserve_a, reserve_b)
        } else {
            (reserve_b, reserve_a)
        };

        // Calculate output using constant product formula
        // x * y = k
        // y_out = y - k / (x + x_in * (1 - fee))

        let fee_bps = config.swap_fee_bps;
        let offer_amount_after_fee = offer_amount
            .checked_mul(10000 - fee_bps)?
            .checked_div(10000)?;

        let ask_amount = reserve_ask
            .checked_mul(offer_amount_after_fee)?
            .checked_div(reserve_offer.checked_add(offer_amount_after_fee)?)?;

        // Commission (fee)
        let commission = offer_amount.checked_sub(offer_amount_after_fee)?;

        // Spread check
        let spread = Self::calculate_spread(
            reserve_offer,
            reserve_ask,
            offer_amount,
            ask_amount,
        )?;

        let max_spread = max_spread_bps.unwrap_or(config.max_allowed_spread_bps);
        if spread > max_spread {
            return Err(Error::SpreadExceedsLimit);
        }

        // Slippage check
        if let Some(min_amount) = ask_asset_min_amount {
            if ask_amount < min_amount {
                return Err(Error::SlippageExceeded);
            }
        }

        // Update reserves
        let (new_reserve_a, new_reserve_b) = if offer_asset == Self::get_token_a(&env)? {
            (reserve_a + offer_amount, reserve_b - ask_amount)
        } else {
            (reserve_a - ask_amount, reserve_b + offer_amount)
        };
        Self::update_reserves(&env, new_reserve_a, new_reserve_b)?;

        // Transfers
        Self::transfer_asset(&env, &offer_asset, &sender, &env.current_contract_address(), offer_amount)?;

        let ask_asset = if offer_asset == Self::get_token_a(&env)? {
            Self::get_token_b(&env)?
        } else {
            Self::get_token_a(&env)?
        };
        Self::transfer_asset(&env, &ask_asset, &env.current_contract_address(), &sender, ask_amount)?;

        // Send commission to fee recipient
        Self::transfer_asset(&env, &offer_asset, &env.current_contract_address(), &config.fee_recipient, commission)?;

        // Emit event
        env.events().publish((
            Symbol::new(&env, "swap"),
            sender,
            offer_asset,
            offer_amount,
            ask_amount,
            commission,
            spread,
        ));

        Ok(ask_amount)
    }

    /// Simulate swap (read-only, no gas)
    pub fn simulate_swap(
        env: Env,
        offer_asset: Address,
        offer_amount: i128,
    ) -> Result<SimulateSwapResponse, Error> {
        let config = Self::get_config(&env)?;
        let (reserve_a, reserve_b) = Self::get_reserves(&env)?;

        let (reserve_offer, reserve_ask) = if offer_asset == Self::get_token_a(&env)? {
            (reserve_a, reserve_b)
        } else {
            (reserve_b, reserve_a)
        };

        let fee_bps = config.swap_fee_bps;
        let offer_amount_after_fee = offer_amount * (10000 - fee_bps) / 10000;

        let ask_amount = reserve_ask * offer_amount_after_fee
            / (reserve_offer + offer_amount_after_fee);

        let commission = offer_amount - offer_amount_after_fee;

        let spread = Self::calculate_spread(
            reserve_offer,
            reserve_ask,
            offer_amount,
            ask_amount,
        )?;

        Ok(SimulateSwapResponse {
            ask_amount,
            commission_amount: commission,
            spread_amount: spread,
            total_return: ask_amount,
        })
    }
}
```

**Mejoras sobre AMM básico:**

✅ **Slippage protection** - Usuario define máximo slippage aceptable
✅ **Spread limits** - Previene sandwiching y MEV
✅ **Fee optimization** - 0.3% óptimo (probado por Uniswap)
✅ **LP token staking** - Earn rewards automáticamente
✅ **Simulation antes de swap** - Usuario ve exactamente qué recibirá
✅ **Emergency pause** - Admin puede pausar en caso de exploit

---

### **1.3 Staking Contract con Multi-Rewards**

```rust
// contracts/stake/src/lib.rs

#[contract]
pub struct StakeContract;

#[contractimpl]
impl StakeContract {
    /// Bond LP tokens
    pub fn bond(
        env: Env,
        sender: Address,
        tokens: i128,
    ) -> Result<(), Error> {
        sender.require_auth();

        let config = Self::get_config(&env)?;

        // Minimum bond check
        if tokens < config.min_bond {
            return Err(Error::BelowMinimumBond);
        }

        // Distribute pending rewards ANTES de cambiar stake
        Self::distribute_rewards(&env)?;

        // Update user stake
        let mut user_stake = Self::get_user_stake(&env, &sender)
            .unwrap_or_default();

        user_stake.amount += tokens;
        user_stake.timestamp = env.ledger().timestamp();

        // Update total staked
        let total_staked = Self::get_total_staked(&env)?;
        Self::set_total_staked(&env, total_staked + tokens)?;

        env.storage().persistent().set(
            &DataKey::UserStake(sender.clone()),
            &user_stake
        );

        // Transfer LP tokens to contract
        Self::transfer_lp_tokens(&env, &sender, &env.current_contract_address(), tokens)?;

        env.events().publish((
            Symbol::new(&env, "bonded"),
            sender,
            tokens,
        ));

        Ok(())
    }

    /// Create distribution flow (admin only)
    pub fn create_distribution_flow(
        env: Env,
        sender: Address,
        manager: Address,
        asset: Address,
    ) -> Result<(), Error> {
        let config = Self::get_config(&env)?;
        config.admin.require_auth();

        let flow = DistributionFlow {
            asset: asset.clone(),
            manager,
            total_distributed: 0,
            undistributed: 0,
        };

        env.storage().persistent().set(
            &DataKey::Flow(asset.clone()),
            &flow
        );

        env.events().publish((
            Symbol::new(&env, "flow_created"),
            asset,
            manager,
        ));

        Ok(())
    }

    /// Fund distribution (reward provider)
    pub fn fund_distribution(
        env: Env,
        sender: Address,
        start_time: u64,
        duration: u64,
        asset: Address,
        amount: i128,
    ) -> Result<(), Error> {
        sender.require_auth();

        // Transfer reward tokens to contract
        Self::transfer_asset(&env, &asset, &sender, &env.current_contract_address(), amount)?;

        // Create distribution schedule
        let schedule = DistributionSchedule {
            asset: asset.clone(),
            start_time,
            end_time: start_time + duration,
            total_amount: amount,
            amount_per_second: amount / duration as i128,
        };

        // Add to schedules
        Self::add_schedule(&env, schedule)?;

        env.events().publish((
            Symbol::new(&env, "distribution_funded"),
            asset,
            amount,
            start_time,
            duration,
        ));

        Ok(())
    }

    /// Distribute rewards (can be called by anyone)
    pub fn distribute_rewards(env: &Env) -> Result<(), Error> {
        let current_time = env.ledger().timestamp();
        let total_staked = Self::get_total_staked(env)?;

        if total_staked == 0 {
            return Ok(()); // No one to distribute to
        }

        // Get all active schedules
        let schedules = Self::get_active_schedules(env, current_time)?;

        for schedule in schedules {
            let time_elapsed = current_time - schedule.last_distribution_time;
            let rewards_to_distribute = schedule.amount_per_second * time_elapsed as i128;

            // Distribute proportionally to all stakers
            // Store rewards per LP token
            let rewards_per_token = rewards_to_distribute * PRECISION / total_staked;

            let mut flow = Self::get_flow(env, &schedule.asset)?;
            flow.total_distributed += rewards_to_distribute;
            flow.undistributed -= rewards_to_distribute;

            // Update accumulated rewards per token
            let mut accumulated = Self::get_accumulated_rewards_per_token(env, &schedule.asset)?;
            accumulated += rewards_per_token;

            env.storage().persistent().set(
                &DataKey::AccumulatedRewardsPerToken(schedule.asset.clone()),
                &accumulated
            );

            env.storage().persistent().set(
                &DataKey::Flow(schedule.asset.clone()),
                &flow
            );
        }

        Ok(())
    }

    /// Withdraw rewards (user)
    pub fn withdraw_rewards(
        env: Env,
        sender: Address,
    ) -> Result<(), Error> {
        sender.require_auth();

        // Distribute latest rewards first
        Self::distribute_rewards(&env)?;

        // Calculate user's withdrawable rewards
        let user_stake = Self::get_user_stake(&env, &sender)?;
        let flows = Self::get_all_flows(&env)?;

        for flow in flows {
            let accumulated = Self::get_accumulated_rewards_per_token(&env, &flow.asset)?;
            let user_accumulated = Self::get_user_accumulated(&env, &sender, &flow.asset)?;

            let rewards = (accumulated - user_accumulated) * user_stake.amount / PRECISION;

            if rewards >= flow.min_reward {
                // Transfer rewards
                Self::transfer_asset(&env, &flow.asset, &env.current_contract_address(), &sender, rewards)?;

                // Update user's accumulated
                env.storage().persistent().set(
                    &DataKey::UserAccumulated(sender.clone(), flow.asset.clone()),
                    &accumulated
                );

                env.events().publish((
                    Symbol::new(&env, "rewards_withdrawn"),
                    sender.clone(),
                    flow.asset.clone(),
                    rewards,
                ));
            }
        }

        Ok(())
    }

    /// Query annualized rewards (APR)
    pub fn query_annualized_rewards(env: Env) -> Result<Vec<AnnualizedReward>, Error> {
        let total_staked = Self::get_total_staked(&env)?;
        let schedules = Self::get_all_schedules(&env)?;

        let mut rewards = Vec::new(&env);

        for schedule in schedules {
            // Calculate annual reward rate
            let yearly_rewards = schedule.amount_per_second * SECONDS_PER_YEAR;
            let apr_bps = if total_staked > 0 {
                yearly_rewards * 10000 / total_staked
            } else {
                0
            };

            rewards.push_back(AnnualizedReward {
                asset: schedule.asset,
                apr_bps, // In basis points (10000 = 100%)
                yearly_amount: yearly_rewards,
            });
        }

        Ok(rewards)
    }
}
```

**Por qué Multi-Rewards es poderoso:**

✅ **Múltiples tokens de reward** - No solo 1, puedes tener XLM + USDC + token del proyecto
✅ **APR dinámico** - Se calcula en tiempo real
✅ **Distribution scheduling** - Programa rewards por días/semanas/meses
✅ **Auto-compound** - Rewards se calculan constantemente
✅ **Fair distribution** - Proporcional al stake de cada usuario

---

### **1.4 Router para Multi-Hop Swaps**

```rust
// contracts/router/src/lib.rs

#[contract]
pub struct Router;

#[derive(Clone)]
pub struct SwapRoute {
    pub pool: Address,
    pub token_in: Address,
    pub token_out: Address,
}

#[contractimpl]
impl Router {
    /// Multi-hop swap
    pub fn swap_exact_tokens_for_tokens(
        env: Env,
        sender: Address,
        amount_in: i128,
        amount_out_min: i128,
        routes: Vec<SwapRoute>,
        deadline: u64,
    ) -> Result<i128, Error> {
        sender.require_auth();

        // Deadline check
        if env.ledger().timestamp() > deadline {
            return Err(Error::DeadlineExpired);
        }

        // Validate routes
        if routes.len() == 0 {
            return Err(Error::InvalidRoute);
        }

        // Verify route continuity
        for i in 0..routes.len() - 1 {
            if routes.get(i).unwrap().token_out != routes.get(i + 1).unwrap().token_in {
                return Err(Error::InvalidRoute);
            }
        }

        // Execute swaps sequentially
        let mut current_amount = amount_in;

        for (i, route) in routes.iter().enumerate() {
            // Call pool's swap function
            let pool_client = PoolClient::new(&env, &route.pool);

            let min_amount = if i == routes.len() - 1 {
                // Last swap: use user's min amount
                amount_out_min
            } else {
                // Intermediate swaps: no minimum (trust the math)
                0
            };

            current_amount = pool_client.swap(
                &sender,
                &route.token_in,
                &current_amount,
                &Some(min_amount),
                &None, // Use pool's default spread
            );
        }

        // Final slippage check
        if current_amount < amount_out_min {
            return Err(Error::InsufficientOutputAmount);
        }

        env.events().publish((
            Symbol::new(&env, "multi_hop_swap"),
            sender,
            amount_in,
            current_amount,
            routes.len(),
        ));

        Ok(current_amount)
    }

    /// Find best route (read-only simulation)
    pub fn get_best_route(
        env: Env,
        token_in: Address,
        token_out: Address,
        amount_in: i128,
    ) -> Result<Vec<SwapRoute>, Error> {
        // Get all available pools
        let pools = Self::get_all_pools(&env)?;

        // Build graph of possible routes
        // Use Dijkstra's algorithm to find optimal path

        // For simplicity, implement 1-hop and 2-hop routes
        let direct_route = Self::find_direct_route(&env, &pools, &token_in, &token_out)?;

        if let Some(route) = direct_route {
            return Ok(vec![&env, route]);
        }

        // Try 2-hop routes (token_in -> intermediate -> token_out)
        let two_hop = Self::find_two_hop_route(&env, &pools, &token_in, &token_out, amount_in)?;

        if let Some(routes) = two_hop {
            return Ok(routes);
        }

        Err(Error::NoRouteFound)
    }
}
```

**Por qué Router es esencial:**

✅ **Mejores precios** - Encuentra el camino óptimo A → B → C
✅ **Más pares disponibles** - Swaps indirectos (TOKEN → XLM → USDC)
✅ **Mejor UX** - Usuario solo selecciona token in/out
✅ **Deadline protection** - Previene transacciones stuck

---

## **FASE 2: Features UI Innovadoras** ⭐⭐⭐

Ahora que tenemos contratos top-tier, necesitamos UI que los muestre.

### **2.1 Dashboard Realtime**

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useTokenFactory } from '@/hooks/useTokenFactory';
import { useRealtime } from '@/hooks/useRealtime';
import { TrendingTokens } from '@/components/dashboard/trending-tokens';
import { RecentTrades } from '@/components/dashboard/recent-trades';
import { PriceChart } from '@/components/dashboard/price-chart';
import { VolumeStats } from '@/components/dashboard/volume-stats';

export default function DashboardPage() {
  const { useAllTokens } = useTokenFactory();
  const { data: tokens, isLoading } = useAllTokens();

  // Realtime updates via Horizon streaming
  const { recentTrades, onlineTrades } = useRealtime({
    onTrade: (trade) => {
      // Show toast notification
      toast.info(`New trade: ${trade.amount} ${trade.symbol}`);
    }
  });

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <StatsCard title="Total Tokens" value={tokens?.length ?? 0} />
        <StatsCard title="24h Volume" value="$1.2M" />
        <StatsCard title="Total TVL" value="$5.4M" />
        <StatsCard title="Active Traders" value={onlineTrades} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Trending Tokens (left 2/3) */}
        <div className="lg:col-span-2">
          <TrendingTokens tokens={tokens} />
        </div>

        {/* Recent Trades (right 1/3) */}
        <div>
          <RecentTrades trades={recentTrades} />
        </div>
      </div>

      {/* Price Charts */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Top Performers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tokens?.slice(0, 4).map(token => (
            <PriceChart key={token.id} token={token} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### **2.2 Trading Interface Avanzada**

```typescript
// src/components/swap/advanced-swap-interface.tsx
'use client';

import { useState } from 'react';
import { useTokenFactory } from '@/hooks/useTokenFactory';
import { useRouter } from '@/hooks/useRouter';
import { PriceImpactWarning } from './price-impact-warning';
import { SlippageSettings } from './slippage-settings';
import { RouteVisualization } from './route-visualization';

export function AdvancedSwapInterface() {
  const [tokenIn, setTokenIn] = useState<string>('');
  const [tokenOut, setTokenOut] = useState<string>('');
  const [amountIn, setAmountIn] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5%

  const { useBuyPrice } = useTokenFactory();
  const { data: price } = useBuyPrice(tokenOut, BigInt(amountIn || 0));

  // Find best route automatically
  const { data: route } = useRouter().useBestRoute(
    tokenIn,
    tokenOut,
    BigInt(amountIn || 0)
  );

  // Calculate price impact
  const priceImpact = calculatePriceImpact(price, route);

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Swap Tokens</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Token In */}
        <div>
          <Label>From</Label>
          <TokenInput
            value={amountIn}
            onChange={setAmountIn}
            token={tokenIn}
            onTokenChange={setTokenIn}
          />
          <Balance token={tokenIn} />
        </div>

        {/* Swap Direction Arrow */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Swap token in/out
              const temp = tokenIn;
              setTokenIn(tokenOut);
              setTokenOut(temp);
            }}
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Token Out */}
        <div>
          <Label>To (estimated)</Label>
          <TokenInput
            value={price?.toString() || '0'}
            readOnly
            token={tokenOut}
            onTokenChange={setTokenOut}
          />
        </div>

        {/* Route Visualization */}
        {route && route.length > 1 && (
          <RouteVisualization route={route} />
        )}

        {/* Price Impact Warning */}
        {priceImpact > 1 && (
          <PriceImpactWarning impact={priceImpact} />
        )}

        {/* Swap Details */}
        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Rate</span>
            <span>1 {tokenInSymbol} = {rate} {tokenOutSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span>Price Impact</span>
            <span className={priceImpact > 5 ? 'text-red-500' : ''}>
              {priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Fee</span>
            <span>0.3%</span>
          </div>
          <div className="flex justify-between">
            <span>Min received</span>
            <span>{minReceived} {tokenOutSymbol}</span>
          </div>
        </div>

        {/* Slippage Settings */}
        <SlippageSettings
          value={slippage}
          onChange={setSlippage}
        />

        {/* Swap Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSwap}
          disabled={!canSwap}
        >
          {getSwapButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Features Premium:**

✅ **Auto-routing** - Encuentra el mejor camino automáticamente
✅ **Price impact warnings** - Alerta si el swap mueve mucho el precio
✅ **Slippage customizable** - Usuario controla tolerancia
✅ **Min received** - Garantiza mínimo output
✅ **Route visualization** - Muestra A → B → C con flechas

---

### **2.3 Real-time Charts (TradingView style)**

```typescript
// src/components/charts/advanced-price-chart.tsx
'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';
import { useChartData } from '@/hooks/useChartData';

export function AdvancedPriceChart({ tokenId }: { tokenId: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const { data: chartData, isLoading } = useChartData(tokenId, '1H');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#000' },
        textColor: '#fff',
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' },
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00ff00',
      downColor: '#ff0000',
      borderVisible: false,
      wickUpColor: '#00ff00',
      wickDownColor: '#ff0000',
    });

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    // Set data
    if (chartData) {
      candlestickSeries.setData(chartData.candles);
      volumeSeries.setData(chartData.volume);
    }

    // Fit content
    chart.timeScale().fitContent();

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [chartData]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <TimeframeButton timeframe="5M" />
        <TimeframeButton timeframe="15M" />
        <TimeframeButton timeframe="1H" active />
        <TimeframeButton timeframe="4H" />
        <TimeframeButton timeframe="1D" />
      </div>

      <div ref={chartContainerRef} />
    </div>
  );
}
```

---

## **FASE 3: Testing de Clase Mundial** ⭐⭐

```typescript
// tests/e2e/token-lifecycle.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Token Lifecycle', () => {
  test('should create, buy, and graduate token', async ({ page }) => {
    // 1. Connect wallet
    await page.goto('/create');
    await page.click('[data-testid="connect-wallet"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');

    // 2. Create token
    await page.fill('[name="name"]', 'Test Memecoin');
    await page.fill('[name="symbol"]', 'TEST');
    await page.fill('[name="description"]', 'Test token for E2E');
    await page.setInputFiles('[name="image"]', 'tests/fixtures/token-image.png');

    await page.click('[type="submit"]');

    // Should show transaction dialog
    await expect(page.locator('[data-testid="tx-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimated-fee"]')).toContainText('XLM');

    // Confirm transaction
    await page.click('[data-testid="confirm-tx"]');

    // Wait for success
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Token created');

    // 3. Navigate to token page
    const tokenId = await page.locator('[data-testid="token-id"]').textContent();
    await page.goto(`/tokens/${tokenId}`);

    // 4. Buy tokens (multiple times to trigger graduation)
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="buy-amount"]', '20000');
      await page.click('[data-testid="buy-button"]');
      await page.click('[data-testid="confirm-tx"]');
      await expect(page.locator('.toast-success')).toBeVisible();
    }

    // 5. Verify graduation
    await expect(page.locator('[data-testid="graduated-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="amm-pool-link"]')).toBeVisible();

    // 6. Verify can't buy through bonding curve anymore
    await page.fill('[data-testid="buy-amount"]', '1000');
    await page.click('[data-testid="buy-button"]');
    await expect(page.locator('.toast-error')).toContainText('graduated');
  });

  test('should provide liquidity and stake LP tokens', async ({ page }) => {
    // ... test completo de LP provision + staking
  });

  test('should execute multi-hop swap', async ({ page }) => {
    // ... test de router
  });
});
```

**Coverage objetivo: >80%**

---

## **FASE 4: Performance Optimization** ⭐⭐

### **4.1 Bundle Optimization**

```typescript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    // Optimize bundle
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];
              return `vendor.${packageName.replace('@', '')}`;
            },
          },
          stellar: {
            test: /[\\/]node_modules[\\/]@stellar[\\/]/,
            name: 'vendor.stellar',
            priority: 10,
          },
        },
      },
    };

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },

  // Compression
  compress: true,

  // Remove console in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

### **4.2 Metrics**

```typescript
// src/lib/analytics.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

function sendToAnalytics(metric) {
  // Send to your analytics
  console.log(metric);

  // Target metrics:
  // LCP: < 2.5s ✅
  // FID: < 100ms ✅
  // CLS: < 0.1 ✅
}
```

---

## **FASE 5: Deployment Strategy** ⭐⭐⭐

### **5.1 Contract Deployment**

```bash
# deploy.sh
#!/bin/bash

echo "🚀 Deploying AstroShibaPop Contracts to Testnet"

# 1. Build all contracts
echo "📦 Building contracts..."
cd contracts/token-factory && stellar contract build
cd ../amm && stellar contract build
cd ../stake && stellar contract build
cd ../router && stellar contract build

# 2. Deploy Token Factory
echo "🏭 Deploying Token Factory..."
TOKEN_FACTORY=$(stellar contract deploy \
  --wasm ../../target/wasm32-unknown-unknown/release/token_factory.wasm \
  --source deployer \
  --network testnet)

echo "Token Factory: $TOKEN_FACTORY"

# 3. Deploy AMM
echo "💱 Deploying AMM..."
AMM=$(stellar contract deploy \
  --wasm ../../target/wasm32-unknown-unknown/release/amm.wasm \
  --source deployer \
  --network testnet)

echo "AMM: $AMM"

# 4. Deploy Staking
echo "💰 Deploying Staking..."
STAKE=$(stellar contract deploy \
  --wasm ../../target/wasm32-unknown-unknown/release/stake.wasm \
  --source deployer \
  --network testnet)

echo "Stake: $STAKE"

# 5. Deploy Router
echo "🛣️ Deploying Router..."
ROUTER=$(stellar contract deploy \
  --wasm ../../target/wasm32-unknown-unknown/release/router.wasm \
  --source deployer \
  --network testnet)

echo "Router: $ROUTER"

# 6. Update .env.local
echo "📝 Updating environment variables..."
cd ../../frontend
cat > .env.local << EOF
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_TOKEN_FACTORY_CONTRACT_ID=$TOKEN_FACTORY
NEXT_PUBLIC_AMM_CONTRACT_ID=$AMM
NEXT_PUBLIC_STAKE_CONTRACT_ID=$STAKE
NEXT_PUBLIC_ROUTER_CONTRACT_ID=$ROUTER
EOF

echo "✅ Deployment complete!"
echo "📋 Contract IDs have been saved to frontend/.env.local"
```

### **5.2 Frontend Deployment (Vercel)**

```bash
# Deploy to Vercel
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_STELLAR_NETWORK testnet
vercel env add NEXT_PUBLIC_TOKEN_FACTORY_CONTRACT_ID $TOKEN_FACTORY
# ... etc
```

---

## **FASE 6: Monitoring & Analytics** ⭐⭐

```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,

  // Track custom events
  beforeSend(event) {
    // Filter out wallet rejections (not errors)
    if (event.message?.includes('user rejected')) {
      return null;
    }
    return event;
  },
});

// Track contract interactions
export function trackContractCall(
  contract: string,
  method: string,
  success: boolean,
  duration: number
) {
  Sentry.addBreadcrumb({
    category: 'contract',
    message: `${contract}.${method}`,
    level: success ? 'info' : 'error',
    data: { duration },
  });
}
```

---

## **FASE 7: Final Touches** ⭐

### **7.1 SEO Optimization**

```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: 'AstroShibaPop | Premier Memecoin Launchpad on Stellar',
  description: 'Create, trade, and launch memecoins on Stellar with bonding curves and instant liquidity',
  keywords: 'stellar, soroban, defi, memecoin, bonding curve, dex, amm',
  openGraph: {
    title: 'AstroShibaPop',
    description: 'Premier Memecoin Launchpad on Stellar',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AstroShibaPop',
    description: 'Premier Memecoin Launchpad on Stellar',
  },
};
```

### **7.2 Documentation**

Crear docs completas:
- Getting Started
- How to Create Token
- How to Provide Liquidity
- Bonding Curve Explained
- Smart Contract Architecture
- API Reference

---

## 📊 Checklist Final para ser TOP TIER

### Smart Contracts ✅
- [ ] Bonding curve con graduación automática
- [ ] AMM con slippage protection
- [ ] Staking con multi-rewards
- [ ] Router para multi-hop swaps
- [ ] Emergency pause mechanisms
- [ ] Rate limiting
- [ ] Auditoría de seguridad completa

### Frontend ✅
- [ ] Dashboard real-time
- [ ] Advanced trading interface
- [ ] TradingView-style charts
- [ ] Price impact warnings
- [ ] Route visualization
- [ ] Mobile responsive
- [ ] PWA support

### Performance ✅
- [ ] Bundle < 200KB
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Code splitting optimizado
- [ ] Image optimization

### Testing ✅
- [ ] Unit tests >80% coverage
- [ ] E2E tests para flows críticos
- [ ] Integration tests
- [ ] Load testing

### DevOps ✅
- [ ] CI/CD pipeline
- [ ] Automated deployments
- [ ] Monitoring (Sentry)
- [ ] Analytics
- [ ] Error alerting

### Documentation ✅
- [ ] User guides
- [ ] Developer docs
- [ ] API reference
- [ ] Contract architecture diagrams

---

## 🎯 Timeline Estimado

- **FASE 1 (Contratos):** 2-3 semanas
- **FASE 2 (UI):** 2 semanas
- **FASE 3 (Testing):** 1 semana
- **FASE 4 (Performance):** 1 semana
- **FASE 5 (Deployment):** 3 días
- **FASE 6 (Monitoring):** 3 días
- **FASE 7 (Polish):** 1 semana

**Total: ~8-10 semanas para plataforma TOP TIER**

---

## 🚀 Quick Wins (implementar YA)

Para ver resultados inmediatos en Testnet:

1. **Token Factory básico** (ya casi lo tienes)
2. **AMM simple** (constant product)
3. **UI de create token**
4. **UI de swap**
5. **Deploy a testnet**

Esto te da una plataforma funcional en **1-2 semanas**.

Luego iteras agregando features premium.

---

¿Quieres que empecemos con alguna fase específica? Puedo generar el código completo para cualquiera de estas features.
