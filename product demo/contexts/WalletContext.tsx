'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  walletType: string | null;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if wallet is connected on mount
    const connected = localStorage.getItem('wallet_connected') === 'true';
    const address = localStorage.getItem('wallet_address');
    const type = localStorage.getItem('wallet_type');

    if (connected && address) {
      setIsConnected(true);
      setWalletAddress(address);
      setWalletType(type);
    } else {
      // Redirect to connect page if trying to access protected routes
      const protectedRoutes = ['/dashboard', '/trading', '/deposit', '/withdraw', '/transactions', '/audit', '/settings', '/order'];
      const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));
      
      if (isProtectedRoute) {
        router.push('/connect');
      }
    }
  }, [pathname, router]);

  const disconnect = () => {
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_type');
    setIsConnected(false);
    setWalletAddress(null);
    setWalletType(null);
    router.push('/');
  };

  return (
    <WalletContext.Provider value={{ isConnected, walletAddress, walletType, disconnect }}>
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
