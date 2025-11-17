# 🚀 AstroShibaPop - Testnet Deployment Info
## Deployed: November 15, 2024

---

## 📋 **Contract Deployments**

### **Token Factory V2**
- **Contract ID**: `CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6`
- **WASM Hash**: `16508e1ba1b5eb03d381856ef5dd983e65cd19213dee85412c4397f420aef177`
- **Network**: Stellar Testnet
- **Explorer**: [View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6)
- **Features**:
  - ✅ 3 Bonding Curve Types (Linear, Exponential, Sigmoid)
  - ✅ Sell Penalties (2-3%)
  - ✅ Rate Limiting (10 tokens/user, 1h cooldown)
  - ✅ Emergency Pause
  - ✅ Overflow Protection

### **AMM Pair V2**
- **Contract ID**: `CDPQKJHEIHTJ7BRYJHHG55ECXTFCTO3DUGSJ6US3GVASN6FTRIZJX6C2`
- **WASM Hash**: `9938a02430c60bfc8c954ab35bd58e6bd8b59a8d11d47f24287ed5573ea6f663`
- **Network**: Stellar Testnet
- **Explorer**: [View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CDPQKJHEIHTJ7BRYJHHG55ECXTFCTO3DUGSJ6US3GVASN6FTRIZJX6C2)
- **Features**:
  - ✅ TWAP Price Oracle
  - ✅ Constant Product AMM (x*y=k)
  - ✅ Price Impact Protection (max 5%)
  - ✅ Reentrancy Guard
  - ✅ Safe Math Library

---

## 👤 **Admin Account**

- **Address**: `GB5NMYP2C3MPVO33IDIMMK7LHVFYZMXU6DQ2SRYK7MCYZNID5TOHICN6`
- **Identity**: `alice` (Stellar CLI)
- **Network**: Testnet
- **Status**: Funded ✅

---

## 📦 **TypeScript Bindings**

Generated bindings are located at:
- `frontend/src/lib/contracts/token-factory/src/index.ts`
- `frontend/src/lib/contracts/amm-pair/src/index.ts`

### Installation:
```bash
cd frontend/src/lib/contracts/token-factory
npm install && npm run build

cd ../amm-pair
npm install && npm run build
```

### Usage Example:
```typescript
import { Contract as TokenFactory } from '@/lib/contracts/token-factory';

// Client is already pre-configured with contract ID
const client = new TokenFactory({
  publicKey: userPublicKey,
  // ... options
});

// Call contract methods
const tokenInfo = await client.get_token_info({ token_id: 'xxx' });
```

---

## 🔗 **Frontend Configuration**

Update your `.env.local`:
```bash
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_TOKEN_FACTORY_CONTRACT_ID=CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6
NEXT_PUBLIC_AMM_PAIR_CONTRACT_ID=CDPQKJHEIHTJ7BRYJHHG55ECXTFCTO3DUGSJ6US3GVASN6FTRIZJX6C2
NEXT_PUBLIC_ADMIN_ADDRESS=GB5NMYP2C3MPVO33IDIMMK7LHVFYZMXU6DQ2SRYK7MCYZNID5TOHICN6
```

---

## 🧪 **Testing on Testnet**

### Get Test XLM:
```bash
# Fund your account from Friendbot
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"

# Or use Stellar CLI
stellar keys fund YOUR_IDENTITY --network testnet
```

### Interact with Contracts:

#### Initialize Token Factory:
```bash
stellar contract invoke \
  --id CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6 \
  --source alice \
  --network testnet \
  -- \
  initialize \
  --admin GB5NMYP2C3MPVO33IDIMMK7LHVFYZMXU6DQ2SRYK7MCYZNID5TOHICN6 \
  --treasury GB5NMYP2C3MPVO33IDIMMK7LHVFYZMXU6DQ2SRYK7MCYZNID5TOHICN6
```

#### Check if Paused:
```bash
stellar contract invoke \
  --id CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6 \
  --source alice \
  --network testnet \
  -- \
  is_paused
```

---

## 📊 **Contract Specifications**

### Token Factory Methods:

**Write Methods:**
- `initialize(admin, treasury)` - Initialize contract
- `create_token(creator, name, symbol, decimals, supply, metadata_uri, curve_type)` - Create new token
- `buy_tokens(buyer, token, xlm_amount, min_tokens_out)` - Buy tokens
- `sell_tokens(seller, token, token_amount, min_xlm_out)` - Sell tokens
- `pause(admin)` - Emergency pause
- `unpause(admin)` - Resume operations

