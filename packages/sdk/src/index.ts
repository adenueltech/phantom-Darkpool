/**
 * Phantom Darkpool SDK
 * Client-side SDK for wallet integration and proof generation
 */

import { BalanceNoteManager, BalanceNote } from './wallet/balanceNoteManager';
import { OrderCommitmentManager, OrderParams, OrderCommitment } from './wallet/orderCommitmentManager';
import { ProofGenerator } from './wallet/proofGenerator';
import { ViewingKeyManager } from './wallet/viewingKeyManager';
import { WithdrawalManager, WithdrawalParams, WithdrawalResult } from './wallet/withdrawalManager';
import { StateManager } from './wallet/stateManager';
import { DataScope, MerkleProof } from './types';

/**
 * Phantom Wallet SDK
 * Main interface for wallet integration
 */
export class PhantomWallet {
  private balanceNoteManager: BalanceNoteManager;
  private orderCommitmentManager: OrderCommitmentManager;
  private proofGenerator: ProofGenerator;
  private viewingKeyManager: ViewingKeyManager;
  private withdrawalManager: WithdrawalManager;
  private stateManager: StateManager;
  private masterKey: bigint;
  private initialized: boolean = false;

  constructor(masterKey: bigint, apiEndpoint: string = '/api/v1') {
    this.masterKey = masterKey;
    this.balanceNoteManager = new BalanceNoteManager(masterKey);
    this.orderCommitmentManager = new OrderCommitmentManager();
    this.proofGenerator = new ProofGenerator();
    this.viewingKeyManager = new ViewingKeyManager(masterKey);
    this.withdrawalManager = new WithdrawalManager(masterKey, `${apiEndpoint}/withdraw`);
    this.stateManager = new StateManager(masterKey);
  }

  /**
   * Initialize wallet (must be called before use)
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.balanceNoteManager.initialize(),
      this.stateManager.initialize(),
    ]);
    this.initialized = true;
  }

  /**
   * Create a new private balance note
   * 
   * @param asset - Asset address
   * @param amount - Balance amount
   * @param owner - Owner's address
   * @returns Created balance note
   */
  async createPrivateBalance(
    asset: string,
    amount: bigint,
    owner: string
  ): Promise<BalanceNote> {
    this.ensureInitialized();
    const note = await this.balanceNoteManager.createPrivateBalance(asset, amount, owner);
    await this.stateManager.storeBalanceNote(note);
    return note;
  }

  /**
   * Get balance for a specific asset
   * 
   * @param asset - Asset address
   * @returns Total unspent balance
   */
  async getBalance(asset: string): Promise<bigint> {
    this.ensureInitialized();
    return await this.balanceNoteManager.getBalance(asset);
  }

  /**
   * Generate order commitment
   * 
   * @param params - Order parameters
   * @returns Order commitment
   */
  async generateOrderCommitment(params: OrderParams): Promise<OrderCommitment> {
    this.ensureInitialized();
    return await this.orderCommitmentManager.generateOrderCommitment(params);
  }

  /**
   * Submit order to backend
   * 
   * @param commitment - Order commitment
   * @param apiEndpoint - Backend API endpoint
   * @returns Order ID
   */
  async submitOrder(
    commitment: OrderCommitment,
    apiEndpoint: string = '/api/v1/orders'
  ): Promise<string> {
    this.ensureInitialized();
    const orderId = await this.orderCommitmentManager.submitOrder(commitment, apiEndpoint);
    await this.stateManager.storeOrder(commitment, 'pending');
    return orderId;
  }

  /**
   * Generate balance proof
   * 
   * @param note - Balance note
   * @param merkleProof - Merkle proof
   * @param minAmount - Minimum amount to prove
   * @returns Balance proof
   */
  async generateBalanceProof(
    note: BalanceNote,
    merkleProof: MerkleProof,
    minAmount: bigint
  ): Promise<any> {
    this.ensureInitialized();
    // Implementation delegated to ProofGenerator
    return await this.proofGenerator.generateBalanceProof({
      merkleRoot: merkleProof.root,
      nullifier: note.nullifier,
      minAmount: minAmount.toString(),
      asset: note.asset,
      amount: note.amount.toString(),
      salt: note.salt.toString(),
      owner: note.owner,
      nullifierSecret: '0', // Derived internally
      merkleProof: merkleProof.siblings,
      pathIndices: merkleProof.pathIndices,
    });
  }

