/**
 * Withdrawal Management
 * 
 * Manages withdrawal operations with proof generation.
 * Handles nullifier generation and submission to Shielded Vault.
 * 
 * Requirements: 14.4
 */

import { BalanceNote } from './balanceNoteManager';
import { generateNullifier, deriveNullifierSecret } from '../crypto/nullifier';
import { ProofGenerator } from './proofGenerator';
import { MerkleProof } from '../types';

/**
 * Withdrawal parameters
 */
export interface WithdrawalParams {
  asset: string;
  amount: bigint;
  recipient: string;
  balanceNote: BalanceNote;
  merkleProof: MerkleProof;
}

/**
 * Withdrawal result
 */
export interface WithdrawalResult {
  transactionHash: string;
  nullifier: string;
  status: 'pending' | 'confirmed' | 'failed';
}

/**
 * Withdrawal Manager
 * Handles withdrawal operations with proof generation
 */
export class WithdrawalManager {
  private masterKey: bigint;
  private proofGenerator: ProofGenerator;
  private apiEndpoint: string;

  constructor(
    masterKey: bigint,
    apiEndpoint: string = '/api/v1/withdraw'
  ) {
    this.masterKey = masterKey;
    this.proofGenerator = new ProofGenerator();
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Withdraw assets from Shielded Vault
   * 
   * @param params - Withdrawal parameters
   * @returns Withdrawal result with transaction hash
   */
  async withdraw(params: WithdrawalParams): Promise<WithdrawalResult> {
    // Validate withdrawal amount
    if (params.amount <= 0n) {
      throw new Error('Withdrawal amount must be positive');
    }

    if (params.amount > params.balanceNote.amount) {
      throw new Error('Insufficient balance in note');
    }

    // Check if note is already spent
    if (params.balanceNote.spent) {
      throw new Error('Balance note already spent');
    }

    // Generate nullifier for withdrawal
    const nullifier = await this.generateWithdrawalNullifier(params.balanceNote);

    // Generate balance proof
    const balanceProof = await this.generateBalanceProof(
      params.balanceNote,
      params.merkleProof,
      params.amount
    );

    // Submit withdrawal transaction
    const result = await this.submitWithdrawal({
      nullifier,
      recipient: params.recipient,
      amount: params.amount,
      asset: params.asset,
      balanceProof,
      merkleProof: params.merkleProof,
    });

    return result;
  }

  /**
   * Generate nullifier for withdrawal
   * 
   * @param balanceNote - Balance note being spent
   * @returns Nullifier as hex string
   */
  private async generateWithdrawalNullifier(
    balanceNote: BalanceNote
  ): Promise<string> {
    // Use the balance note's existing nullifier
    // (already generated during note creation)
    if (balanceNote.nullifier) {
      return balanceNote.nullifier;
    }

    // If nullifier doesn't exist, generate it
    const commitmentBigInt = BigInt(balanceNote.commitment);
    const noteIndex = BigInt(balanceNote.index || Date.now());
    const nullifierSecret = await deriveNullifierSecret(this.masterKey, noteIndex);
    const nullifier = await generateNullifier(commitmentBigInt, nullifierSecret);

    return '0x' + nullifier.toString(16).padStart(64, '0');
  }

  /**
   * Generate balance proof for withdrawal
   * 
   * @param balanceNote - Balance note being spent
   * @param merkleProof - Merkle proof of note membership
   * @param minAmount - Minimum amount to prove (withdrawal amount)
   * @returns Balance proof
   */
  private async generateBalanceProof(
    balanceNote: BalanceNote,
    merkleProof: MerkleProof,
    minAmount: bigint
  ): Promise<any> {
    // Derive nullifier secret
    const noteIndex = BigInt(balanceNote.index || Date.now());
    const nullifierSecret = await deriveNullifierSecret(this.masterKey, noteIndex);

    // Prepare proof inputs
    const inputs = {
      // Public inputs
      merkleRoot: merkleProof.root,
      nullifier: balanceNote.nullifier,
      minAmount: minAmount.toString(),

      // Private inputs
      asset: balanceNote.asset,
      amount: balanceNote.amount.toString(),
      salt: balanceNote.salt.toString(),
      owner: balanceNote.owner,
      nullifierSecret: nullifierSecret.toString(),
      merkleProof: merkleProof.siblings,
      pathIndices: merkleProof.pathIndices,
    };

    // Generate proof using ProofGenerator
    return await this.proofGenerator.generateBalanceProof(inputs);
  }

  /**
   * Submit withdrawal transaction to backend
   * 
   * @param withdrawalData - Withdrawal data with proofs
   * @returns Withdrawal result
   */
  private async submitWithdrawal(withdrawalData: {
    nullifier: string;
    recipient: string;
    amount: bigint;
    asset: string;
    balanceProof: any;
    merkleProof: MerkleProof;
  }): Promise<WithdrawalResult> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nullifier: withdrawalData.nullifier,
        recipient: withdrawalData.recipient,
        amount: withdrawalData.amount.toString(),
        asset: withdrawalData.asset,
        balanceProof: withdrawalData.balanceProof,
        merkleProof: {
          siblings: withdrawalData.merkleProof.siblings,
          pathIndices: withdrawalData.merkleProof.pathIndices,
          root: withdrawalData.merkleProof.root,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Withdrawal failed: ${error.message || response.statusText}`);
    }

    const result = await response.json();

    return {
      transactionHash: result.transactionHash,
      nullifier: withdrawalData.nullifier,
      status: result.status || 'pending',
    };
  }

  /**
   * Check withdrawal status
   * 
   * @param transactionHash - Transaction hash to check
   * @returns Withdrawal status
   */
  async getWithdrawalStatus(transactionHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    confirmations?: number;
    error?: string;
  }> {
    const response = await fetch(`${this.apiEndpoint}/${transactionHash}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get withdrawal status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Estimate withdrawal gas cost
   * 
   * @param params - Withdrawal parameters
   * @returns Estimated gas cost
   */
  async estimateWithdrawalCost(params: WithdrawalParams): Promise<bigint> {
    const response = await fetch(`${this.apiEndpoint}/estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: params.asset,
        amount: params.amount.toString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to estimate withdrawal cost: ${response.statusText}`);
    }

    const result = await response.json();
    return BigInt(result.estimatedGas);
  }
}
