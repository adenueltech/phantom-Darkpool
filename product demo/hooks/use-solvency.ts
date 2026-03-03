/**
 * Solvency Proofs Hook
 * Fetches and displays system solvency proofs
 */

import { useState, useEffect, useCallback } from 'react';

export interface SolvencyProof {
  id: string;
  timestamp: number;
  totalDeposits: string;
  totalCommitments: string;
  verified: boolean;
  participants: number;
  blockNumber: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export function useSolvency() {
  const [solvencyProofs, setSolvencyProofs] = useState<SolvencyProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch solvency proofs
  const fetchSolvencyProofs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/audit/solvency`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch solvency proofs');
      }

      const data = await response.json();
      setSolvencyProofs(data.proofs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching solvency proofs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Format token amount for display
  const formatAmount = (amount: string): string => {
    try {
      const value = BigInt(amount);
      const divisor = BigInt(10 ** 18); // Assuming 18 decimals
      const formatted = Number(value / divisor).toLocaleString();
      return `$${formatted}`;
    } catch {
      return amount;
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  // Fetch solvency proofs on mount
  useEffect(() => {
    fetchSolvencyProofs();
  }, [fetchSolvencyProofs]);

  return {
    solvencyProofs,
    loading,
    error,
    formatAmount,
    formatTimestamp,
    refreshSolvencyProofs: fetchSolvencyProofs,
  };
}
