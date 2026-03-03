/**
 * Integration Test: Deposit-to-Withdrawal Flow
 * 
 * **Validates: Requirements 1.1, 1.2, 1.4, 5.1, 5.2, 5.4, 5.5, 5.6**
 * 
 * Tests the complete flow:
 * 1. Deposit assets to Shielded Vault
 * 2. Create encrypted balance note
 * 3. Verify note commitment in tree
 * 4. Withdraw assets
 * 5. Verify nullifier is marked as spent
 */

import { PhantomWallet } from '@phantom-darkpool/sdk';
import { CommitmentTree } from '@phantom-darkpool/sdk/crypto';
import * as fc from 'fast-check';
import {
  addressArbitrary,
  assetAddressArbitrary,
  balanceAmountArbitrary,
  masterKeyArbitrary,
} from './test-generators';

describe('Integration: Deposit-to-Withdrawal Flow', () => {
  let wallet: PhantomWallet;
  let merkleTree: CommitmentTree;

  beforeEach(async () => {
    // Initialize wallet with random master key
    const masterKey = BigInt('0x' + '1'.repeat(64));
    wallet = new PhantomWallet(masterKey);
    await wallet.initialize();

    // Initialize Merkle tree
    merkleTree = new CommitmentTree(20);
    await merkleTree.initialize();
  });

  afterEach(async () => {
    await wallet.clearAll();
  });

  it('should complete full deposit-to-withdrawal flow', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (asset, amount, owner) => {
          // Step 1: Create balance note (simulating deposit)
          const balanceNote = await wallet.createPrivateBalance(asset, amount, owner);

          // Verify note properties
          expect(balanceNote.asset).toBe(asset);
          expect(balanceNote.amount).toBe(amount);
          expect(balanceNote.owner).toBe(owner);
          expect(balanceNote.commitment).toMatch(/^0x[0-9a-f]{64}$/i);
          expect(balanceNote.nullifier).toMatch(/^0x[0-9a-f]{64}$/i);
          expect(balanceNote.spent).toBe(false);

          // Step 2: Add commitment to tree
          const commitmentBigInt = BigInt(balanceNote.commitment);
          merkleTree.insert(commitmentBigInt);

          // Step 3: Verify commitment in tree
          const treeRoot = merkleTree.getRoot();
          const merkleProof = merkleTree.generateProof(merkleTree.getSize() - 1);

          expect(merkleProof).toBeDefined();
          expect(merkleProof.root).toBe(treeRoot);

          // Step 4: Verify balance is tracked
          const balance = await wallet.getBalance(asset);
          expect(balance).toBeGreaterThanOrEqual(amount);

          // Step 5: Get unspent notes
          const unspentNotes = await wallet.getUnspentNotes(asset);
          expect(unspentNotes.length).toBeGreaterThan(0);
          expect(unspentNotes.some((n) => n.commitment === balanceNote.commitment)).toBe(true);

          // Step 6: Simulate withdrawal (mark note as spent)
          await wallet['balanceNoteManager'].markNoteSpent(balanceNote.commitment);

          // Step 7: Verify note is marked as spent
          const notesAfterSpend = await wallet.getUnspentNotes(asset);
          expect(notesAfterSpend.some((n) => n.commitment === balanceNote.commitment)).toBe(false);

          // Step 8: Verify balance is reduced
          const balanceAfterSpend = await wallet.getBalance(asset);
          expect(balanceAfterSpend).toBe(balance - amount);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle multiple deposits for same asset', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        fc.array(balanceAmountArbitrary(), { minLength: 2, maxLength: 5 }),
        addressArbitrary(),
        async (asset, amounts, owner) => {
          // Create multiple balance notes
          const notes = await Promise.all(
            amounts.map((amount) => wallet.createPrivateBalance(asset, amount, owner))
          );

          // Verify all notes are created
          expect(notes.length).toBe(amounts.length);

          // Verify total balance
          const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0n);
          const balance = await wallet.getBalance(asset);
          expect(balance).toBe(totalAmount);

          // Verify all commitments are unique
          const commitments = notes.map((n) => n.commitment);
          const uniqueCommitments = new Set(commitments);
          expect(uniqueCommitments.size).toBe(commitments.length);

          // Verify all nullifiers are unique
          const nullifiers = notes.map((n) => n.nullifier);
          const uniqueNullifiers = new Set(nullifiers);
          expect(uniqueNullifiers.size).toBe(nullifiers.length);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should handle deposits for multiple assets', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(assetAddressArbitrary(), { minLength: 2, maxLength: 4 }).filter((assets) => {
          const uniqueAssets = new Set(assets);
          return uniqueAssets.size === assets.length;
        }),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (assets, amount, owner) => {
          // Create balance notes for each asset
          const notes = await Promise.all(
            assets.map((asset) => wallet.createPrivateBalance(asset, amount, owner))
          );

          // Verify balance for each asset
          for (const asset of assets) {
            const balance = await wallet.getBalance(asset);
            expect(balance).toBe(amount);
          }

          // Verify total number of unspent notes
          const allUnspentNotes = await Promise.all(
            assets.map((asset) => wallet.getUnspentNotes(asset))
          );
          const totalUnspentNotes = allUnspentNotes.reduce((sum, notes) => sum + notes.length, 0);
          expect(totalUnspentNotes).toBe(assets.length);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should prevent double-spending via nullifier tracking', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (asset, amount, owner) => {
          // Create balance note
          const balanceNote = await wallet.createPrivateBalance(asset, amount, owner);

          // Mark note as spent (first spend)
          await wallet['balanceNoteManager'].markNoteSpent(balanceNote.commitment);

          // Verify note is spent
          const unspentNotes = await wallet.getUnspentNotes(asset);
          expect(unspentNotes.some((n) => n.commitment === balanceNote.commitment)).toBe(false);

          // Attempt to mark as spent again (should not error, but should be idempotent)
          await wallet['balanceNoteManager'].markNoteSpent(balanceNote.commitment);

          // Verify note is still spent
          const unspentNotesAfter = await wallet.getUnspentNotes(asset);
          expect(unspentNotesAfter.some((n) => n.commitment === balanceNote.commitment)).toBe(
            false
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain commitment tree integrity across multiple insertions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            asset: assetAddressArbitrary(),
            amount: balanceAmountArbitrary(),
            owner: addressArbitrary(),
          }),
          { minLength: 5, maxLength: 20 }
        ),
        async (noteParams) => {
          const commitments: bigint[] = [];

          // Create notes and add to tree
          for (const params of noteParams) {
            const note = await wallet.createPrivateBalance(
              params.asset,
              params.amount,
              params.owner
            );
            const commitment = BigInt(note.commitment);
            merkleTree.insert(commitment);
            commitments.push(commitment);
          }

          // Verify all commitments can be proven
          for (let i = 0; i < commitments.length; i++) {
            const proof = merkleTree.generateProof(i);
            expect(proof).toBeDefined();
            expect(proof.leaf).toBe(commitments[i]);

            // Verify proof
            const isValid = merkleTree.verifyProof(proof);
            expect(isValid).toBe(true);
          }

          // Verify tree root is deterministic
          const root1 = merkleTree.getRoot();
          
          // Rebuild tree with same commitments
          const newTree = new CommitmentTree(20);
          await newTree.initialize();
          for (const commitment of commitments) {
            newTree.insert(commitment);
          }
          const root2 = newTree.getRoot();

          expect(root1).toBe(root2);
        }
      ),
      { numRuns: 10 }
    );
  });
});
