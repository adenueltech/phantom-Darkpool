/**
 * Balance Management Hook
 * Fetches and manages user's encrypted balance notes from IndexedDB
 */

import { useState, useEffect, useCallback } from 'react';
import { PhantomWallet, BalanceNote } from '@phantom-darkpool/sdk';
import { useWallet } from '@/contexts/WalletContext';

export interface AssetBalance {
  asset: string;
  assetSymbol: string;
  amount: bigint;
  usdValue: string;
  percentage: string;
  trend: 'up' | 'down' | 'flat';
  notes: BalanceNote[];
}

export interface BalanceState {
  balances: AssetBalance[];
  totalUsdValue: string;
  isLoading: boolean;
  error: string | null;
}

// Asset address to symbol mapping (mock for demo)
const ASSET_SYMBOLS: Record<string, string> = {
  '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7': 'ETH',
  '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8': 'USDC',
  '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3': 'DAI',
};

// Mock USD prices (in production, fetch from price oracle)
const MOCK_USD_PRICES: Record<string, number> = {
  ETH: 2380,
  USDC: 1,
  DAI: 1,
};

export function useBalance() {
  const { walletAddress, isConnected } = useWallet();
  const [state, setState] = useState<BalanceState>({
    balances: [],
    totalUsdValue: '$0',
    isLoading: false,
    error: null,
  });

  /**
   * Fetch balances from SDK
   */
  const fetchBalances = useCallback(async () => {
    if (!isConnected || !walletAddress) {
      setState({
        balances: [],
        totalUsdValue: '$0',
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Initialize SDK with master key derived from wallet address
      const masterKey = BigInt(walletAddress);
      const wallet = new PhantomWallet(masterKey);
      await wallet.initialize();

      // Get balances for all supported assets
      const assetAddresses = Object.keys(ASSET_SYMBOLS);
      const balancePromises = assetAddresses.map(async (asset) => {
        const amount = await wallet.getBalance(asset);
        const notes = await wallet.getUnspentNotes(asset);
        const symbol = ASSET_SYMBOLS[asset] || 'UNKNOWN';
        
        // Calculate USD value
        const amountInUnits = Number(amount) / 1e18; // Convert from wei
        const usdPrice = MOCK_USD_PRICES[symbol] || 0;
        const usdValue = amountInUnits * usdPrice;

        return {
          asset,
          assetSymbol: symbol,
          amount,
          usdValue: `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          percentage: '+0.0%', // TODO: Calculate 24h change
          trend: 'flat' as const,
          notes,
        };
      });

      const balances = await Promise.all(balancePromises);
      
      // Filter out zero balances
      const nonZeroBalances = balances.filter(b => b.amount > 0n);

      // Calculate total USD value
      const totalUsd = nonZeroBalances.reduce((sum, b) => {
        const value = parseFloat(b.usdValue.replace(/[$,]/g, ''));
        return sum + value;
      }, 0);

      setState({
        balances: nonZeroBalances,
        totalUsdValue: `$${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to fetch balances:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch balances',
      }));
    }
  }, [isConnected, walletAddress]);

  /**
   * Refresh balances
   */
  const refresh = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Fetch balances on mount and when wallet changes
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    ...state,
    refresh,
  };
}
