/**
 * API Client for Phantom Darkpool Backend
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OrderSubmission {
  orderCommitment: string;
  expiration: number;
  orderValidityProof: string;
}

export interface OrderStatus {
  orderId: string;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  timestamp: number;
  expiration: number;
  executionId?: string;
}

export interface WithdrawalRequest {
  nullifier: string;
  recipient: string;
  amount: string;
  balanceProof: string;
  merkleProof: string[];
}

export interface BalanceProofRequest {
  asset: string;
  minAmount: string;
}

export interface BalanceProofResponse {
  proof: string;
  merkleRoot: string;
  nullifier: string;
}

export interface CommitmentTreeInfo {
  root: string;
  depth: number;
  leafCount: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // Order submission
  async submitOrder(order: OrderSubmission): Promise<ApiResponse<{ orderId: string }>> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  // Get order status
  async getOrderStatus(orderId: string): Promise<ApiResponse<OrderStatus>> {
    return this.request(`/orders/${orderId}/status`, {
      method: 'GET',
    });
  }

  // Submit withdrawal
  async submitWithdrawal(withdrawal: WithdrawalRequest): Promise<ApiResponse<{ txHash: string }>> {
    return this.request('/withdraw', {
      method: 'POST',
      body: JSON.stringify(withdrawal),
    });
  }

  // Generate balance proof
  async generateBalanceProof(request: BalanceProofRequest): Promise<ApiResponse<BalanceProofResponse>> {
    return this.request('/balance-proof', {
      method: 'GET',
      body: JSON.stringify(request),
    });
  }

  // Get commitment tree info
  async getCommitmentTree(): Promise<ApiResponse<CommitmentTreeInfo>> {
    return this.request('/commitment-tree', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
