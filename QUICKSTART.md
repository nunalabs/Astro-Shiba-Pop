# 🚀 AstroShibaPop - Quickstart Guide

> Guía rápida para empezar a desarrollar

---

## 📦 Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar environment variables
cd frontend
cp .env.local.example .env.local
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

Edita `frontend/.env.local`:

```env
# Stellar Network
NEXT_PUBLIC_STELLAR_NETWORK=testnet

# Contract IDs (después de deployar)
NEXT_PUBLIC_TOKEN_FACTORY_CONTRACT_ID=
NEXT_PUBLIC_AMM_ROUTER_CONTRACT_ID=
```

### 2. Wallet Setup

**Instalar Freighter Wallet:**
- Chrome: https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/freighter/

**Configurar para Testnet:**
1. Abrir Freighter
2. Settings → Network → Testnet
3. Obtener XLM de prueba: https://laboratory.stellar.org/#account-creator

---

## 🏃‍♂️ Desarrollo

```bash
# Iniciar servidor de desarrollo
cd frontend
pnpm dev
```

Abrir http://localhost:3000

---

## 🔧 Comandos Disponibles

### Frontend

```bash
# Desarrollo
pnpm dev

# Build producción
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Tests unitarios
pnpm test

# Tests E2E
pnpm test:e2e
pnpm test:e2e:ui      # Con UI
```

---

## 📝 Uso Básico

### Conectar Wallet

```typescript
'use client';

import { useWallet } from '@/stores/wallet';
import { WalletButton } from '@/components/wallet/wallet-button';

export function MyPage() {
  const { isConnected, address } = useWallet();

  return (
    <div>
      <WalletButton />
      {isConnected && <p>Conectado: {address}</p>}
    </div>
  );
}
```

### Crear Token

```typescript
'use client';

import { useTokenFactory } from '@/hooks/useTokenFactory';

export function CreateTokenPage() {
  const { useCreateToken } = useTokenFactory();
  const createToken = useCreateToken();

  const handleCreate = async () => {
    await createToken.mutateAsync({
      name: 'My Token',
      symbol: 'MTK',
      imageUrl: 'https://example.com/image.png',
      description: 'An amazing token',
    });
  };

  return (
    <button
      onClick={handleCreate}
      disabled={createToken.isPending}
    >
      {createToken.isPending ? 'Creando...' : 'Crear Token'}
    </button>
  );
}
```

### Listar Tokens

```typescript
'use client';

import { useTokenFactory } from '@/hooks/useTokenFactory';

export function TokensList() {
  const { useAllTokens } = useTokenFactory();
  const { data: tokens, isLoading } = useAllTokens();

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      {tokens?.map((token) => (
        <div key={token.id}>
          <h3>{token.name}</h3>
          <p>{token.symbol}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/              # Next.js 14 App Router
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   │   ├── useTransaction.ts
│   │   └── useTokenFactory.ts
│   ├── lib/
│   │   └── stellar/      # Stellar SDK integration
│   │       ├── config.ts
│   │       ├── client.ts
│   │       ├── utils.ts
│   │       ├── transactions.ts
│   │       └── services/
│   └── stores/           # Zustand stores
│       └── wallet.ts
├── .env.local            # Environment variables
└── package.json
```

---

## 🔐 Deployment de Contratos

### 1. Build Contracts

```bash
cd contracts/token-factory
stellar contract build
```

### 2. Deploy a Testnet

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/token_factory.wasm \
  --network testnet \
  --source YOUR_KEY_NAME
```

### 3. Guardar Contract ID

Copiar el contract ID retornado a `frontend/.env.local`:

```env
NEXT_PUBLIC_TOKEN_FACTORY_CONTRACT_ID=CXXXXXXXXX...
```

---

## 📚 Recursos

- **Docs Completas:** `IMPLEMENTATION_STATUS.md`
- **Roadmap:** `IMPLEMENTATION_ROADMAP.md`
- **Deployment Guide:** `SOROBAN_DEPLOYMENT_GUIDE.md`
- **Stellar Docs:** https://developers.stellar.org
- **Soroban Docs:** https://soroban.stellar.org
- **Context7 (Docs Actualizadas):** Usar MCP integration

---

## 🐛 Troubleshooting

### Wallet no conecta

1. Verificar que Freighter esté instalado
2. Verificar que esté en Testnet
3. Refrescar la página

### Contract ID no encontrado

1. Verificar que `.env.local` exista
2. Verificar que `NEXT_PUBLIC_TOKEN_FACTORY_CONTRACT_ID` esté configurado
3. Reiniciar el servidor de desarrollo

### TypeScript errors

```bash
pnpm typecheck
```

### Build errors

```bash
rm -rf .next node_modules
pnpm install
pnpm build
```

---

## ✅ Next Steps

1. **Deploy Contratos** - Deployar a Testnet y obtener contract IDs
2. **Conectar Pages** - Implementar lógica en Create, Swap, Pools
3. **Testing** - Escribir tests E2E para flows críticos
4. **Deploy Frontend** - Deploy a Vercel

---

**¿Listo para empezar? 🚀**

```bash
pnpm dev
```
