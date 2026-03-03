/**
 * Pedersen Commitment System
 * 
 * Creates binding and hiding commitments for balance notes.
 * Uses elliptic curve cryptography for commitment generation.
 * 
 * Requirements: 1.1, 1.3
 */

import { pedersenHash } from 'bigint-pedersen';

/**
 * Balance note structure for commitment generation
 */
export interface BalanceNoteData {
  asset: bigint;
  amount: bigint;
  salt: bigint;
  owner: bigint;
}

/**
 * Create Pedersen commitment for a balance note
 * commitment = PedersenCommit(asset || amount || salt || owner)
 * 
 * Properties:
 * - Binding: Cannot change values without changing commitment
 * - Hiding: Commitment reveals nothing about underlying values
 * - Unlinkable: Cannot link multiple notes to same owner without viewing key
 * 
 * @param data - Balance note data
 * @returns Commitment as bigint
 */
export function createBalanceCommitment(data: BalanceNoteData): bigint {
  const message = [data.asset, data.amount, data.salt, data.owner];
  return pedersenHash(message);
}

/**
 * Verify that a commitment matches the provided balance note data
 * 
 * @param commitment - The commitment to verify
 * @param data - Balance note data to check against
 * @returns True if commitment matches data
 */
export function verifyBalanceCommitment(
  commitment: bigint,
  data: BalanceNoteData
): boolean {
  const computedCommitment = createBalanceCommitment(data);
  return commitment === computedCommitment;
}

/**
 * Generate a random salt for balance note blinding
 * Uses cryptographically secure random number generation
 * 
 * @returns Random salt as bigint
 */
export function generateRandomSalt(): bigint {
  // Generate 32 random bytes
  const randomBytes = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    // Browser environment
    window.crypto.getRandomValues(randomBytes);
  } else {
    // Node.js environment
    const crypto = require('crypto');
    crypto.randomFillSync(randomBytes);
  }
  
  // Convert bytes to bigint
  let salt = 0n;
  for (let i = 0; i < randomBytes.length; i++) {
    salt = (salt << 8n) | BigInt(randomBytes[i]);
  }
  
  return salt;
}

/**
 * Create a complete balance note with commitment
 * 
 * @param asset - Asset address as bigint
 * @param amount - Balance amount
 * @param owner - Owner's public key as bigint
 * @param salt - Optional salt (generated if not provided)
 * @returns Balance note data with commitment
 */
export function createBalanceNote(
  asset: bigint,
  amount: bigint,
  owner: bigint,
  salt?: bigint
): BalanceNoteData & { commitment: bigint } {
  const noteSalt = salt ?? generateRandomSalt();
  const data: BalanceNoteData = {
    asset,
    amount,
    salt: noteSalt,
    owner,
  };
  
  const commitment = createBalanceCommitment(data);
  
  return {
    ...data,
    commitment,
  };
}

/**
 * Convert address string to bigint for commitment generation
 */
export function addressToBigInt(address: string): bigint {
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  return BigInt('0x' + cleanAddress);
}

/**
 * Convert bigint to hex address string
 */
export function bigIntToAddress(value: bigint): string {
  return '0x' + value.toString(16).padStart(64, '0');
}
