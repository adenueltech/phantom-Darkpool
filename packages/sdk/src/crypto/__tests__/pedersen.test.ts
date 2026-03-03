/**
 * Pedersen Commitment Tests
 */

import {
  createBalanceCommitment,
  verifyBalanceCommitment,
  generateRandomSalt,
  createBalanceNote,
  addressToBigInt,
  bigIntToAddress,
  BalanceNoteData,
} from '../pedersen';

describe('Pedersen Commitment System', () => {
  describe('createBalanceCommitment', () => {
    it('should create commitment from balance note data', () => {
      const data: BalanceNoteData = {
        asset: BigInt('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'),
        amount: BigInt('1000000000000000000'),
        salt: BigInt('0x' + '1'.repeat(64)),
        owner: BigInt('0x' + '2'.repeat(64)),
      };
      
      const commitment = createBalanceCommitment(data);
      
      expect(typeof commitment).toBe('bigint');
      expect(commitment).toBeGreaterThan(0n);
    });

    it('should be deterministic', () => {
      const data: BalanceNoteData = {
        asset: BigInt(1),
        amount: BigInt(100),
        salt: BigInt(999),
        owner: BigInt(777),
      };
      
      const commitment1 = createBalanceCommitment(data);
      const commitment2 = createBalanceCommitment(data);
      
      expect(commitment1).toBe(commitment2);
    });

    it('should produce different commitments for different amounts', () => {
      const baseData: BalanceNoteData = {
        asset: BigInt(1),
        amount: BigInt(100),
        salt: BigInt(999),
        owner: BigInt(777),
      };
      
      const commitment1 = createBalanceCommitment(baseData);
      const commitment2 = createBalanceCommitment({
        ...baseData,
        amount: BigInt(200),
      });
      
      expect(commitment1).not.toBe(commitment2);
    });

    it('should produce different commitments for different salts', () => {
      const baseData: BalanceNoteData = {
        asset: BigInt(1),
        amount: BigInt(100),
        salt: BigInt(999),
        owner: BigInt(777),
      };
      
      const commitment1 = createBalanceCommitment(baseData);
      const commitment2 = createBalanceCommitment({
        ...baseData,
        salt: BigInt(888),
      });
      
      expect(commitment1).not.toBe(commitment2);
    });

    it('should produce different commitments for different owners', () => {
      const baseData: BalanceNoteData = {
        asset: BigInt(1),
        amount: BigInt(100),
        salt: BigInt(999),
        owner: BigInt(777),
      };
      
      const commitment1 = createBalanceCommitment(baseData);
      const commitment2 = createBalanceCommitment({
        ...baseData,
        owner: BigInt(888),
      });
      
      expect(commitment1).not.toBe(commitment2);
    });

    it('should produce different commitments for different assets', () => {
      const baseData: BalanceNoteData = {
        asset: BigInt(1),
        amount: BigInt(100),
        salt: BigInt(999),
        owner: BigInt(777),
      };
      
      const commitment1 = createBalanceCommitment(baseData);
      const commitment2 = createBalanceCommitment({
        ...baseData,
        asset: BigInt(2),
      });
      
      expect(commitment1).not.toBe(commitment2);
    });
  });

  describe('verifyBalanceCommitment', () => {
    it('should verify valid commitment', () => {
      const data: BalanceNoteData = {
        asset: BigInt(1),
        amount: BigInt(100),
        salt: BigInt(999),
        owner: BigInt(777),
      };
      
      const commitment = createBalanceCommitment(data);
      const isValid = verifyBalanceCommitment(commitment, data);
      
      expect(isValid).toBe(true);
    });

    it('should reject commitment with wrong amount', () => {
      const data: BalanceNoteData = {
        asset: BigInt(1),
        amount: BigInt(100),
        salt: BigInt(999),
        owner: BigInt(777),
      };
      
      const commitment = createBalanceCommitment(data);
      const isValid = verifyBalanceCommitment(commitment, {
        ...data,
        amount: BigInt(200),
      });
      
      expect(isValid).toBe(false);
    });

    it('should reject commitment with wrong salt', () => {
      const data: BalanceNoteData = {
        asset: BigInt(1),
        amount: BigInt(100),
        salt: BigInt(999),
        owner: BigInt(777),
      };
      
      const commitment = createBalanceCommitment(data);
      const isValid = verifyBalanceCommitment(commitment, {
        ...data,
        salt: BigInt(888),
      });
      
      expect(isValid).toBe(false);
    });

    it('should reject commitment with wrong owner', () => {
      const data: BalanceNoteData = {
        asset: BigInt(1),
        amount: BigInt(100),
        salt: BigInt(999),
        owner: BigInt(777),
      };
      
      const commitment = createBalanceCommitment(data);
      const isValid = verifyBalanceCommitment(commitment, {
        ...data,
        owner: BigInt(888),
      });
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateRandomSalt', () => {
    it('should generate random salt', () => {
      const salt = generateRandomSalt();
      
      expect(typeof salt).toBe('bigint');
      expect(salt).toBeGreaterThan(0n);
    });

    it('should generate different salts', () => {
      const salt1 = generateRandomSalt();
      const salt2 = generateRandomSalt();
      
      expect(salt1).not.toBe(salt2);
    });

    it('should generate salts with sufficient entropy', () => {
      const salts = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        salts.add(generateRandomSalt().toString());
      }
      
      // All 100 salts should be unique
      expect(salts.size).toBe(100);
    });
  });

  describe('createBalanceNote', () => {
    it('should create complete balance note', () => {
      const asset = BigInt('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7');
      const amount = BigInt('1000000000000000000');
      const owner = BigInt('0x' + '1'.repeat(64));
      
      const note = createBalanceNote(asset, amount, owner);
      
      expect(note.asset).toBe(asset);
      expect(note.amount).toBe(amount);
      expect(note.owner).toBe(owner);
      expect(typeof note.salt).toBe('bigint');
      expect(typeof note.commitment).toBe('bigint');
      expect(note.salt).toBeGreaterThan(0n);
      expect(note.commitment).toBeGreaterThan(0n);
    });

    it('should create note with provided salt', () => {
      const asset = BigInt(1);
      const amount = BigInt(100);
      const owner = BigInt(777);
      const salt = BigInt(999);
      
      const note = createBalanceNote(asset, amount, owner, salt);
      
      expect(note.salt).toBe(salt);
    });

    it('should create note with random salt if not provided', () => {
      const asset = BigInt(1);
      const amount = BigInt(100);
      const owner = BigInt(777);
      
      const note1 = createBalanceNote(asset, amount, owner);
      const note2 = createBalanceNote(asset, amount, owner);
      
      expect(note1.salt).not.toBe(note2.salt);
      expect(note1.commitment).not.toBe(note2.commitment);
    });

    it('should create verifiable commitment', () => {
      const asset = BigInt(1);
      const amount = BigInt(100);
      const owner = BigInt(777);
      
      const note = createBalanceNote(asset, amount, owner);
      
      const isValid = verifyBalanceCommitment(note.commitment, {
        asset: note.asset,
        amount: note.amount,
        salt: note.salt,
        owner: note.owner,
      });
      
      expect(isValid).toBe(true);
    });
  });

  describe('address conversion utilities', () => {
    it('should convert address to bigint', () => {
      const address = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const bigint = addressToBigInt(address);
      
      expect(typeof bigint).toBe('bigint');
      expect(bigint).toBeGreaterThan(0n);
    });

    it('should handle address without 0x prefix', () => {
      const address = '049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const bigint = addressToBigInt(address);
      
      expect(typeof bigint).toBe('bigint');
      expect(bigint).toBeGreaterThan(0n);
    });

    it('should convert bigint to address', () => {
      const value = BigInt('0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7');
      const address = bigIntToAddress(value);
      
      expect(address).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('should round-trip address conversion', () => {
      const original = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const bigint = addressToBigInt(original);
      const restored = bigIntToAddress(bigint);
      
      expect(restored.toLowerCase()).toBe(original.toLowerCase());
    });
  });

  describe('commitment properties', () => {
    it('should demonstrate binding property', () => {
      // Cannot change values without changing commitment
      const data: BalanceNoteData = {
        asset: BigInt(1),
        amount: BigInt(100),
        salt: BigInt(999),
        owner: BigInt(777),
      };
      
      const commitment = createBalanceCommitment(data);
      
      // Changing any value changes the commitment
      const modifiedData = { ...data, amount: BigInt(101) };
      const modifiedCommitment = createBalanceCommitment(modifiedData);
      
      expect(commitment).not.toBe(modifiedCommitment);
    });

    it('should demonstrate hiding property', () => {
      // Commitment reveals nothing about underlying values
      // Two different notes with same commitment would be impossible to create
      const note1 = createBalanceNote(BigInt(1), BigInt(100), BigInt(777));
      const note2 = createBalanceNote(BigInt(1), BigInt(100), BigInt(777));
      
      // Different salts mean different commitments
      expect(note1.commitment).not.toBe(note2.commitment);
      
      // Cannot determine amount from commitment alone
      expect(note1.commitment.toString()).not.toContain('100');
    });

    it('should demonstrate unlinkability', () => {
      // Cannot link multiple notes to same owner without viewing key
      const owner = BigInt(777);
      
      const note1 = createBalanceNote(BigInt(1), BigInt(100), owner);
      const note2 = createBalanceNote(BigInt(1), BigInt(200), owner);
      
      // Commitments don't reveal they belong to same owner
      expect(note1.commitment).not.toBe(note2.commitment);
      
      // No obvious relationship between commitments
      const diff = note1.commitment > note2.commitment 
        ? note1.commitment - note2.commitment 
        : note2.commitment - note1.commitment;
      
      // Difference should be large and unpredictable
      expect(diff).toBeGreaterThan(1000n);
    });
  });
});