  /**
   * Withdraw assets from Shielded Vault
   * 
   * @param params - Withdrawal parameters
   * @returns Withdrawal result
   */
  async withdraw(params: WithdrawalParams): Promise<WithdrawalResult> {
    this.ensureInitialized();
    const result = await this.withdrawalManager.withdraw(params);
    
    // Mark note as spent
    await this.balanceNoteManager.markNoteSpent(params.balanceNote.commitment);
    
    return result;
  }

  /**
   * Create viewing key for selective disclosure
   * 
   * @param owner - Owner's address
   * @param dataScope - Scope of data access
   * @param expirationMs - Expiration time in milliseconds
   * @returns Viewing key
   */
  async createViewingKey(
    owner: string,
    dataScope: DataScope,
    expirationMs: number = 86400000
  ): Promise<any> {
    this.ensureInitialized();
    return await this.viewingKeyManager.createViewingKey(owner, dataScope, expirationMs);
  }

  /**
   * Revoke viewing key
   * 
   * @param keyId - Key ID to revoke
   */
  revokeViewingKey(keyId: string): void {
    this.ensureInitialized();
    this.viewingKeyManager.revokeViewingKey(keyId);
  }

  /**
   * Synchronize state with on-chain data
   * 
   * @param apiEndpoint - Backend API endpoint
   * @param fromBlock - Starting block number
   */
  async syncWithChain(apiEndpoint?: string, fromBlock?: number): Promise<void> {
    this.ensureInitialized();
    await this.stateManager.syncWithChain(apiEndpoint, fromBlock);
  }

  /**
   * Export wallet state for backup
   * 
   * @returns Encrypted state as JSON string
   */
  async exportState(): Promise<string> {
    this.ensureInitialized();
    return await this.stateManager.exportState();
  }

  /**
   * Import wallet state from backup
   * 
   * @param data - Encrypted state JSON string
   */
  async importState(data: string): Promise<void> {
    this.ensureInitialized();
    await this.stateManager.importState(data);
  }

  /**
   * Get unspent notes for an asset
   * 
   * @param asset - Asset address
   * @returns Array of unspent balance notes
   */
  async getUnspentNotes(asset: string): Promise<BalanceNote[]> {
    this.ensureInitialized();
    return await this.balanceNoteManager.getUnspentNotes(asset);
  }

  /**
   * Get orders by status
   * 
   * @param status - Order status filter
   * @returns Array of order commitments
   */
  async getOrdersByStatus(
    status: 'pending' | 'active' | 'filled' | 'cancelled' | 'expired'
  ): Promise<OrderCommitment[]> {
    this.ensureInitialized();
    return await this.stateManager.getOrdersByStatus(status);
  }

  /**
   * Clear all wallet data
   */
  async clearAll(): Promise<void> {
    this.ensureInitialized();
    await Promise.all([
      this.balanceNoteManager.clearAll(),
      this.stateManager.clearAll(),
      this.viewingKeyManager.clearAll(),
    ]);
  }

  /**
   * Ensure wallet is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Wallet not initialized. Call initialize() first.');
    }
  }
}

// Export types and interfaces
export * from './types';
export * from './crypto';
export * from './wallet/balanceNoteManager';
export * from './wallet/orderCommitmentManager';
export * from './wallet/proofGenerator';
export * from './wallet/viewingKeyManager';
export * from './wallet/withdrawalManager';
export * from './wallet/stateManager';

export { BalanceNote, OrderParams, OrderCommitment, WithdrawalParams, WithdrawalResult, DataScope, MerkleProof };
