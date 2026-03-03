import { initializeTreeManager, getTreeInfo, insertCommitment, generateMerkleProof } from '../../services/treeService';

describe('Tree Service', () => {
  describe('initializeTreeManager', () => {
    it('should initialize tree manager', async () => {
      const manager = await initializeTreeManager();
      expect(manager).toBeDefined();
    });

    it('should return same instance on multiple calls', async () => {
      const manager1 = await initializeTreeManager();
      const manager2 = await initializeTreeManager();
      expect(manager1).toBe(manager2);
    });
  });

  describe('getTreeInfo', () => {
    it('should return tree info for specific asset', async () => {
      const info = await getTreeInfo('0xETH');

      expect(info).toBeDefined();
      expect(info.asset).toBe('0xETH');
      expect(info.root).toBeDefined();
      expect(info.size).toBe(0);
      expect(info.depth).toBe(20);
    });

    it('should return info for all assets when no asset specified', async () => {
      const info = await getTreeInfo();

      expect(info).toBeDefined();
      expect(info.trees).toBeDefined();
      expect(Array.isArray(info.trees)).toBe(true);
    });
  });

  describe('insertCommitment', () => {
    it('should insert commitment into tree', async () => {
      const asset = '0xETH';
      const commitment = BigInt('0x123abc');

      const index = await insertCommitment(asset, commitment);

      expect(typeof index).toBe('number');
      expect(index).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateMerkleProof', () => {
    it('should generate Merkle proof', async () => {
      const asset = '0xETH';
      const leafIndex = 0;

      const proof = await generateMerkleProof(asset, leafIndex);

      expect(proof).toBeDefined();
      expect(proof.proof).toBeDefined();
      expect(proof.root).toBeDefined();
    });
  });
});
