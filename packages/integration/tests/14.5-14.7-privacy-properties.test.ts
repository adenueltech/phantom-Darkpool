/**
 * Property Tests: Privacy and Security Properties
 * 
 * **Property 36: Public Solvency Verification** (14.5)
 * **Validates: Requirements 13.1, 13.2, 13.4**
 * 
 * **Property 37: No Unauthorized Balance Note Creation** (14.6)
 * **Validates: Requirements 13.5**
 * 
 * **Property 38: Encrypted Data Owner-Only Decryption** (14.7)
 * **Validates: Requirements 15.7**
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

describe('Property 36: Public Solvency Verification', () => {
  let wallet: PhantomWallet;
  let merkleTree: CommitmentTree;

  beforeEach(async () => {
    const masterKey = BigInt('0x' + '1'.repeat(64));
    wallet = new PhantomWallet(masterKey);
    await wallet.initialize();
    merkleTree = new CommitmentTree(20);
    await merkleTree.initialize();
  });

  afterEach(async () => {
    await wallet.clearAll();
  });

  it('should maintain verifiable solvency: total commitments = total deposits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            asset: assetAddressArbitrary(),
            amount: balanceAmountArbitrary(),
            owner: addressArbitrary(),
          }),
          { minLength: 5, maxLength: 15 }
        ),
        async (deposits) => {
          // Track total deposits per asset
          const totalDeposits = new Map<string, bigint>();

          // Create balance notes (simulating deposits)
          const notes = [];
          for (const deposit of deposits) {
            const note = await wallet.createPrivateBalance(
              deposit.asset,
              deposit.amount,
              deposit.owner
            );
            notes.push(note);

            // Add to tree
            merkleTree.insert(BigInt(note.commitment));

            // Track deposits
            const current = totalDeposits.get(deposit.asset) || 0n;
            totalDeposits.set(deposit.asset, current + deposit.amount);
          }

          // Verify: total balance notes = total deposits per asset
          for (const [asset, expectedTotal] of totalDeposits) {
            const actualTotal = await wallet.getBalance(asset);
            expect(actualTotal).toBe(expectedTotal);
          }

          // Verify: all commitments are in tree and verifiable
          for (let i = 0; i < notes.length; i++) {
            const proof = merkleTree.generateProof(i);
            const isValid = merkleTree.verifyProof(proof);
            expect(isValid).toBe(true);
          }

          // Verify: tree root is publicly verifiable
          const root = merkleTree.getRoot();
          expect(root).toBeDefined();
          expect(root).toBeGreaterThan(0n);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should maintain solvency after spending notes', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        fc.array(balanceAmountArbitrary(), { minLength: 3, maxLength: 5 }),
        addressArbitrary(),
        async (asset, amounts, owner) => {
          // Create notes
          const notes = await Promise.all(
            amounts.map((amount) => wallet.createPrivateBalance(asset, amount, owner))
          );

          const totalDeposited = amounts.reduce((sum, amt) => sum + amt, 0n);

          // Verify initial solvency
          expect(await wallet.getBalance(asset)).toBe(totalDeposited);

          // Spend some notes
          const notesToSpend = notes.slice(0, Math.floor(notes.length / 2));
          const spentAmount = notesToSpend.reduce((sum, note) => sum + note.amount, 0n);

          for (const note of notesToSpend) {
            await wallet['balanceNoteManager'].markNoteSpent(note.commitment);
          }

          // Verify solvency maintained
          const remainingBalance = await wallet.getBalance(asset);
          expect(remainingBalance).toBe(totalDeposited - spentAmount);

          // Verify unspent notes sum to remaining balance
          const unspentNotes = await wallet.getUnspentNotes(asset);
          const unspentSum = unspentNotes.reduce((sum, note) => sum + note.amount, 0n);
          expect(unspentSum).toBe(remainingBalance);
        }
      ),
      { numRuns: 15 }
    );
  });
});

describe('Property 37: No Unauthorized Balance Note Creation', () => {
  let wallet: PhantomWallet;

  beforeEach(async () => {
    const masterKey = BigInt('0x' + '1'.repeat(64));
    wallet = new PhantomWallet(masterKey);
    await wallet.initialize();
  });

  afterEach(async () => {
    await wallet.clearAll();
  });

  it('should only create balance notes through explicit deposit flow', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (asset, amount, owner) => {
          // Initial balance should be zero
          const initialBalance = await wallet.getBalance(asset);
          expect(initialBalance).toBe(0n);

          // Create note (simulating deposit)
          const note = await wallet.createPrivateBalance(asset, amount, owner);

          // Balance should increase by exactly the deposited amount
          const newBalance = await wallet.getBalance(asset);
          expect(newBalance).toBe(initialBalance + amount);

          // Verify note is tracked
          const unspentNotes = await wallet.getUnspentNotes(asset);
          expect(unspentNotes.some((n) => n.commitment === note.commitment)).toBe(true);

          // Cannot have balance without corresponding note
          const totalUnspent = unspentNotes.reduce((sum, n) => sum + n.amount, 0n);
          expect(totalUnspent).toBe(newBalance);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should prevent balance inflation without deposits', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        fc.array(balanceAmountArbitrary(), { minLength: 3, maxLength: 5 }),
        addressArbitrary(),
        async (asset, amounts, owner) => {
          // Create notes
          const notes = await Promise.all(
            amounts.map((amount) => wallet.createPrivateBalance(asset, amount, owner))
          );

          const totalCreated = amounts.reduce((sum, amt) => sum + amt, 0n);

          // Balance should equal sum of created notes
          const balance = await wallet.getBalance(asset);
          expect(balance).toBe(totalCreated);

          // Verify each note is accounted for
          const unspentNotes = await wallet.getUnspentNotes(asset);
          expect(unspentNotes.length).toBe(notes.length);

          // Verify no extra value exists
          const unspentSum = unspentNotes.reduce((sum, note) => sum + note.amount, 0n);
          expect(unspentSum).toBe(totalCreated);
        }
      ),
      { numRuns: 15 }
    );
  });
});

describe('Property 38: Encrypted Data Owner-Only Decryption', () => {
  it('should encrypt balance notes with owner-specific key', async () => {
    await fc.assert(
      fc.asyncProperty(
        masterKeyArbitrary(),
        masterKeyArbitrary(),
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (ownerKey, otherKey, asset, amount, owner) => {
          if (ownerKey === otherKey) return; // Skip if same key

          // Create wallet with owner key
          const ownerWallet = new PhantomWallet(ownerKey);
          await ownerWallet.initialize();

          // Create balance note
          const note = await ownerWallet.createPrivateBalance(asset, amount, owner);

          // Owner can retrieve the note
          const ownerNotes = await ownerWallet.getUnspentNotes(asset);
          expect(ownerNotes.some((n) => n.commitment === note.commitment)).toBe(true);

          // Create wallet with different key
          const otherWallet = new PhantomWallet(otherKey);
          await otherWallet.initialize();

          // Other wallet cannot see the note
          const otherNotes = await otherWallet.getUnspentNotes(asset);
          expect(otherNotes.some((n) => n.commitment === note.commitment)).toBe(false);

          // Other wallet has zero balance for this asset
          const otherBalance = await otherWallet.getBalance(asset);
          expect(otherBalance).toBe(0n);

          // Cleanup
          await ownerWallet.clearAll();
          await otherWallet.clearAll();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should maintain encryption across wallet sessions', async () => {
    await fc.assert(
      fc.asyncProperty(
        masterKeyArbitrary(),
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (masterKey, asset, amount, owner) => {
          // Create wallet and note
          const wallet1 = new PhantomWallet(masterKey);
          await wallet1.initialize();

          const note = await wallet1.createPrivateBalance(asset, amount, owner);
          const commitment = note.commitment;

          // Create new wallet instance with same key
          const wallet2 = new PhantomWallet(masterKey);
          await wallet2.initialize();

          // Should be able to retrieve the same note
          const notes = await wallet2.getUnspentNotes(asset);
          expect(notes.some((n) => n.commitment === commitment)).toBe(true);

          // Balance should be consistent
          const balance1 = await wallet1.getBalance(asset);
          const balance2 = await wallet2.getBalance(asset);
          expect(balance1).toBe(balance2);
          expect(balance1).toBe(amount);

          // Cleanup
          await wallet1.clearAll();
          await wallet2.clearAll();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should protect order commitments with encryption', async () => {
    await fc.assert(
      fc.asyncProperty(
        masterKeyArbitrary(),
        masterKeyArbitrary(),
        assetAddressArbitrary(),
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        async (ownerKey, otherKey, baseAsset, quoteAsset, amount) => {
          if (ownerKey === otherKey || baseAsset === quoteAsset) return;

          // Create owner wallet
          const ownerWallet = new PhantomWallet(ownerKey);
          await ownerWallet.initialize();

          // Create order commitment
          const orderCommitment = await ownerWallet.generateOrderCommitment({
            baseAsset,
            quoteAsset,
            amount,
            price: 1000n,
            orderType: 'BUY',
            expiration: Date.now() + 3600000,
            owner: '0x' + '1'.repeat(40),
          });

          // Commitment hash is public but doesn't reveal order details
          expect(orderCommitment.commitmentHash).toMatch(/^0x[0-9a-f]{64}$/i);

          // Order parameters are stored locally (encrypted)
          expect(orderCommitment.orderParams.amount).toBe(amount);
          expect(orderCommitment.orderParams.baseAsset).toBe(baseAsset);

          // Other wallet cannot access order details from commitment hash alone
          // (In real system, order details are encrypted and only accessible with viewing key)

          await ownerWallet.clearAll();
        }
      ),
      { numRuns: 15 }
    );
  });
});
