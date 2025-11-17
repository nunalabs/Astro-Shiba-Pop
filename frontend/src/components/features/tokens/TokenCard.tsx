/**
 * Token Card Component
 *
 * Displays token information with quick trade actions
 */

'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTokenInfo, useTokenPrice, useTokenMarketCap } from '@/hooks/useTokenFactoryQueries';
import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Props
// ============================================================================

export interface TokenCardProps {
  tokenId: string;
  onTradeClick?: (tokenId: string) => void;
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function TokenCard({ tokenId, onTradeClick, compact = false }: TokenCardProps) {
  const { data: tokenInfo, isLoading: infoLoading } = useTokenInfo(tokenId);
  const { data: currentPrice, isLoading: priceLoading } = useTokenPrice(tokenId);
  const { data: marketCap, isLoading: marketCapLoading } = useTokenMarketCap(tokenId);

  // Loading state
  if (infoLoading || priceLoading) {
    return <TokenCardSkeleton compact={compact} />;
  }

  // Error state
  if (!tokenInfo || !currentPrice) {
    return null;
  }

  // Extract data
  const { name, symbol, metadata_uri } = tokenInfo;
  const curveType = tokenInfo.bonding_curve?.curve_type?.tag || 'Linear';
  const circulatingSupply = tokenInfo.bonding_curve?.circulating_supply || 0n;
  const priceInXlm = Number(currentPrice) / 10_000_000;
  const marketCapInXlm = marketCap ? Number(marketCap) / 10_000_000 : 0;

  // Parse metadata for image
  let imageUrl = '';
  let description = '';
  try {
    if (metadata_uri && metadata_uri.startsWith('data:application/json,')) {
      const jsonData = decodeURIComponent(metadata_uri.replace('data:application/json,', ''));
      const metadata = JSON.parse(jsonData);
      imageUrl = metadata.image || '';
      description = metadata.description || '';
    }
  } catch (e) {
    console.error('Failed to parse metadata:', e);
  }

  // Curve type badge color
  const curveTypeColor = {
    Linear: 'default' as const,
    Exponential: 'destructive' as const,
    Sigmoid: 'secondary' as const,
  }[curveType] || 'default' as const;

  // ============================================================================
  // Compact Render
  // ============================================================================

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Token Image */}
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {symbol.slice(0, 2)}
              </div>
            )}

            {/* Token Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold truncate">{name}</h3>
                <Badge variant={curveTypeColor} className="text-xs">
                  {curveType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{symbol}</p>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="font-bold">{priceInXlm.toFixed(7)} XLM</p>
              {marketCap !== undefined && (
                <p className="text-xs text-muted-foreground">
                  MCap: {formatNumber(marketCapInXlm)} XLM
                </p>
              )}
            </div>

            {/* Action */}
            <Button
              size="sm"
              onClick={() => onTradeClick?.(tokenId)}
            >
              Trade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Full Render
  // ============================================================================

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {/* Token Image Header */}
      <div className="relative h-40 bg-gradient-to-br from-purple-500 to-pink-500">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
            {symbol.slice(0, 2)}
          </div>
        )}
        {/* Curve Type Badge */}
        <Badge
          variant={curveTypeColor}
          className="absolute top-3 right-3"
        >
          {curveType}
        </Badge>
      </div>

      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold">{name}</h3>
            <p className="text-muted-foreground">{symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-lg font-bold">{priceInXlm.toFixed(7)} XLM</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Market Cap */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3 w-3" />
              Market Cap
            </div>
            <p className="font-bold">
              {marketCapLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                `${formatNumber(marketCapInXlm)} XLM`
              )}
            </p>
          </div>

          {/* Circulating Supply */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3 w-3" />
              Circulating
            </div>
            <p className="font-bold">
              {formatNumber(Number(circulatingSupply) / 10_000_000)}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          className="flex-1"
          variant="default"
          onClick={() => onTradeClick?.(tokenId)}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Buy
        </Button>
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => onTradeClick?.(tokenId)}
        >
          <TrendingDown className="mr-2 h-4 w-4" />
          Sell
        </Button>
        <Link href={`/tokens/${tokenId}`}>
          <Button variant="ghost" size="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function TokenCardSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Skeleton className="h-40 w-full" />
      <CardHeader>
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
      </CardFooter>
    </Card>
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
