'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  TrendingUp,
  Sparkles,
  Droplets,
  Flame,
  Medal,
  Crown,
  Award,
} from 'lucide-react';

type LeaderboardCategory = 'creators' | 'traders' | 'liquidity' | 'viral';

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName?: string;
  value: number;
  tokens?: number;
  volume?: number;
  liquidity?: number;
  points: number;
  level: number;
  badge?: string;
}

export default function LeaderboardPage() {
  const [category, setCategory] = useState<LeaderboardCategory>('creators');

  // Mock leaderboard data - in production, this would come from GraphQL
  const leaderboards: Record<LeaderboardCategory, LeaderboardEntry[]> = {
    creators: [
      {
        rank: 1,
        address: 'GXXX...XXX',
        displayName: 'MemeKing',
        value: 15,
        tokens: 15,
        points: 15000,
        level: 25,
        badge: 'legendary',
      },
      {
        rank: 2,
        address: 'GYYY...YYY',
        displayName: 'TokenMaster',
        value: 12,
        tokens: 12,
        points: 12000,
        level: 22,
        badge: 'epic',
      },
      {
        rank: 3,
        address: 'GZZZ...ZZZ',
        displayName: 'CryptoWizard',
        value: 10,
        tokens: 10,
        points: 10000,
        level: 20,
        badge: 'epic',
      },
      {
        rank: 4,
        address: 'GAAA...AAA',
        displayName: 'ShibaLord',
        value: 8,
        tokens: 8,
        points: 8000,
        level: 18,
      },
      {
        rank: 5,
        address: 'GBBB...BBB',
        value: 7,
        tokens: 7,
        points: 7000,
        level: 16,
      },
    ],
    traders: [
      {
        rank: 1,
        address: 'GXXX...XXX',
        displayName: 'WhaleTrader',
        value: 2500000,
        volume: 2500000,
        points: 25000,
        level: 30,
        badge: 'legendary',
      },
      {
        rank: 2,
        address: 'GYYY...YYY',
        displayName: 'SwapMaster',
        value: 1800000,
        volume: 1800000,
        points: 18000,
        level: 26,
        badge: 'epic',
      },
      {
        rank: 3,
        address: 'GZZZ...ZZZ',
        displayName: 'TradingPro',
        value: 1200000,
        volume: 1200000,
        points: 12000,
        level: 22,
        badge: 'epic',
      },
      {
        rank: 4,
        address: 'GAAA...AAA',
        value: 950000,
        volume: 950000,
        points: 9500,
        level: 19,
      },
      {
        rank: 5,
        address: 'GBBB...BBB',
        displayName: 'DeFiHero',
        value: 780000,
        volume: 780000,
        points: 7800,
        level: 17,
      },
    ],
    liquidity: [
      {
        rank: 1,
        address: 'GXXX...XXX',
        displayName: 'LiquidityKing',
        value: 850000,
        liquidity: 850000,
        points: 20000,
        level: 28,
        badge: 'legendary',
      },
      {
        rank: 2,
        address: 'GYYY...YYY',
        displayName: 'PoolMaster',
        value: 620000,
        liquidity: 620000,
        points: 15000,
        level: 24,
        badge: 'epic',
      },
      {
        rank: 3,
        address: 'GZZZ...ZZZ',
        value: 480000,
        liquidity: 480000,
        points: 12000,
        level: 21,
        badge: 'epic',
      },
      {
        rank: 4,
        address: 'GAAA...AAA',
        displayName: 'YieldFarmer',
        value: 350000,
        liquidity: 350000,
        points: 8500,
        level: 18,
      },
      {
        rank: 5,
        address: 'GBBB...BBB',
        value: 280000,
        liquidity: 280000,
        points: 7000,
        level: 16,
      },
    ],
    viral: [
      {
        rank: 1,
        address: 'CXXX...XXX',
        displayName: 'MoonShiba',
        value: 2500,
        tokens: 1,
        points: 0,
        level: 0,
      },
      {
        rank: 2,
        address: 'CYYY...YYY',
        displayName: 'RocketDoge',
        value: 1850,
        tokens: 1,
        points: 0,
        level: 0,
      },
      {
        rank: 3,
        address: 'CZZZ...ZZZ',
        displayName: 'GalacticPepe',
        value: 1420,
        tokens: 1,
        points: 0,
        level: 0,
      },
      {
        rank: 4,
        address: 'CAAA...AAA',
        displayName: 'StellarCat',
        value: 980,
        tokens: 1,
        points: 0,
        level: 0,
      },
      {
        rank: 5,
        address: 'CBBB...BBB',
        displayName: 'AstroDog',
        value: 750,
        tokens: 1,
        points: 0,
        level: 0,
      },
    ],
  };

  const currentLeaderboard = leaderboards[category];

  const formatValue = (value: number, cat: LeaderboardCategory): string => {
    if (cat === 'creators') return `${value} tokens`;
    if (cat === 'viral') return `${value} holders`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'legendary':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'epic':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const categories = [
    {
      id: 'creators' as LeaderboardCategory,
      name: 'Top Creators',
      icon: Sparkles,
      description: 'Most successful token creators',
    },
    {
      id: 'traders' as LeaderboardCategory,
      name: 'Top Traders',
      icon: TrendingUp,
      description: 'Highest trading volume',
    },
    {
      id: 'liquidity' as LeaderboardCategory,
      name: 'Top LPs',
      icon: Droplets,
      description: 'Largest liquidity providers',
    },
    {
      id: 'viral' as LeaderboardCategory,
      name: 'Viral Tokens',
      icon: Flame,
      description: 'Most popular tokens by holders',
    },
  ];

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Trophy className="mr-3 h-10 w-10 text-primary" />
          Leaderboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Top performers and trending tokens on AstroShibaPop
        </p>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                category === cat.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setCategory(cat.id)}
            >
              <CardContent className="p-4 text-center">
                <Icon
                  className={`h-8 w-8 mx-auto mb-2 ${
                    category === cat.id ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <h3 className="font-semibold mb-1">{cat.name}</h3>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 3 Podium (Desktop) */}
        <div className="hidden lg:block lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-primary" />
                Top 3
              </CardTitle>
              <CardDescription>Hall of fame</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentLeaderboard.slice(0, 3).map((entry) => (
                <div
                  key={entry.rank}
                  className={`p-4 rounded-lg border-2 ${
                    entry.rank === 1
                      ? 'border-yellow-500 bg-yellow-50'
                      : entry.rank === 2
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-orange-600 bg-orange-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    {getRankIcon(entry.rank)}
                    {entry.badge && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getBadgeColor(
                          entry.badge
                        )}`}
                      >
                        {entry.badge}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-lg mb-1">
                    {entry.displayName || `${entry.address.slice(0, 8)}...`}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2 font-mono">
                    {entry.address}
                  </div>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {formatValue(entry.value, category)}
                  </div>
                  {category !== 'viral' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Level {entry.level}</span>
                      <span className="font-semibold">{entry.points.toLocaleString()} pts</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Full Rankings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {categories.find((c) => c.id === category)?.name || 'Rankings'}
              </CardTitle>
              <CardDescription>
                {categories.find((c) => c.id === category)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {currentLeaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      entry.rank <= 3 ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Rank */}
                        <div className="w-12 flex justify-center">{getRankIcon(entry.rank)}</div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-lg truncate">
                              {entry.displayName || `${entry.address.slice(0, 12)}...`}
                            </span>
                            {entry.badge && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getBadgeColor(
                                  entry.badge
                                )}`}
                              >
                                {entry.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {entry.address}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            {formatValue(entry.value, category)}
                          </div>
                          {category !== 'viral' && (
                            <div className="text-sm text-muted-foreground">
                              Lv. {entry.level} • {entry.points.toLocaleString()} pts
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievement Info */}
          {category !== 'viral' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Sparkles className="mr-2 h-5 w-5 text-primary" />
                  Earning Points & Levels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Create Tokens</p>
                    <p className="text-muted-foreground">
                      Earn 1000 points per token created. Graduated tokens give bonus points.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Trade Tokens</p>
                    <p className="text-muted-foreground">
                      Earn 1 point per $1 traded. High volume traders get multipliers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Droplets className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Provide Liquidity</p>
                    <p className="text-muted-foreground">
                      Earn 2 points per $1 of liquidity per day. Long-term LPs get bonuses.
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted">
                  <p className="font-semibold mb-1">Badge Tiers</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span>🥇 Legendary</span>
                      <span className="text-muted-foreground">Level 25+</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>💜 Epic</span>
                      <span className="text-muted-foreground">Level 20+</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🔵 Rare</span>
                      <span className="text-muted-foreground">Level 15+</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🟢 Common</span>
                      <span className="text-muted-foreground">Level 10+</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
