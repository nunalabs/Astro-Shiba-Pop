/**
 * Token Detail Page
 *
 * Detailed view of a single token with trading interface
 */

'use client';

import { use } from 'react';
import { TradingInterface } from '@/components/features/tokens/TradingInterface';
import { TokenCard } from '@/components/features/tokens/TokenCard';
import { useTokenInfo, useTokenPrice, useTokenMarketCap } from '@/hooks/useTokenFactoryQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// ============================================================================
// Props
// ============================================================================

interface TokenDetailPageProps {
  params: Promise<{
    tokenId: string;
  }>;
}

// ============================================================================
// Component
// ============================================================================

export default function TokenDetailPage({ params }: TokenDetailPageProps) {
  const { tokenId } = use(params);

  const { data: tokenInfo, isLoading: infoLoading } = useTokenInfo(tokenId);
  const { data: currentPrice, isLoading: priceLoading } = useTokenPrice(tokenId);
  const { data: marketCap, isLoading: marketCapLoading } = useTokenMarketCap(tokenId);

  // Loading state
  if (infoLoading || priceLoading) {
    return (
      <div className="container py-10 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!tokenInfo || !currentPrice) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Token not found or failed to load token information.
          </AlertDescription>
        </Alert>
        <Link href="/explore" className="mt-4 inline-block">
          <Button variant="outline">Back to Explore</Button>
        </Link>
      </div>
    );
  }

  // Extract data
  const { name, symbol, metadata_uri } = tokenInfo;
  const curveType = tokenInfo.bonding_curve?.curve_type?.tag || 'Linear';
  const circulatingSupply = tokenInfo.bonding_curve?.circulating_supply || 0n;
  const priceInXlm = Number(currentPrice) / 10_000_000;
  const marketCapInXlm = marketCap ? Number(marketCap) / 10_000_000 : 0;

  // Parse metadata
  let description = '';
  try {
    if (metadata_uri && metadata_uri.startsWith('data:application/json,')) {
      const jsonData = decodeURIComponent(metadata_uri.replace('data:application/json,', ''));
      const metadata = JSON.parse(jsonData);
      description = metadata.description || '';
    }
  } catch (e) {
    console.error('Failed to parse metadata:', e);
  }

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {name} ({symbol})
            </h1>
            {description && (
              <p className="text-lg text-muted-foreground">{description}</p>
            )}
          </div>
          <Link href="/explore">
            <Button variant="outline">Back to Explore</Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="h-4 w-4" />
                Price
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{priceInXlm.toFixed(7)} XLM</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <DollarSign className="h-4 w-4" />
                Market Cap
              </div>
            </CardHeader>
            <CardContent>
              {marketCapLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{formatNumber(marketCapInXlm)} XLM</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="h-4 w-4" />
                Circulating
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatNumber(Number(circulatingSupply) / 10_000_000)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Activity className="h-4 w-4" />
                Curve Type
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{curveType}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Interface */}
        <div className="lg:col-span-2">
          <TradingInterface tokenId={tokenId} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Token Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Token Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract</span>
                <span className="font-mono text-xs">{tokenId.slice(0, 8)}...{tokenId.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Decimals</span>
                <span>7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bonding Curve</span>
                <span className="font-bold">{curveType}</span>
              </div>
              <div className="pt-3 border-t">
                <a
                  href={`https://stellar.expert/explorer/testnet/contract/${tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  View on Explorer →
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Activity tracking coming soon
              </p>
            </CardContent>
          </Card>
        </div>
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
  return num.toFixed(2);
}
