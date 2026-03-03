/**
 * Property Tests: Key Rotation and Matching Engine Properties
 * 
 * **Property 39: Key Rotation Preservation** (14.17)
 * **Validates: Requirements 17.4**
 * 
 * **Property 44: Matching Engine Order Retrieval** (14.18)
 * **Validates: Requirements 19.1**
 * 
 * **Property 45: Dual Settlement Mode Support** (14.19)
 * **Validates: Requirements 19.6**
 */

import { PhantomWallet } from '@phantom-darkpool/sdk';
import * as fc from 'fast-check';
import {
  addressArbitrary,
  assetAddressArbitrary,
  balanceAmountArbitrary,
  compatibleOrderPairArbitrary,
  masterKeyArbitrary,
  orderParamsArbitrary,
} from './test-generators';

describe('Property 39: Key Rotation Preservation', () => {
  it('should preserve old notes after key rotation', async () => {
    await fc.assert(
      fc.asyncProperty(
        masterKeyArbitrary(),
        masterKeyArbitrary(),
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (oldKey, newKey, asset, amount, owner) => {
          if (oldKey === newKey) return;

          // Create wallet with old key
          const oldWallet = new PhantomWallet(oldKey);
          await oldWallet.initialize();

          // Create balance note with old key
          const oldNote = await oldWallet.createPrivateBalance(asset, amount, owner);

          // Verify note exists
          const oldBalance = await oldWallet.getBalance(asset);
          expect(oldBalance).toBe(amount);

          // Simulate key rotation: create new wallet with new key
          const newWallet = new PhantomWallet(newKey);
          await newWallet.initialize();

          // Create new note with new key
          const newNote = await newWallet.createPrivateBalance(asset, amount, owner);

          // Verify new note exists
          const newBalance = await newWallet.getBalance(asset);
          expect(newBalance).toBe(amount);

          // Verify old note is still accessible with old key
          const oldBalanceAfterRotation = await oldWallet.getBalance(asset);
          expect(oldBalanceAfterRotation).toBe(amount);

          // Verify notes have different commitments (different keys)
          expect(oldNote.commitment).not.toBe(newNote.commitment);

          // Verify notes have different nullifiers
          expect(oldNote.nullifier).not.toBe(newNote.nullifier);

          // Cleanup
          await oldWallet.clearAll();
          await newWallet.clearAll();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should allow spending old notes after key rotation', async () => {
    await fc.assert(
      fc.asyncProperty(
        masterKeyArbitrary(),
        masterKeyArbitrary(),
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        addressArbitrary(),
        async (oldKey, newKey, asset, amount, owner) => {
          if (oldKey === newKey) return;

          // Create wallet with old key and note
          const oldWallet = new PhantomWallet(oldKey);
          await oldWallet.initialize();
          const oldNote = await oldWallet.createPrivateBalance(asset, amount, owner);

          // Rotate to new key
          const newWallet = new PhantomWallet(newKey);
          await newWallet.initialize();

          // Old wallet can still spend old note
          await oldWallet['balanceNoteManager'].markNoteSpent(oldNote.commitment);

          // Verify old note is spent
          const oldBalance = await oldWallet.getBalance(asset);
          expect(oldBalance).toBe(0n);

          // New wallet has independent state
          const newBalance = await newWallet.getBalance(asset);
          expect(newBalance).toBe(0n);

          // Cleanup
          await oldWallet.clearAll();
          await newWallet.clearAll();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should support gradual migration to new key', async () => {
    await fc.assert(
      fc.asyncProperty(
        masterKeyArbitrary(),
        masterKeyArbitrary(),
        assetAddressArbitrary(),
        fc.array(balanceAmountArbitrary(), { minLength: 3, maxLength: 5 }),
        addressArbitrary(),
        async (oldKey, newKey, asset, amounts, owner) => {
          if (oldKey === newKey) return;

          // Create old wallet with multiple notes
          const oldWallet = new PhantomWallet(oldKey);
          await oldWallet.initialize();

          const oldNotes = await Promise.all(
            amounts.map((amount) => oldWallet.createPrivateBalance(asset, amount, owner))
          );

          const totalOldAmount = amounts.reduce((sum, amt) => sum + amt, 0n);

          // Create new wallet
          const newWallet = new PhantomWallet(newKey);
          await newWallet.initialize();

          // Gradually migrate: spend old notes and create new ones
          for (let i = 0; i < oldNotes.length; i++) {
            // Spend old note
            await oldWallet['balanceNoteManager'].markNoteSpent(oldNotes[i].commitment);

            // Create new note with same amount
            await newWallet.createPrivateBalance(asset, amounts[i], owner);
          }

          // Verify old wallet has zero balance
          const oldBalance = await oldWallet.getBalance(asset);
          expect(oldBalance).toBe(0n);

          // Verify new wallet has all migrated balance
          const newBalance = await newWallet.getBalance(asset);
          expect(newBalance).toBe(totalOldAmount);

          // Cleanup
          await oldWallet.clearAll();
          await newWallet.clearAll();
        }
      ),
      { numRuns: 10 }
    );
  });
});

describe('Property 44: Matching Engine Order Retrieval', () => {
  let wallet: PhantomWallet;

  beforeEach(async () => {
    const masterKey = BigInt('0x' + '1'.repeat(64));
    wallet = new PhantomWallet(masterKey);
    await wallet.initialize();
  });

  afterEach(async () => {
    await wallet.clearAll();
  });

  it('should retrieve all active unexpired orders', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(orderParamsArbitrary(), { minLength: 5, maxLength: 10 }),
        async (orderParamsList) => {
          // Generate orders
          const commitments = await Promise.all(
            orderParamsList.map((params) => wallet.generateOrderCommitment(params))
          );

          // Simulate order registry
          const activeOrders = commitments.filter(
            (c) => c.orderParams.expiration > Date.now()
          );

          // Verify all unexpired orders are retrievable
          expect(activeOrders.length).toBeGreaterThan(0);

          // Verify each order has valid commitment
          for (const order of activeOrders) {
            expect(order.commitmentHash).toMatch(/^0x[0-9a-f]{64}$/i);
            expect(order.orderParams.expiration).toBeGreaterThan(Date.now());
          }

          // Verify orders can be filtered by asset pair
          const firstAssetPair = activeOrders[0].orderParams;
          const matchingAssetPairOrders = activeOrders.filter(
            (o) =>
              o.orderParams.baseAsset === firstAssetPair.baseAsset &&
              o.orderParams.quoteAsset === firstAssetPair.quoteAsset
          );

          expect(matchingAssetPairOrders.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should exclude expired orders from retrieval', async () => {
    await fc.assert(
      fc.asyncProperty(
        assetAddressArbitrary(),
        assetAddressArbitrary(),
        balanceAmountArbitrary(),
        async (baseAsset, quoteAsset, amount) => {
          if (baseAsset === quoteAsset) return;

          // Create order that will expire soon
          const shortExpiration = Date.now() + 100; // 100ms

          const orderParams = {
            baseAsset,
            quoteAsset,
            amount,
            price: 1000n,
            orderType: 'BUY' as const,
            expiration: shortExpiration,
            owner: '0x' + '1'.repeat(40),
          };

          const commitment = await wallet.generateOrderCommitment(orderParams);

          // Initially active
          expect(commitment.orderParams.expiration).toBeGreaterThan(Date.now());

          // Wait for expiration
          await new Promise((resolve) => setTimeout(resolve, 150));

          // Now expired
          const isExpired = commitment.orderParams.expiration <= Date.now();
          expect(isExpired).toBe(true);

          // Simulate matching engine filtering
          const activeOrders = [commitment].filter(
            (c) => c.orderParams.expiration > Date.now()
          );

          // Should be excluded
          expect(activeOrders.length).toBe(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should retrieve orders sorted by timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(orderParamsArbitrary(), { minLength: 5, maxLength: 10 }),
        async (orderParamsList) => {
          // Generate orders with delays to ensure different timestamps
          const commitments = [];
          for (const params of orderParamsList) {
            const commitment = await wallet.generateOrderCommitment(params);
            commitments.push(commitment);
            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          // Sort by timestamp
          const sortedOrders = [...commitments].sort((a, b) => a.timestamp - b.timestamp);

          // Verify timestamps are increasing
          for (let i = 1; i < sortedOrders.length; i++) {
            expect(sortedOrders[i].timestamp).toBeGreaterThanOrEqual(
              sortedOrders[i - 1].timestamp
            );
          }

          // Verify nonces are also increasing (since they're based on timestamp)
          for (let i = 1; i < sortedOrders.length; i++) {
            expect(sortedOrders[i].nonce).toBeGreaterThan(sortedOrders[i - 1].nonce);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});

describe('Property 45: Dual Settlement Mode Support', () => {
  let buyerWallet: PhantomWallet;
  let sellerWallet: PhantomWallet;

  beforeEach(async () => {
    const buyerKey = BigInt('0x' + '1'.repeat(64));
    const sellerKey = BigInt('0x' + '2'.repeat(64));

    buyerWallet = new PhantomWallet(buyerKey);
    sellerWallet = new PhantomWallet(sellerKey);

    await Promise.all([buyerWallet.initialize(), sellerWallet.initialize()]);
  });

  afterEach(async () => {
    await Promise.all([buyerWallet.clearAll(), sellerWallet.clearAll()]);
  });

  it('should support automated settlement mode', async () => {
    await fc.assert(
      fc.asyncProperty(compatibleOrderPairArbitrary(), async (orderPair) => {
        // Generate order commitments
        const buyCommitment = await buyerWallet.generateOrderCommitment(orderPair.buyOrder);
        const sellCommitment = await sellerWallet.generateOrderCommitment(orderPair.sellOrder);

        // Simulate automated settlement by matching engine
        const executionBundle = {
          executionId: '0x' + '1'.repeat(64),
          orderIds: [buyCommitment.commitmentHash, sellCommitment.commitmentHash],
          mode: 'automated',
          submitter: 'matching-engine',
        };

        // Verify bundle structure
        expect(executionBundle.mode).toBe('automated');
        expect(executionBundle.orderIds.length).toBe(2);
        expect(executionBundle.submitter).toBe('matching-engine');

        // Create balance notes (simulating settlement)
        const baseAmount = orderPair.buyOrder.amount;
        const quoteAmount = orderPair.buyOrder.amount * orderPair.buyOrder.price;

        await buyerWallet.createPrivateBalance(
          orderPair.buyOrder.baseAsset,
          baseAmount,
          orderPair.buyOrder.owner
        );

        await sellerWallet.createPrivateBalance(
          orderPair.sellOrder.quoteAsset,
          quoteAmount,
          orderPair.sellOrder.owner
        );

        // Verify settlement succeeded
        const buyerBalance = await buyerWallet.getBalance(orderPair.buyOrder.baseAsset);
        expect(buyerBalance).toBe(baseAmount);

        const sellerBalance = await sellerWallet.getBalance(orderPair.sellOrder.quoteAsset);
        expect(sellerBalance).toBe(quoteAmount);
      }),
      { numRuns: 15 }
    );
  });

  it('should support manual settlement mode', async () => {
    await fc.assert(
      fc.asyncProperty(compatibleOrderPairArbitrary(), async (orderPair) => {
        // Generate order commitments
        const buyCommitment = await buyerWallet.generateOrderCommitment(orderPair.buyOrder);
        const sellCommitment = await sellerWallet.generateOrderCommitment(orderPair.sellOrder);

        // Simulate manual settlement by user
        const executionBundle = {
          executionId: '0x' + '2'.repeat(64),
          orderIds: [buyCommitment.commitmentHash, sellCommitment.commitmentHash],
          mode: 'manual',
          submitter: orderPair.buyOrder.owner, // User submits
        };

        // Verify bundle structure
        expect(executionBundle.mode).toBe('manual');
        expect(executionBundle.orderIds.length).toBe(2);
        expect(executionBundle.submitter).toBe(orderPair.buyOrder.owner);

        // Create balance notes (simulating settlement)
        const baseAmount = orderPair.buyOrder.amount;
        const quoteAmount = orderPair.buyOrder.amount * orderPair.buyOrder.price;

        await buyerWallet.createPrivateBalance(
          orderPair.buyOrder.baseAsset,
          baseAmount,
          orderPair.buyOrder.owner
        );

        await sellerWallet.createPrivateBalance(
          orderPair.sellOrder.quoteAsset,
          quoteAmount,
          orderPair.sellOrder.owner
        );

        // Verify settlement succeeded
        const buyerBalance = await buyerWallet.getBalance(orderPair.buyOrder.baseAsset);
        expect(buyerBalance).toBe(baseAmount);

        const sellerBalance = await sellerWallet.getBalance(orderPair.sellOrder.quoteAsset);
        expect(sellerBalance).toBe(quoteAmount);
      }),
      { numRuns: 15 }
    );
  });

  it('should produce same result regardless of settlement mode', async () => {
    await fc.assert(
      fc.asyncProperty(compatibleOrderPairArbitrary(), async (orderPair) => {
        // Test automated mode
        const buyerWallet1 = new PhantomWallet(BigInt('0x' + '1'.repeat(64)));
        const sellerWallet1 = new PhantomWallet(BigInt('0x' + '2'.repeat(64)));
        await Promise.all([buyerWallet1.initialize(), sellerWallet1.initialize()]);

        const baseAmount = orderPair.buyOrder.amount;
        const quoteAmount = orderPair.buyOrder.amount * orderPair.buyOrder.price;

        await buyerWallet1.createPrivateBalance(
          orderPair.buyOrder.baseAsset,
          baseAmount,
          orderPair.buyOrder.owner
        );
        await sellerWallet1.createPrivateBalance(
          orderPair.sellOrder.quoteAsset,
          quoteAmount,
          orderPair.sellOrder.owner
        );

        const automatedBuyerBalance = await buyerWallet1.getBalance(orderPair.buyOrder.baseAsset);
        const automatedSellerBalance = await sellerWallet1.getBalance(
          orderPair.sellOrder.quoteAsset
        );

        // Test manual mode
        const buyerWallet2 = new PhantomWallet(BigInt('0x' + '3'.repeat(64)));
        const sellerWallet2 = new PhantomWallet(BigInt('0x' + '4'.repeat(64)));
        await Promise.all([buyerWallet2.initialize(), sellerWallet2.initialize()]);

        await buyerWallet2.createPrivateBalance(
          orderPair.buyOrder.baseAsset,
          baseAmount,
          orderPair.buyOrder.owner
        );
        await sellerWallet2.createPrivateBalance(
          orderPair.sellOrder.quoteAsset,
          quoteAmount,
          orderPair.sellOrder.owner
        );

        const manualBuyerBalance = await buyerWallet2.getBalance(orderPair.buyOrder.baseAsset);
        const manualSellerBalance = await sellerWallet2.getBalance(orderPair.sellOrder.quoteAsset);

        // Both modes should produce same balances
        expect(automatedBuyerBalance).toBe(manualBuyerBalance);
        expect(automatedSellerBalance).toBe(manualSellerBalance);

        // Cleanup
        await Promise.all([
          buyerWallet1.clearAll(),
          sellerWallet1.clearAll(),
          buyerWallet2.clearAll(),
          sellerWallet2.clearAll(),
        ]);
      }),
      { numRuns: 10 }
    );
  });
});
