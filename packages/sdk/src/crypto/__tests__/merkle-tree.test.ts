/**
 * Merkle Tree Tests
 * 
 * Tests for CommitmentTree and MultiAssetTreeManager
 */

import { CommitmentTree, MultiAssetTreeManager, TREE_DEPTH } from '../merkle-tree';

describe('CommitmentTree', () => {
  let tree: CommitmentTree;

  beforeEach(async () => {
    tree = new CommitmentTree(TREE_DEPTH);
    await tree.initialize();
  });

  describe('initialization', () => {
    it('should initialize with correct depth', () => {
      expect(tree.getSize()).toBe(0);
    });

    it('should initialize with initial leaves', async () => {
      const leaves = [BigInt(1), BigInt(2), BigInt(3)];
      const newTree = new CommitmentTree(TREE_DEPTH);
      await newTree.initialize(leaves);
      
      expect(newTree.getSize()).toBe(3);
      expect(newTree.getLeaves()).toEqual(leaves);
    });
  });

  describe('insert', () => {
    it('should insert commitment and return index', () => {
      const commitment = BigInt(12345);
      const index = tree.insert(commitment);
      
      expect(index).toBe(0);
      expect(tree.getSize()).toBe(1);
    });

    it('should insert multiple commitments', () => {
      const commitments = [BigInt(1), BigInt(2), BigInt(3)];
      
      commitments.forEach((c, i) => {
        const index = tree.insert(c);
        expect(index).toBe(i);
      });
      
      expect(tree.getSize()).toBe(3);
    });
  });

  describe('getRoot', () => {
    it('should return root after insertions', () => {
      tree.insert(BigInt(1));
      const root1 = tree.getRoot();
      
      tree.insert(BigInt(2));
      const root2 = tree.getRoot();
      
      expect(root1).not.toBe(root2);
    });

    it('should have deterministic root for same leaves', async () => {
      const leaves = [BigInt(100), BigInt(200), BigInt(300)];
      
      const tree1 = new CommitmentTree(TREE_DEPTH);
      await tree1.initialize(leaves);
      
      const tree2 = new CommitmentTree(TREE_DEPTH);
      await tree2.initialize(leaves);
      
      expect(tree1.getRoot()).toBe(tree2.getRoot());
    });
  });

  describe('generateProof', () => {
    it('should generate valid proof for inserted leaf', () => {
      const commitment = BigInt(12345);
      const index = tree.insert(commitment);
      
      const proof = tree.generateProof(index);
      
      expect(proof.leaf).toBe(commitment);
      expect(proof.root).toBe(tree.getRoot());
      expect(proof.siblings.length).toBe(TREE_DEPTH);
    });

    it('should throw error for invalid index', () => {
      expect(() => tree.generateProof(0)).toThrow('Invalid leaf index');
      expect(() => tree.generateProof(-1)).toThrow('Invalid leaf index');
    });
  });

  describe('verifyProof', () => {
    it('should verify valid proof', () => {
      const commitment = BigInt(12345);
      const index = tree.insert(commitment);
      
      const proof = tree.generateProof(index);
      const isValid = tree.verifyProof(proof);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid proof with wrong leaf', () => {
      const commitment = BigInt(12345);
      const index = tree.insert(commitment);
      
      const proof = tree.generateProof(index);
      proof.leaf = BigInt(99999); // Tamper with leaf
      
      const isValid = tree.verifyProof(proof);
      expect(isValid).toBe(false);
    });

    it('should reject proof with wrong root', () => {
      const commitment = BigInt(12345);
      const index = tree.insert(commitment);
      
      const proof = tree.generateProof(index);
      proof.root = BigInt(99999); // Tamper with root
      
      const isValid = tree.verifyProof(proof);
      expect(isValid).toBe(false);
    });
  });

  describe('state persistence', () => {
    it('should export and import state correctly', async () => {
      const commitments = [BigInt(1), BigInt(2), BigInt(3)];
      commitments.forEach(c => tree.insert(c));
      
      const state = tree.exportState();
      
      const newTree = new CommitmentTree(TREE_DEPTH);
      await newTree.importState(state);
      
      expect(newTree.getRoot()).toBe(tree.getRoot());
      expect(newTree.getSize()).toBe(tree.getSize());
      expect(newTree.getLeaves()).toEqual(tree.getLeaves());
    });

    it('should reject state with mismatched depth', async () => {
      const state = tree.exportState();
      state.depth = 15; // Different depth
      
      const newTree = new CommitmentTree(TREE_DEPTH);
      await expect(newTree.importState(state)).rejects.toThrow('Tree depth mismatch');
    });
  });
});

