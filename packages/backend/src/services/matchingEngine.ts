import { getActiveOrders } from './orderService';
import { broadcastSettlement } from './websocketService';

/**
 * Order data structure
 */
interface Order {
  orderId: string;
  baseAsset: string;
  quoteAsset: string;
  amount: bigint;
  price: bigint;
  orderType: 'BUY' | 'SELL';
  timestamp: number;
  expiration: number;
  owner: string;
}

/**
 * Matched order pair
 */
interface MatchedPair {
  buyOrder: Order;
  sellOrder: Order;
  executionId: string;
}

/**
 * Matching Engine
 * 
 * Identifies compatible orders and generates execution bundles.
 * Runs deterministic matching algorithm with price-time priority.
 * 
 * Requirements: 3.1, 3.2, 3.5, 3.6, 19.1, 19.2
 */
export class MatchingEngine {
  private isRunning: boolean = false;
  private matchingInterval: NodeJS.Timeout | null = null;

  /**
   * Start the matching engine
   */
  start(intervalMs: number = 5000) {
    if (this.isRunning) {
      console.log('Matching engine already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting matching engine...');

    // Run matching loop
    this.matchingInterval = setInterval(async () => {
      try {
        await this.runMatchingCycle();
      } catch (error) {
        console.error('Matching cycle error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop the matching engine
   */
  stop() {
    if (this.matchingInterval) {
      clearInterval(this.matchingInterval);
      this.matchingInterval = null;
    }
    this.isRunning = false;
    console.log('Matching engine stopped');
  }

  /**
   * Run one matching cycle
   */
  private async runMatchingCycle() {
    // 1. Fetch active orders from Order Registry
    const orderIds = await getActiveOrders();
    
    if (orderIds.length < 2) {
      return; // Need at least 2 orders to match
    }

    // 2. Fetch order details (in production, decrypt from commitments)
    const orders = await this.fetchOrderDetails(orderIds);

    // 3. Group orders by asset pair
    const ordersByPair = this.groupOrdersByAssetPair(orders);

    // 4. Match orders for each asset pair
    for (const [assetPair, pairOrders] of ordersByPair.entries()) {
      const matches = this.matchOrders(pairOrders);
      
      // 5. Generate execution bundles for matches
      for (const match of matches) {
        await this.generateExecutionBundle(match);
      }
    }
  }

  /**
   * Fetch order details from order IDs
   * In production, this would decrypt order commitments
   */
  private async fetchOrderDetails(orderIds: string[]): Promise<Order[]> {
    // Mock implementation
    // In production, retrieve and decrypt order details
    return [];
  }

  /**
   * Group orders by asset pair
   */
  private groupOrdersByAssetPair(orders: Order[]): Map<string, Order[]> {
    const grouped = new Map<string, Order[]>();

    for (const order of orders) {
      const pairKey = `${order.baseAsset}-${order.quoteAsset}`;
      
      if (!grouped.has(pairKey)) {
        grouped.set(pairKey, []);
      }
      
      grouped.get(pairKey)!.push(order);
    }

    return grouped;
  }

  /**
   * Match orders using price-time priority
   * 
   * Algorithm:
   * 1. Separate buy and sell orders
   * 2. Sort buy orders by price (descending) then timestamp (ascending)
   * 3. Sort sell orders by price (ascending) then timestamp (ascending)
   * 4. Match orders where buyPrice >= sellPrice
   * 
   * Requirements: 3.1, 3.5, 3.6
   */
  private matchOrders(orders: Order[]): MatchedPair[] {
    const matches: MatchedPair[] = [];

    // Separate buy and sell orders
    const buyOrders = orders.filter(o => o.orderType === 'BUY');
    const sellOrders = orders.filter(o => o.orderType === 'SELL');

    // Sort by price-time priority
    buyOrders.sort((a, b) => {
      // Higher price first, then earlier timestamp
      if (a.price !== b.price) {
        return Number(b.price - a.price);
      }
      return a.timestamp - b.timestamp;
    });

    sellOrders.sort((a, b) => {
      // Lower price first, then earlier timestamp
      if (a.price !== b.price) {
        return Number(a.price - b.price);
      }
      return a.timestamp - b.timestamp;
    });

    // Match orders
    let buyIndex = 0;
    let sellIndex = 0;

    while (buyIndex < buyOrders.length && sellIndex < sellOrders.length) {
      const buyOrder = buyOrders[buyIndex];
      const sellOrder = sellOrders[sellIndex];

      // Check price compatibility: buyPrice >= sellPrice
      if (buyOrder.price >= sellOrder.price) {
        // Check amount compatibility
        if (buyOrder.amount === sellOrder.amount) {
          // Perfect match
          matches.push({
            buyOrder,
            sellOrder,
            executionId: this.generateExecutionId(buyOrder, sellOrder)
          });

          buyIndex++;
          sellIndex++;
        } else {
          // Partial match - would need to split orders
          // For simplicity, skip for now
          buyIndex++;
          sellIndex++;
        }
      } else {
        // No more matches possible
        break;
      }
    }

    return matches;
  }

  /**
   * Generate execution bundle for matched orders
   * 
   * Requirements: 3.2, 3.3, 19.4
   */
  private async generateExecutionBundle(match: MatchedPair) {
    try {
      const { buyOrder, sellOrder, executionId } = match;

      // 1. Generate all required proofs
      // - Balance proofs for both parties
      // - Order validity proofs
      // - Trade conservation proof
      // - Matching correctness proof

      // 2. Create execution bundle
      const bundle = {
        executionId,
        orderIds: [buyOrder.orderId, sellOrder.orderId],
        inputNullifiers: [], // From balance notes
        outputCommitments: [], // New balance notes
        proofs: {
          balanceProofs: [],
          orderValidityProofs: [],
          tradeConservationProof: [],
          matchingCorrectnessProof: []
        }
      };

      // 3. Submit to Settlement Contract
      await this.submitSettlement(bundle);

      // 4. Broadcast settlement event
      broadcastSettlement({
        executionId,
        orderIds: [buyOrder.orderId, sellOrder.orderId],
        timestamp: Date.now()
      });

      console.log(`Execution bundle generated: ${executionId}`);
    } catch (error) {
      console.error('Generate execution bundle error:', error);
    }
  }

  /**
   * Submit settlement to Settlement Contract
   */
  private async submitSettlement(bundle: any) {
    // In production, call Settlement Contract
    // const contract = new Contract(SETTLEMENT_ABI, SETTLEMENT_ADDRESS, provider);
    // await contract.settle_execution(...);
    
    console.log('Settlement submitted:', bundle.executionId);
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(buyOrder: Order, sellOrder: Order): string {
    return `exec_${buyOrder.orderId}_${sellOrder.orderId}_${Date.now()}`;
  }
}

// Export singleton instance
export const matchingEngine = new MatchingEngine();
