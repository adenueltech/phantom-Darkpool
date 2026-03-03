import { broadcast, broadcastOrderUpdate, broadcastSettlement, broadcastTreeUpdate } from '../../services/websocketService';

describe('WebSocket Service', () => {
  describe('broadcast', () => {
    it('should broadcast message without errors', () => {
      const message = {
        type: 'test',
        data: 'test data'
      };

      // Should not throw
      expect(() => broadcast(message)).not.toThrow();
    });
  });

  describe('broadcastOrderUpdate', () => {
    it('should broadcast order update', () => {
      const data = {
        orderId: '0x123',
        status: 'submitted'
      };

      expect(() => broadcastOrderUpdate(data)).not.toThrow();
    });
  });

  describe('broadcastSettlement', () => {
    it('should broadcast settlement event', () => {
      const data = {
        executionId: 'exec_123',
        orderIds: ['0x123', '0x456'],
        timestamp: Date.now()
      };

      expect(() => broadcastSettlement(data)).not.toThrow();
    });
  });

  describe('broadcastTreeUpdate', () => {
    it('should broadcast tree update', () => {
      const data = {
        asset: '0xETH',
        root: '0xabc',
        size: 10
      };

      expect(() => broadcastTreeUpdate(data)).not.toThrow();
    });
  });
});
