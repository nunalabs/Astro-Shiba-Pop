/**
 * Token List Component
 *
 * Displays a grid of tokens with filtering and sorting
 */

'use client';

import { useState, useMemo } from 'react';
import { TokenCard } from './TokenCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTokenCount } from '@/hooks/useTokenFactoryQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// Props
// ============================================================================

export interface TokenListProps {
  onTokenClick?: (tokenId: string) => void;
  compact?: boolean;
  limit?: number;
}

type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low' | 'mcap-high' | 'mcap-low';

// ============================================================================
// Component
// ============================================================================

export function TokenList({ onTokenClick, compact = false, limit }: TokenListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Get token count
  const { data: tokenCount, isLoading } = useTokenCount();

  // Generate token IDs (in production, this would come from an API)
  // For now, we'll use sequential IDs based on token count
  const tokenIds = useMemo(() => {
    if (!tokenCount || tokenCount === 0) return [];

    const count = Number(tokenCount);
    const ids: string[] = [];

    // Generate placeholder token IDs
    // In production, you'd fetch actual token addresses from the contract
    for (let i = 0; i < Math.min(count, limit || count); i++) {
      ids.push(`TOKEN_${i}`);
    }

    return ids;
  }, [tokenCount, limit]);

  // Filter and sort tokens
  const filteredTokenIds = useMemo(() => {
    let filtered = [...tokenIds];

    // Apply search filter (in production, filter by name/symbol)
    if (searchQuery) {
      // This is a placeholder - in production, you'd fetch token info and filter
      filtered = filtered.filter((id) =>
        id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting (in production, sort by actual data)
    // This is a placeholder - in production, you'd sort by actual token data
    switch (sortBy) {
      case 'newest':
        filtered.reverse();
        break;
      case 'oldest':
        // Already in order
        break;
      case 'price-high':
      case 'price-low':
      case 'mcap-high':
      case 'mcap-low':
        // In production, sort by actual price/mcap data
        break;
    }

    return filtered;
  }, [tokenIds, searchQuery, sortBy]);

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <div className="space-y-4">
        <TokenListSkeleton count={6} compact={compact} />
      </div>
    );
  }

  // ============================================================================
  // Empty State
  // ============================================================================

  if (!tokenCount || tokenCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-6xl opacity-20">🚀</div>
        <h3 className="text-2xl font-bold">No tokens yet</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Be the first to create a meme token on AstroShibaPop!
          <br />
          Launch your token with a bonding curve for automatic price discovery.
        </p>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 md:w-64">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="mcap-high">Market Cap: High to Low</SelectItem>
              <SelectItem value="mcap-low">Market Cap: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTokenIds.length} of {Number(tokenCount)} tokens
      </div>

      {/* No Results */}
      {filteredTokenIds.length === 0 && searchQuery && (
        <Alert>
          <AlertDescription>
            No tokens found matching &quot;{searchQuery}&quot;
          </AlertDescription>
        </Alert>
      )}

      {/* Token Grid */}
      {filteredTokenIds.length > 0 && (
        <div
          className={
            compact
              ? 'space-y-3'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          }
        >
          {filteredTokenIds.map((tokenId) => (
            <TokenCard
              key={tokenId}
              tokenId={tokenId}
              onTradeClick={onTokenClick}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function TokenListSkeleton({ count = 6, compact }: { count?: number; compact?: boolean }) {
  return (
    <>
      {/* Filter Skeletons */}
      <div className="flex flex-col md:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 md:w-64" />
      </div>

      {/* Grid Skeletons */}
      <div
        className={
          compact
            ? 'space-y-3'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        }
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-3">
            {compact ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
