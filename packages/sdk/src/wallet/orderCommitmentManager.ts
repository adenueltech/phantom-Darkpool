/**
 * Order Commitment Management
 * 
 * Generates and manages order commitments for private trading.
 * Handles order creation, commitment hash calculation, and submission.
 * 
 * Requirements: 14.2
 */

import { generateOrderCommitmentHash } from '../crypto/poseidon';

/**
 * Order parameters
 */
export interface OrderParams {
  baseAsset: string;
  quoteAsset: string;
  amount: bigint;
  price: bigint;
  orderType: 'BUY' | 'SELL';
  expiration: number;
  owner: string;
}

/**
 * Order commitment structure
 */
export interface OrderCommitment {
  commitmentHash: string;
  orderParams: OrderParams;
  nonce: bigint;
  timestamp: number;
}

/**
 * Order Commitment Manager
 * Handles creation and management of order commitments
 */
export class OrderCommitmentManager {
  private nonceCounter: bigint = 0n;

  constructor() {
    // Initialize nonce with timestamp to ensure uniqueness
    this.nonceCounter = BigInt(Date.now());
  }

  /**
   * Generate order commitment
   * 
   * @param params - Order parameters
   * @returns Order commitment with hash
   */
  async generateOrderCommitment(params: OrderParams): Promise<OrderCommitment> {
    // Validate order parameters
    this.validateOrderParams(params);

    // Generate unique nonce
    const nonce = this.generateNonce();

    // Convert addresses to bigint
    const baseAssetBigInt = this.addressToBigInt(params.baseAsset);
    const quoteAssetBigInt = this.addressToBigInt(params.quoteAsset);
    const ownerBigInt = this.addressToBigInt(params.owner);

    // Convert order type to bigint (0 for BUY, 1 for SELL)
    const orderTypeBigInt = params.orderType === 'BUY' ? 0n : 1n;

    // Generate commitment hash
    const commitmentHash = await generateOrderCommitmentHash({
      baseAsset: baseAssetBigInt,
      quoteAsset: quoteAssetBigInt,
      amount: params.amount,
      price: params.price,
      orderType: orderTypeBigInt,
      expiration: BigInt(params.expiration),
      nonce,
      owner: ownerBigInt,
    });

    return {
      commitmentHash: '0x' + commitmentHash.toString(16).padStart(64, '0'),
      orderParams: params,
      nonce,
      timestamp: Date.now(),
    };
  }

  /**
   * Submit order to backend
   */
  async submitOrder(
    commitment: OrderCommitment,
    apiEndpoint: string = '/api/v1/orders'
  ): Promise<string> {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderCommitment: commitment.commitmentHash,
        expiration: commitment.orderParams.expiration,
        orderValidityProof: [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit order: ${response.statusText}`);
    }

    const result = await response.json();
    return result.orderId;
  }

  private generateNonce(): bigint {
    this.nonceCounter += 1n;
    return this.nonceCounter;
  }

  private validateOrderParams(params: OrderParams): void {
    if (params.baseAsset.toLowerCase() === params.quoteAsset.toLowerCase()) {
      throw new Error('Base asset and quote asset must be different');
    }
    if (params.amount <= 0n) {
      throw new Error('Order amount must be positive');
    }
    if (params.price <= 0n) {
      throw new Error('Order price must be positive');
    }
    if (params.expiration <= Date.now()) {
      throw new Error('Order expiration must be in the future');
    }
  }

  private addressToBigInt(address: string): bigint {
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    return BigInt('0x' + cleanAddress);
  }
}
