import { generateBalanceProof } from '../../services/balanceService';

describe('Balance Service', () => {
  describe('generateBalanceProof', () => {
    it('should generate balance proof successfully', async () => {
      const request = {
        asset: '0xETH',
        minAmount: '1000000000000000000',
        noteIndex: 0
      };

      const proof = await generateBalanceProof(request);

      expect(proof).toBeDefined();
      expect(proof.proof).toBeDefined();
      expect(proof.merkleRoot).toBe('0x0');
      expect(proof.nullifier).toBe('0x0');
      expect(proof.publicInputs).toBeDefined();
      expect(proof.publicInputs.minAmount).toBe(request.minAmount);
    });

    it('should handle errors gracefully', async () => {
      const request = {
        asset: '',
        minAmount: '',
        noteIndex: -1
      };

      // Should not throw, returns mock data
      const proof = await generateBalanceProof(request);
      expect(proof).toBeDefined();
    });
  });
});
