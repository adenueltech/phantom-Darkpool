/**
 * Nullifier System Tests
 */

import {
  generateNullifier,
  deriveNullifierSecret,
  generateMasterKey,
  NullifierTracker,
  verifyNullifier,
  nullifierToHex,
  hexToNullifier,
} from '../nullifier';

describe('Nullifier Generation System', () => {
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

    it('should produce unique nullifiers for different commitments', async () => {
      const secret = BigInt(99999);
      
      const nullifier1 = await generateNullifier(BigInt(1), secret);
      const nullifier2 = await generateNullifier(BigInt(2), secret);
      
      expect(nullifier1).not.toBe(nullifier2);
    });

    it('should produce unique nullifiers for different secrets', async () => {
      const commitment = BigInt(12345);
      
      const nullifier1 = await generateNullifier(commitment, BigInt(1));
      const nullifier2 = await generateNullifier(commitment, BigInt(2));
      
      expect(nullifier1).not.toBe(nullifier2);
    });

    it('should demonstrate unlinkability', async () => {
      // Cannot link nullifier to commitment without secret
      const commitment = BigInt('0x123456789abcdef');
      const secret = BigInt('0xfedcba987654321');
      
      const nullifier = await generateNullifier(commitment, secret);
      
      // Nullifier should not reveal commitment
      expect(nullifier).not.toBe(commitment);
      expect(nullifier.toString()).not.toContain(commitment.toString().slice(0, 10));
    });
  });

  describe('deriveNullifierSecret', () => {
    it('should derive nullifier secret from master key and index', async () => {
      const masterKey = BigInt('0x' + '1'.repeat(64));
      const index = BigInt(0);
      
      const secret = await deriveNullifierSecret(masterKey, index);
      
      expect(typeof secret).toBe('bigint');
      expect(secret).toBeGreaterThan(0n);
    });

    it('should be deterministic', async () => {
      const masterKey = BigInt('0x' + '1'.repeat(64));
      const index = BigInt(5);
      
      const secret1 = await deriveNullifierSecret(masterKey, index);
      const secret2 = await deriveNullifierSecret(masterKey, index);
      
      expect(secret1).toBe(secret2);
    });

    it('should produce different secrets for different indices', async () => {
      const masterKey = BigInt('0x' + '1'.repeat(64));
      
      const secret0 = await deriveNullifierSecret(masterKey, BigInt(0));
      const secret1 = await deriveNullifierSecret(masterKey, BigInt(1));
      const secret2 = await deriveNullifierSecret(masterKey, BigInt(2));
      
      expect(secret0).not.toBe(secret1);
      expect(secret1).not.toBe(secret2);
      expect(secret0).not.toBe(secret2);
    });

    it('should produce different secrets for different master keys', async () => {
      const index = BigInt(0);
      
      const secret1 = await deriveNullifierSecret(BigInt('0x' + '1'.repeat(64)), index);
      const secret2 = await deriveNullifierSecret(BigInt('0x' + '2'.repeat(64)), index);
      
      expect(secret1).not.toBe(secret2);
    });

    it('should support hierarchical key derivation', async () => {
      const masterKey = BigInt('0x' + '1'.repeat(64));
      
      // Derive secrets for multiple balance notes
      const secrets = await Promise.all([
        deriveNullifierSecret(masterKey, BigInt(0)),
        deriveNullifierSecret(masterKey, BigInt(1)),
        deriveNullifierSecret(masterKey, BigInt(2)),
        deriveNullifierSecret(masterKey, BigInt(3)),
        deriveNullifierSecret(masterKey, BigInt(4)),
      ]);
      
      // All secrets should be unique
      const uniqueSecrets = new Set(secrets.map(s => s.toString()));
      expect(uniqueSecrets.size).toBe(5);
    });
  });

  describe('generateMasterKey', () => {
    it('should generate master key from 32-byte seed', () => {
      const seed = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        seed[i] = i;
      }
      
      const masterKey = generateMasterKey(seed);
      
      expect(typeof masterKey).toBe('bigint');
      expect(masterKey).toBeGreaterThan(0n);
    });

    it('should be deterministic', () => {
      const seed = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        seed[i] = i;
      }
      
      const key1 = generateMasterKey(seed);
      const key2 = generateMasterKey(seed);
      
      expect(key1).toBe(key2);
    });

    it('should produce different keys for different seeds', () => {
      const seed1 = new Uint8Array(32).fill(1);
      const seed2 = new Uint8Array(32).fill(2);
      
      const key1 = generateMasterKey(seed1);
      const key2 = generateMasterKey(seed2);
      
      expect(key1).not.toBe(key2);
    });

    it('should throw error for invalid seed length', () => {
      const invalidSeed = new Uint8Array(16); // Wrong length
      
      expect(() => generateMasterKey(invalidSeed)).toThrow('Seed must be 32 bytes');
    });
  });

  describe('NullifierTracker', () => {
    let tracker: NullifierTracker;

    beforeEach(() => {
      tracker = new NullifierTracker();
    });

    describe('markSpent', () => {
      it('should mark nullifier as spent', () => {
        const nullifier = BigInt(12345);
        const commitment = BigInt(67890);
        
        tracker.markSpent({ nullifier, commitment });
        
        expect(tracker.isSpent(nullifier)).toBe(true);
      });

      it('should store spent timestamp', () => {
        const nullifier = BigInt(12345);
        const commitment = BigInt(67890);
        
        const before = Date.now();
        tracker.markSpent({ nullifier, commitment });
        const after = Date.now();
        
        const entry = tracker.getEntry(nullifier);
        expect(entry).toBeDefined();
        expect(entry!.spentAt).toBeGreaterThanOrEqual(before);
        expect(entry!.spentAt).toBeLessThanOrEqual(after);
      });

      it('should remove from pending when marked spent', () => {
        const nullifier = BigInt(12345);
        const commitment = BigInt(67890);
        
        tracker.markPending({ nullifier, commitment });
        expect(tracker.isPending(nullifier)).toBe(true);
        
        tracker.markSpent({ nullifier, commitment });
        expect(tracker.isPending(nullifier)).toBe(false);
        expect(tracker.isSpent(nullifier)).toBe(true);
      });
    });

    describe('markPending', () => {
      it('should mark nullifier as pending', () => {
        const nullifier = BigInt(12345);
        const commitment = BigInt(67890);
        
        tracker.markPending({ nullifier, commitment });
        
        expect(tracker.isPending(nullifier)).toBe(true);
        expect(tracker.isSpent(nullifier)).toBe(false);
      });
    });

    describe('isSpent', () => {
      it('should return false for unspent nullifier', () => {
        const nullifier = BigInt(12345);
        expect(tracker.isSpent(nullifier)).toBe(false);
      });

      it('should return true for spent nullifier', () => {
        const nullifier = BigInt(12345);
        tracker.markSpent({ nullifier, commitment: BigInt(67890) });
        expect(tracker.isSpent(nullifier)).toBe(true);
      });
    });

    describe('isPending', () => {
      it('should return false for non-pending nullifier', () => {
        const nullifier = BigInt(12345);
        expect(tracker.isPending(nullifier)).toBe(false);
      });

      it('should return true for pending nullifier', () => {
        const nullifier = BigInt(12345);
        tracker.markPending({ nullifier, commitment: BigInt(67890) });
        expect(tracker.isPending(nullifier)).toBe(true);
      });
    });

    describe('getEntry', () => {
      it('should return undefined for unknown nullifier', () => {
        const entry = tracker.getEntry(BigInt(99999));
        expect(entry).toBeUndefined();
      });

      it('should return entry for spent nullifier', () => {
        const nullifier = BigInt(12345);
        const commitment = BigInt(67890);
        
        tracker.markSpent({ nullifier, commitment });
        
        const entry = tracker.getEntry(nullifier);
        expect(entry).toBeDefined();
        expect(entry!.nullifier).toBe(nullifier);
        expect(entry!.commitment).toBe(commitment);
      });

      it('should return entry for pending nullifier', () => {
        const nullifier = BigInt(12345);
        const commitment = BigInt(67890);
        
        tracker.markPending({ nullifier, commitment });
        
        const entry = tracker.getEntry(nullifier);
        expect(entry).toBeDefined();
        expect(entry!.nullifier).toBe(nullifier);
      });
    });

    describe('getSpentNullifiers', () => {
      it('should return empty array initially', () => {
        expect(tracker.getSpentNullifiers()).toEqual([]);
      });

      it('should return all spent nullifiers', () => {
        tracker.markSpent({ nullifier: BigInt(1), commitment: BigInt(10) });
        tracker.markSpent({ nullifier: BigInt(2), commitment: BigInt(20) });
        tracker.markSpent({ nullifier: BigInt(3), commitment: BigInt(30) });
        
        const spent = tracker.getSpentNullifiers();
        expect(spent.length).toBe(3);
      });

      it('should not include pending nullifiers', () => {
        tracker.markSpent({ nullifier: BigInt(1), commitment: BigInt(10) });
        tracker.markPending({ nullifier: BigInt(2), commitment: BigInt(20) });
        
        const spent = tracker.getSpentNullifiers();
        expect(spent.length).toBe(1);
        expect(spent[0].nullifier).toBe(BigInt(1));
      });
    });

    describe('clearPending', () => {
      it('should clear pending nullifier', () => {
        const nullifier = BigInt(12345);
        
        tracker.markPending({ nullifier, commitment: BigInt(67890) });
        expect(tracker.isPending(nullifier)).toBe(true);
        
        tracker.clearPending(nullifier);
        expect(tracker.isPending(nullifier)).toBe(false);
      });

      it('should not affect spent nullifiers', () => {
        const nullifier = BigInt(12345);
        
        tracker.markSpent({ nullifier, commitment: BigInt(67890) });
        tracker.clearPending(nullifier);
        
        expect(tracker.isSpent(nullifier)).toBe(true);
      });
    });

    describe('state persistence', () => {
      it('should export and import state', () => {
        tracker.markSpent({ nullifier: BigInt(1), commitment: BigInt(10) });
        tracker.markPending({ nullifier: BigInt(2), commitment: BigInt(20) });
        
        const exported = tracker.export();
        
        const newTracker = new NullifierTracker();
        newTracker.import(exported);
        
        expect(newTracker.isSpent(BigInt(1))).toBe(true);
        expect(newTracker.isPending(BigInt(2))).toBe(true);
      });

      it('should preserve all entry data', () => {
        const entry = {
          nullifier: BigInt(12345),
          commitment: BigInt(67890),
          transactionHash: '0xabc123',
        };
        
        tracker.markSpent(entry);
        
        const exported = tracker.export();
        const newTracker = new NullifierTracker();
        newTracker.import(exported);
        
        const restored = newTracker.getEntry(entry.nullifier);
        expect(restored).toBeDefined();
        expect(restored!.nullifier.toString()).toBe(entry.nullifier.toString());
        expect(restored!.commitment.toString()).toBe(entry.commitment.toString());
      });
    });
  });

  describe('verifyNullifier', () => {
    it('should verify valid nullifier', async () => {
      const commitment = BigInt(12345);
      const secret = BigInt(67890);
      
      const nullifier = await generateNullifier(commitment, secret);
      const isValid = await verifyNullifier(nullifier, commitment, secret);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid nullifier', async () => {
      const commitment = BigInt(12345);
      const secret = BigInt(67890);
      
      const wrongNullifier = BigInt(99999);
      const isValid = await verifyNullifier(wrongNullifier, commitment, secret);
      
      expect(isValid).toBe(false);
    });

    it('should reject nullifier with wrong commitment', async () => {
      const commitment = BigInt(12345);
      const secret = BigInt(67890);
      
      const nullifier = await generateNullifier(commitment, secret);
      const isValid = await verifyNullifier(nullifier, BigInt(11111), secret);
      
      expect(isValid).toBe(false);
    });

    it('should reject nullifier with wrong secret', async () => {
      const commitment = BigInt(12345);
      const secret = BigInt(67890);
      
      const nullifier = await generateNullifier(commitment, secret);
      const isValid = await verifyNullifier(nullifier, commitment, BigInt(11111));
      
      expect(isValid).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should convert nullifier to hex', () => {
      const nullifier = BigInt('0x123456789abcdef');
      const hex = nullifierToHex(nullifier);
      
      expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('should convert hex to nullifier', () => {
      const hex = '0x123456789abcdef';
      const nullifier = hexToNullifier(hex);
      
      expect(typeof nullifier).toBe('bigint');
      expect(nullifier).toBe(BigInt(hex));
    });

    it('should round-trip hex conversion', () => {
      const original = BigInt('0x123456789abcdef0123456789abcdef');
      const hex = nullifierToHex(original);
      const restored = hexToNullifier(hex);
      
      expect(restored).toBe(original);
    });
  });

  describe('integration scenarios', () => {
    it('should support complete nullifier lifecycle', async () => {
      // 1. Generate master key
      const seed = new Uint8Array(32).fill(42);
      const masterKey = generateMasterKey(seed);
      
      // 2. Derive nullifier secret for first balance note
      const secret = await deriveNullifierSecret(masterKey, BigInt(0));
      
      // 3. Generate nullifier from commitment
      const commitment = BigInt('0x123456789abcdef');
      const nullifier = await generateNullifier(commitment, secret);
      
      // 4. Track nullifier
      const tracker = new NullifierTracker();
      tracker.markPending({ nullifier, commitment });
      
      expect(tracker.isPending(nullifier)).toBe(true);
      
      // 5. Mark as spent after transaction confirms
      tracker.markSpent({ nullifier, commitment });
      
      expect(tracker.isSpent(nullifier)).toBe(true);
      expect(tracker.isPending(nullifier)).toBe(false);
      
      // 6. Verify nullifier
      const isValid = await verifyNullifier(nullifier, commitment, secret);
      expect(isValid).toBe(true);
    });

    it('should prevent double-spending', async () => {
      const tracker = new NullifierTracker();
      const nullifier = BigInt(12345);
      const commitment = BigInt(67890);
      
      // First spend
      tracker.markSpent({ nullifier, commitment });
      
      // Attempt double-spend
      const canSpendAgain = !tracker.isSpent(nullifier);
      
      expect(canSpendAgain).toBe(false);
    });
  });
});
