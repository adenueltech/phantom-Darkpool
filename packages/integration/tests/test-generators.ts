/**
 * Property-Based Test Generators
 * 
 * Provides fast-check arbitraries for generating test data
 * for Phantom Darkpool property-based tests.
 */

import * as fc from 'fast-check';

/**
 * Generate random Ethereum-like address
 */
export const addressArbitrary = (): fc.Arbitrary<string> =>
  fc
    .hexaString({ minLength: 40, maxLength: 40 })
    .map((hex) => `0x${hex}`);

/**
 * Generate random bytes32 value
 */
export const bytes32Arbitrary = (): fc.Arbitrary<string> =>
  fc
    .hexaString({ minLength: 64, maxLength: 64 })
    .map((hex) => `0x${hex}`);

/**
 * Generate random bigint in valid range
 */
export const bigIntArbitrary = (
  min: bigint = 1n,
  max: bigint = 2n ** 128n
): fc.Arbitrary<bigint> =>
  fc.bigInt({ min, max });

/**
 * Generate random asset address (non-zero)
 */
export const assetAddressArbitrary = (): fc.Arbitrary<string> =>
  fc
    .hexaString({ minLength: 40, maxLength: 40 })
    .filter((hex) => hex !== '0'.repeat(40))
    .map((hex) => `0x${hex}`);

/**
 * Generate random balance amount
 */
export const balanceAmountArbitrary = (): fc.Arbitrary<bigint> =>
  bigIntArbitrary(1n, 10n ** 18n * 1000000n); // Up to 1M tokens with 18 decimals

/**
 * Generate random price
 */
export const priceArbitrary = (): fc.Arbitrary<bigint> =>
  bigIntArbitrary(1n, 10n ** 18n * 100000n); // Up to 100k with 18 decimals

/**
 * Generate random salt for commitments
 */
export const saltArbitrary = (): fc.Arbitrary<bigint> =>
  bigIntArbitrary(0n, 2n ** 252n - 1n); // Field size for BN254

/**
 * Generate random timestamp in the future
 */
export const futureTimestampArbitrary = (): fc.Arbitrary<number> =>
  fc.integer({ min: Date.now() + 3600000, max: Date.now() + 86400000 * 30 }); // 1 hour to 30 days

/**
 * Generate random order type
 */
export const orderTypeArbitrary = (): fc.Arbitrary<'BUY' | 'SELL'> =>
  fc.constantFrom('BUY', 'SELL');

/**
 * Generate balance note data
 */
export interface BalanceNoteData {
  asset: string;
  amount: bigint;
  salt: bigint;
  owner: string;
}

export const balanceNoteDataArbitrary = (): fc.Arbitrary<BalanceNoteData> =>
  fc.record({
    asset: assetAddressArbitrary(),
    amount: balanceAmountArbitrary(),
    salt: saltArbitrary(),
    owner: addressArbitrary(),
  });

/**
 * Generate order parameters
 */
export interface OrderParamsData {
  baseAsset: string;
  quoteAsset: string;
  amount: bigint;
  price: bigint;
  orderType: 'BUY' | 'SELL';
  expiration: number;
  owner: string;
}

export const orderParamsArbitrary = (): fc.Arbitrary<OrderParamsData> =>
  fc
    .record({
      baseAsset: assetAddressArbitrary(),
      quoteAsset: assetAddressArbitrary(),
      amount: balanceAmountArbitrary(),
      price: priceArbitrary(),
      orderType: orderTypeArbitrary(),
      expiration: futureTimestampArbitrary(),
      owner: addressArbitrary(),
    })
    .filter((params) => params.baseAsset !== params.quoteAsset);

/**
 * Generate compatible order pair (matching asset pairs and prices)
 */
export interface CompatibleOrderPair {
  buyOrder: OrderParamsData;
  sellOrder: OrderParamsData;
}

export const compatibleOrderPairArbitrary = (): fc.Arbitrary<CompatibleOrderPair> =>
  fc
    .tuple(
      assetAddressArbitrary(),
      assetAddressArbitrary(),
      balanceAmountArbitrary(),
      priceArbitrary(),
      addressArbitrary(),
      addressArbitrary(),
      futureTimestampArbitrary()
    )
    .filter(([base, quote]) => base !== quote)
    .chain(([baseAsset, quoteAsset, amount, sellPrice, buyer, seller, expiration]) =>
      fc
        .integer({ min: Number(sellPrice), max: Number(sellPrice) * 2 })
        .map((buyPriceNum) => {
          const buyPrice = BigInt(buyPriceNum);
          return {
            buyOrder: {
              baseAsset,
              quoteAsset,
              amount,
              price: buyPrice,
              orderType: 'BUY' as const,
              expiration,
              owner: buyer,
            },
            sellOrder: {
              baseAsset,
              quoteAsset,
              amount,
              price: sellPrice,
              orderType: 'SELL' as const,
              expiration,
              owner: seller,
            },
          };
        })
    );

/**
 * Generate data scope for viewing keys
 */
export const dataScopeArbitrary = (): fc.Arbitrary<string> =>
  fc.constantFrom('BALANCE_NOTE', 'ORDER_COMMITMENT', 'TRADE_HISTORY', 'ALL');

/**
 * Generate master key for wallet
 */
export const masterKeyArbitrary = (): fc.Arbitrary<bigint> =>
  bigIntArbitrary(1n, 2n ** 256n - 1n);

/**
 * Generate nullifier secret
 */
export const nullifierSecretArbitrary = (): fc.Arbitrary<bigint> =>
  bigIntArbitrary(1n, 2n ** 252n - 1n);

/**
 * Generate array of balance notes with same asset
 */
export const sameAssetNotesArbitrary = (
  count: number
): fc.Arbitrary<BalanceNoteData[]> =>
  fc
    .tuple(assetAddressArbitrary(), fc.array(balanceAmountArbitrary(), { minLength: count, maxLength: count }))
    .chain(([asset, amounts]) =>
      fc.array(
        fc.record({
          asset: fc.constant(asset),
          amount: fc.constantFrom(...amounts),
          salt: saltArbitrary(),
          owner: addressArbitrary(),
        }),
        { minLength: count, maxLength: count }
      )
    );

/**
 * Generate multiple assets
 */
export const multipleAssetsArbitrary = (count: number): fc.Arbitrary<string[]> =>
  fc
    .array(assetAddressArbitrary(), { minLength: count, maxLength: count })
    .filter((assets) => {
      const uniqueAssets = new Set(assets);
      return uniqueAssets.size === assets.length;
    });
