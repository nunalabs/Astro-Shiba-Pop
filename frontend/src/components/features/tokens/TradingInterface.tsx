/**
 * Trading Interface Component
 *
 * Dual-panel interface for buying and selling tokens via bonding curve
 */

'use client';

import { useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  useBuyTokens,
  useSellTokens,
  useTokenPrice,
  useTokenInfo,
} from '@/hooks/useTokenFactoryQueries';
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// Buy Form Schema
// ============================================================================

const buyTokenSchema = z.object({
  xlmAmount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'XLM amount must be greater than 0',
    })
    .refine((val) => !isNaN(Number(val)) && Number(val) <= 1_000_000, {
      message: 'XLM amount too large',
    }),
  slippageTolerance: z.literal(0.5), // Fixed slippage tolerance
});

type BuyTokenFormValues = z.infer<typeof buyTokenSchema>;

// ============================================================================
// Sell Form Schema
// ============================================================================

const sellTokenSchema = z.object({
  tokenAmount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Token amount must be greater than 0',
    }),
  slippageTolerance: z.literal(0.5), // Fixed slippage tolerance
});

type SellTokenFormValues = z.infer<typeof sellTokenSchema>;

// ============================================================================
// Props
// ============================================================================

export interface TradingInterfaceProps {
  tokenId: string;
  userBalance?: bigint; // User's token balance for selling
}

// ============================================================================
// Component
// ============================================================================

