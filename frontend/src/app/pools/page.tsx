'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet/wallet-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Droplets, Plus, Minus, TrendingUp, Search } from 'lucide-react';

interface Pool {
  id: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Address: string;
  token1Address: string;
  reserve0: string;
  reserve1: string;
  totalLiquidity: string;
  apr: number;
  volume24h: string;
  userLiquidity?: string;
}

export default function PoolsPage() {
  const { address, isConnected } = useWallet();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock pools data - in production, this would come from GraphQL
  const pools: Pool[] = [
    {
      id: '1',
      token0Symbol: 'XLM',
      token1Symbol: 'SHIBA',
      token0Address: 'native',
      token1Address: 'CXXX...XXX',
      reserve0: '50000',
      reserve1: '1000000',
      totalLiquidity: '223606.80',
      apr: 45.2,
      volume24h: '12500',
      userLiquidity: '1500.50',
    },
    {
      id: '2',
      token0Symbol: 'XLM',
      token1Symbol: 'DOGE',
      token0Address: 'native',
      token1Address: 'CYYY...YYY',
      reserve0: '30000',
      reserve1: '500000',
      totalLiquidity: '122474.49',
      apr: 32.5,
      volume24h: '8200',
    },
    {
      id: '3',
      token0Symbol: 'XLM',
      token1Symbol: 'PEPE',
      token0Address: 'native',
      token1Address: 'CZZZ...ZZZ',
      reserve0: '75000',
      reserve1: '2000000',
      totalLiquidity: '387298.33',
      apr: 58.7,
      volume24h: '21300',
      userLiquidity: '2350.75',
    },
  ];

  const filteredPools = pools.filter(
    (pool) =>
      pool.token0Symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.token1Symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddLiquidity = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: 'Adding liquidity',
        description: 'Please approve the transaction in your wallet',
      });

      // TODO: Implement actual add liquidity logic
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Liquidity added!',
        description: `Added ${amount0} ${selectedPool?.token0Symbol} and ${amount1} ${selectedPool?.token1Symbol}`,
      });

      setAmount0('');
      setAmount1('');
    } catch (error) {
      toast({
        title: 'Failed to add liquidity',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: 'Removing liquidity',
        description: 'Please approve the transaction in your wallet',
      });

      // TODO: Implement actual remove liquidity logic
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Liquidity removed!',
        description: `Removed ${amount0} ${selectedPool?.token0Symbol} and ${amount1} ${selectedPool?.token1Symbol}`,
      });

      setAmount0('');
      setAmount1('');
    } catch (error) {
      toast({
        title: 'Failed to remove liquidity',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Droplets className="mr-3 h-10 w-10 text-primary" />
          Liquidity Pools
        </h1>
        <p className="text-lg text-muted-foreground">
          Add liquidity to earn trading fees and rewards
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pools List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Pool Cards */}
          {filteredPools.length > 0 ? (
            filteredPools.map((pool) => (
              <Card
                key={pool.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedPool?.id === pool.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedPool(pool)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                          {pool.token0Symbol[0]}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-lg font-bold -ml-3 border-2 border-background">
                          {pool.token1Symbol[0]}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {pool.token0Symbol}/{pool.token1Symbol}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          TVL: ${parseFloat(pool.totalLiquidity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{pool.apr}%</div>
                      <p className="text-xs text-muted-foreground">APR</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">24h Volume</p>
                      <p className="font-semibold">${parseFloat(pool.volume24h).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reserve {pool.token0Symbol}</p>
                      <p className="font-semibold">{parseFloat(pool.reserve0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reserve {pool.token1Symbol}</p>
                      <p className="font-semibold">{parseFloat(pool.reserve1).toLocaleString()}</p>
                    </div>
                  </div>

                  {pool.userLiquidity && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Your Liquidity</span>
                        <span className="font-semibold">${pool.userLiquidity}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Droplets className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No pools found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add/Remove Liquidity Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedPool
                    ? `${selectedPool.token0Symbol}/${selectedPool.token1Symbol}`
                    : 'Select Pool'}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={mode === 'add' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('add')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={mode === 'remove' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('remove')}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {mode === 'add' ? 'Add liquidity to earn fees' : 'Remove your liquidity'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPool ? (
                <>
                  {/* Token 0 Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount0">{selectedPool.token0Symbol}</Label>
                    <Input
                      id="amount0"
                      type="number"
                      placeholder="0.0"
                      value={amount0}
                      onChange={(e) => {
                        setAmount0(e.target.value);
                        // Auto-calculate proportional amount1
                        if (e.target.value) {
                          const ratio =
                            parseFloat(selectedPool.reserve1) /
                            parseFloat(selectedPool.reserve0);
                          setAmount1((parseFloat(e.target.value) * ratio).toFixed(6));
                        } else {
                          setAmount1('');
                        }
                      }}
                    />
                    {mode === 'remove' && selectedPool.userLiquidity && (
                      <p className="text-sm text-muted-foreground">
                        Available: {selectedPool.userLiquidity}
                      </p>
                    )}
                  </div>

                  {/* Plus Icon */}
                  <div className="flex justify-center">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Token 1 Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount1">{selectedPool.token1Symbol}</Label>
                    <Input
                      id="amount1"
                      type="number"
                      placeholder="0.0"
                      value={amount1}
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  {/* Pool Info */}
                  {amount0 && amount1 && (
                    <div className="rounded-lg border p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate</span>
                        <span className="font-medium">
                          1 {selectedPool.token0Symbol} ={' '}
                          {(
                            parseFloat(selectedPool.reserve1) / parseFloat(selectedPool.reserve0)
                          ).toFixed(6)}{' '}
                          {selectedPool.token1Symbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">APR</span>
                        <span className="font-medium text-green-600">{selectedPool.apr}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Share of Pool</span>
                        <span className="font-medium">~0.01%</span>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={mode === 'add' ? handleAddLiquidity : handleRemoveLiquidity}
                    disabled={!isConnected || !amount0 || !amount1 || loading}
                  >
                    {loading ? (
                      mode === 'add' ? (
                        'Adding Liquidity...'
                      ) : (
                        'Removing Liquidity...'
                      )
                    ) : !isConnected ? (
                      'Connect Wallet'
                    ) : !amount0 || !amount1 ? (
                      'Enter Amounts'
                    ) : mode === 'add' ? (
                      <>
                        <Plus className="mr-2 h-5 w-5" />
                        Add Liquidity
                      </>
                    ) : (
                      <>
                        <Minus className="mr-2 h-5 w-5" />
                        Remove Liquidity
                      </>
                    )}
                  </Button>

                  {/* Earnings Info */}
                  {mode === 'add' && (
                    <div className="rounded-lg bg-primary/5 p-4">
                      <div className="flex items-start space-x-2">
                        <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium mb-1">Earn Trading Fees</p>
                          <p className="text-muted-foreground">
                            You'll earn 0.3% of all trades on this pair proportional to your share
                            of the pool.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a pool to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