describe('MultiAssetTreeManager', () => {
  let manager: MultiAssetTreeManager;
  const ETH = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
  const USDC = '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';

  beforeEach(() => {
    manager = new MultiAssetTreeManager(TREE_DEPTH);
  });

  describe('getTree', () => {
    it('should create tree for new asset', async () => {
      const tree = await manager.getTree(ETH);
      expect(tree).toBeDefined();
      expect(tree.getSize()).toBe(0);
    });

    it('should return same tree for same asset', async () => {
      const tree1 = await manager.getTree(ETH);
      const tree2 = await manager.getTree(ETH);
      expect(tree1).toBe(tree2);
    });

    it('should create separate trees for different assets', async () => {
      const ethTree = await manager.getTree(ETH);
      const usdcTree = await manager.getTree(USDC);
      expect(ethTree).not.toBe(usdcTree);
    });
  });

  describe('insertCommitment', () => {
    it('should insert commitment for specific asset', async () => {
      const commitment = BigInt(12345);
      const index = await manager.insertCommitment(ETH, commitment);
      
      expect(index).toBe(0);
      expect(await manager.getTreeSize(ETH)).toBe(1);
    });

    it('should maintain separate commitments per asset', async () => {
      await manager.insertCommitment(ETH, BigInt(100));
      await manager.insertCommitment(ETH, BigInt(200));
      await manager.insertCommitment(USDC, BigInt(300));
      
      expect(await manager.getTreeSize(ETH)).toBe(2);
      expect(await manager.getTreeSize(USDC)).toBe(1);
    });
  });

  describe('getRoot', () => {
    it('should return different roots for different assets', async () => {
      await manager.insertCommitment(ETH, BigInt(100));
      await manager.insertCommitment(USDC, BigInt(100));
      
      const ethRoot = await manager.getRoot(ETH);
      const usdcRoot = await manager.getRoot(USDC);
      
      expect(ethRoot).not.toBe(usdcRoot);
    });
  });

  describe('generateProof and verifyProof', () => {
    it('should generate and verify proof for specific asset', async () => {
      const commitment = BigInt(12345);
      const index = await manager.insertCommitment(ETH, commitment);
      
      const proof = await manager.generateProof(ETH, index);
      const isValid = await manager.verifyProof(ETH, proof);
      
      expect(isValid).toBe(true);
      expect(proof.leaf).toBe(commitment);
    });

    it('should not verify proof for wrong asset', async () => {
      const commitment = BigInt(12345);
      const index = await manager.insertCommitment(ETH, commitment);
      
      const proof = await manager.generateProof(ETH, index);
      
      // Try to verify ETH proof against USDC tree
      await manager.insertCommitment(USDC, BigInt(99999));
      const isValid = await manager.verifyProof(USDC, proof);
      
      expect(isValid).toBe(false);
    });
  });

  describe('getSupportedAssets', () => {
    it('should return empty array initially', () => {
      expect(manager.getSupportedAssets()).toEqual([]);
    });

    it('should return all assets with trees', async () => {
      await manager.getTree(ETH);
      await manager.getTree(USDC);
      
      const assets = manager.getSupportedAssets();
      expect(assets).toContain(ETH);
      expect(assets).toContain(USDC);
      expect(assets.length).toBe(2);
    });
  });

  describe('state persistence', () => {
    it('should export and import all tree states', async () => {
      await manager.insertCommitment(ETH, BigInt(100));
      await manager.insertCommitment(ETH, BigInt(200));
      await manager.insertCommitment(USDC, BigInt(300));
      
      const states = await manager.exportAllStates();
      
      const newManager = new MultiAssetTreeManager(TREE_DEPTH);
      await newManager.importAllStates(states);
      
      expect(await newManager.getRoot(ETH)).toBe(await manager.getRoot(ETH));
      expect(await newManager.getRoot(USDC)).toBe(await manager.getRoot(USDC));
      expect(await newManager.getTreeSize(ETH)).toBe(2);
      expect(await newManager.getTreeSize(USDC)).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all trees', async () => {
      await manager.getTree(ETH);
      await manager.getTree(USDC);
      
      manager.clear();
      
      expect(manager.getSupportedAssets()).toEqual([]);
    });
  });
});