export function TradingInterface({ tokenId, userBalance = 0n }: TradingInterfaceProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  // Queries
  const { data: tokenInfo, isLoading: tokenInfoLoading } = useTokenInfo(tokenId);
  const { data: currentPrice, isLoading: priceLoading } = useTokenPrice(tokenId);

  // Mutations
  const buyTokens = useBuyTokens();
  const sellTokens = useSellTokens();

  // Buy form
  const buyForm = useForm<BuyTokenFormValues>({
    resolver: zodResolver(buyTokenSchema),
    defaultValues: {
      xlmAmount: '',
      slippageTolerance: 0.5,
    },
  });

  // Sell form
  const sellForm = useForm<SellTokenFormValues>({
    resolver: zodResolver(sellTokenSchema),
    defaultValues: {
      tokenAmount: '',
      slippageTolerance: 0.5,
    },
  });

  // ============================================================================
  // Buy Calculations
  // ============================================================================

  const buyEstimate = useMemo(() => {
    const xlmAmount = buyForm.watch('xlmAmount');
    const slippage = buyForm.watch('slippageTolerance');

    if (!xlmAmount || !currentPrice) return null;

    const xlmAmountNum = Number(xlmAmount);
    if (isNaN(xlmAmountNum) || xlmAmountNum <= 0) return null;

    // Convert to stroops (1 XLM = 10^7 stroops)
    const xlmInStroops = BigInt(Math.floor(xlmAmountNum * 10_000_000));

    // Estimate tokens based on current price (simplified calculation)
    // In production, call contract simulation for accurate estimate
    const estimatedTokens = (xlmAmountNum * 10_000_000) / Number(currentPrice);
    const minTokensOut = estimatedTokens * (1 - slippage / 100);

    return {
      xlmInStroops,
      estimatedTokens: BigInt(Math.floor(estimatedTokens)),
      minTokensOut: BigInt(Math.floor(minTokensOut)),
      pricePerToken: Number(currentPrice) / 10_000_000,
      slippageProtection: slippage,
    };
  }, [buyForm.watch('xlmAmount'), buyForm.watch('slippageTolerance'), currentPrice]);

  // ============================================================================
  // Sell Calculations
  // ============================================================================

  const sellEstimate = useMemo(() => {
    const tokenAmount = sellForm.watch('tokenAmount');
    const slippage = sellForm.watch('slippageTolerance');

    if (!tokenAmount || !currentPrice || !tokenInfo) return null;

    const tokenAmountNum = Number(tokenAmount);
    if (isNaN(tokenAmountNum) || tokenAmountNum <= 0) return null;

    // Convert to token units with decimals
    const tokenAmountBig = BigInt(Math.floor(tokenAmountNum * 10_000_000));

    // Get sell penalty from token info
    const curveType = tokenInfo.bonding_curve?.curve_type?.tag || 'Linear';
    const sellPenaltyBps = curveType === 'Exponential' ? 300 : 200; // 3% or 2%

    // Estimate XLM based on current price (simplified)
    const xlmBeforePenalty = (tokenAmountNum * Number(currentPrice)) / 10_000_000;
    const penalty = (xlmBeforePenalty * sellPenaltyBps) / 10_000;
    const estimatedXlm = xlmBeforePenalty - penalty;
    const minXlmOut = estimatedXlm * (1 - slippage / 100);

    return {
      tokenAmountBig,
      estimatedXlm,
      minXlmOut: BigInt(Math.floor(minXlmOut * 10_000_000)),
      sellPenalty: penalty,
      sellPenaltyPercent: sellPenaltyBps / 100,
      pricePerToken: Number(currentPrice) / 10_000_000,
      slippageProtection: slippage,
    };
  }, [sellForm.watch('tokenAmount'), sellForm.watch('slippageTolerance'), currentPrice, tokenInfo]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const onBuy = async (values: BuyTokenFormValues) => {
    if (!buyEstimate) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid XLM amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      await buyTokens.mutateAsync({
        tokenId,
        xlmAmount: buyEstimate.xlmInStroops,
        minTokensOut: buyEstimate.minTokensOut,
      });

      toast({
        title: 'Purchase Successful!',
        description: `You bought approximately ${Number(buyEstimate.estimatedTokens) / 10_000_000} tokens`,
      });

      buyForm.reset();
    } catch (error) {
      console.error('Buy error:', error);
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Transaction failed',
        variant: 'destructive',
      });
    }
  };

  const onSell = async (values: SellTokenFormValues) => {
    if (!sellEstimate) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid token amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      await sellTokens.mutateAsync({
        tokenId,
        tokenAmount: sellEstimate.tokenAmountBig,
        minXlmOut: sellEstimate.minXlmOut,
      });

      toast({
        title: 'Sale Successful!',
        description: `You received approximately ${sellEstimate.estimatedXlm.toFixed(2)} XLM`,
      });

      sellForm.reset();
    } catch (error) {
      console.error('Sell error:', error);
      toast({
        title: 'Sale Failed',
        description: error instanceof Error ? error.message : 'Transaction failed',
        variant: 'destructive',
      });
    }
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (tokenInfoLoading || priceLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!tokenInfo || !currentPrice) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load token information. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Trade {tokenInfo.symbol}</CardTitle>
        <CardDescription>
          Current Price: {(Number(currentPrice) / 10_000_000).toFixed(7)} XLM per token
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'sell')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Sell
            </TabsTrigger>
          </TabsList>

          {/* BUY TAB */}
          <TabsContent value="buy" className="space-y-4 mt-6">
            <Form {...buyForm}>
              <form onSubmit={buyForm.handleSubmit(onBuy)} className="space-y-6">
                {/* XLM Amount */}
                <FormField
                  control={buyForm.control}
                  name="xlmAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>XLM Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="10.0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Amount of XLM to spend</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slippage Tolerance */}
                <FormField
                  control={buyForm.control}
                  name="slippageTolerance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slippage Tolerance (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum acceptable price movement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Buy Estimate */}
                {buyEstimate && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You will receive:</span>
                      <span className="font-bold">
                        ~{(Number(buyEstimate.estimatedTokens) / 10_000_000).toFixed(2)}{' '}
                        {tokenInfo.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price per token:</span>
                      <span>{buyEstimate.pricePerToken.toFixed(7)} XLM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Minimum received:</span>
                      <span>
                        {(Number(buyEstimate.minTokensOut) / 10_000_000).toFixed(2)}{' '}
                        {tokenInfo.symbol}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={buyTokens.isPending || !buyEstimate}
                >
                  {buyTokens.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buying...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Buy Tokens
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          {/* SELL TAB */}
          <TabsContent value="sell" className="space-y-4 mt-6">
            <Form {...sellForm}>
              <form onSubmit={sellForm.handleSubmit(onSell)} className="space-y-6">
                {/* Token Amount */}
                <FormField
                  control={sellForm.control}
                  name="tokenAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="100.0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Amount of {tokenInfo.symbol} to sell
                        {userBalance > 0n && (
                          <span className="ml-2">
                            (Balance: {(Number(userBalance) / 10_000_000).toFixed(2)})
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slippage Tolerance */}
                <FormField
                  control={sellForm.control}
                  name="slippageTolerance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slippage Tolerance (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum acceptable price movement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sell Estimate */}
                {sellEstimate && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You will receive:</span>
                      <span className="font-bold">
                        ~{sellEstimate.estimatedXlm.toFixed(4)} XLM
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price per token:</span>
                      <span>{sellEstimate.pricePerToken.toFixed(7)} XLM</span>
                    </div>
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Sell penalty ({sellEstimate.sellPenaltyPercent}%):</span>
                      <span>-{sellEstimate.sellPenalty.toFixed(4)} XLM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Minimum received:</span>
                      <span>
                        {(Number(sellEstimate.minXlmOut) / 10_000_000).toFixed(4)} XLM
                      </span>
                    </div>
                  </div>
                )}

                {/* Sell Warning */}
                {sellEstimate && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Selling incurs a {sellEstimate.sellPenaltyPercent}% penalty to
                      discourage pump-and-dump behavior.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  variant="destructive"
                  disabled={sellTokens.isPending || !sellEstimate}
                >
                  {sellTokens.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Selling...
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-2 h-4 w-4" />
                      Sell Tokens
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
