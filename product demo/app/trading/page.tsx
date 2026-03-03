'use client';

import { AppWrapper } from '@/app/app-wrapper';
import { useState, useEffect, useCallback } from 'react';
import { ArrowRightIcon, TrendingUpIcon, TrendingDownIcon, LockIcon, WifiIcon, WifiOffIcon } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { mockSDK } from '@/lib/sdk-integration';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useWebSocket } from '@/hooks/use-websocket';
import { WebSocketEvent } from '@/lib/websocket-client';

interface OrderBookEntry {
  price: string;
  amount: string;
  total: string;
  encrypted: boolean;
}

interface ActiveOrder {
  orderId?: string;
  pair: string;
  type: string;
  amount: string;
  price: string;
  status: string;
  expiry: string;
  timestamp?: number;
}

export default function Trading() {
  const { isConnected, walletAddress } = useWallet();
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [pair, setPair] = useState('ETH/USDC');
  const [expiry, setExpiry] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrders, setSubmittedOrders] = useState<ActiveOrder[]>([]);
  const [buyOrders, setBuyOrders] = useState<OrderBookEntry[]>([
    { price: '2,450', amount: '0.5', total: '1,225', encrypted: true },
    { price: '2,449', amount: '1.2', total: '2,939', encrypted: true },
    { price: '2,448', amount: '2.1', total: '5,141', encrypted: true },
    { price: '2,447', amount: '0.8', total: '1,958', encrypted: true },
  ]);
  const [sellOrders, setSellOrders] = useState<OrderBookEntry[]>([
    { price: '2,452', amount: '1.0', total: '2,452', encrypted: true },
    { price: '2,453', amount: '0.6', total: '1,472', encrypted: true },
    { price: '2,454', amount: '1.5', total: '3,681', encrypted: true },
    { price: '2,455', amount: '2.0', total: '4,910', encrypted: true },
  ]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // WebSocket event handler
  const handleWebSocketEvent = useCallback((event: WebSocketEvent) => {
    console.log('WebSocket event received:', event);
    
    switch (event.type) {
      case 'order_submitted':
        // Simulate new order in order book
        toast.info('New order submitted to order book');
        setLastUpdate(Date.now());
        // In production, fetch updated order book from API
        break;
        
      case 'order_matched':
        // Update order status
        toast.success(`Order matched! Execution ID: ${event.data.executionId.slice(0, 10)}...`);
        setSubmittedOrders(prev => 
          prev.map(order => 
            order.orderId === event.data.orderId 
              ? { ...order, status: 'Matched' }
              : order
          )
        );
        setLastUpdate(Date.now());
        break;
        
      case 'order_cancelled':
        // Remove cancelled order
        toast.info('Order cancelled');
        setSubmittedOrders(prev => 
          prev.filter(order => order.orderId !== event.data.orderId)
        );
        setLastUpdate(Date.now());
        break;
        
      case 'settlement_complete':
        // Update settled orders
        toast.success('Settlement complete!');
        setSubmittedOrders(prev => 
          prev.map(order => 
            event.data.orderIds.includes(order.orderId || '')
              ? { ...order, status: 'Settled' }
              : order
          )
        );
        setLastUpdate(Date.now());
        break;
        
      case 'tree_root_updated':
        // Tree root updated
        console.log('Tree root updated:', event.data.newRoot);
        setLastUpdate(Date.now());
        break;
    }
  }, []);

  // Connect to WebSocket
  const { isConnected: wsConnected } = useWebSocket(handleWebSocketEvent);

  const handlePlaceOrder = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || !price) {
      toast.error('Please enter amount and price');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Parse trading pair
      const [baseAsset, quoteAsset] = pair.split('/');
      const baseAddress = getAssetAddress(baseAsset);
      const quoteAddress = getAssetAddress(quoteAsset);

      // Step 2: Generate order commitment
      toast.info('Generating order commitment...');
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e18));
      const priceBigInt = BigInt(Math.floor(parseFloat(price) * 1e18));
      const expirationTime = Date.now() + parseInt(expiry) * 24 * 60 * 60 * 1000;

      const orderCommitment = await mockSDK.generateOrderCommitment({
        baseAsset: baseAddress,
        quoteAsset: quoteAddress,
        amount: amountBigInt,
        price: priceBigInt,
        orderType: orderType.toUpperCase() as 'BUY' | 'SELL',
        expiration: expirationTime,
      });

      // Step 3: Generate Order Validity Proof
      toast.info('Generating zero-knowledge proof...');
      const proof = await mockSDK.generateOrderValidityProof(orderCommitment);

      // Step 4: Submit to backend API
      toast.info('Submitting order...');
      const result = await apiClient.submitOrder({
        orderCommitment: orderCommitment.commitmentHash,
        expiration: expirationTime,
        orderValidityProof: proof.proof,
      });

      if (result.success && result.data) {
        toast.success('Order placed successfully!');
        
        // Add to submitted orders list
        setSubmittedOrders(prev => [{
          orderId: result.data!.orderId,
          pair,
          type: orderType.toUpperCase(),
          amount,
          price,
          status: 'Active',
          expiry: `In ${expiry} days`,
          timestamp: Date.now(),
        }, ...prev]);

        // Reset form
        setAmount('');
        setPrice('');
      } else {
        toast.error(result.error || 'Failed to submit order');
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      toast.error(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get asset address
  const getAssetAddress = (symbol: string): string => {
    const addresses: Record<string, string> = {
      'ETH': '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      'USDC': '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
      'DAI': '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3',
    };
    return addresses[symbol] || '0x0';
  };

  const activeOrders = [
    { pair: 'ETH/USDC', type: 'BUY', amount: '1.5', price: '2,400', status: 'Active', expiry: 'In 6 days' },
    { pair: 'USDC/DAI', type: 'SELL', amount: '5,000', price: '1.001', status: 'Active', expiry: 'In 2 days' },
    { pair: 'ETH/DAI', type: 'BUY', amount: '0.8', price: '2,450', status: 'Partially Matched', expiry: 'In 1 day' },
  ];

  return (
    <AppWrapper currentPage="trading">
      <div className="p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Private Trading</h1>
              <p className="text-[#6B7280]">Place orders with complete privacy - no order details are revealed</p>
            </div>
            {/* WebSocket Status Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
              {wsConnected ? (
                <>
                  <WifiIcon size={16} className="text-[#10B981]" />
                  <span className="text-[#10B981] text-sm font-semibold">Live</span>
                </>
              ) : (
                <>
                  <WifiOffIcon size={16} className="text-[#6B7280]" />
                  <span className="text-[#6B7280] text-sm font-semibold">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Placement Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Place Order</h2>

              {/* Order Type Selector */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setOrderType('buy')}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-colors ${
                    orderType === 'buy'
                      ? 'bg-[#10B981] text-white'
                      : 'bg-[#1F2937] text-[#E5E7EB] hover:bg-[#22D3EE]/10'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setOrderType('sell')}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-colors ${
                    orderType === 'sell'
                      ? 'bg-[#EF4444] text-white'
                      : 'bg-[#1F2937] text-[#E5E7EB] hover:bg-[#22D3EE]/10'
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Trading Pair */}
              <div className="mb-4">
                <label className="block text-[#6B7280] text-sm font-semibold mb-2">Trading Pair</label>
                <select
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option>ETH/USDC</option>
                  <option>USDC/DAI</option>
                  <option>ETH/DAI</option>
                </select>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="block text-[#6B7280] text-sm font-semibold mb-2">Amount</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {/* Price */}
              <div className="mb-6">
                <label className="block text-[#6B7280] text-sm font-semibold mb-2">Limit Price</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {/* Privacy Info */}
              <div className="bg-[#1F2937]/50 border border-[#8B5CF6]/30 rounded p-3 mb-6 flex items-start gap-2">
                <LockIcon size={16} className="text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                <p className="text-[#6B7280] text-xs">Order details are encrypted. Only zero-knowledge proofs are visible on-chain.</p>
              </div>

              {/* Submit Button */}
              <button 
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !amount || !price}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  orderType === 'buy'
                    ? 'bg-[#10B981] hover:bg-[#059669]'
                    : 'bg-[#EF4444] hover:bg-[#DC2626]'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Proof...
                  </div>
                ) : (
                  `Place ${orderType.toUpperCase()} Order`
                )}
              </button>

              {/* Order Expiry */}
              <div className="mt-4">
                <label className="block text-[#6B7280] text-sm font-semibold mb-2">Expiry</label>
                <select 
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Order Book and Active Orders */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Book */}
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
              <div className="border-b border-[rgba(107,114,128,0.2)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Order Book - {pair}</h2>
                    <p className="text-[#6B7280] text-sm mt-1">All orders are encrypted - amounts shown are partially revealed</p>
                  </div>
                  {wsConnected && (
                    <div className="flex items-center gap-2 text-[#10B981] text-sm">
                      <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                      <span>Live Updates</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="divide-y divide-[rgba(107,114,128,0.2)]">
                {/* Sell Orders */}
                <div>
                  <div className="p-4 bg-[#1F2937]/30 flex items-center justify-between text-[#6B7280] text-sm font-semibold">
                    <span>Price</span>
                    <span>Amount</span>
                    <span>Total</span>
                  </div>
                  {sellOrders.map((order, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-[#1F2937]/50 transition-colors border-t border-[rgba(107,114,128,0.1)]">
                      <span className="text-[#EF4444]">${order.price}</span>
                      <span className="flex items-center gap-1">
                        {order.amount} <LockIcon size={14} className="text-[#6B7280]" />
                      </span>
                      <span className="text-[#6B7280]">${order.total}</span>
                    </div>
                  ))}
                </div>

                {/* Spread */}
                <div className="p-4 bg-[#1F2937]/50 flex items-center justify-center gap-2">
                  <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent"></div>
                  <span className="text-[#6B7280] text-sm">Spread: $2</span>
                  <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent"></div>
                </div>

                {/* Buy Orders */}
                <div>
                  {buyOrders.map((order, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-[#1F2937]/50 transition-colors border-b border-[rgba(107,114,128,0.1)]">
                      <span className="text-[#10B981]">${order.price}</span>
                      <span className="flex items-center gap-1">
                        {order.amount} <LockIcon size={14} className="text-[#6B7280]" />
                      </span>
                      <span className="text-[#6B7280]">${order.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Orders */}
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
              <div className="border-b border-[rgba(107,114,128,0.2)] p-6">
                <h2 className="text-xl font-bold">Your Active Orders</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(107,114,128,0.2)] bg-[#1F2937]/30">
                      <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Pair</th>
                      <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Type</th>
                      <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Amount</th>
                      <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Price</th>
                      <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Status</th>
                      <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Expires</th>
                      <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...submittedOrders, ...activeOrders].map((order, idx) => (
                      <tr key={idx} className="border-b border-[rgba(107,114,128,0.2)] hover:bg-[#1F2937]/30 transition-colors">
                        <td className="px-6 py-4 font-semibold">{order.pair}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${
                            order.type === 'BUY'
                              ? 'bg-[#10B981]/20 text-[#10B981]'
                              : 'bg-[#EF4444]/20 text-[#EF4444]'
                          }`}>
                            {order.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">{order.amount}</td>
                        <td className="px-6 py-4">${order.price}</td>
                        <td className="px-6 py-4">
                          <span className="text-[#22D3EE]">{order.status}</span>
                        </td>
                        <td className="px-6 py-4 text-[#6B7280]">{order.expiry}</td>
                        <td className="px-6 py-4">
                          <button className="text-[#EF4444] hover:text-[#DC2626] font-semibold text-sm">
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppWrapper>
  );
}