**Read Methods:**
- `get_price(token)` - Get current token price
- `get_market_cap(token)` - Get market capitalization
- `get_token_info(token)` - Get complete token info
- `get_creator_tokens(creator)` - Get tokens by creator
- `get_token_count()` - Get total token count
- `is_paused()` - Check pause status

### AMM Pair Methods:

**Write Methods:**
- `initialize(token_0, token_1, factory, fee_to)` - Initialize pair
- `add_liquidity(sender, amount_0, amount_1, amount_0_min, amount_1_min)` - Add liquidity
- `remove_liquidity(sender, liquidity, amount_0_min, amount_1_min)` - Remove liquidity
- `swap(sender, amount_in, amount_out_min, token_in)` - Execute swap

**Read Methods:**
- `get_reserves()` - Get current reserves
- `get_pair_info()` - Get pair information
- `balance_of(address)` - Get LP token balance
- `total_supply()` - Get total LP supply
- `get_amount_out(amount_in, token_in)` - Calculate output amount
- `get_amount_in(amount_out, token_out)` - Calculate input amount

---

## 🔐 **Security Notes**

### Emergency Procedures:

1. **Pause Contract** (if issue detected):
```bash
stellar contract invoke \
  --id CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6 \
  --source alice \
  --network testnet \
  -- \
  pause \
  --admin GB5NMYP2C3MPVO33IDIMMK7LHVFYZMXU6DQ2SRYK7MCYZNID5TOHICN6
```

2. **Unpause Contract** (after resolution):
```bash
stellar contract invoke \
  --id CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6 \
  --source alice \
  --network testnet \
  -- \
  unpause \
  --admin GB5NMYP2C3MPVO33IDIMMK7LHVFYZMXU6DQ2SRYK7MCYZNID5TOHICN6
```

### Rate Limits:
- Max 10 tokens per user
- 1 hour cooldown between token creations
- Max 5% price impact per trade

### Protections Enabled:
- ✅ Reentrancy protection (CHECK-EFFECTS-INTERACTIONS)
- ✅ Overflow/Underflow protection (checked arithmetic)
- ✅ Slippage protection (user-defined minimums)
- ✅ K invariant validation
- ✅ Input validation on all methods

---

## 📈 **Monitoring**

### View Activity:
- **Stellar Expert**: https://stellar.expert/explorer/testnet
- **Transaction History**: View all contract transactions in explorer
- **Contract Storage**: Inspect contract state

### Recommended Tools:
- **StellarExpert** - Block explorer
- **Stellar Laboratory** - Test contract calls
- **Stellar CLI** - Command-line interaction

---

## 🎯 **Next Steps**

### Frontend Integration:
1. ✅ Bindings generated
2. ✅ .env configured
3. ⏳ Update services to use bindings
4. ⏳ Implement UI components
5. ⏳ E2E testing

### Testing Checklist:
- [ ] Initialize contracts
- [ ] Create test token
- [ ] Buy tokens via bonding curve
- [ ] Sell tokens (verify penalty)
- [ ] Check rate limiting
- [ ] Test pause/unpause
- [ ] Graduate token to AMM
- [ ] Add liquidity to AMM
- [ ] Execute swaps
- [ ] Verify TWAP oracle

### Production Readiness:
- [ ] Complete E2E testing on testnet
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation review
- [ ] Mainnet deployment plan

---

## 🆘 **Troubleshooting**

### Common Issues:

**"Contract not found"**
- Verify contract ID is correct
- Check network (testnet vs mainnet)
- Ensure contract is deployed

**"Insufficient balance"**
- Fund account from Friendbot
- Check XLM balance: `stellar keys address alice | xargs stellar account`

**"Transaction failed"**
- Check simulation first
- Verify all parameters
- Check error message in transaction result

**"Rate limit exceeded"**
- Wait for cooldown period (1 hour)
- Or use different account

---

## 📞 **Support**

- **Documentation**: `/SOROBAN_BEST_PRACTICES.md`
- **Roadmap**: `/IMPLEMENTATION_ROADMAP.md`
- **Summary**: `/SESSION_SUMMARY.md`
- **GitHub**: (your repo)
- **Discord**: Stellar Discord #soroban channel

---

**Deployment Status**: ✅ LIVE ON TESTNET

**Last Updated**: November 15, 2024

**Deployed By**: alice (GB5NMYP2C3MPVO33IDIMMK7LHVFYZMXU6DQ2SRYK7MCYZNID5TOHICN6)
