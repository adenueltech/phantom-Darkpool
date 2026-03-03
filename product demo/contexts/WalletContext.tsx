'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { connect, disconnect as starknetDisconnect } from 'get-starknet';
import { AccountInterface } from 'starknet';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  walletType: string | null;
  account: AccountInterface | null;
  connect: (walletId: string) => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      // Try to reconnect to wallet
      reconnectWallet(type);
    } else {
      // Redirect to connect page if trying to access protected routes
      const protectedRoutes = ['/dashboard', '/trading', '/deposit', '/withdraw', '/transactions', '/audit', '/settings', '/order'];
      const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));
      
      if (isProtectedRoute) {
        router.push('/connect');
      }
    }
  }, [pathname, router]);

  const reconnectWallet = async (walletId: string | null) => {
    if (!walletId) return;
    
    try {
      const starknet = await connect({ modalMode: 'neverAsk' });
      if (starknet?.isConnected) {
        setAccount(starknet.account);
      }
    } catch (err) {
      console.error('Failed to reconnect wallet:', err);
    }
  };

  const connectWallet = async (walletId: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      // For Starknet wallets (Argent X, Braavos)
      if (walletId === 'argent' || walletId === 'braavos') {
        const starknet = await connect({ 
          modalMode: 'alwaysAsk',
          modalTheme: 'dark'
        });

        if (!starknet) {
          throw new Error('No wallet found. Please install Argent X or Braavos.');
        }

        await starknet.enable();

        if (starknet.isConnected && starknet.account) {
          const address = starknet.account.address;
          
          // Store connection state
          localStorage.setItem('wallet_connected', 'true');
          localStorage.setItem('wallet_type', walletId);
          localStorage.setItem('wallet_address', address);
          
          setIsConnected(true);
          setWalletAddress(address);
          setWalletType(walletId);
          setAccount(starknet.account);
          
          // Listen for account changes
          starknet.on('accountsChanged', (accounts) => {
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
              localStorage.setItem('wallet_address', accounts[0]);
            } else {
              disconnectWallet();
            }
          });

          // Listen for network changes
          starknet.on('networkChanged', () => {
            // Optionally handle network changes
            console.log('Network changed');
          });
        }
      } else {
        // For other wallets, use mock connection for now
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('wallet_type', walletId);
        localStorage.setItem('wallet_address', mockAddress);
        
        setIsConnected(true);
        setWalletAddress(mockAddress);
        setWalletType(walletId);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (account) {
        await starknetDisconnect();
      }
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
    }

    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_type');
    setIsConnected(false);
    setWalletAddress(null);
    setWalletType(null);
    setAccount(null);
    router.push('/');
  };

  return (
    <WalletContext.Provider value={{ 
      isConnected, 
      walletAddress, 
      walletType, 
      account,
      connect: connectWallet,
      disconnect: disconnectWallet,
      isConnecting,
      error
    }}>
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
