/**
 * Poseidon Hash Function Tests
 */

import {
  initPoseidon,
  poseidonHash,
  poseidonHash2,
  poseidonHashMany,
  generateNullifier,
  hashMerkleNode,
  generateOrderCommitmentHash,
  hexToBigInt,
  bigIntToHex,
} from '../poseidon';

describe('Poseidon Hash Function', () => {
  beforeAll(async () => {
    await initPoseidon();
  });

  describe('poseidonHash', () => {
    it('should hash a single value', async () => {
      const input = BigInt(12345);
      const hash = await poseidonHash(input);
      
      expect(typeof hash).toBe('bigint');
      expect(hash).toBeGreaterThan(0n);
    });

    it('should produce deterministic hashes', async () => {
      const input = BigInt(99999);
      const hash1 = await poseidonHash(input);
      const hash2 = await poseidonHash(input);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await poseidonHash(BigInt(1));
      const hash2 = await poseidonHash(BigInt(2));
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('poseidonHash2', () => {
    it('should hash two values', async () => {
      const left = BigInt(100);
      const right = BigInt(200);
      const hash = await poseidonHash2(left, right);
      
      expect(typeof hash).toBe('bigint');
      expect(hash).toBeGreaterThan(0n);
    });

    it('should be deterministic', async () => {
      const left = BigInt(111);
      const right = BigInt(222);
      const hash1 = await poseidonHash2(left, right);
      const hash2 = await poseidonHash2(left, right);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await poseidonHash2(BigInt(1), BigInt(2));
      const hash2 = await poseidonHash2(BigInt(2), BigInt(1));
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes when order changes', async () => {
      const a = BigInt(100);
      const b = BigInt(200);
      const hashAB = await poseidonHash2(a, b);
      const hashBA = await poseidonHash2(b, a);
      
      expect(hashAB).not.toBe(hashBA);
    });
  });

  describe('poseidonHashMany', () => {
    it('should hash multiple values', async () => {
      const inputs = [BigInt(1), BigInt(2), BigInt(3), BigInt(4)];
      const hash = await poseidonHashMany(inputs);
      
      expect(typeof hash).toBe('bigint');
      expect(hash).toBeGreaterThan(0n);
    });

    it('should be deterministic', async () => {
      const inputs = [BigInt(10), BigInt(20), BigInt(30)];
      const hash1 = await poseidonHashMany(inputs);
      const hash2 = await poseidonHashMany(inputs);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different input arrays', async () => {
      const hash1 = await poseidonHashMany([BigInt(1), BigInt(2), BigInt(3)]);
      const hash2 = await poseidonHashMany([BigInt(3), BigInt(2), BigInt(1)]);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty array', async () => {
      const hash = await poseidonHashMany([]);
      expect(typeof hash).toBe('bigint');
    });

    it('should handle single element', async () => {
      const hash = await poseidonHashMany([BigInt(42)]);
      expect(typeof hash).toBe('bigint');
    });
  });

  describe('generateNullifier', () => {
    it('should generate nullifier from commitment and secret', async () => {
      const commitment = BigInt('0x123456789abcdef');
      const secret = BigInt('0xfedcba987654321');
      
      const nullifier = await generateNullifier(commitment, secret);
      
      expect(typeof nullifier).toBe('bigint');
      expect(nullifier).toBeGreaterThan(0n);
    });

    it('should be deterministic', async () => {
      const commitment = BigInt(12345);
      const secret = BigInt(67890);
      
      const nullifier1 = await generateNullifier(commitment, secret);
      const nullifier2 = await generateNullifier(commitment, secret);
      
      expect(nullifier1).toBe(nullifier2);
    });

    it('should produce different nullifiers for different commitments', async () => {
      const secret = BigInt(99999);
      const nullifier1 = await generateNullifier(BigInt(1), secret);
      const nullifier2 = await generateNullifier(BigInt(2), secret);
      
      expect(nullifier1).not.toBe(nullifier2);
    });

    it('should produce different nullifiers for different secrets', async () => {
      const commitment = BigInt(12345);
      const nullifier1 = await generateNullifier(commitment, BigInt(1));
      const nullifier2 = await generateNullifier(commitment, BigInt(2));
      
      expect(nullifier1).not.toBe(nullifier2);
    });
  });

  describe('hashMerkleNode', () => {
    it('should hash two child nodes', async () => {
      const left = BigInt('0x111');
      const right = BigInt('0x222');
      
      const parent = await hashMerkleNode(left, right);
      
      expect(typeof parent).toBe('bigint');
      expect(parent).toBeGreaterThan(0n);
    });

    it('should be deterministic', async () => {
      const left = BigInt(100);
      const right = BigInt(200);
      
      const hash1 = await hashMerkleNode(left, right);
      const hash2 = await hashMerkleNode(left, right);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('generateOrderCommitmentHash', () => {
    it('should generate order commitment hash', async () => {
      const params = {
        baseAsset: BigInt('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'),
        quoteAsset: BigInt('0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8'),
        amount: BigInt('1000000000000000000'),
        price: BigInt('2000000000000000000'),
        orderType: BigInt(0), // BUY
        expiration: BigInt(Math.floor(Date.now() / 1000) + 3600),
        nonce: BigInt(1),
        owner: BigInt('0x' + '1'.repeat(64)),
      };
      
      const hash = await generateOrderCommitmentHash(params);
      
      expect(typeof hash).toBe('bigint');
      expect(hash).toBeGreaterThan(0n);
    });

    it('should be deterministic', async () => {
      const params = {
        baseAsset: BigInt(1),
        quoteAsset: BigInt(2),
        amount: BigInt(100),
        price: BigInt(200),
        orderType: BigInt(0),
        expiration: BigInt(1000),
        nonce: BigInt(1),
        owner: BigInt(999),
      };
      
      const hash1 = await generateOrderCommitmentHash(params);
      const hash2 = await generateOrderCommitmentHash(params);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different orders', async () => {
      const params1 = {
        baseAsset: BigInt(1),
        quoteAsset: BigInt(2),
        amount: BigInt(100),
        price: BigInt(200),
        orderType: BigInt(0),
        expiration: BigInt(1000),
        nonce: BigInt(1),
        owner: BigInt(999),
      };
      
      const params2 = {
        ...params1,
        amount: BigInt(200), // Different amount
      };
      
      const hash1 = await generateOrderCommitmentHash(params1);
      const hash2 = await generateOrderCommitmentHash(params2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for BUY vs SELL', async () => {
      const baseParams = {
        baseAsset: BigInt(1),
        quoteAsset: BigInt(2),
        amount: BigInt(100),
        price: BigInt(200),
        expiration: BigInt(1000),
        nonce: BigInt(1),
        owner: BigInt(999),
      };
      
      const buyHash = await generateOrderCommitmentHash({
        ...baseParams,
        orderType: BigInt(0),
      });
      
      const sellHash = await generateOrderCommitmentHash({
        ...baseParams,
        orderType: BigInt(1),
      });
      
      expect(buyHash).not.toBe(sellHash);
    });
  });

  describe('utility functions', () => {
    it('should convert hex to bigint', () => {
      const hex = '0x123456789abcdef';
      const bigint = hexToBigInt(hex);
      
      expect(typeof bigint).toBe('bigint');
      expect(bigint).toBe(BigInt(hex));
    });

    it('should convert bigint to hex', () => {
      const value = BigInt('0x123456789abcdef');
      const hex = bigIntToHex(value);
      
      expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
      expect(BigInt(hex)).toBe(value);
    });

    it('should round-trip hex conversion', () => {
      const original = BigInt('0x123456789abcdef0123456789abcdef');
      const hex = bigIntToHex(original);
      const restored = hexToBigInt(hex);
      
      expect(restored).toBe(original);
    });
  });
});
