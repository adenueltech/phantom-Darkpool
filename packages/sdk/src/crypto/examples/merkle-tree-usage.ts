/**
 * Merkle Tree Usage Examples
 * 
 * Demonstrates how to use CommitmentTree and MultiAssetTreeManager
 */

import { CommitmentTree, MultiAssetTreeManager, TREE_DEPTH } from '../merkle-tree';
import { createBalanceCommitment } from '../pedersen';

/**
 * Example 1: Basic single tree usage
 */
async function basicTreeExample() {
  // Create and initialize tree
  const tree = new CommitmentTree(TREE_DEPTH);
  await tree.initialize();

  // Insert commitments
  const commitment1 = BigInt('0x123456789abcdef');
  const commitment2 = BigInt('0xfedcba987654321');
  
  const index1 = tree.insert(commitment1);
  const index2 = tree.insert(commitment2);
  
  console.log('Inserted at indices:', index1, index2);
  console.log('Current root:', tree.getRoot().toString(16));
  
  // Generate and verify proof
  const proof = tree.generateProof(index1);
  const isValid = tree.verifyProof(proof);
  
  console.log('Proof valid:', isValid);
  
  return tree;
}

/**
 * Example 2: Multi-asset tree management
 */
async function multiAssetExample() {
  const manager = new MultiAssetTreeManager(TREE_DEPTH);
  
  // Asset addresses (Starknet testnet)
  const ETH = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
  const USDC = '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';
  
  // Insert commitments for different assets
  const ethCommitment = BigInt('0x111111');
  const usdcCommitment = BigInt('0x222222');
  
  const ethIndex = await manager.insertCommitment(ETH, ethCommitment);
  const usdcIndex = await manager.insertCommitment(USDC, usdcCommitment);
  
  console.log('ETH tree size:', await manager.getTreeSize(ETH));
  console.log('USDC tree size:', await manager.getTreeSize(USDC));
  
  // Get roots for each asset
  const ethRoot = await manager.getRoot(ETH);
  const usdcRoot = await manager.getRoot(USDC);
  
  console.log('ETH root:', ethRoot.toString(16));
  console.log('USDC root:', usdcRoot.toString(16));
  
  // Generate proof for specific asset
  const proof = await manager.generateProof(ETH, ethIndex);
  const isValid = await manager.verifyProof(ETH, proof);
  
  console.log('ETH proof valid:', isValid);
  
  return manager;
}

/**
 * Example 3: State persistence
 */
async function persistenceExample() {
  // Create tree with data
  const tree = new CommitmentTree(TREE_DEPTH);
  await tree.initialize();
  
  tree.insert(BigInt(100));
  tree.insert(BigInt(200));
  tree.insert(BigInt(300));
  
  // Export state
  const state = tree.exportState();
  console.log('Exported state:', {
    depth: state.depth,
    root: state.root.toString(16),
    size: state.size
  });
  
  // Save to storage (e.g., localStorage, IndexedDB)
  const serialized = JSON.stringify({
    depth: state.depth,
    root: state.root.toString(),
    leaves: state.leaves.map(l => l.toString()),
    size: state.size
  });
  
  // Later: restore from storage
  const parsed = JSON.parse(serialized);
  const restoredState = {
    depth: parsed.depth,
    root: BigInt(parsed.root),
    leaves: parsed.leaves.map((l: string) => BigInt(l)),
    size: parsed.size
  };
  
  const newTree = new CommitmentTree(TREE_DEPTH);
  await newTree.importState(restoredState);
  
  console.log('Restored tree root:', newTree.getRoot().toString(16));
  console.log('Roots match:', newTree.getRoot() === tree.getRoot());
  
  return newTree;
}

/**
 * Example 4: Integration with balance notes
 */
async function balanceNoteExample() {
  const manager = new MultiAssetTreeManager(TREE_DEPTH);
  
  const ETH = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
  
  // Create balance note commitment
  const balanceNote = {
    asset: BigInt(ETH),
    amount: BigInt('1000000000000000000'), // 1 ETH
    salt: BigInt('0x' + '1'.repeat(64)),
    owner: BigInt('0x' + '2'.repeat(64))
  };
  
  const commitment = createBalanceCommitment(balanceNote);
  
  // Insert into tree
  const index = await manager.insertCommitment(ETH, commitment);
  
  console.log('Balance note inserted at index:', index);
  console.log('Commitment:', commitment.toString(16));
  
  // Generate proof for withdrawal
  const proof = await manager.generateProof(ETH, index);
  
  console.log('Merkle proof generated for withdrawal');
  console.log('Proof siblings count:', proof.siblings.length);
  console.log('Current root:', proof.root.toString(16));
  
  return { manager, proof };
}

/**
 * Example 5: Batch operations
 */
async function batchOperationsExample() {
  const tree = new CommitmentTree(TREE_DEPTH);
  await tree.initialize();
  
  // Batch insert commitments
  const commitments = Array.from({ length: 100 }, (_, i) => BigInt(i + 1));
  
  console.time('Batch insert');
  commitments.forEach(c => tree.insert(c));
  console.timeEnd('Batch insert');
  
  console.log('Tree size after batch:', tree.getSize());
  console.log('Final root:', tree.getRoot().toString(16));
  
  // Verify multiple proofs
  console.time('Verify 10 proofs');
  for (let i = 0; i < 10; i++) {
    const proof = tree.generateProof(i);
    const isValid = tree.verifyProof(proof);
    if (!isValid) {
      console.error('Proof verification failed for index', i);
    }
  }
  console.timeEnd('Verify 10 proofs');
  
  return tree;
}

// Export examples
export {
  basicTreeExample,
  multiAssetExample,
  persistenceExample,
  balanceNoteExample,
  batchOperationsExample
};
