'use client';

import { AppWrapper } from '@/app/app-wrapper';
import { useState } from 'react';
import { ArrowRightIcon, TrendingUpIcon, TrendingDownIcon, LockIcon } from 'lucide-react';

export default function Trading() {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [pair, setPair] = useState('ETH/USDC');

  const buyOrders = [
    { price: '2,450', amount: '0.5', total: '1,225', encrypted: true },
    { price: '2,449', amount: '1.2', total: '2,939', encrypted: true },
    { price: '2,448', amount: '2.1', total: '5,141', encrypted: true },
    { price: '2,447', amount: '0.8', total: '1,958', encrypted: true },
  ];

  const sellOrders = [
    { price: '2,452', amount: '1.0', total: '2,452', encrypted: true },
    { price: '2,453', amount: '0.6', total: '1,472', encrypted: true },
    { price: '2,454', amount: '1.5', total: '3,681', encrypted: true },
    { price: '2,455', amount: '2.0', total: '4,910', encrypted: true },
  ];

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
          <h1 className="text-3xl md:text-4xl font-bold">Private Trading</h1>
          <p className="text-[#6B7280]">Place orders with complete privacy - no order details are revealed</p>
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
              <button className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                orderType === 'buy'
                  ? 'bg-[#10B981] hover:bg-[#059669]'
                  : 'bg-[#EF4444] hover:bg-[#DC2626]'
              }`}>
                Place {orderType.toUpperCase()} Order
              </button>

              {/* Order Expiry */}
              <div className="mt-4">
                <label className="block text-[#6B7280] text-sm font-semibold mb-2">Expiry</label>
                <select className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]">
                  <option>1 day</option>
                  <option>7 days</option>
                  <option>30 days</option>
                  <option>Never</option>
                </select>
              </div>
            </div>
          </div>

          {/* Order Book and Active Orders */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Book */}
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
              <div className="border-b border-[rgba(107,114,128,0.2)] p-6">
                <h2 className="text-xl font-bold">Order Book - {pair}</h2>
                <p className="text-[#6B7280] text-sm mt-1">All orders are encrypted - amounts shown are partially revealed</p>
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
                    {activeOrders.map((order, idx) => (
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
