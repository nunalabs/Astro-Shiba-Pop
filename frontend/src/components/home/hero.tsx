import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';

export function Hero() {
  return (
    <section className="container py-20 md:py-32">
      <div className="mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm mb-6">
          <Sparkles className="mr-2 h-4 w-4" />
          <span className="font-semibold">Built on Stellar</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl mb-6">
          Create & Trade
          <span className="text-primary"> Meme Tokens</span>
          <br />
          On Stellar
        </h1>

        <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
          The DeFi hybrid platform for meme tokens. Create your token in seconds,
          trade with ultra-low fees, and earn rewards through liquidity mining.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg">
            <Link href="/create">
              <Sparkles className="mr-2 h-5 w-5" />
              Create Token
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="text-lg">
            <Link href="/swap">
              <TrendingUp className="mr-2 h-5 w-5" />
              Start Trading
            </Link>
          </Button>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border bg-card">
            <Zap className="h-10 w-10 text-primary mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Ultra-Low Fees</h3>
            <p className="text-sm text-muted-foreground">
              $0.00001 per transaction on Stellar. 1000x cheaper than Ethereum.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <Sparkles className="h-10 w-10 text-primary mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Create in Seconds</h3>
            <p className="text-sm text-muted-foreground">
              No coding required. Just name, symbol, and image. Deploy for $0.001.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <TrendingUp className="h-10 w-10 text-primary mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Earn Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Provide liquidity, stake, and earn through our gamified system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
