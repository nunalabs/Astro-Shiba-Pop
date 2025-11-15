'use client';

import { useQuery, gql } from '@apollo/client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

const TRENDING_TOKENS_QUERY = gql`
  query TrendingTokens {
    trendingTokens(limit: 6) {
      address
      name
      symbol
      imageUrl
      marketCap
      volume24h
      priceChange24h
      holders
    }
  }
`;

export function TrendingTokens() {
  const { data, loading } = useQuery(TRENDING_TOKENS_QUERY);

  if (loading) {
    return (
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-8 flex items-center">
          <TrendingUp className="mr-2 h-8 w-8" />
          Trending Tokens
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  const tokens = data?.trendingTokens || [];

  if (tokens.length === 0) {
    return (
      <section className="container py-16">
        <h2 className="text-3xl font-bold mb-8 flex items-center">
          <TrendingUp className="mr-2 h-8 w-8" />
          Trending Tokens
        </h2>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No tokens created yet. Be the first!
            </p>
            <Button asChild>
              <Link href="/create">Create First Token</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="container py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold flex items-center">
          <TrendingUp className="mr-2 h-8 w-8" />
          Trending Tokens
        </h2>
        <Button asChild variant="ghost">
          <Link href="/tokens">View All →</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tokens.map((token: any) => (
          <Link key={token.address} href={`/tokens/${token.address}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {token.imageUrl && (
                      <img
                        src={token.imageUrl}
                        alt={token.name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{token.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{token.symbol}</p>
                    </div>
                  </div>
                  {token.priceChange24h !== undefined && (
                    <span
                      className={
                        token.priceChange24h >= 0
                          ? 'text-green-600 font-semibold'
                          : 'text-red-600 font-semibold'
                      }
                    >
                      {token.priceChange24h >= 0 ? '+' : ''}
                      {token.priceChange24h.toFixed(2)}%
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Market Cap</p>
                    <p className="font-semibold">
                      ${formatNumber(token.marketCap || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">24h Volume</p>
                    <p className="font-semibold">
                      ${formatNumber(token.volume24h || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Holders</p>
                    <p className="font-semibold">{token.holders || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
