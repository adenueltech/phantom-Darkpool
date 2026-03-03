/**
 * Merkle Commitment Tree System
 * 
 * Incremental Merkle tree for storing balance note commitments.
 * Uses Poseidon hash for ZK-friendly operations.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 10.6
 */

import { IncrementalMerkleTree } from '@zk-kit/incremental-merkle-tree';
import { poseidonHash2 } from './poseidon';

/**
 * Tree configuration constants
 */
export const TREE_DEPTH = 20; // Supports 2^20 = 1,048,576 leaves
export const ZERO_VALUE = BigInt(0);

/**
 * Merkle proof structure
 */
export interface MerkleProof {
  leaf: bigint;
  siblings: bigint[];
  pathIndices: number[];
  root: bigint;
}

/**
 * Tree state for persistence
 */
export interface TreeState {
  depth: number;
  root: bigint;
  leaves: bigint[];
  size: number;
}

/**
 * Commitment Tree for balance notes
 * Manages a Merkle tree of balance note commitments with Poseidon hash
 */
export class CommitmentTree {
  private tree: IncrementalMerkleTree | null = null;
  private readonly depth: number;
  private poseidonHasher: ((left: bigint, right: bigint) => bigint) | null = null;

  constructor(depth: number = TREE_DEPTH) {
    this.depth = depth;
  }

  /**
   * Initialize the tree with Poseidon hash function
   * Must be called before using the tree
   */
  async initialize(initialLeaves: bigint[] = []): Promise<void> {
    // Import circomlibjs dynamically to get Poseidon
    const circomlibjs = await import('circomlibjs');
    const poseidonInstance = await circomlibjs.buildPoseidon();

    // Create synchronous wrapper for Poseidon hash
    this.poseidonHasher = (left: bigint, right: bigint): bigint => {
      const hash = poseidonInstance([left, right]);
      return poseidonInstance.F.toObject(hash);
    };

    // Initialize tree with zero value (0n) and Poseidon hash
    this.tree = new IncrementalMerkleTree(
      this.poseidonHasher,
      this.depth,
      ZERO_VALUE,
      2,  // arity (binary tree)
      initialLeaves
    );
  }

  /**
   * Insert a commitment into the tree
   * 
   * @param commitment - Balance note commitment to insert
   * @returns Index of the inserted leaf
   */
  insert(commitment: bigint): number {
    if (!this.tree) {
      throw new Error('Tree not initialized. Call initialize() first.');
    }

    this.tree.insert(commitment);
    return this.tree.leaves.length - 1;
  }

  /**
   * Get the current Merkle root
   * 
   * @returns Current tree root
   */
  getRoot(): bigint {
    if (!this.tree) {
      throw new Error('Tree not initialized. Call initialize() first.');
    }

    return this.tree.root;
  }

  /**
   * Generate Merkle proof for a leaf at given index
   * 
   * @param leafIndex - Index of the leaf to prove
   * @returns Merkle proof structure
   */
  generateProof(leafIndex: number): MerkleProof {
    if (!this.tree) {
      throw new Error('Tree not initialized. Call initialize() first.');
    }

    if (leafIndex < 0 || leafIndex >= this.tree.leaves.length) {
      throw new Error(`Invalid leaf index: ${leafIndex}`);
    }

    const proof = this.tree.createProof(leafIndex);
    
    return {
      leaf: this.tree.leaves[leafIndex],
      siblings: proof.siblings.map((s: [bigint, bigint]) => s[0]),
      pathIndices: proof.pathIndices,
      root: this.tree.root,
    };
  }

  /**
   * Verify a Merkle proof
   * 
   * @param proof - Merkle proof to verify
   * @returns True if proof is valid
   */
  verifyProof(proof: MerkleProof): boolean {
    if (!this.tree) {
      throw new Error('Tree not initialized. Call initialize() first.');
    }

    // Reconstruct root from leaf and siblings
    let computedHash = proof.leaf;

    for (let i = 0; i < proof.siblings.length; i++) {
      const sibling = proof.siblings[i];
      const isLeft = proof.pathIndices[i] === 0;

      if (!this.poseidonHasher) {
        throw new Error('Poseidon hasher not initialized');
      }

      if (isLeft) {
        computedHash = this.poseidonHasher(computedHash, sibling);
      } else {
        computedHash = this.poseidonHasher(sibling, computedHash);
      }
    }

    return computedHash === proof.root;
  }

