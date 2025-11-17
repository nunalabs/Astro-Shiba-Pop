# 🧪 Testing Guide - AstroShibaPop Testnet

## 🎯 Objetivo

Probar completamente la aplicación en Stellar Testnet antes de ir a producción.

---

## ✅ PRERREQUISITOS

### 1. Wallet Setup
```bash
# Instalar Freighter Wallet
Chrome: https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk
Firefox: https://addons.mozilla.org/en-US/firefox/addon/freighter/
```

### 2. Conseguir XLM de Testnet
```bash
# Friendbot - Get 10,000 XLM testnet
https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY
```

### 3. Configurar Freighter
- Cambiar a Testnet
- Importar/Crear cuenta
- Verificar balance

---

## 🧪 TEST PLAN COMPLETO

### FASE 1: Verificación de Conexión

#### Test 1.1: Wallet Connection
```
✓ Abrir aplicación
✓ Clic en "Connect Wallet"
✓ Autorizar en Freighter
✓ Verificar que muestra tu address
✓ Verificar que muestra balance
```

**Resultado Esperado**:
- Address visible en header
- Balance correcto
- Estado "Connected"

#### Test 1.2: Contract Status
```bash
# Via CLI - Verificar contracts están operativos
stellar contract invoke \
  --id CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6 \
  --source alice \
  --network testnet \
  -- \
  is_paused

# Esperado: false
```

---

### FASE 2: Crear Token

#### Test 2.1: Form Validation
```
✓ Ir a /create
✓ Intentar submit vacío → Error
✓ Name muy corto (< 3) → Error
✓ Symbol inválido (lowercase) → Error
✓ Description muy corta (< 10) → Error
✓ Supply muy bajo (< 1M) → Error
```

#### Test 2.2: Create Token Success
```
Datos de prueba:
┌─────────────────┬──────────────────────┐
│ Campo           │ Valor                │
├─────────────────┼──────────────────────┤
│ Name            │ Test Shiba           │
│ Symbol          │ TSHIB                │
│ Description     │ Testing token on...  │
│ Image URL       │ https://...png       │
│ Initial Supply  │ 1000000000           │
│ Curve Type      │ Linear               │
│ Decimals        │ 7 (auto)             │
└─────────────────┴──────────────────────┘

Flujo:
✓ Llenar formulario
✓ Clic "Create Token"
✓ Aprobar en Freighter
✓ Esperar confirmación
✓ Ver toast de éxito
✓ Verificar token en Dashboard
```

**Verificación**:
```bash
# Via CLI
stellar contract invoke \
  --id CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6 \
  --source alice \
  --network testnet \
  -- \
  get_token_count

# Should return: 1
```

#### Test 2.3: Rate Limiting
```
✓ Crear token #1 → Success
✓ Crear token #2 → Success
✓ Crear token #3 → Success
...
✓ Crear token #10 → Success
✓ Crear token #11 → Should FAIL (max 10 tokens/user)
```

#### Test 2.4: Cooldown
```
✓ Crear token
✓ Intentar crear otro inmediatamente
✓ Should fail (1 hour cooldown)
✓ Esperar 1 hora (o probar con otra cuenta)
✓ Crear otro token → Success
```

---

### FASE 3: Trading (Buy Tokens)

#### Test 3.1: Buy Validation
```
✓ Ir a token detail page
✓ Tab "Buy"
✓ XLM amount = 0 → Error
✓ XLM amount muy grande → Error
✓ XLM amount válido → OK
```

#### Test 3.2: Buy Success
```
Test Case:
┌──────────────────┬─────────┐
│ XLM Amount       │ 10      │
│ Slippage         │ 0.5%    │
│ Expected Tokens  │ ~XXX    │
└──────────────────┴─────────┘

Flujo:
✓ Ingresar 10 XLM
✓ Ver estimate en tiempo real
✓ Verificar slippage protection
✓ Clic "Buy Tokens"
✓ Aprobar en Freighter
✓ Esperar confirmación
✓ Ver toast de éxito
✓ Verificar balance aumentó
```

**Verificación**:
```bash
# Check price increased
stellar contract invoke \
  --id CBX5QP3KROW7OUFZAMG26T6HGFMS3POSEI6RDJWBOCKVXJFLJU6BIZZ6 \
  --source alice \
  --network testnet \
  -- \
  get_price \
  --token TOKEN_ADDRESS
```

