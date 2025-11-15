# Deploying AstroShibaPop Frontend to Vercel

This guide explains how to deploy the AstroShibaPop frontend to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Git repository connected to Vercel

## Configuration Overview

The project is configured with:
- **Package Manager**: pnpm 8.15.0 (via Corepack)
- **Framework**: Next.js 14
- **Node Version**: 20.11.0
- **Monorepo**: Turborepo workspace

## Option 1: Deploy from Vercel Dashboard (Recommended)

### Step 1: Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Click "Import"

### Step 2: Configure Project Settings

**Root Directory**:
- Select "Edit" next to Root Directory
- Set to: `frontend`
- This tells Vercel to use the frontend subdirectory as the project root

**Framework Preset**:
- Should auto-detect as "Next.js"
- If not, manually select "Next.js"

**Build Settings**:
- Leave as default (Vercel will use the commands from the frontend/package.json)
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `pnpm install`

**Node Version**:
- Will use Node 20.x automatically from `.node-version` file

### Step 3: Configure Environment Variables

Add the following environment variables in Vercel dashboard:

**Required for Production:**
```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com/graphql
```

**Optional (for local testing in Vercel preview):**
```
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
```

> **Note**: For a fully functional deployment, you'll need:
> 1. Backend API (Indexer + GraphQL) deployed separately
> 2. Smart contracts deployed to Stellar testnet
> 3. Update `NEXT_PUBLIC_API_URL` to point to your deployed backend

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Visit your deployment URL

## Option 2: Deploy from CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# From project root, deploy
vercel

# Follow the prompts:
# - Set root directory to: frontend
# - Confirm framework preset: Next.js
# - Configure environment variables when prompted
```

## Option 3: Deploy Monorepo Root (Advanced)

If you want to deploy from the monorepo root:

1. **In Vercel Dashboard**:
   - Root Directory: Leave as `./` (project root)
   - Override Build Command: Enable
   - Build Command: `pnpm --filter=frontend build`
   - Override Install Command: Enable
   - Install Command: `corepack enable && pnpm install`

2. **Environment Variables**: Same as Option 1

## Troubleshooting

### Error: "Unsupported environment (bad pnpm version)"

**Solution**:
- Make sure `packageManager` field is set in root `package.json` (already configured)
- Vercel should use Corepack to install pnpm 8.15.0 automatically
- If still failing, try Option 1 (deploy from `frontend` directory)

### Error: "Cannot find module '@astroshibapop/shared-types'"

**Solution**:
- This happens when deploying from `frontend` root directory
- The frontend depends on the workspace package `@astroshibapop/shared-types`
- **Option A**: Copy `packages/shared-types` into `frontend/src/types` and update imports
- **Option B**: Deploy from monorepo root using Option 3
- **Option C**: Use Vercel's monorepo support (see below)

### Using Vercel Monorepo Support

Vercel has beta support for Turborepo monorepos:

1. Install Turbo globally in your Vercel project:
   ```bash
   vercel env add TURBO_TOKEN
   vercel env add TURBO_TEAM
   ```

2. Configure in Vercel Dashboard:
   - Enable "Include source files outside of the Root Directory"
   - This allows access to workspace dependencies

## Frontend-Only Deployment (Current Setup)

Since the frontend has mock data, you can deploy it standalone for testing:

**Features that work without backend**:
- ✅ UI/UX navigation
- ✅ All pages visible
- ✅ Mock data displays
- ✅ Wallet connection (Freighter)
- ❌ Real token creation (needs contracts + backend)
- ❌ Real swaps (needs contracts + backend)
- ❌ Real pool data (needs backend API)
- ❌ Real leaderboard (needs backend API)

## Full Stack Deployment

For a complete deployment:

1. **Deploy Smart Contracts**:
   ```bash
   ./scripts/deploy-contracts.sh
   # Save contract addresses
   ```

2. **Deploy Backend** (choose one):
   - Railway.app (PostgreSQL + Node.js)
   - Render.com (Docker support)
   - AWS/GCP/Azure (full control)
   - See `DEPLOYMENT_GUIDE.md` for details

3. **Update Environment Variables**:
   - Set contract addresses in backend
   - Set `NEXT_PUBLIC_API_URL` to backend GraphQL endpoint

4. **Deploy Frontend** to Vercel (this guide)

## Environment Variables Reference

### Frontend (.env.local)

```bash
# Network Configuration
NEXT_PUBLIC_NETWORK=testnet

# Backend API
NEXT_PUBLIC_API_URL=https://api.astroshibapop.com/graphql

# Optional: Direct Contract Interaction
NEXT_PUBLIC_TOKEN_FACTORY_CONTRACT=CXXXX...
NEXT_PUBLIC_AMM_ROUTER_CONTRACT=CXXXX...

# Optional: Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX
```

## Vercel Deployment Checklist

- [ ] Repository connected to Vercel
- [ ] Root directory set to `frontend` (Option 1) OR monorepo config (Option 3)
- [ ] Framework preset: Next.js
- [ ] Node version: 20.x (auto-detected from `.node-version`)
- [ ] Environment variables configured
- [ ] Backend API deployed (if needed for production)
- [ ] Smart contracts deployed to testnet
- [ ] First deployment successful
- [ ] Preview deployments working

## Next Steps After Deployment

1. **Test the deployment**: Visit your Vercel URL
2. **Connect Freighter Wallet**: Test wallet connection
3. **Verify all pages load**: Home, Create, Swap, Pools, Tokens, Leaderboard
4. **Set up custom domain** (optional): Configure in Vercel dashboard
5. **Enable preview deployments**: Automatic PR previews
6. **Set up monitoring**: Vercel Analytics, Web Vitals

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Turborepo Documentation: https://turbo.build/repo/docs
- AstroShibaPop Issues: https://github.com/nunalabs/Astro-Shiba-Pop/issues

---

**Need Help?** Check the main `DEPLOYMENT_GUIDE.md` for complete deployment instructions including backend and contracts.
