/**
 * Nullifier Generation System
 * 
 * Prevents double-spending of balance notes through unique nullifiers.
 * Each balance note has a unique nullifier derived from its commitment and a secret.
 * 
 * Requirements: 1.4, 1.5, 9.1
 */

import { poseidonHash2 } from './poseidon';
import { poseidonHashMany } from './poseidon';

/**
 * Nullifier tracking entry
 */
export interface NullifierEntry {
  nullifier: bigint;
  commitment: bigint;
  spentAt?: number; // Timestamp when spent
  transactionHash?: string;
}

/**
 * Generate nullifier from commitment and nullifier secret
 * nullifier = Poseidon(commitment, nullifierSecret)
 * 
 * Properties:
 * - Uniqueness: Each balance note has unique nullifier
 * - Unlinkability: Cannot link nullifier to commitment without secret
 * - Deterministic: Same inputs always produce same nullifier
 * 
 * @param commitment - Balance note commitment
 * @param nullifierSecret - Secret key for nullifier generation
 * @returns Nullifier as bigint
 */
export async function generateNullifier(
  commitment: bigint,
  nullifierSecret: bigint
): Promise<bigint> {
  return poseidonHash2(commitment, nullifierSecret);
}

/**
 * Derive nullifier secret from master key and index
 * Allows deterministic key derivation for multiple balance notes
 * 
 * nullifierSecret = Poseidon(masterKey, index, "nullifier")
 * 
 * @param masterKey - User's master secret key
 * @param index - Derivation index (e.g., note index)
 * @returns Nullifier secret for the given index
 */
export async function deriveNullifierSecret(
  masterKey: bigint,
  index: bigint
): Promise<bigint> {
  // Use a domain separator to prevent key reuse across different contexts
  const domainSeparator = BigInt('0x' + Buffer.from('nullifier').toString('hex'));
  return poseidonHashMany([masterKey, index, domainSeparator]);
}

/**
 * Generate master key from seed phrase or private key
 * This is a simplified version - production should use proper key derivation (BIP32/BIP44)
 * 
 * @param seed - Seed bytes or private key
 * @returns Master key as bigint
 */
export function generateMasterKey(seed: Uint8Array): bigint {
  if (seed.length !== 32) {
    throw new Error('Seed must be 32 bytes');
  }
  
  let masterKey = 0n;
  for (let i = 0; i < seed.length; i++) {
    masterKey = (masterKey << 8n) | BigInt(seed[i]);
  }
  
  return masterKey;
}

/**
 * Nullifier tracker for client-side management
 * Tracks spent and unspent nullifiers
 */
export class NullifierTracker {
  private spentNullifiers: Map<string, NullifierEntry>;
  private pendingNullifiers: Map<string, NullifierEntry>;
  
  constructor() {
    this.spentNullifiers = new Map();
    this.pendingNullifiers = new Map();
  }
  
  /**
   * Mark a nullifier as spent
   */
  markSpent(entry: NullifierEntry): void {
    const key = entry.nullifier.toString();
    this.spentNullifiers.set(key, {
      ...entry,
      spentAt: entry.spentAt ?? Date.now(),
    });
    this.pendingNullifiers.delete(key);
  }
  
  /**
   * Mark a nullifier as pending (transaction submitted but not confirmed)
   */
  markPending(entry: NullifierEntry): void {
    const key = entry.nullifier.toString();
    this.pendingNullifiers.set(key, entry);
  }
  
  /**
   * Check if a nullifier has been spent
   */
  isSpent(nullifier: bigint): boolean {
    return this.spentNullifiers.has(nullifier.toString());
  }
  
  /**
   * Check if a nullifier is pending
   */
  isPending(nullifier: bigint): boolean {
    return this.pendingNullifiers.has(nullifier.toString());
  }
  
  /**
   * Get nullifier entry
   */
  getEntry(nullifier: bigint): NullifierEntry | undefined {
    const key = nullifier.toString();
    return this.spentNullifiers.get(key) ?? this.pendingNullifiers.get(key);
  }
  
  /**
   * Get all spent nullifiers
   */
  getSpentNullifiers(): NullifierEntry[] {
    return Array.from(this.spentNullifiers.values());
  }
  
  /**
   * Clear pending nullifier (e.g., transaction failed)
   */
  clearPending(nullifier: bigint): void {
    this.pendingNullifiers.delete(nullifier.toString());
  }
  
  /**
   * Export tracker state for persistence
   */
  export(): string {
    // Convert BigInt values to strings for JSON serialization
    const spent = Array.from(this.spentNullifiers.entries()).map(([key, entry]) => [
      key,
      {
        nullifier: entry.nullifier.toString(),
        commitment: entry.commitment.toString(),
        spentAt: entry.spentAt,
        transactionHash: entry.transactionHash,
      },
    ]);
    
    const pending = Array.from(this.pendingNullifiers.entries()).map(([key, entry]) => [
      key,
      {
        nullifier: entry.nullifier.toString(),
        commitment: entry.commitment.toString(),
        spentAt: entry.spentAt,
        transactionHash: entry.transactionHash,
      },
    ]);
    
    return JSON.stringify({ spent, pending });
  }
  
  /**
   * Import tracker state from persistence
   */
  import(data: string): void {
    const parsed = JSON.parse(data);
    
    // Convert string values back to BigInt
    this.spentNullifiers = new Map(
      parsed.spent.map(([key, entry]: [string, any]) => [
        key,
        {
          nullifier: BigInt(entry.nullifier),
          commitment: BigInt(entry.commitment),
          spentAt: entry.spentAt,
          transactionHash: entry.transactionHash,
        },
      ])
    );
    
    this.pendingNullifiers = new Map(
      parsed.pending.map(([key, entry]: [string, any]) => [
        key,
        {
          nullifier: BigInt(entry.nullifier),
          commitment: BigInt(entry.commitment),
          spentAt: entry.spentAt,
          transactionHash: entry.transactionHash,
        },
      ])
    );
  }
}

/**
 * Verify nullifier matches commitment and secret
 * Used for testing and validation
 * 
 * @param nullifier - Nullifier to verify
 * @param commitment - Balance note commitment
 * @param nullifierSecret - Nullifier secret
 * @returns True if nullifier is valid
 */
export async function verifyNullifier(
  nullifier: bigint,
  commitment: bigint,
  nullifierSecret: bigint
): Promise<boolean> {
  const computedNullifier = await generateNullifier(commitment, nullifierSecret);
  return nullifier === computedNullifier;
}

/**
 * Convert nullifier to hex string for storage/display
 */
export function nullifierToHex(nullifier: bigint): string {
  return '0x' + nullifier.toString(16).padStart(64, '0');
}

/**
 * Convert hex string to nullifier bigint
 */
export function hexToNullifier(hex: string): bigint {
  return BigInt(hex);
}
