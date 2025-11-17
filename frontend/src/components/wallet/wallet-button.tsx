/**
 * Wallet Button Component
 *
 * Displays wallet connection button with address when connected.
 * Handles all wallet connection states and errors.
 */

'use client';

import { useEffect } from 'react';
import { useWallet } from '@/stores/wallet';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { truncateAddress } from '@/lib/stellar/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, Copy, ExternalLink, LogOut } from 'lucide-react';
import { getBlockExplorer } from '@/lib/stellar/config';

export function WalletButton() {
  const {
    isConnected,
    address,
    connect,
    disconnect,
    checkConnection,
    isConnecting,
    error,
    clearError,
  } = useWallet();

  const { toast } = useToast();

  // Check connection on mount and auto-reconnect if needed
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast({
        title: 'Wallet Error',
        description: error,
        variant: 'destructive',
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const handleConnect = async () => {
    try {
      await connect('freighter');

      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to Freighter wallet',
      });
    } catch (error) {
      // Error already handled by store and shown in toast via useEffect
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();

    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);

      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  const handleViewExplorer = () => {
    if (address) {
      const explorer = getBlockExplorer();
      window.open(explorer.account(address), '_blank');
    }
  };

  // Not connected - show connect button
  if (!isConnected || !address) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  // Connected - show address with dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">{truncateAddress(address)}</span>
          <span className="sm:hidden">{truncateAddress(address, 3)}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleViewExplorer}>
          <ExternalLink className="mr-2 h-4 w-4" />
          <span>View in Explorer</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
