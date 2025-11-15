import { Hero } from '@/components/home/hero';
import { TrendingTokens } from '@/components/home/trending-tokens';
import { Stats } from '@/components/home/stats';
import { Features } from '@/components/home/features';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <TrendingTokens />
      <Features />
    </>
  );
}
