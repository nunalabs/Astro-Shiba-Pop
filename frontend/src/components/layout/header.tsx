'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/lib/wallet/wallet-provider';
import { formatAddress } from '@/lib/utils';
import { Rocket, Wallet } from 'lucide-react';

export function Header() {
  const { address, isConnected, connect, disconnect } = useWallet();

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
        <div className="flex items-center space-x-4">
          {isConnected && address ? (
            <Button variant="outline" onClick={disconnect}>
              <Wallet className="mr-2 h-4 w-4" />
              {formatAddress(address)}
            </Button>
          ) : (
            <Button onClick={connect}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
