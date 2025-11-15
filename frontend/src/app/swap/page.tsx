'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet/wallet-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownUp, Settings } from 'lucide-react';

export default function SwapPage() {
  const { address, isConnected } = useWallet();
  const { toast } = useToast();

  const [tokenIn, setTokenIn] = useState('XLM');
  const [tokenOut, setTokenOut] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('0');
  const [swapping, setSwapping] = useState(false);

  const handleSwap = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setSwapping(true);

    try {
      toast({
        title: 'Swap in progress',
        description: 'Please approve the transaction in your wallet',
      });

      // TODO: Implement actual swap logic
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Swap successful!',
        description: `Swapped ${amountIn} ${tokenIn} for ${amountOut} ${tokenOut}`,
      });

      setAmountIn('');
      setAmountOut('0');
    } catch (error) {
      toast({
        title: 'Swap failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center">
            <ArrowDownUp className="mr-3 h-10 w-10 text-primary" />
            Swap Tokens
          </h1>
          <p className="text-lg text-muted-foreground">
            Trade tokens instantly with 0.3% fee
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Swap</CardTitle>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Exchange tokens at market price with minimal slippage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Token In */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">You Pay</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  className="text-xl"
                />
                <Button variant="outline" className="min-w-[100px]">
                  {tokenIn}
                </Button>
              </div>
            </div>

            {/* Swap Direction */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  const temp = tokenIn;
                  setTokenIn(tokenOut);
                  setTokenOut(temp);
                }}
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Token Out */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">You Receive</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amountOut}
                  readOnly
                  className="text-xl bg-muted"
                />
                <Button variant="outline" className="min-w-[100px]">
                  {tokenOut || 'Select'}
                </Button>
              </div>
            </div>

            {/* Swap Details */}
            {amountIn && amountOut !== '0' && (
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium">
                    1 {tokenIn} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)}{' '}
                    {tokenOut}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee (0.3%)</span>
                  <span className="font-medium">
                    {(parseFloat(amountIn) * 0.003).toFixed(4)} {tokenIn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Impact</span>
                  <span className="font-medium text-green-600">{'<0.1%'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Received</span>
                  <span className="font-medium">
                    {(parseFloat(amountOut) * 0.99).toFixed(6)} {tokenOut}
                  </span>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSwap}
              disabled={!isConnected || !amountIn || !tokenOut || swapping}
            >
              {swapping ? (
                'Swapping...'
              ) : !isConnected ? (
                'Connect Wallet'
              ) : !tokenOut ? (
                'Select Token'
              ) : !amountIn ? (
                'Enter Amount'
              ) : (
                <>
                  <ArrowDownUp className="mr-2 h-5 w-5" />
                  Swap
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 text-sm text-muted-foreground text-center">
          <p>Powered by AstroShibaPop AMM • Stellar Network</p>
          <p className="mt-1">Ultra-low fees • Fast finality • Secure</p>
        </div>
      </div>
    </div>
  );
}
