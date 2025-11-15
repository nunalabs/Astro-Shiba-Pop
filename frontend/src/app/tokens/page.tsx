'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Coins, Search, TrendingUp, TrendingDown, Filter, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

interface Token {
  id: string;
  address: string;
  name: string;
  symbol: string;
  imageUrl: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  createdAt: string;
  graduated: boolean;
}

type SortField = 'marketCap' | 'volume24h' | 'priceChange24h' | 'holders' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function TokensPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterGraduated, setFilterGraduated] = useState<boolean | null>(null);

  // Mock tokens data - in production, this would come from GraphQL
  const tokens: Token[] = [
    {
      id: '1',
      address: 'CXXX...XXX',
      name: 'AstroShiba',
      symbol: 'SHIBA',
      imageUrl: 'https://via.placeholder.com/40',
      price: 0.00042,
      priceChange24h: 15.5,
      volume24h: 125000,
      marketCap: 450000,
      holders: 1250,
      createdAt: '2024-01-15',
      graduated: true,
    },
    {
      id: '2',
      address: 'CYYY...YYY',
      name: 'MoonDoge',
      symbol: 'DOGE',
      imageUrl: 'https://via.placeholder.com/40',
      price: 0.00015,
      priceChange24h: -8.2,
      volume24h: 82000,
      marketCap: 280000,
      holders: 850,
      createdAt: '2024-01-20',
      graduated: true,
    },
    {
      id: '3',
      address: 'CZZZ...ZZZ',
      name: 'PepeCoin',
      symbol: 'PEPE',
      imageUrl: 'https://via.placeholder.com/40',
      price: 0.00089,
      priceChange24h: 42.8,
      volume24h: 213000,
      marketCap: 680000,
      holders: 2100,
      createdAt: '2024-01-10',
      graduated: true,
    },
    {
      id: '4',
      address: 'CAAA...AAA',
      name: 'RocketShiba',
      symbol: 'RSHIBA',
      imageUrl: 'https://via.placeholder.com/40',
      price: 0.00025,
      priceChange24h: 5.2,
      volume24h: 45000,
      marketCap: 95000,
      holders: 420,
      createdAt: '2024-01-25',
      graduated: false,
    },
    {
      id: '5',
      address: 'CBBB...BBB',
      name: 'StellarCat',
      symbol: 'SCAT',
      imageUrl: 'https://via.placeholder.com/40',
      price: 0.00012,
      priceChange24h: -3.5,
      volume24h: 28000,
      marketCap: 62000,
      holders: 310,
      createdAt: '2024-01-28',
      graduated: false,
    },
    {
      id: '6',
      address: 'CCCC...CCC',
      name: 'GalacticDog',
      symbol: 'GDOG',
      imageUrl: 'https://via.placeholder.com/40',
      price: 0.00067,
      priceChange24h: 28.3,
      volume24h: 156000,
      marketCap: 520000,
      holders: 1680,
      createdAt: '2024-01-12',
      graduated: true,
    },
  ];

  const filteredAndSortedTokens = tokens
    .filter((token) => {
      const matchesSearch =
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterGraduated === null || token.graduated === filterGraduated;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (a[sortField] < b[sortField]) return -1 * multiplier;
      if (a[sortField] > b[sortField]) return 1 * multiplier;
      return 0;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPrice = (price: number): string => {
    if (price < 0.000001) return `$${price.toExponential(2)}`;
    return `$${price.toFixed(6)}`;
  };

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Coins className="mr-3 h-10 w-10 text-primary" />
          All Tokens
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore and discover meme tokens on AstroShibaPop
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens by name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterGraduated === null ? 'default' : 'outline'}
            onClick={() => setFilterGraduated(null)}
          >
            All
          </Button>
          <Button
            variant={filterGraduated === true ? 'default' : 'outline'}
            onClick={() => setFilterGraduated(true)}
          >
            Graduated
          </Button>
          <Button
            variant={filterGraduated === false ? 'default' : 'outline'}
            onClick={() => setFilterGraduated(false)}
          >
            Bonding Curve
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">#</th>
                  <th className="text-left p-4 font-medium">Token</th>
                  <th className="text-left p-4 font-medium">Price</th>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort('priceChange24h')}
                  >
                    <div className="flex items-center">
                      24h %
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort('volume24h')}
                  >
                    <div className="flex items-center">
                      24h Volume
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort('marketCap')}
                  >
                    <div className="flex items-center">
                      Market Cap
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th
                    className="text-left p-4 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort('holders')}
                  >
                    <div className="flex items-center">
                      Holders
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTokens.length > 0 ? (
                  filteredAndSortedTokens.map((token, index) => (
                    <tr
                      key={token.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4 text-muted-foreground">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                            {token.symbol[0]}
                          </div>
                          <div>
                            <div className="font-semibold">{token.name}</div>
                            <div className="text-sm text-muted-foreground">{token.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono">{formatPrice(token.price)}</td>
                      <td className="p-4">
                        <div
                          className={`flex items-center font-semibold ${
                            token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {token.priceChange24h >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {Math.abs(token.priceChange24h).toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-4 font-semibold">{formatNumber(token.volume24h)}</td>
                      <td className="p-4 font-semibold">{formatNumber(token.marketCap)}</td>
                      <td className="p-4">{token.holders.toLocaleString()}</td>
                      <td className="p-4">
                        {token.graduated ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Graduated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Bonding
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <Link href={`/swap?token=${token.address}`}>
                          <Button size="sm" variant="outline">
                            Trade
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-muted-foreground">
                      No tokens found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedTokens.length > 0 ? (
          filteredAndSortedTokens.map((token, index) => (
            <Card key={token.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-muted-foreground text-sm">#{index + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div className="font-semibold">{token.name}</div>
                      <div className="text-sm text-muted-foreground">{token.symbol}</div>
                    </div>
                  </div>
                  {token.graduated ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Graduated
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Bonding
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-semibold font-mono">{formatPrice(token.price)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">24h Change</p>
                    <p
                      className={`font-semibold flex items-center ${
                        token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {token.priceChange24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(token.priceChange24h).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Market Cap</p>
                    <p className="font-semibold">{formatNumber(token.marketCap)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Holders</p>
                    <p className="font-semibold">{token.holders.toLocaleString()}</p>
                  </div>
                </div>

                <Link href={`/swap?token=${token.address}`}>
                  <Button className="w-full" size="sm">
                    Trade
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No tokens found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        Showing {filteredAndSortedTokens.length} of {tokens.length} tokens
      </div>
    </div>
  );
}
