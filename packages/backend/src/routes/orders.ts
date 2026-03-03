import { Router, type Router as RouterType } from 'express';
import { submitOrder, getOrderStatus, getActiveOrders } from '../services/orderService';

const router: RouterType = Router();

/**
 * POST /api/v1/orders
 * Submit a new order
 */
router.post('/', async (req, res) => {
  try {
    const { orderCommitment, expiration, orderValidityProof } = req.body;
    
    if (!orderCommitment || !expiration || !orderValidityProof) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await submitOrder({
      orderCommitment,
      expiration,
      orderValidityProof
    });
    
    res.json(result);
  } catch (error) {
    console.error('Order submission error:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

/**
 * GET /api/v1/orders/:orderId/status
 * Get order status
 */
router.get('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const status = await getOrderStatus(orderId);
    
    if (!status) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(status);
  } catch (error) {
    console.error('Order status error:', error);
    res.status(500).json({ error: 'Failed to get order status' });
  }
});

/**
 * GET /api/v1/orders/active
 * Get all active orders
 */
router.get('/active', async (req, res) => {
  try {
    const orders = await getActiveOrders();
    res.json({ orders });
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({ error: 'Failed to get active orders' });
  }
});

export default router;
