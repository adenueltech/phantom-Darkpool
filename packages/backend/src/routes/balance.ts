import { Router, type Router as RouterType } from 'express';
import { generateBalanceProof } from '../services/balanceService';

const router: RouterType = Router();

/**
 * GET /api/v1/balance-proof
 * Generate balance proof for withdrawal
 */
router.get('/proof', async (req, res) => {
  try {
    const { asset, minAmount, noteIndex } = req.query;
    
    if (!asset || !minAmount || !noteIndex) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const proof = await generateBalanceProof({
      asset: asset as string,
      minAmount: minAmount as string,
      noteIndex: parseInt(noteIndex as string)
    });
    
    res.json(proof);
  } catch (error) {
    console.error('Balance proof error:', error);
    res.status(500).json({ error: 'Failed to generate balance proof' });
  }
});

/**
 * POST /api/v1/balance/withdraw
 * Submit withdrawal request
 */
router.post('/withdraw', async (req, res) => {
  try {
    const { nullifier, recipient, amount, asset, balanceProof, merkleProof } = req.body;
    
    if (!nullifier || !recipient || !amount || !asset || !balanceProof || !merkleProof) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Submit withdrawal to Shielded Vault contract
    // This would call the smart contract
    
    res.json({ 
      status: 'pending',
      message: 'Withdrawal submitted'
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

export default router;
