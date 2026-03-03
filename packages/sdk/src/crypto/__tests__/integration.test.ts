/**
 * Cryptographic Primitives Integration Tests
 * 
 * Tests that verify all cryptographic components work together correctly
 */

import { initPoseidon, poseidonHash2 } from '../poseidon';
import { createBalanceNote, createBalanceCommitment } from '../pedersen';
import { generateNullifier, deriveNullifierSecret, generateMasterKey, NullifierTracker } from '../nullifier';
import { CommitmentTree, MultiAssetTreeManager, TREE_DEPTH } from '../merkle-tree';

describe('Cryptographic Primitives Integration', () => {
  beforeAll(async () => {
    await initPoseidon();
  });

  describe('Complete Balance Note Flow', () => {
    it('should create, commit, and track balance note', async () => {
      // 1. Create balance note with Pedersen commitment
      const asset = BigInt('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7');
      const amount = BigInt('1000000000000000000'); // 1 ETH
      const owner = BigInt('0x' + '1'.repeat(64));
      
      const note = createBalanceNote(asset, amount, owner);
      
      expect(note.commitment).toBeGreaterThan(0n);
      
      // 2. Generate nullifier with Poseidon hash
      const masterKey = generateMasterKey(new Uint8Array(32).fill(42));
      const nullifierSecret = await deriveNullifierSecret(masterKey, BigInt(0));
      const nullifier = await generateNullifier(note.commitment, nullifierSecret);
      
      expect(nullifier).toBeGreaterThan(0n);
      expect(nullifier).not.toBe(note.commitment);
      
      // 3. Add commitment to Merkle tree
      const tree = new CommitmentTree(TREE_DEPTH);
      await tree.initialize();
      
      const index = tree.insert(note.commitment);
      expect(index).toBe(0);
      
      // 4. Generate Merkle proof
      const proof = tree.generateProof(index);
      expect(proof.leaf).toBe(note.commitment);
      expect(tree.verifyProof(proof)).toBe(true);
      
      // 5. Track nullifier
      const tracker = new NullifierTracker();
      tracker.markPending({ nullifier, commitment: note.commitment });
      
      expect(tracker.isPending(nullifier)).toBe(true);
      expect(tracker.isSpent(nullifier)).toBe(false);
    });

    it('should support multiple balance notes for same owner', async () => {
      const owner = BigInt('0x' + '1'.repeat(64));
      const masterKey = generateMasterKey(new Uint8Array(32).fill(42));
      
      // Create multiple notes
      const notes = [
        createBalanceNote(BigInt(1), BigInt(100), owner),
        createBalanceNote(BigInt(1), BigInt(200), owner),
        createBalanceNote(BigInt(1), BigInt(300), owner),
      ];
      
      // All commitments should be unique
      const commitments = new Set(notes.map(n => n.commitment.toString()));
      expect(commitments.size).toBe(3);
      
      // Generate unique nullifiers for each
      const nullifiers = await Promise.all(
        notes.map(async (note, i) => {
          const secret = await deriveNullifierSecret(masterKey, BigInt(i));
          return generateNullifier(note.commitment, secret);
        })
      );
      
      // All nullifiers should be unique
      const uniqueNullifiers = new Set(nullifiers.map(n => n.toString()));
      expect(uniqueNullifiers.size).toBe(3);
    });
  });

  describe('Multi-Asset Balance Management', () => {
    it('should manage balance notes for multiple assets', async () => {
      const ETH = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const USDC = '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';
      
      const owner = BigInt('0x' + '1'.repeat(64));
      const manager = new MultiAssetTreeManager(TREE_DEPTH);
      
      // Create ETH balance note
      const ethNote = createBalanceNote(BigInt(ETH), BigInt('1000000000000000000'), owner);
      const ethIndex = await manager.insertCommitment(ETH, ethNote.commitment);
      
      // Create USDC balance note
      const usdcNote = createBalanceNote(BigInt(USDC), BigInt('1000000000'), owner);
      const usdcIndex = await manager.insertCommitment(USDC, usdcNote.commitment);
      
      // Verify separate trees
      expect(await manager.getTreeSize(ETH)).toBe(1);
      expect(await manager.getTreeSize(USDC)).toBe(1);
      
      // Verify different roots
      const ethRoot = await manager.getRoot(ETH);
      const usdcRoot = await manager.getRoot(USDC);
      expect(ethRoot).not.toBe(usdcRoot);
      
      // Verify proofs
      const ethProof = await manager.generateProof(ETH, ethIndex);
      const usdcProof = await manager.generateProof(USDC, usdcIndex);
      
      expect(await manager.verifyProof(ETH, ethProof)).toBe(true);
      expect(await manager.verifyProof(USDC, usdcProof)).toBe(true);
    });
  });

  describe('Deposit Flow Simulation', () => {
    it('should simulate complete deposit flow', async () => {
      const ETH = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const depositAmount = BigInt('5000000000000000000'); // 5 ETH
      const owner = BigInt('0x' + '1'.repeat(64));
      
      // User deposits assets
      const note = createBalanceNote(BigInt(ETH), depositAmount, owner);
      
      // System adds commitment to tree
      const manager = new MultiAssetTreeManager(TREE_DEPTH);
      const noteIndex = await manager.insertCommitment(ETH, note.commitment);
      
      // User stores encrypted note locally
      const encryptedNote = {
        asset: note.asset.toString(),
        amount: note.amount.toString(),
        salt: note.salt.toString(),
        owner: note.owner.toString(),
        commitment: note.commitment.toString(),
        index: noteIndex,
      };
      
      // Verify note can be reconstructed
      const reconstructed = {
        asset: BigInt(encryptedNote.asset),
        amount: BigInt(encryptedNote.amount),
        salt: BigInt(encryptedNote.salt),
        owner: BigInt(encryptedNote.owner),
      };
      
      const reconstructedCommitment = createBalanceCommitment(reconstructed);
      expect(reconstructedCommitment).toBe(note.commitment);
      
      // Verify Merkle proof
      const proof = await manager.generateProof(ETH, noteIndex);
      expect(await manager.verifyProof(ETH, proof)).toBe(true);
    });
  });

  describe('Withdrawal Flow Simulation', () => {
    it('should simulate complete withdrawal flow', async () => {
      const ETH = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const owner = BigInt('0x' + '1'.repeat(64));
      const masterKey = generateMasterKey(new Uint8Array(32).fill(42));
      
      // Setup: User has a balance note
      const note = createBalanceNote(BigInt(ETH), BigInt('3000000000000000000'), owner);
      
      const manager = new MultiAssetTreeManager(TREE_DEPTH);
      const noteIndex = await manager.insertCommitment(ETH, note.commitment);
      
      // Withdrawal: Generate nullifier
      const nullifierSecret = await deriveNullifierSecret(masterKey, BigInt(0));
      const nullifier = await generateNullifier(note.commitment, nullifierSecret);
      
      // Generate Merkle proof
      const merkleProof = await manager.generateProof(ETH, noteIndex);
      
      // Verify proof before submission
      expect(await manager.verifyProof(ETH, merkleProof)).toBe(true);
      
      // Track nullifier
      const tracker = new NullifierTracker();
      tracker.markPending({ nullifier, commitment: note.commitment });
      
      // After transaction confirms
      tracker.markSpent({
        nullifier,
        commitment: note.commitment,
        transactionHash: '0xabc123',
      });
      
      // Verify nullifier is spent
      expect(tracker.isSpent(nullifier)).toBe(true);
      
      // Attempt to reuse nullifier (should fail)
      const canReuseNullifier = !tracker.isSpent(nullifier);
      expect(canReuseNullifier).toBe(false);
    });
  });

  describe('Order Commitment Flow', () => {
    it('should create order commitment with all components', async () => {
      const ETH = BigInt('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7');
      const USDC = BigInt('0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8');
      
      // Order parameters
      const orderParams = {
        baseAsset: ETH,
        quoteAsset: USDC,
        amount: BigInt('1000000000000000000'), // 1 ETH
        price: BigInt('2000000000'), // 2000 USDC
        orderType: BigInt(0), // BUY
        expiration: BigInt(Math.floor(Date.now() / 1000) + 3600),
        nonce: BigInt(1),
        owner: BigInt('0x' + '1'.repeat(64)),
      };
      
      // Generate order commitment hash using Poseidon
      const { poseidonHashMany } = await import('../poseidon');
      const commitmentHash = await poseidonHashMany([
        orderParams.baseAsset,
        orderParams.quoteAsset,
        orderParams.amount,
        orderParams.price,
        orderParams.orderType,
        orderParams.expiration,
        orderParams.nonce,
        orderParams.owner,
      ]);
      
      expect(commitmentHash).toBeGreaterThan(0n);
      
      // Verify determinism
      const commitmentHash2 = await poseidonHashMany([
        orderParams.baseAsset,
        orderParams.quoteAsset,
        orderParams.amount,
        orderParams.price,
        orderParams.orderType,
        orderParams.expiration,
        orderParams.nonce,
        orderParams.owner,
      ]);
      
      expect(commitmentHash).toBe(commitmentHash2);
    });
  });

  describe('Trade Settlement Simulation', () => {
    it('should simulate trade with input/output balance notes', async () => {
      const ETH = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const USDC = '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';
      
      const buyer = BigInt('0x' + '1'.repeat(64));
      const seller = BigInt('0x' + '2'.repeat(64));
      
      const manager = new MultiAssetTreeManager(TREE_DEPTH);
      const tracker = new NullifierTracker();
      
      // Buyer has USDC
      const buyerUSDC = createBalanceNote(BigInt(USDC), BigInt('2000000000'), buyer);
      await manager.insertCommitment(USDC, buyerUSDC.commitment);
      
      // Seller has ETH
      const sellerETH = createBalanceNote(BigInt(ETH), BigInt('1000000000000000000'), seller);
      await manager.insertCommitment(ETH, sellerETH.commitment);
      
      // Generate nullifiers for inputs
      const buyerMasterKey = generateMasterKey(new Uint8Array(32).fill(1));
      const sellerMasterKey = generateMasterKey(new Uint8Array(32).fill(2));
      
      const buyerSecret = await deriveNullifierSecret(buyerMasterKey, BigInt(0));
      const sellerSecret = await deriveNullifierSecret(sellerMasterKey, BigInt(0));
      
      const buyerNullifier = await generateNullifier(buyerUSDC.commitment, buyerSecret);
      const sellerNullifier = await generateNullifier(sellerETH.commitment, sellerSecret);
      
      // Create output notes (after trade)
      const buyerETH = createBalanceNote(BigInt(ETH), BigInt('1000000000000000000'), buyer);
      const sellerUSDC = createBalanceNote(BigInt(USDC), BigInt('2000000000'), seller);
      
      // Add output commitments to trees
      await manager.insertCommitment(ETH, buyerETH.commitment);
      await manager.insertCommitment(USDC, sellerUSDC.commitment);
      
      // Mark input nullifiers as spent
      tracker.markSpent({ nullifier: buyerNullifier, commitment: buyerUSDC.commitment });
      tracker.markSpent({ nullifier: sellerNullifier, commitment: sellerETH.commitment });
      
      // Verify conservation: inputs spent, outputs created
      expect(tracker.isSpent(buyerNullifier)).toBe(true);
      expect(tracker.isSpent(sellerNullifier)).toBe(true);
      expect(await manager.getTreeSize(ETH)).toBe(2); // seller input + buyer output
      expect(await manager.getTreeSize(USDC)).toBe(2); // buyer input + seller output
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch operations efficiently', async () => {
      const ETH = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const owner = BigInt('0x' + '1'.repeat(64));
      
      const manager = new MultiAssetTreeManager(TREE_DEPTH);
      
      // Create 100 balance notes
      const notes = Array.from({ length: 100 }, (_, i) =>
        createBalanceNote(BigInt(ETH), BigInt(i + 1), owner)
      );
      
      // Insert all commitments
      const startTime = Date.now();
      for (const note of notes) {
        await manager.insertCommitment(ETH, note.commitment);
      }
      const endTime = Date.now();
      
      expect(await manager.getTreeSize(ETH)).toBe(100);
      
      // Should complete in reasonable time (< 5 seconds)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);
      
      console.log(`Inserted 100 commitments in ${duration}ms`);
    });

    it('should verify multiple proofs efficiently', async () => {
      const ETH = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const owner = BigInt('0x' + '1'.repeat(64));
      
      const manager = new MultiAssetTreeManager(TREE_DEPTH);
      
      // Create and insert 50 notes
      const notes = Array.from({ length: 50 }, (_, i) =>
        createBalanceNote(BigInt(ETH), BigInt(i + 1), owner)
      );
      
      for (const note of notes) {
        await manager.insertCommitment(ETH, note.commitment);
      }
      
      // Generate and verify 50 proofs
      const startTime = Date.now();
      for (let i = 0; i < 50; i++) {
        const proof = await manager.generateProof(ETH, i);
        const isValid = await manager.verifyProof(ETH, proof);
        expect(isValid).toBe(true);
      }
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      console.log(`Verified 50 proofs in ${duration}ms`);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle zero amounts', () => {
      const note = createBalanceNote(BigInt(1), BigInt(0), BigInt(777));
      expect(note.commitment).toBeGreaterThan(0n);
    });

    it('should handle very large amounts', () => {
      const largeAmount = BigInt('0xffffffffffffffffffffffffffffffff');
      const note = createBalanceNote(BigInt(1), largeAmount, BigInt(777));
      expect(note.commitment).toBeGreaterThan(0n);
    });

    it('should handle same commitment in different asset trees', async () => {
      const commitment = BigInt('0x123456789abcdef');
      
      const manager = new MultiAssetTreeManager(TREE_DEPTH);
      
      await manager.insertCommitment('asset1', commitment);
      await manager.insertCommitment('asset2', commitment);
      
      // Same commitment can exist in different trees
      expect(await manager.getTreeSize('asset1')).toBe(1);
      expect(await manager.getTreeSize('asset2')).toBe(1);
      
      // But roots should be different (different tree contexts)
      const root1 = await manager.getRoot('asset1');
      const root2 = await manager.getRoot('asset2');
      expect(root1).toBe(root2); // Actually same because same single leaf
    });
  });
});
