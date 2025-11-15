# Deploying AstroShibaPop Frontend to Vercel

This guide explains how to deploy the AstroShibaPop frontend to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Git repository connected to Vercel

## ⚠️ Important: Monorepo Configuration

This project uses a pnpm monorepo structure. To deploy only the frontend to Vercel, you MUST configure the **Root Directory** setting to point to the `frontend` subdirectory. This avoids workspace dependency issues.

## ✅ Recommended: Deploy from Frontend Subdirectory

### Step 1: Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select your Git provider (GitHub/GitLab/Bitbucket)
3. Import the `Astro-Shiba-Pop` repository
4. Click "Import"

### Step 2: Configure Project Settings ⚠️ CRITICAL

**🔴 Root Directory** (MOST IMPORTANT):
1. Click "Edit" next to "Root Directory"
2. Type: `frontend`
3. This tells Vercel to treat `frontend/` as the project root
4. **This avoids all monorepo/pnpm workspace issues**

**Framework Preset**:
- Should auto-detect as "Next.js" ✅
- If not, manually select "Next.js"

**Build & Development Settings**:
- Build Command: (leave default) `npm run build`
- Output Directory: (leave default) `.next`
- Install Command: (leave default) `npm install`

> **Note**: Vercel will automatically use npm instead of pnpm when deploying from the `frontend` subdirectory, which is perfect since it's self-contained with no workspace dependencies.

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

1. Click "Deploy" 🚀
2. Wait for the build to complete (usually 2-3 minutes)
3. Visit your deployment URL
4. Test the application

**Expected Build Output:**
```
✓ Cloning repository
✓ Installing dependencies (npm install)
✓ Building Next.js application
✓ Deployment successful
```

## Alternative: Deploy from Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow the prompts:
# - Confirm settings
# - Configure environment variables when prompted
```

**For subsequent deployments:**
```bash
cd frontend
vercel --prod
```

## Troubleshooting

### Error: "Unsupported environment (bad pnpm version)"

**Solution**: ✅ Set Root Directory to `frontend` in Vercel dashboard
- This is the most common issue
- Deploying from the frontend subdirectory avoids all pnpm/monorepo issues
- Vercel will use npm automatically

### Error: Build fails with "Cannot find module"

**Possible causes**:
1. Root Directory not set correctly → Set to `frontend`
2. Missing environment variables → Add `NEXT_PUBLIC_API_URL`
3. Node version mismatch → Vercel uses Node 20.x by default (correct)

**Solution**:
```
1. Verify Root Directory = "frontend"
2. Check Build Logs in Vercel dashboard
3. Ensure all environment variables are set
```

### Error: "ENOENT: no such file or directory"

**Solution**: Make sure Root Directory is set to `frontend`, not `./` or blank

### Build succeeds but site doesn't work

**Check**:
1. Environment variables are set (especially `NEXT_PUBLIC_API_URL`)
2. The API URL is accessible from the internet (not localhost)
3. Browser console for errors (F12 → Console)

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

## 📋 Vercel Deployment Checklist

Before deploying:
- [ ] Repository connected to Vercel
- [ ] **Root Directory set to `frontend`** ⚠️ CRITICAL
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Environment variable `NEXT_PUBLIC_NETWORK=testnet` added
- [ ] Environment variable `NEXT_PUBLIC_API_URL` added (can be placeholder for now)

After first deployment:
- [ ] First deployment successful ✅
- [ ] All pages accessible (Home, Create, Swap, Pools, Tokens, Leaderboard)
- [ ] Freighter wallet connection working
- [ ] Preview deployments enabled for PRs

## 🎉 Next Steps After Deployment

1. **Test the deployment**: Visit your Vercel URL (e.g., `https://astro-shiba-pop.vercel.app`)
2. **Verify all pages**:
   - ✅ Home page with stats
   - ✅ Create Token page
   - ✅ Swap interface
   - ✅ Pools page
   - ✅ Tokens listing
   - ✅ Leaderboard
3. **Test Freighter wallet**: Click "Connect Wallet" button
4. **Custom domain** (optional): Add in Vercel dashboard → Settings → Domains
5. **Preview deployments**: Enabled automatically for all PRs
6. **Monitoring**: Enable Vercel Analytics and Speed Insights

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Full Deployment Guide**: See `DEPLOYMENT_GUIDE.md` for backend + contracts
- **Issues**: https://github.com/nunalabs/Astro-Shiba-Pop/issues

---

## 🚨 Quick Reference

**Most Common Fix**: If deployment fails with pnpm errors:
```
Vercel Dashboard → Settings → Root Directory → Set to "frontend" → Save
```

**Current Status**: Frontend can be deployed standalone with mock data. For full functionality, deploy backend and smart contracts separately (see `DEPLOYMENT_GUIDE.md`).
