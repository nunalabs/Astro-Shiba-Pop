'use client';

import Link from 'next/link';
import { Rocket } from 'lucide-react';
import { WalletButton } from '@/components/wallet/wallet-button';

export function Header() {

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-8">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">AstroShibaPop</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-6 flex-1">
          <Link
            href="/create"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Create Token
          </Link>
          <Link
            href="/swap"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Swap
          </Link>
          <Link
            href="/pools"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Pools
          </Link>
          <Link
            href="/tokens"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Tokens
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Leaderboard
          </Link>
        </nav>

        {/* Wallet Connection */}
        <WalletButton />
      </div>
    </header>
  );
}