  /**
   * Get the number of leaves in the tree
   */
  getSize(): number {
    if (!this.tree) {
      throw new Error('Tree not initialized. Call initialize() first.');
    }

    return this.tree.leaves.length;
  }

  /**
   * Get all leaves in the tree
   */
  getLeaves(): bigint[] {
    if (!this.tree) {
      throw new Error('Tree not initialized. Call initialize() first.');
    }

    return [...this.tree.leaves];
  }

  /**
   * Export tree state for persistence
   */
  exportState(): TreeState {
    if (!this.tree) {
      throw new Error('Tree not initialized. Call initialize() first.');
    }

    return {
      depth: this.depth,
      root: this.tree.root,
      leaves: [...this.tree.leaves],
      size: this.tree.leaves.length,
    };
  }

  /**
   * Import tree state from persistence
   */
  async importState(state: TreeState): Promise<void> {
    if (state.depth !== this.depth) {
      throw new Error(`Tree depth mismatch: expected ${this.depth}, got ${state.depth}`);
    }

    await this.initialize(state.leaves);
  }
}

/**
 * Multi-Asset Tree Manager
 * Manages separate commitment trees for each asset type
 * 
 * Requirements: 10.6
 */
export class MultiAssetTreeManager {
  private trees: Map<string, CommitmentTree> = new Map();
  private readonly depth: number;

  constructor(depth: number = TREE_DEPTH) {
    this.depth = depth;
  }

  /**
   * Get or create tree for a specific asset
   * 
   * @param asset - Asset address or identifier
   * @returns Commitment tree for the asset
   */
  async getTree(asset: string): Promise<CommitmentTree> {
    if (!this.trees.has(asset)) {
      const tree = new CommitmentTree(this.depth);
      await tree.initialize();
      this.trees.set(asset, tree);
    }

    return this.trees.get(asset)!;
  }

  /**
   * Insert commitment for a specific asset
   * 
   * @param asset - Asset address or identifier
   * @param commitment - Balance note commitment
   * @returns Index of the inserted leaf
   */
  async insertCommitment(asset: string, commitment: bigint): Promise<number> {
    const tree = await this.getTree(asset);
    return tree.insert(commitment);
  }

  /**
   * Get root for a specific asset tree
   * 
   * @param asset - Asset address or identifier
   * @returns Current tree root
   */
  async getRoot(asset: string): Promise<bigint> {
    const tree = await this.getTree(asset);
    return tree.getRoot();
  }

  /**
   * Generate proof for a specific asset
   * 
   * @param asset - Asset address or identifier
   * @param leafIndex - Index of the leaf to prove
   * @returns Merkle proof
   */
  async generateProof(asset: string, leafIndex: number): Promise<MerkleProof> {
    const tree = await this.getTree(asset);
    return tree.generateProof(leafIndex);
  }

  /**
   * Verify proof for a specific asset
   * 
   * @param asset - Asset address or identifier
   * @param proof - Merkle proof to verify
   * @returns True if proof is valid
   */
  async verifyProof(asset: string, proof: MerkleProof): Promise<boolean> {
    const tree = await this.getTree(asset);
    return tree.verifyProof(proof);
  }

  /**
   * Get all supported assets
   */
  getSupportedAssets(): string[] {
    return Array.from(this.trees.keys());
  }

  /**
   * Get tree size for a specific asset
   */
  async getTreeSize(asset: string): Promise<number> {
    const tree = await this.getTree(asset);
    return tree.getSize();
  }

  /**
   * Export all tree states for persistence
   */
  async exportAllStates(): Promise<Map<string, TreeState>> {
    const states = new Map<string, TreeState>();

    for (const [asset, tree] of this.trees.entries()) {
      states.set(asset, tree.exportState());
    }

    return states;
  }

  /**
   * Import all tree states from persistence
   */
  async importAllStates(states: Map<string, TreeState>): Promise<void> {
    for (const [asset, state] of states.entries()) {
      const tree = new CommitmentTree(this.depth);
      await tree.importState(state);
      this.trees.set(asset, tree);
    }
  }

  /**
   * Clear all trees (for testing)
   */
  clear(): void {
    this.trees.clear();
  }
}
