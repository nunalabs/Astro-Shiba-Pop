# AstroShibaPop Frontend

## Arquitectura Modular y Escalable

Este frontend sigue las mejores prácticas 2025 para aplicaciones DeFi con Next.js 14.

### 📁 Estructura de Directorios

```
src/
├── app/                      # Next.js 14 App Router
│   ├── create/               # Token creation page
│   ├── swap/                 # Swap interface
│   ├── pools/                # Liquidity pools
│   ├── tokens/               # Token listing
│   ├── leaderboard/          # Gamification
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
│
├── components/
│   ├── ui/                   # Base components (shadcn/ui)
│   ├── layout/               # Layout components
│   ├── home/                 # Home page components
│   └── features/             # Feature-specific (to be added)
│       ├── wallet/
│       ├── swap/
│       ├── pools/
│       └── tokens/
│
├── lib/
│   ├── stellar/              # Stellar SDK integration
│   │   ├── client.ts         # Stellar client
│   │   ├── config.ts         # Network configuration
│   │   ├── transactions.ts   # Transaction builder
│   │   └── services/         # Contract services
│   ├── wallet/               # Wallet integration
│   ├── graphql/              # GraphQL client (to be added)
│   └── utils.ts              # Utilities
│
├── hooks/                    # Custom React hooks
│   ├── useWallet.ts          # (to be added)
│   ├── useContract.ts        # (to be added)
│   └── useTransaction.ts     # (to be added)
│
├── stores/                   # Zustand state management
│   ├── wallet.ts             # (to be added)
│   ├── contracts.ts          # (to be added)
│   └── ui.ts                 # (to be added)
│
├── types/                    # TypeScript types
│   └── index.ts              # Global types
│
└── test/                     # Test setup
    └── setup.ts

tests/
├── e2e/                      # Playwright E2E tests
├── integration/              # Integration tests
└── unit/                     # Unit tests (to be added)
```

### 🧪 Testing

#### Unit Tests (Vitest)
```bash
pnpm test              # Run unit tests
pnpm test:ui           # Run with UI
pnpm test:coverage     # Generate coverage report
```

#### E2E Tests (Playwright)
```bash
pnpm test:e2e          # Run E2E tests
pnpm test:e2e:ui       # Run with UI
pnpm test:e2e:debug    # Run in debug mode
```

### 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3+ (strict mode)
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest + Playwright
- **Blockchain**: @stellar/stellar-sdk + Freighter API

### 📦 Key Dependencies

- `@stellar/stellar-sdk` - Stellar blockchain SDK
- `@stellar/freighter-api` - Freighter wallet integration
- `@tanstack/react-query` - Data fetching and caching
- `zustand` - Lightweight state management
- `@apollo/client` - GraphQL client

### 🔧 Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### 🎯 Next Steps

See [IMPLEMENTATION_ROADMAP.md](../IMPLEMENTATION_ROADMAP.md) for the complete implementation plan.

**Current Phase**: FASE 2 - TypeScript Bindings Generation
