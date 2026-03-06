/**
 * Cryptographic Primitives Module
 * 
 * Exports all cryptographic functions for Phantom Darkpool SDK
 */

export * from './poseidon';
export * from './pedersen';
// Export nullifier functions except generateNullifier (already exported from poseidon)
export {
  deriveNullifierSecret,
  generateMasterKey,
  NullifierTracker,
  verifyNullifier,
  nullifierToHex,
  hexToNullifier,
  type NullifierEntry
} from './nullifier';
export * from './merkle-tree';