#### Test 3.3: Bonding Curve Behavior
```
Linear Curve:
✓ Buy 10 XLM worth → Price P1
✓ Buy 10 XLM worth → Price P2
✓ Verificar: P2 > P1 (precio aumenta linealmente)

Exponential Curve:
✓ Buy 10 XLM worth → Price P1
✓ Buy 10 XLM worth → Price P2
✓ Verificar: P2 >> P1 (precio aumenta exponencialmente)
✓ Verificar: Sell penalty = 3%
```

---

### FASE 4: Trading (Sell Tokens)

#### Test 4.1: Sell Validation
```
✓ Tab "Sell"
✓ Token amount = 0 → Error
✓ Token amount > balance → Error
✓ Token amount válido → OK
```

#### Test 4.2: Sell Success
```
Test Case:
┌──────────────────┬─────────┐
│ Token Amount     │ 50      │
│ Slippage         │ 0.5%    │
│ Sell Penalty     │ 2-3%    │
│ Expected XLM     │ ~XXX    │
└──────────────────┴─────────┘

Flujo:
✓ Ingresar cantidad tokens
✓ Ver estimate (con penalty)
✓ Ver warning de sell penalty
✓ Clic "Sell Tokens"
✓ Aprobar en Freighter
✓ Esperar confirmación
✓ Ver toast de éxito
✓ Verificar XLM recibido
```

#### Test 4.3: Sell Penalty Verification
```
Para Linear (2% penalty):
Buy Price = 1.0 XLM
Sell Price = 0.98 XLM
Penalty = 0.02 XLM (2%)

Para Exponential (3% penalty):
Buy Price = 1.0 XLM
Sell Price = 0.97 XLM
Penalty = 0.03 XLM (3%)

✓ Verificar cálculos correctos
✓ Verificar penalty mostrado en UI
✓ Verificar XLM recibido = esperado - penalty
```

---

### FASE 5: Token Discovery

#### Test 5.1: Explore Page
```
✓ Ir a /explore
✓ Ver lista de tokens
✓ Verificar TokenCards muestran:
  - Nombre
  - Symbol
  - Precio actual
  - Market Cap
  - Curve type
```

#### Test 5.2: Search & Filter
```
✓ Buscar por nombre
✓ Buscar por symbol
✓ Filtrar por curve type
✓ Ordenar por precio
✓ Ordenar por market cap
✓ Ordenar por newest/oldest
```

#### Test 5.3: Token Detail Page
```
✓ Clic en token
✓ Ver página de detalle
✓ Verificar información:
  - Nombre, symbol, description
  - Precio actual
  - Market Cap
  - Circulating supply
  - Curve type
  - Creator address
✓ Ver trading interface
✓ Hacer una compra
✓ Hacer una venta
```

---

### FASE 6: Dashboard

#### Test 6.1: Stats Display
```
✓ Ir a homepage (/)
✓ Verificar stats cards:
  - Total Tokens
  - 24h Volume
  - Total Users
  - Market Cap
✓ Verificar números actualizan en tiempo real
```

#### Test 6.2: Recent Tokens
```
✓ Ver sección "Recent Tokens"
✓ Verificar muestra últimos creados
✓ Clic en token → ir a detail page
✓ Verificar "Create Token" button
```

---

### FASE 7: Error Handling

#### Test 7.1: Contract Errors
```
Escenarios de error a probar:
✓ Contract paused → Error message
✓ Insufficient XLM → Error message
✓ Slippage exceeded → Error message
✓ Price impact too high → Error message
✓ Network error → Error message
✓ Transaction failed → Error message
```

#### Test 7.2: Wallet Errors
```
✓ Wallet not connected → Prompt to connect
✓ Wrong network → Error message
✓ User rejects transaction → Cancel gracefully
✓ Insufficient balance → Error before submission
```

#### Test 7.3: Form Errors
```
✓ Todos los campos de validación
✓ Mensajes de error claros
✓ Error highlighting
✓ Form reset después de submit
```

---

### FASE 8: Performance

#### Test 8.1: Loading States
```
✓ Ver skeletons mientras carga
✓ Loading spinners en buttons
✓ Smooth transitions
✓ No flash of content
```

#### Test 8.2: Data Fetching
```
✓ React Query caching funciona
✓ Background refetch sin interrumpir UI
✓ Optimistic updates
✓ Cache invalidation después de mutations
```

#### Test 8.3: Bundle Size
```bash
# Verificar en build
pnpm build

# Ver route sizes
# Verificar < 600 KB por route
```

---

### FASE 9: Cross-Browser Testing

```
Browsers a probar:
✓ Chrome (latest)
✓ Firefox (latest)
✓ Safari (latest)
✓ Brave

Features a verificar en cada uno:
✓ Freighter se conecta
✓ Forms funcionan
✓ Trading funciona
✓ UI se ve correctamente
✓ No console errors
```

