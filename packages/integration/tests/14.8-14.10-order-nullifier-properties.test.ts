/**
 * Property Tests: Order Commitment and Nullifier Properties
 * 
 * **Property 6: Order Commitment Determinism** (14.8)
 * **Validates: Requirements 2.1, 2.2, 10.2**
 * 
 * **Property 7: Order Validity Proof Requirement** (14.9)
 * **Validates: Requirements 2.3, 2.5**
 * 
 * **Property 5: Nullifier State Transition** (14.10)
 * **Validates: Requirements 1.5, 4.7, 5.7, 9.2**
 */

import { PhantomWallet } from '@phantom-darkpool/sdk';
import { generateOrderCommitmentHash } from '@phantom-darkpool/sdk/crypto';
import * as fc from 'fast-check';
import {
  addressArbitrary,
  assetAddressArbitrary,
  balanceAmountArbitrary,
  orderParamsArbitrary,
  saltArbitrary,
} from './test-generators';

describe('Property 6: Order Commitment Determinism', () => {
  let wallet: PhantomWallet;

  beforeEach(async () => {
    const masterKey = BigInt('0x' + '1'.repeat(64));
    wallet = new PhantomWallet(masterKey);
    await wallet.initialize();
  });

  afterEach(async () => {
    await wallet.clearAll();
  });

  it('should generate identical hashes for same order parameters and nonce', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        balanceAmountArbitrary(),
        addressArbitrary(),
        saltArbitrary(),
        async (baseAsset, quoteAsset, amount, price, owner, nonce) => {
          if (baseAsset === quoteAsset) return;

          // Convert addresses to bigint
          const baseBigInt = BigInt(baseAsset);
          const quoteBigInt = BigInt(quoteAsset);
          const ownerBigInt = BigInt(owner);
          const expiration = BigInt(Date.now() + 3600000);

          // Generate hash twice with same parameters
          const hash1 = await generateOrderCommitmentHash({
            baseAsset: baseBigInt,
            quoteAsset: quoteBigInt,
            amount,
            price,
            orderType: 0n, // BUY
            expiration,
            nonce,
            owner: ownerBigInt,
          });

          const hash2 = await generateOrderCommitmentHash({
            baseAsset: baseBigInt,
            quoteAsset: quoteBigInt,
            amount,
            price,
            orderType: 0n, // BUY
            expiration,
            nonce,
            owner: ownerBigInt,
          });

          // Hashes should be identical
          expect(hash1).toBe(hash2);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should generate different hashes for different nonces', async () => {
    await fc.assert(
      fc.asyncProperty(
        orderParamsArbitrary(),
        saltArbitrary(),
        saltArbitrary(),
        async (orderParams, nonce1, nonce2) => {
          if (nonce1 === nonce2) return;

          const baseBigInt = BigInt(orderParams.baseAsset);
          const quoteBigInt = BigInt(orderParams.quoteAsset);
          const ownerBigInt = BigInt(orderParams.owner);
          const orderTypeBigInt = orderParams.orderType === 'BUY' ? 0n : 1n;

          // Generate hashes with different nonces
          const hash1 = await generateOrderCommitmentHash({
            baseAsset: baseBigInt,
            quoteAsset: quoteBigInt,
            amount: orderParams.amount,
            price: orderParams.price,
            orderType: orderTypeBigInt,
            expiration: BigInt(orderParams.expiration),
            nonce: nonce1,
            owner: ownerBigInt,
          });

          const hash2 = await generateOrderCommitmentHash({
            baseAsset: baseBigInt,
            quoteAsset: quoteBigInt,
            amount: orderParams.amount,
            price: orderParams.price,
            orderType: orderTypeBigInt,
            expiration: BigInt(orderParams.expiration),
            nonce: nonce2,
            owner: ownerBigInt,
          });

          // Hashes should be different
          expect(hash1).not.toBe(hash2);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should generate different hashes for different order parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        orderParamsArbitrary(),
        balanceAmountArbitrary(),
        saltArbitrary(),
        async (orderParams, differentAmount, nonce) => {
          if (orderParams.amount === differentAmount) return;

          const baseBigInt = BigInt(orderParams.baseAsset);
          const quoteBigInt = BigInt(orderParams.quoteAsset);
          const ownerBigInt = BigInt(orderParams.owner);
          const orderTypeBigInt = orderParams.orderType === 'BUY' ? 0n : 1n;

          // Generate hash with original amount
          const hash1 = await generateOrderCommitmentHash({
            baseAsset: baseBigInt,
            quoteAsset: quoteBigInt,
            amount: orderParams.amount,
            price: orderParams.price,
            orderType: orderTypeBigInt,
            expiration: BigInt(orderParams.expiration),
            nonce,
            owner: ownerBigInt,
          });

          // Generate hash with different amount
          const hash2 = await generateOrderCommitmentHash({
            baseAsset: baseBigInt,
            quoteAsset: quoteBigInt,
            amount: differentAmount,
            price: orderParams.price,
            orderType: orderTypeBigInt,
            expiration: BigInt(orderParams.expiration),
            nonce,
            owner: ownerBigInt,
          });

          // Hashes should be different
          expect(hash1).not.toBe(hash2);
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 7: Order Validity Proof Requirement', () => {
  let wallet: PhantomWallet;

  beforeEach(async () => {
    const masterKey = BigInt('0x' + '1'.repeat(64));
    wallet = new PhantomWallet(masterKey);
    await wallet.initialize();
  });

  afterEach(async () => {
    await wallet.clearAll();
  });

  it('should accept orders with valid parameters', async () => {
    await fc.assert(
      fc.asyncProperty(orderParamsArbitrary(), async (orderParams) => {
        // Generate order commitment (validates parameters)
        const commitment = await wallet.generateOrderCommitment(orderParams);

        // Should succeed without throwing
        expect(commitment).toBeDefined();
        expect(commitment.commitmentHash).toMatch(/^0x[0-9a-f]{64}$/i);
        expect(commitment.orderParams).toEqual(orderParams);
      }),
      { numRuns: 20 }
    );
  });

  it('should reject orders with invalid parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        async (asset, amount) => {
          // Same base and quote asset (invalid)
          const invalidParams = {
            baseAsset: asset,
            quoteAsset: asset,
            amount,
            price: 1000n,
            orderType: 'BUY' as const,
            expiration: Date.now() + 3600000,
            owner: '0x' + '1'.repeat(40),
          };

          await expect(wallet.generateOrderCommitment(invalidParams)).rejects.toThrow();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should reject orders with zero amount', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        assetAddressArbitrary(),
        async (baseAsset, quoteAsset) => {
          if (baseAsset === quoteAsset) return;

          const invalidParams = {
            baseAsset,
            quoteAsset,
            amount: 0n,
            price: 1000n,
            orderType: 'BUY' as const,
            expiration: Date.now() + 3600000,
            owner: '0x' + '1'.repeat(40),
          };

          await expect(wallet.generateOrderCommitment(invalidParams)).rejects.toThrow(
            'Order amount must be positive'
          );
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should reject orders with zero price', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        async (baseAsset, quoteAsset, amount) => {
          if (baseAsset === quoteAsset) return;

          const invalidParams = {
            baseAsset,
            quoteAsset,
            amount,
            price: 0n,
            orderType: 'BUY' as const,
            expiration: Date.now() + 3600000,
            owner: '0x' + '1'.repeat(40),
          };

          await expect(wallet.generateOrderCommitment(invalidParams)).rejects.toThrow(
            'Order price must be positive'
          );
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should reject orders with past expiration', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        async (baseAsset, quoteAsset, amount) => {
          if (baseAsset === quoteAsset) return;

          const invalidParams = {
            baseAsset,
            quoteAsset,
            amount,
            price: 1000n,
            orderType: 'BUY' as const,
            expiration: Date.now() - 3600000, // Past
            owner: '0x' + '1'.repeat(40),
          };

          await expect(wallet.generateOrderCommitment(invalidParams)).rejects.toThrow(
            'Order expiration must be in the future'
          );
        }
      ),
      { numRuns: 15 }
    );
  });
});

describe('Property 5: Nullifier State Transition', () => {
  let wallet: PhantomWallet;

  beforeEach(async () => {
    const masterKey = BigInt('0x' + '1'.repeat(64));
    wallet = new PhantomWallet(masterKey);
    await wallet.initialize();
  });

  afterEach(async () => {
    await wallet.clearAll();
  });

  it('should mark nullifier as spent when note is spent', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (asset, amount, owner) => {
          // Create balance note
          const note = await wallet.createPrivateBalance(asset, amount, owner);

          // Initially not spent
          expect(note.spent).toBe(false);

          // Verify note is in unspent set
          const unspentBefore = await wallet.getUnspentNotes(asset);
          expect(unspentBefore.some((n) => n.commitment === note.commitment)).toBe(true);

          // Mark as spent
          await wallet['balanceNoteManager'].markNoteSpent(note.commitment);

          // Verify note is no longer in unspent set
          const unspentAfter = await wallet.getUnspentNotes(asset);
          expect(unspentAfter.some((n) => n.commitment === note.commitment)).toBe(false);

          // Balance should be reduced
          const balance = await wallet.getBalance(asset);
          expect(balance).toBe(0n);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should maintain spent state across multiple queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (asset, amount, owner) => {
          // Create and spend note
          const note = await wallet.createPrivateBalance(asset, amount, owner);
          await wallet['balanceNoteManager'].markNoteSpent(note.commitment);

          // Query multiple times
          for (let i = 0; i < 3; i++) {
            const unspentNotes = await wallet.getUnspentNotes(asset);
            expect(unspentNotes.some((n) => n.commitment === note.commitment)).toBe(false);

            const balance = await wallet.getBalance(asset);
            expect(balance).toBe(0n);
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should handle spending multiple notes independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        fc.array(balanceAmountArbitrary(), { minLength: 3, maxLength: 5 }),
        addressArbitrary(),
        async (asset, amounts, owner) => {
          // Create multiple notes
          const notes = await Promise.all(
            amounts.map((amount) => wallet.createPrivateBalance(asset, amount, owner))
          );

          const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0n);

          // Spend first note
          await wallet['balanceNoteManager'].markNoteSpent(notes[0].commitment);

          // Verify first note is spent
          const unspent1 = await wallet.getUnspentNotes(asset);
          expect(unspent1.some((n) => n.commitment === notes[0].commitment)).toBe(false);

          // Verify other notes are still unspent
          for (let i = 1; i < notes.length; i++) {
            expect(unspent1.some((n) => n.commitment === notes[i].commitment)).toBe(true);
          }

          // Verify balance is reduced by first note amount
          const balance1 = await wallet.getBalance(asset);
          expect(balance1).toBe(totalAmount - amounts[0]);

          // Spend second note
          await wallet['balanceNoteManager'].markNoteSpent(notes[1].commitment);

          // Verify both notes are spent
          const unspent2 = await wallet.getUnspentNotes(asset);
          expect(unspent2.some((n) => n.commitment === notes[0].commitment)).toBe(false);
          expect(unspent2.some((n) => n.commitment === notes[1].commitment)).toBe(false);

          // Verify balance is reduced by both amounts
          const balance2 = await wallet.getBalance(asset);
          expect(balance2).toBe(totalAmount - amounts[0] - amounts[1]);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should generate unique nullifiers for each note', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        fc.array(balanceAmountArbitrary(), { minLength: 5, maxLength: 10 }),
        addressArbitrary(),
        async (asset, amounts, owner) => {
          // Create multiple notes
          const notes = await Promise.all(
            amounts.map((amount) => wallet.createPrivateBalance(asset, amount, owner))
          );

          // Verify all nullifiers are unique
          const nullifiers = notes.map((n) => n.nullifier);
          const uniqueNullifiers = new Set(nullifiers);
          expect(uniqueNullifiers.size).toBe(nullifiers.length);

          // Verify all nullifiers are valid hex strings
          for (const nullifier of nullifiers) {
            expect(nullifier).toMatch(/^0x[0-9a-f]{64}$/i);
          }
        }
      ),
      { numRuns: 15 }
    );
  });
});
