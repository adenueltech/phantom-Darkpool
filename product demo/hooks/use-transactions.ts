/**
 * Transaction History Hook
 * Fetches transaction history from on-chain events
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';

export interface Transaction {
  type: 'deposit' | 'withdrawal' | 'trade';
  asset: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  txHash?: string;
  blockNumber?: number;
}

export interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export function useTransactions() {
  const { walletAddress, isConnected } = useWallet();
  const [state, setState] = useState<TransactionState>({
    transactions: [],
    isLoading: false,
    error: null,
  });

  /**
   * Fetch transaction history from backend
   */
  const fetchTransactions = useCallback(async () => {
    if (!isConnected || !walletAddress) {
      setState({
        transactions: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch from backend API
      const response = await fetch(
        `${API_BASE_URL}/transactions?address=${walletAddress}&limit=20`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState({
        transactions: data.transactions || [],
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      
      // Fallback to mock data on error
      const mockTransactions: Transaction[] = [
        {
          type: 'deposit',
          asset: 'ETH',
          amount: '2.5',
          status: 'confirmed',
          timestamp: Date.now() - 2 * 60 * 60 * 1000,
          txHash: '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0'),
          blockNumber: 123456,
        },
        {
          type: 'trade',
          asset: 'ETH/USDC',
          amount: '1.0',
          status: 'confirmed',
          timestamp: Date.now() - 4 * 60 * 60 * 1000,
          txHash: '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0'),
          blockNumber: 123450,
        },
        {
          type: 'trade',
          asset: 'USDC/DAI',
          amount: '10,000',
          status: 'confirmed',
          timestamp: Date.now() - 24 * 60 * 60 * 1000,
          txHash: '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0'),
          blockNumber: 123400,
        },
      ];
      
      setState({
        transactions: mockTransactions,
        isLoading: false,
        error: error.message || 'Failed to fetch transactions',
      });
    }
  }, [isConnected, walletAddress]);

  /**
   * Refresh transaction history
   */
  const refresh = useCallback(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  /**
   * Format timestamp to relative time
   */
  const formatTimestamp = useCallback((timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }, []);

  // Fetch transactions on mount and when wallet changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    ...state,
    refresh,
    formatTimestamp,
  };
}
