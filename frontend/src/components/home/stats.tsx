'use client';

import { useQuery, gql } from '@apollo/client';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { useEffect, useState } from 'react';

const GLOBAL_STATS_QUERY = gql`
  query GlobalStats {
    globalStats {
      totalTokens
      totalPools
      totalUsers
      totalVolume24h
      totalTVL
    }
  }
`;

export function Stats() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, loading } = useQuery(GLOBAL_STATS_QUERY, {
    pollInterval: 30000, // Refresh every 30s
    skip: !isClient, // Skip query during SSR/SSG
  });

  const stats = [
    {
      label: 'Total Tokens',
      value: data?.globalStats?.totalTokens || 0,
    },
    {
      label: 'Total Pools',
      value: data?.globalStats?.totalPools || 0,
    },
    {
      label: 'Active Users',
      value: data?.globalStats?.totalUsers || 0,
    },
    {
      label: '24h Volume',
      value: `$${formatNumber(data?.globalStats?.totalVolume24h || 0)}`,
    },
    {
      label: 'Total TVL',
      value: `$${formatNumber(data?.globalStats?.totalTVL || 0)}`,
    },
  ];

  return (
    <section className="container py-10 border-y bg-muted/50">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 bg-transparent shadow-none">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">
                {loading ? '...' : stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
