/**
 * Property Test: Multi-Asset Support
 * 
 * **Property 29: Multi-Asset Balance Note Support**
 * **Validates: Requirements 10.1, 10.5**
 * 
 * For any supported asset type, users should be able to create balance notes,
 * and the system should correctly track and validate notes for different
 * asset types independently.
 */

import { PhantomWallet } from '@phantom-darkpool/sdk';
import * as fc from 'fast-check';
import {
  addressArbitrary,
  assetAddressArbitrary,
  balanceAmountArbitrary,
  multipleAssetsArbitrary,
} from './test-generators';

describe('Property 29: Multi-Asset Support', () => {
  let wallet: PhantomWallet;

  beforeEach(async () => {
    const masterKey = BigInt('0x' + '1'.repeat(64));
    wallet = new PhantomWallet(masterKey);
    await wallet.initialize();
  });

  afterEach(async () => {
    await wallet.clearAll();
  });

  it('should support balance notes for multiple asset types independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        multipleAssetsArbitrary(3),
        fc.array(balanceAmountArbitrary(), { minLength: 3, maxLength: 3 }),
        addressArbitrary(),
        async (assets, amounts, owner) => {
          // Create balance notes for each asset
          const notes = await Promise.all(
            assets.map((asset, i) => wallet.createPrivateBalance(asset, amounts[i], owner))
          );

          // Verify each note has correct asset
          for (let i = 0; i < assets.length; i++) {
            expect(notes[i].asset).toBe(assets[i]);
            expect(notes[i].amount).toBe(amounts[i]);
          }

          // Verify balances are tracked independently
          for (let i = 0; i < assets.length; i++) {
            const balance = await wallet.getBalance(assets[i]);
            expect(balance).toBe(amounts[i]);
          }

          // Verify commitments are unique across assets
          const commitments = notes.map((n) => n.commitment);
          const uniqueCommitments = new Set(commitments);
          expect(uniqueCommitments.size).toBe(commitments.length);

          // Verify unspent notes are tracked per asset
          for (let i = 0; i < assets.length; i++) {
            const unspentNotes = await wallet.getUnspentNotes(assets[i]);
            expect(unspentNotes.length).toBe(1);
            expect(unspentNotes[0].asset).toBe(assets[i]);
            expect(unspentNotes[0].amount).toBe(amounts[i]);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain independent balances when spending notes from one asset', async () => {
    await fc.assert(
      fc.asyncProperty(
        multipleAssetsArbitrary(2),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (assets, amount, owner) => {
          // Create notes for both assets
          const note1 = await wallet.createPrivateBalance(assets[0], amount, owner);
          const note2 = await wallet.createPrivateBalance(assets[1], amount, owner);

          // Verify initial balances
          expect(await wallet.getBalance(assets[0])).toBe(amount);
          expect(await wallet.getBalance(assets[1])).toBe(amount);

          // Spend note from first asset
          await wallet['balanceNoteManager'].markNoteSpent(note1.commitment);

          // Verify first asset balance is zero
          expect(await wallet.getBalance(assets[0])).toBe(0n);

          // Verify second asset balance is unchanged
          expect(await wallet.getBalance(assets[1])).toBe(amount);

          // Verify unspent notes
          const unspent1 = await wallet.getUnspentNotes(assets[0]);
          const unspent2 = await wallet.getUnspentNotes(assets[1]);

          expect(unspent1.length).toBe(0);
          expect(unspent2.length).toBe(1);
          expect(unspent2[0].commitment).toBe(note2.commitment);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should support many assets simultaneously', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 10 }),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (assetCount, amount, owner) => {
          // Generate unique assets
          const assets = Array.from({ length: assetCount }, (_, i) =>
            `0x${i.toString(16).padStart(40, '0')}`
          );

          // Create notes for all assets
          const notes = await Promise.all(
            assets.map((asset) => wallet.createPrivateBalance(asset, amount, owner))
          );

          // Verify all notes created
          expect(notes.length).toBe(assetCount);

          // Verify each asset has correct balance
          for (const asset of assets) {
            const balance = await wallet.getBalance(asset);
            expect(balance).toBe(amount);
          }

          // Verify total number of unspent notes
          const allUnspentNotes = await Promise.all(
            assets.map((asset) => wallet.getUnspentNotes(asset))
          );
          const totalUnspent = allUnspentNotes.reduce((sum, notes) => sum + notes.length, 0);
          expect(totalUnspent).toBe(assetCount);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle multiple notes per asset type', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        fc.array(balanceAmountArbitrary(), { minLength: 3, maxLength: 7 }),
        addressArbitrary(),
        async (asset, amounts, owner) => {
          // Create multiple notes for same asset
          const notes = await Promise.all(
            amounts.map((amount) => wallet.createPrivateBalance(asset, amount, owner))
          );

          // Verify total balance
          const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0n);
          const balance = await wallet.getBalance(asset);
          expect(balance).toBe(totalAmount);

          // Verify all notes are tracked
          const unspentNotes = await wallet.getUnspentNotes(asset);
          expect(unspentNotes.length).toBe(amounts.length);

          // Verify each note has correct amount
          const noteAmounts = unspentNotes.map((n) => n.amount).sort((a, b) => Number(a - b));
          const expectedAmounts = [...amounts].sort((a, b) => Number(a - b));
          expect(noteAmounts).toEqual(expectedAmounts);
        }
      ),
      { numRuns: 15 }
    );
  });
});
