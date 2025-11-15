import { Coins, Shield, Zap, Trophy } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Coins,
      title: 'Token Factory',
      description:
        'Create meme tokens in seconds with our bonding curve mechanism. No liquidity needed upfront.',
    },
    {
      icon: Zap,
      title: 'AMM Swap',
      description:
        'Trade tokens instantly with our automated market maker. Ultra-low fees and fast finality.',
    },
    {
      icon: Shield,
      title: 'Secure & Audited',
      description:
        'Smart contracts built in Rust with multiple security audits. Your funds are safe.',
    },
    {
      icon: Trophy,
      title: 'Gamification',
      description:
        'Earn points, unlock achievements, and climb leaderboards. Get rewarded for your activity.',
    },
  ];

  return (
    <section className="container py-20 bg-muted/30">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why AstroShibaPop?</h2>
          <p className="text-lg text-muted-foreground">
            The complete DeFi platform for meme tokens on Stellar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-lg border bg-card hover:shadow-lg transition-shadow"
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
