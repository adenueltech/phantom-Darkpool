import { useState } from 'react';
import { apiClient, ApiResponse } from '@/lib/api-client';

export function useApi<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = async <R>(
    apiCall: () => Promise<ApiResponse<R>>
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();

      if (response.success && response.data) {
        setData(response.data as any);
        return response.data;
      } else {
        setError(response.error || 'Request failed');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, data, execute };
}
