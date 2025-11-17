/**
 * Explore Tokens Page
 *
 * Browse all tokens with filtering and sorting
 */

'use client';

import { TokenList } from '@/components/features/tokens/TokenList';
import { Search } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Search className="mr-3 h-10 w-10 text-primary" />
          Explore Tokens
        </h1>
        <p className="text-lg text-muted-foreground">
          Discover and trade meme tokens on AstroShibaPop
        </p>
      </div>

      <TokenList />
    </div>
  );
}
