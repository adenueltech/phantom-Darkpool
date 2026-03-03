/**
 * Poseidon Hash Function Wrapper
 * 
 * ZK-friendly hash function for nullifiers, Merkle nodes, and commitments.
 * Uses circomlibjs implementation optimized for BN254 scalar field.
 * 
 * Requirements: 1.4, 8.1
 */

import { buildPoseidon } from 'circomlibjs';

let poseidonInstance: any = null;

/**
 * Initialize Poseidon hash function
 * Must be called before using any hash functions
 */
export async function initPoseidon(): Promise<void> {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
}

/**
 * Ensure Poseidon is initialized
 */
async function ensurePoseidon(): Promise<any> {
  if (!poseidonInstance) {
    await initPoseidon();
  }
  return poseidonInstance;
}

/**
 * Hash a single value using Poseidon
 */
export async function poseidonHash(input: bigint): Promise<bigint> {
  const poseidon = await ensurePoseidon();
  const hash = poseidon([input]);
  return poseidon.F.toObject(hash);
}

/**
 * Hash two values using Poseidon (for Merkle tree nodes)
 */
export async function poseidonHash2(left: bigint, right: bigint): Promise<bigint> {
  const poseidon = await ensurePoseidon();
  const hash = poseidon([left, right]);
  return poseidon.F.toObject(hash);
}

/**
 * Hash multiple values using Poseidon
 */
export async function poseidonHashMany(inputs: bigint[]): Promise<bigint> {
  const poseidon = await ensurePoseidon();
  const hash = poseidon(inputs);
  return poseidon.F.toObject(hash);
}

/**
 * Generate nullifier from commitment and nullifier secret
 * nullifier = Poseidon(commitment, nullifierSecret)
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
 * Hash Merkle tree node (parent of two children)
 * 
 * @param left - Left child hash
 * @param right - Right child hash
 * @returns Parent node hash
 */
export async function hashMerkleNode(left: bigint, right: bigint): Promise<bigint> {
  return poseidonHash2(left, right);
}

/**
 * Generate order commitment hash from order parameters
 * commitmentHash = Poseidon(baseAsset, quoteAsset, amount, price, orderType, expiration, nonce, owner)
 * 
 * @param params - Order parameters
 * @returns Order commitment hash
 */
export async function generateOrderCommitmentHash(params: {
  baseAsset: bigint;
  quoteAsset: bigint;
  amount: bigint;
  price: bigint;
  orderType: bigint; // 0 for BUY, 1 for SELL
  expiration: bigint;
  nonce: bigint;
  owner: bigint;
}): Promise<bigint> {
  const inputs = [
    params.baseAsset,
    params.quoteAsset,
    params.amount,
    params.price,
    params.orderType,
    params.expiration,
    params.nonce,
    params.owner,
  ];
  return poseidonHashMany(inputs);
}

/**
 * Convert hex string to bigint
 */
export function hexToBigInt(hex: string): bigint {
  return BigInt(hex);
}

/**
 * Convert bigint to hex string
 */
export function bigIntToHex(value: bigint): string {
  return '0x' + value.toString(16).padStart(64, '0');
}
