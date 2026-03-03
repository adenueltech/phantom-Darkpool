import { Router, type Router as RouterType } from 'express';
import { getTransactionHistory } from '../services/transactionService';

const router: RouterType = Router();

/**
 * GET /api/v1/transactions
 * Get transaction history for a wallet address
 */
router.get('/', async (req, res) => {
  try {
    const { address, limit, offset } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Missing required parameter: address' });
    }
    
    const transactions = await getTransactionHistory({
      address: address as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    
    res.json({ transactions });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

/**
 * GET /api/v1/transactions/:txHash
 * Get details for a specific transaction
 */
router.get('/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    // In production, query blockchain for transaction details
    // For now, return mock response
    res.json({
      txHash,
      type: 'deposit',
      asset: 'ETH',
      amount: '2.5',
      status: 'confirmed',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      blockNumber: 123456,
      confirmations: 12,
    });
  } catch (error) {
    console.error('Transaction details error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

export default router;
