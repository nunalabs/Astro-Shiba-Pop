/**
 * Dashboard Component
 *
 * Main dashboard showing platform statistics and recent tokens
 */

'use client';

import { StatsCard } from './StatsCard';
import { TokenList } from '../tokens/TokenList';
import { useTokenCount, useIsPaused } from '@/hooks/useTokenFactoryQueries';
import { useWallet } from '@/stores/wallet';
import {
  Rocket,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ============================================================================
// Component
// ============================================================================

export function Dashboard() {
  const { publicKey, isConnected } = useWallet();
  const { data: tokenCount, isLoading: tokenCountLoading } = useTokenCount();
  const { data: isPaused, isLoading: isPausedLoading } = useIsPaused();

  // Calculate stats
  const totalTokens = tokenCount ? Number(tokenCount) : 0;

  // Mock data for now (in production, fetch from API/contract)
  const totalVolume24h = 125_432; // XLM
  const totalUsers = 1_234;
  const totalMarketCap = 2_456_789; // XLM

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to AstroShibaPop - The premium memecoin launchpad on Stellar
          </p>
        </div>
        {isConnected && (
          <Link href="/create">
            <Button size="lg" className="gap-2">
              <Rocket className="h-5 w-5" />
              Create Token
            </Button>
          </Link>
        )}
      </div>

      {/* Paused Warning */}
      {isPaused && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Platform Paused</AlertTitle>
          <AlertDescription>
            The platform is currently paused for maintenance. Token creation and
            trading are temporarily disabled.
          </AlertDescription>
        </Alert>
      )}

      {/* Not Connected Warning */}
      {!isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connect Your Wallet</AlertTitle>
          <AlertDescription>
            Connect your Freighter wallet to create and trade tokens.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tokens"
          value={totalTokens}
          icon={Rocket}
          description="Tokens created on the platform"
          isLoading={tokenCountLoading}
        />

        <StatsCard
          title="24h Volume"
          value={`${formatNumber(totalVolume24h)} XLM`}
          icon={TrendingUp}
          description="Trading volume in last 24 hours"
          trend={{
            value: 12.5,
            label: 'vs yesterday',
          }}
        />

        <StatsCard
          title="Total Users"
          value={formatNumber(totalUsers)}
          icon={Users}
          description="Unique wallet addresses"
          trend={{
            value: 8.3,
            label: 'this week',
          }}
        />

        <StatsCard
          title="Market Cap"
          value={`${formatNumber(totalMarketCap)} XLM`}
          icon={DollarSign}
          description="Total value locked"
        />
      </div>

      {/* Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Recent Tokens</h2>
        </div>

        <TokenList limit={12} />
      </div>

      {/* Platform Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-muted rounded-lg">
        <div>
          <h3 className="font-bold text-lg mb-2">🚀 Launch Tokens</h3>
          <p className="text-sm text-muted-foreground">
            Create your meme token with a bonding curve for automatic price discovery.
            Choose from Linear, Exponential, or Sigmoid curves.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-2">💰 Fair Launch</h3>
          <p className="text-sm text-muted-foreground">
            No presales, no team allocations. Everyone buys from the same bonding
            curve. Sell penalties discourage pump-and-dump.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-2">🔒 Secure & Audited</h3>
          <p className="text-sm text-muted-foreground">
            Built with enterprise-grade security on Soroban. Reentrancy protection,
            overflow protection, and rate limiting built-in.
          </p>
        </div>
      </div>

      {/* Contract Info */}
      <div className="text-xs text-muted-foreground text-center pb-8">
        <p>
          Running on Stellar Testnet •{' '}
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${process.env.NEXT_PUBLIC_TOKEN_FACTORY_CONTRACT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            View Contract
          </a>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toString();
}
