import { Router, type Router as RouterType } from 'express';
import { getTreeInfo } from '../services/treeService';

const router: RouterType = Router();

/**
 * GET /api/v1/commitment-tree
 * Get commitment tree information
 */
router.get('/', async (req, res) => {
  try {
    const { asset } = req.query;
    
    const treeInfo = await getTreeInfo(asset as string);
    
    res.json(treeInfo);
  } catch (error) {
    console.error('Tree info error:', error);
    res.status(500).json({ error: 'Failed to get tree info' });
  }
});

export default router;
