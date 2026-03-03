/**
 * Viewing Keys Hook
 * Manages viewing key creation, revocation, and fetching
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';

export type DataScope = 'BALANCE_NOTE' | 'ORDER_COMMITMENT' | 'TRADE_HISTORY' | 'ALL';

export interface ViewingKey {
  keyId: string;
  dataScope: DataScope;
  expiration: number;
  revoked: boolean;
  createdAt: number;
  isValid: boolean;
  accessCount: number;
  decryptionKey?: string;
}

export interface AuditLogEntry {
  timestamp: number;
  accessor: string;
  action: string;
  dataAccessed: string;
  formattedTime: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export function useViewingKeys() {
  const { address } = useWallet();
  const [viewingKeys, setViewingKeys] = useState<ViewingKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch viewing keys for the current user
  const fetchViewingKeys = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/audit/viewing-keys?owner=${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch viewing keys');
      }

      const data = await response.json();
      setViewingKeys(data.keys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching viewing keys:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Create a new viewing key
  const createViewingKey = async (
    dataScope: DataScope,
    expirationDays: number = 30,
    auditor?: string,
    purpose?: string
  ): Promise<ViewingKey | null> => {
    if (!address) {
      setError('No wallet connected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate viewing key using SDK (mock for now)
      const keyId = '0x' + Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      const decryptionKey = '0x' + Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const expiration = Date.now() + (expirationDays * 24 * 60 * 60 * 1000);

      // Register viewing key on backend
      const response = await fetch(`${API_BASE}/audit/viewing-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyId,
          owner: address,
          dataScope,
          expiration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register viewing key');
      }

      const newKey: ViewingKey = {
        keyId,
        dataScope,
        expiration,
        revoked: false,
        createdAt: Date.now(),
        isValid: true,
        accessCount: 0,
        decryptionKey,
      };

      // Refresh the list
      await fetchViewingKeys();

      return newKey;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating viewing key:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Revoke a viewing key
  const revokeViewingKey = async (keyId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/audit/viewing-keys/${keyId}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke viewing key');
      }

      // Refresh the list
      await fetchViewingKeys();

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error revoking viewing key:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get audit logs for a viewing key
  const getAuditLogs = async (keyId: string): Promise<AuditLogEntry[]> => {
    try {
      const response = await fetch(`${API_BASE}/audit/logs/${keyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      return data.logs || [];
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      return [];
    }
  };

  // Fetch viewing keys on mount and when address changes
  useEffect(() => {
    if (address) {
      fetchViewingKeys();
    }
  }, [address, fetchViewingKeys]);

  return {
    viewingKeys,
    loading,
    error,
    createViewingKey,
    revokeViewingKey,
    getAuditLogs,
    refreshViewingKeys: fetchViewingKeys,
  };
}
