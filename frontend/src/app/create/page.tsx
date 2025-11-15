'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet/wallet-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Upload } from 'lucide-react';

export default function CreateTokenPage() {
  const { address, isConnected } = useWallet();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: '7',
    initialSupply: '1000000',
    metadataUri: '',
  });

  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      // TODO: Call Token Factory contract
      // This would involve:
      // 1. Building transaction with stellar-sdk
      // 2. Signing with wallet
      // 3. Submitting to network
      // 4. Waiting for confirmation

      toast({
        title: 'Token creation in progress',
        description: 'Please approve the transaction in your wallet',
      });

      // Simulate for now
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Token created successfully!',
        description: `${formData.name} (${formData.symbol}) has been created`,
      });

      // Reset form
      setFormData({
        name: '',
        symbol: '',
        decimals: '7',
        initialSupply: '1000000',
        metadataUri: '',
      });
    } catch (error) {
      console.error('Error creating token:', error);
      toast({
        title: 'Error creating token',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center">
            <Sparkles className="mr-3 h-10 w-10 text-primary" />
            Create Meme Token
          </h1>
          <p className="text-lg text-muted-foreground">
            Deploy your own meme token in seconds for just $0.001
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Token Details</CardTitle>
            <CardDescription>
              Fill in the details for your new token. All fields are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Token Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Token Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., AstroShiba"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  minLength={3}
                  maxLength={32}
                />
                <p className="text-sm text-muted-foreground">
                  3-32 characters. This is the full name of your token.
                </p>
              </div>

              {/* Token Symbol */}
              <div className="space-y-2">
                <Label htmlFor="symbol">Token Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., SHIBA"
                  value={formData.symbol}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      symbol: e.target.value.toUpperCase(),
                    }))
                  }
                  required
                  minLength={2}
                  maxLength={12}
                />
                <p className="text-sm text-muted-foreground">
                  2-12 characters. This is the ticker symbol.
                </p>
              </div>

              {/* Initial Supply */}
              <div className="space-y-2">
                <Label htmlFor="supply">Initial Supply</Label>
                <Input
                  id="supply"
                  type="number"
                  placeholder="1000000"
                  value={formData.initialSupply}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, initialSupply: e.target.value }))
                  }
                  required
                  min="1000000"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum 1,000,000 tokens. This is the total supply.
                </p>
              </div>

              {/* Metadata URI */}
              <div className="space-y-2">
                <Label htmlFor="metadataUri">Image URL (IPFS or HTTP)</Label>
                <div className="flex gap-2">
                  <Input
                    id="metadataUri"
                    placeholder="ipfs://... or https://..."
                    value={formData.metadataUri}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metadataUri: e.target.value }))
                    }
                    required
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  URL to your token's image. Use IPFS for permanence.
                </p>
              </div>

              {/* Cost Info */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Creation Fee</span>
                  <span className="font-bold">0.01 XLM</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Network Fee (approx)</span>
                  <span>~0.0001 XLM</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between font-bold">
                    <span>Total Cost</span>
                    <span>~0.0101 XLM</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">≈ $0.001 USD</p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!isConnected || creating}
              >
                {creating ? (
                  'Creating Token...'
                ) : !isConnected ? (
                  'Connect Wallet First'
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Create Token
                  </>
                )}
              </Button>

              {!isConnected && (
                <p className="text-sm text-center text-muted-foreground">
                  Please connect your Freighter wallet to create a token
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bonding Curve</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Your token starts with a bonding curve for automatic liquidity. Price increases
              as more people buy.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Graduation to AMM</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              At 100k XLM market cap, your token automatically graduates to our AMM for
              enhanced liquidity.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
