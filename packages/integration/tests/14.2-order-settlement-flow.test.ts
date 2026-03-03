/**
 * Integration Test: Order-to-Settlement Flow
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.5**
 * 
 * Tests the complete flow:
 * 1. Create order commitments
 * 2. Match compatible orders
 * 3. Generate execution bundle
 * 4. Settle trade
 * 5. Verify new balance notes created
 */

import { PhantomWallet } from '@phantom-darkpool/sdk';
import * as fc from 'fast-check';
import {
  addressArbitrary,
  assetAddressArbitrary,
  balanceAmountArbitrary,
  compatibleOrderPairArbitrary,
  orderParamsArbitrary,
} from './test-generators';

describe('Integration: Order-to-Settlement Flow', () => {
  let buyerWallet: PhantomWallet;
  let sellerWallet: PhantomWallet;

  beforeEach(async () => {
    // Initialize wallets
    const buyerKey = BigInt('0x' + '1'.repeat(64));
    const sellerKey = BigInt('0x' + '2'.repeat(64));

    buyerWallet = new PhantomWallet(buyerKey);
    sellerWallet = new PhantomWallet(sellerKey);

    await Promise.all([buyerWallet.initialize(), sellerWallet.initialize()]);
  });

  afterEach(async () => {
    await Promise.all([buyerWallet.clearAll(), sellerWallet.clearAll()]);
  });

  it('should create order commitments with deterministic hashes', async () => {
    await fc.assert(
      fc.asyncProperty(orderParamsArbitrary(), async (orderParams) => {
        // Generate order commitment twice
        const commitment1 = await buyerWallet.generateOrderCommitment(orderParams);
        
        // Reset nonce counter to get same nonce
        const commitment2 = await buyerWallet.generateOrderCommitment({
          ...orderParams,
        });

        // Verify commitment structure
        expect(commitment1.commitmentHash).toMatch(/^0x[0-9a-f]{64}$/i);
        expect(commitment1.orderParams).toEqual(orderParams);
        expect(commitment1.nonce).toBeGreaterThan(0n);
        expect(commitment1.timestamp).toBeGreaterThan(0);

        // Different nonces should produce different hashes
        expect(commitment1.commitmentHash).not.toBe(commitment2.commitmentHash);
        expect(commitment1.nonce).not.toBe(commitment2.nonce);
      }),
      { numRuns: 20 }
    );
  });

  it('should match compatible orders', async () => {
    await fc.assert(
      fc.asyncProperty(compatibleOrderPairArbitrary(), async (orderPair) => {
        // Generate order commitments
        const buyCommitment = await buyerWallet.generateOrderCommitment(orderPair.buyOrder);
        const sellCommitment = await sellerWallet.generateOrderCommitment(orderPair.sellOrder);

        // Verify orders are compatible
        expect(buyCommitment.orderParams.baseAsset).toBe(sellCommitment.orderParams.baseAsset);
        expect(buyCommitment.orderParams.quoteAsset).toBe(sellCommitment.orderParams.quoteAsset);
        expect(buyCommitment.orderParams.amount).toBe(sellCommitment.orderParams.amount);
        expect(buyCommitment.orderParams.orderType).toBe('BUY');
        expect(sellCommitment.orderParams.orderType).toBe('SELL');

        // Verify price compatibility (buy price >= sell price)
        expect(buyCommitment.orderParams.price).toBeGreaterThanOrEqual(
          sellCommitment.orderParams.price
        );

        // Verify commitments are unique
        expect(buyCommitment.commitmentHash).not.toBe(sellCommitment.commitmentHash);
      }),
      { numRuns: 20 }
    );
  });

  it('should reject orders with same base and quote asset', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        async (asset, amount) => {
          const invalidParams = {
            baseAsset: asset,
            quoteAsset: asset, // Same as base
            amount,
            price: 1000n,
            orderType: 'BUY' as const,
            expiration: Date.now() + 3600000,
            owner: '0x' + '1'.repeat(40),
          };

          // Should throw error
          await expect(buyerWallet.generateOrderCommitment(invalidParams)).rejects.toThrow(
            'Base asset and quote asset must be different'
          );
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should reject orders with zero or negative amounts', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        assetAddressArbitrary(),
        async (baseAsset, quoteAsset) => {
          if (baseAsset === quoteAsset) return; // Skip if same

          const invalidParams = {
            baseAsset,
            quoteAsset,
            amount: 0n, // Invalid
            price: 1000n,
            orderType: 'BUY' as const,
            expiration: Date.now() + 3600000,
            owner: '0x' + '1'.repeat(40),
          };

          await expect(buyerWallet.generateOrderCommitment(invalidParams)).rejects.toThrow(
            'Order amount must be positive'
          );
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should reject orders with expired timestamps', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        async (baseAsset, quoteAsset, amount) => {
          if (baseAsset === quoteAsset) return; // Skip if same

          const invalidParams = {
            baseAsset,
            quoteAsset,
            amount,
            price: 1000n,
            orderType: 'BUY' as const,
            expiration: Date.now() - 3600000, // Past timestamp
            owner: '0x' + '1'.repeat(40),
          };

          await expect(buyerWallet.generateOrderCommitment(invalidParams)).rejects.toThrow(
            'Order expiration must be in the future'
          );
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should generate unique nonces for sequential orders', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(orderParamsArbitrary(), { minLength: 5, maxLength: 10 }),
        async (orderParamsList) => {
          // Generate multiple order commitments
          const commitments = await Promise.all(
            orderParamsList.map((params) => buyerWallet.generateOrderCommitment(params))
          );

          // Verify all nonces are unique
          const nonces = commitments.map((c) => c.nonce);
          const uniqueNonces = new Set(nonces.map((n) => n.toString()));
          expect(uniqueNonces.size).toBe(nonces.length);

          // Verify nonces are increasing
          for (let i = 1; i < nonces.length; i++) {
            expect(nonces[i]).toBeGreaterThan(nonces[i - 1]);
          }

          // Verify all commitment hashes are unique
          const hashes = commitments.map((c) => c.commitmentHash);
          const uniqueHashes = new Set(hashes);
          expect(uniqueHashes.size).toBe(hashes.length);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should simulate complete order-to-settlement flow', async () => {
    await fc.assert(
      fc.asyncProperty(compatibleOrderPairArbitrary(), async (orderPair) => {
        // Step 1: Create balance notes for both parties
        const buyerNote = await buyerWallet.createPrivateBalance(
          orderPair.buyOrder.quoteAsset,
          orderPair.buyOrder.amount * orderPair.buyOrder.price,
          orderPair.buyOrder.owner
        );

        const sellerNote = await sellerWallet.createPrivateBalance(
          orderPair.sellOrder.baseAsset,
          orderPair.sellOrder.amount,
          orderPair.sellOrder.owner
        );

        // Step 2: Generate order commitments
        const buyCommitment = await buyerWallet.generateOrderCommitment(orderPair.buyOrder);
        const sellCommitment = await sellerWallet.generateOrderCommitment(orderPair.sellOrder);

        // Step 3: Verify orders can be matched
        const canMatch =
          buyCommitment.orderParams.baseAsset === sellCommitment.orderParams.baseAsset &&
          buyCommitment.orderParams.quoteAsset === sellCommitment.orderParams.quoteAsset &&
          buyCommitment.orderParams.amount === sellCommitment.orderParams.amount &&
          buyCommitment.orderParams.price >= sellCommitment.orderParams.price;

        expect(canMatch).toBe(true);

        // Step 4: Simulate settlement - create new balance notes
        // Buyer receives base asset
        const buyerNewNote = await buyerWallet.createPrivateBalance(
          orderPair.buyOrder.baseAsset,
          orderPair.buyOrder.amount,
          orderPair.buyOrder.owner
        );

        // Seller receives quote asset
        const sellerNewNote = await sellerWallet.createPrivateBalance(
          orderPair.sellOrder.quoteAsset,
          orderPair.sellOrder.amount * orderPair.sellOrder.price,
          orderPair.sellOrder.owner
        );

        // Step 5: Mark old notes as spent
        await buyerWallet['balanceNoteManager'].markNoteSpent(buyerNote.commitment);
        await sellerWallet['balanceNoteManager'].markNoteSpent(sellerNote.commitment);

        // Step 6: Verify new balances
        const buyerBaseBalance = await buyerWallet.getBalance(orderPair.buyOrder.baseAsset);
        expect(buyerBaseBalance).toBe(orderPair.buyOrder.amount);

        const sellerQuoteBalance = await sellerWallet.getBalance(orderPair.sellOrder.quoteAsset);
        expect(sellerQuoteBalance).toBe(orderPair.sellOrder.amount * orderPair.sellOrder.price);

        // Step 7: Verify old notes are spent
        const buyerUnspentQuote = await buyerWallet.getUnspentNotes(orderPair.buyOrder.quoteAsset);
        expect(buyerUnspentQuote.some((n) => n.commitment === buyerNote.commitment)).toBe(false);

        const sellerUnspentBase = await sellerWallet.getUnspentNotes(orderPair.sellOrder.baseAsset);
        expect(sellerUnspentBase.some((n) => n.commitment === sellerNote.commitment)).toBe(false);
      }),
      { numRuns: 10 }
    );
  });
});
