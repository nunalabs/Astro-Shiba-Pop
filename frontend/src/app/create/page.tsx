'use client';

import { CreateTokenForm } from '@/components/features/tokens/CreateTokenForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function CreateTokenPage() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center">
            <Sparkles className="mr-3 h-10 w-10 text-primary" />
            Create Meme Token
          </h1>
          <p className="text-lg text-muted-foreground">
            Launch your token with a bonding curve for automatic price discovery
          </p>
        </div>

        <CreateTokenForm />

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
