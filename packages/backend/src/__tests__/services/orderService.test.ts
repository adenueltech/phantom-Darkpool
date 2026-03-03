import { submitOrder, getOrderStatus, getActiveOrders } from '../../services/orderService';

describe('Order Service', () => {
  describe('submitOrder', () => {
    it('should submit order successfully', async () => {
      const orderData = {
        orderCommitment: '0x123abc',
        expiration: Date.now() + 3600000,
        orderValidityProof: ['0xproof1', '0xproof2']
      };

      const result = await submitOrder(orderData);

      expect(result).toBeDefined();
      expect(result.orderId).toBe(orderData.orderCommitment);
      expect(result.status).toBe('submitted');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getOrderStatus', () => {
    it('should return order status', async () => {
      const orderId = '0x123abc';
      const status = await getOrderStatus(orderId);

      expect(status).toBeDefined();
      expect(status?.orderId).toBe(orderId);
      expect(status?.active).toBe(true);
      expect(status?.cancelled).toBe(false);
    });
  });

  describe('getActiveOrders', () => {
    it('should return list of active orders', async () => {
      const orders = await getActiveOrders();

      expect(Array.isArray(orders)).toBe(true);
    });
  });
});
