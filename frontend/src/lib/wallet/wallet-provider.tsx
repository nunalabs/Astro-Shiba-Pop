'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Check if already connected
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const connected = await isConnected();
      if (connected) {
        const publicKey = await getPublicKey();
        setAddress(publicKey);
        setConnected(true);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  }

  async function connect() {
    try {
      const publicKey = await getPublicKey();
      setAddress(publicKey);
      setConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  function disconnect() {
    setAddress(null);
    setConnected(false);
  }

  async function sign(xdr: string): Promise<string> {
    try {
      const signedXdr = await signTransaction(xdr, {
        network: process.env.NEXT_PUBLIC_NETWORK || 'TESTNET',
        networkPassphrase:
          process.env.NEXT_PUBLIC_NETWORK === 'PUBLIC'
            ? 'Public Global Stellar Network ; September 2015'
            : 'Test SDF Network ; September 2015',
      });
      return signedXdr;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: connected,
        connect,
        disconnect,
        signTransaction: sign,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