---

### FASE 10: Mobile Testing

```
Devices a probar:
✓ iPhone (Safari)
✓ Android (Chrome)

Features móviles:
✓ Responsive layout
✓ Touch interactions
✓ Mobile wallet (si disponible)
✓ Forms usables
✓ No scroll horizontal
```

---

## 📊 TEST CHECKLIST

### Pre-Launch Checklist

```
CONTRACTS:
[ ] ✅ Token Factory deployed
[ ] ✅ AMM Pair deployed
[ ] ✅ Contracts initialized
[ ] ✅ Contracts operational (is_paused = false)
[ ] ✅ Token count works
[ ] ⏳ Create token works (TO TEST)
[ ] ⏳ Buy tokens works (TO TEST)
[ ] ⏳ Sell tokens works (TO TEST)

FRONTEND:
[ ] ✅ Build successful
[ ] ✅ TypeScript errors = 0
[ ] ✅ All components render
[ ] ✅ Wallet connection works
[ ] ⏳ Contract queries work (TO TEST)
[ ] ⏳ Contract mutations work (TO TEST)
[ ] ⏳ Forms validate correctly (TO TEST)
[ ] ⏳ Error handling works (TO TEST)

USER FLOWS:
[ ] ⏳ Connect wallet flow (TO TEST)
[ ] ⏳ Create token flow (TO TEST)
[ ] ⏳ Buy tokens flow (TO TEST)
[ ] ⏳ Sell tokens flow (TO TEST)
[ ] ⏳ Browse tokens flow (TO TEST)
[ ] ⏳ View token detail flow (TO TEST)

QUALITY:
[ ] ✅ No TypeScript errors
[ ] ✅ No build warnings (only Stellar SDK)
[ ] ⏳ No runtime errors (TO TEST)
[ ] ⏳ No console errors (TO TEST)
[ ] ⏳ All links work (TO TEST)
[ ] ⏳ All buttons work (TO TEST)
```

---

## 🐛 KNOWN ISSUES TO TEST

### 1. Token ID Format
```
PROBLEMA: TokenList usa placeholder IDs ("TOKEN_0", "TOKEN_1")
SOLUCIÓN REAL: Necesitamos obtener addresses reales de tokens

TODO:
- Implementar get_all_tokens() o similar
- O get_creator_tokens() para cada creator
- Actualizar TokenList para usar addresses reales
```

### 2. User Balance
```
PROBLEMA: TradingInterface no tiene balance real del usuario
SOLUCIÓN REAL: Necesitamos query al token contract

TODO:
- Implementar hook para obtener balance
- Mostrar balance actual en UI
- Deshabilitar sell si balance = 0
```

### 3. Transaction Signing
```
PROBLEMA: Los bindings generados manejan signing automáticamente
VERIFICAR: Que Freighter prompt aparece correctamente

TODO:
- Probar flow completo de signing
- Verificar que user puede aprobar/rechazar
- Manejar errores de signing
```

---

## 🚀 PRÓXIMOS PASOS

### Inmediato (HOY)
1. ✅ Run `pnpm dev`
2. ⏳ Conectar Freighter
3. ⏳ Verificar contract queries funcionan
4. ⏳ Crear primer token de prueba

### Esta Semana
5. ⏳ Implementar get_all_tokens
6. ⏳ Implementar user balance query
7. ⏳ Probar todo el test plan
8. ⏳ Fix bugs encontrados

### Próxima Semana
9. ⏳ Implementar features faltantes (activity, charts)
10. ⏳ Security review
11. ⏳ Performance optimization
12. ⏳ Final QA

---

## 📝 REPORTING BUGS

Template para reportar bugs:

```markdown
### Bug Title

**Environment**: Testnet
**Date**: YYYY-MM-DD
**Severity**: High/Medium/Low

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:
-

**Actual Behavior**:
-

**Screenshots**:
-

**Console Errors**:
```
error log
```

**Additional Context**:
-
```

---

## ✅ SUCCESS CRITERIA

La aplicación está lista para mainnet cuando:

```
✅ Todos los tests pasan
✅ Zero critical bugs
✅ < 5 medium bugs
✅ Performance acceptable (< 3s load time)
✅ Mobile funciona correctamente
✅ Cross-browser compatible
✅ Security audit passed
✅ User testing completed
✅ Documentation complete
```

---

**START TESTING**: 🧪

```bash
cd frontend
pnpm dev
```

Open http://localhost:3000 and start testing! 🚀
