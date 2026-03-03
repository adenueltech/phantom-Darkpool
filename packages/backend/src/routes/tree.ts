import { Router, type Router as RouterType } from 'express';
import { getTreeInfo, generateMerkleProof } from '../services/treeService';

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

/**
 * GET /api/v1/commitment-tree/proof
 * Generate Merkle proof for a balance note
 */
router.get('/proof', async (req, res) => {
  try {
    const { asset, leafIndex } = req.query;
    
    if (!asset || leafIndex === undefined) {
      return res.status(400).json({ error: 'Missing required parameters: asset, leafIndex' });
    }
    
    const proof = await generateMerkleProof(
      asset as string,
      parseInt(leafIndex as string)
    );
    
    res.json(proof);
  } catch (error) {
    console.error('Merkle proof error:', error);
    res.status(500).json({ error: 'Failed to generate Merkle proof' });
  }
});

export default router;
