'use client';

import { AppWrapper } from '@/app/app-wrapper';
import { LockIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';

export default function OrderDetails() {
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <AppWrapper currentPage="trading">
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Order Details</h1>
          <p className="text-[#6B7280]">ETH/USDC Buy Order</p>
        </div>

        {/* Order Status */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Order #ORD-2024-001</h2>
              <div className="flex items-center gap-2 text-[#22D3EE]">
                <CheckCircleIcon size={18} />
                <span className="font-semibold">Active</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">1.5 ETH</div>
              <div className="text-[#6B7280] text-sm">$3,675 USD</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[#6B7280] text-sm mb-1">Order Type</div>
              <div className="font-semibold text-[#10B981]">BUY</div>
            </div>
            <div>
              <div className="text-[#6B7280] text-sm mb-1">Pair</div>
              <div className="font-semibold">ETH/USDC</div>
            </div>
            <div>
              <div className="text-[#6B7280] text-sm mb-1">Price</div>
              <div className="font-semibold">$2,450</div>
            </div>
            <div>
              <div className="text-[#6B7280] text-sm mb-1">Status</div>
              <div className="font-semibold text-[#22D3EE]">Partially Matched</div>
            </div>
          </div>
        </div>

        {/* Order Timing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
            <div className="text-[#6B7280] text-sm font-semibold mb-2">Created</div>
            <div className="text-lg font-bold">2 hours ago</div>
            <div className="text-[#6B7280] text-xs mt-2">2024-02-15 14:30:45 UTC</div>
          </div>

          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
            <div className="text-[#6B7280] text-sm font-semibold mb-2">Expires In</div>
            <div className="text-lg font-bold text-[#F59E0B]">6 days</div>
            <div className="text-[#6B7280] text-xs mt-2">2024-02-21 14:30:45 UTC</div>
          </div>

          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
            <div className="text-[#6B7280] text-sm font-semibold mb-2">Last Updated</div>
            <div className="text-lg font-bold">15 minutes ago</div>
            <div className="text-[#6B7280] text-xs mt-2">2024-02-15 14:45:30 UTC</div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 space-y-6">
          <h2 className="text-xl font-bold">Order Specification</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg border border-[rgba(107,114,128,0.2)]">
              <span className="text-[#6B7280]">Order Commitment Hash</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[#22D3EE]">0x7f3a9c2e...</span>
                <button
                  onClick={() => copyToClipboard('0x7f3a9c2e1b6d5f8a4c3e2d1f0a9b8c7d', 'commitment')}
                  className="text-[#6B7280] hover:text-[#E5E7EB]"
                >
                  <CopyIcon size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg border border-[rgba(107,114,128,0.2)]">
              <span className="text-[#6B7280]">Nonce</span>
              <span className="font-mono text-sm text-[#22D3EE]">82841293847</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg border border-[rgba(107,114,128,0.2)]">
              <span className="text-[#6B7280]">Owner (Public Key)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[#22D3EE]">0x742d...a8F</span>
                <button
                  onClick={() => copyToClipboard('0x742d35Cc6634C0532925a3b844Bc9e7595a8', 'owner')}
                  className="text-[#6B7280] hover:text-[#E5E7EB]"
                >
                  <CopyIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Matching Status */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 space-y-6">
          <h2 className="text-xl font-bold">Matching Status</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <CheckCircleIcon size={20} className="text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Matched Orders</h3>
                <p className="text-[#6B7280] text-sm">1.0 ETH matched with order #ORD-2024-002</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <ClockIcon size={20} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Awaiting Match</h3>
                <p className="text-[#6B7280] text-sm">0.5 ETH remaining in order book</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1F2937]/50 rounded-lg p-4 border border-[rgba(107,114,128,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Matched</span>
              <span className="text-[#10B981] font-bold">66.7%</span>
            </div>
            <div className="w-full bg-[#1F2937] rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-[#10B981] to-[#22D3EE] h-full" style={{ width: '66.7%' }}></div>
            </div>
          </div>
        </div>

        {/* Settlements */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
          <div className="border-b border-[rgba(107,114,128,0.2)] p-6">
            <h2 className="text-xl font-bold">Settlements</h2>
            <p className="text-[#6B7280] text-sm mt-2">Zero-knowledge proof verified trades</p>
          </div>

          <div className="divide-y divide-[rgba(107,114,128,0.2)]">
            <div className="p-6 hover:bg-[#1F2937]/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold mb-1">Settlement #SETTLE-001</h3>
                  <p className="text-[#6B7280] text-sm">Matched with order #ORD-2024-002</p>
                </div>
                <div className="flex items-center gap-1 text-[#10B981]">
                  <CheckCircleIcon size={18} />
                  <span className="text-sm font-semibold">Settled</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[#6B7280] mb-1">Amount</div>
                  <div className="font-semibold">1.0 ETH</div>
                </div>
                <div>
                  <div className="text-[#6B7280] mb-1">Price</div>
                  <div className="font-semibold">$2,450</div>
                </div>
                <div>
                  <div className="text-[#6B7280] mb-1">Execution ID</div>
                  <div className="font-mono text-xs text-[#22D3EE]">0xabc123...</div>
                </div>
                <div>
                  <div className="text-[#6B7280] mb-1">Time</div>
                  <div className="font-semibold">1 hour ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Proofs */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LockIcon size={20} className="text-[#8B5CF6]" />
            Zero-Knowledge Proofs
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#1F2937]/50 rounded">
              <div className="flex items-center gap-3">
                <CheckCircleIcon size={18} className="text-[#10B981]" />
                <span>Order Validity Proof</span>
              </div>
              <span className="text-[#6B7280] text-sm">Verified</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1F2937]/50 rounded">
              <div className="flex items-center gap-3">
                <CheckCircleIcon size={18} className="text-[#10B981]" />
                <span>Balance Proof</span>
              </div>
              <span className="text-[#6B7280] text-sm">Verified</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1F2937]/50 rounded">
              <div className="flex items-center gap-3">
                <CheckCircleIcon size={18} className="text-[#10B981]" />
                <span>Matching Correctness Proof</span>
              </div>
              <span className="text-[#6B7280] text-sm">Verified</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1F2937]/50 rounded">
              <div className="flex items-center gap-3">
                <CheckCircleIcon size={18} className="text-[#10B981]" />
                <span>Trade Conservation Proof</span>
              </div>
              <span className="text-[#6B7280] text-sm">Verified</span>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-[#1F2937]/30 border border-[#8B5CF6]/30 rounded-lg p-6 flex items-start gap-4">
          <AlertCircleIcon size={24} className="text-[#8B5CF6] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">Your Order is Private</h3>
            <p className="text-[#6B7280] text-sm">
              The full order details (amount, price, expiration) are encrypted on-chain. Only zero-knowledge proofs verify order validity. 
              The matching engine never sees your unencrypted order data, and settlement occurs with mathematical certainty.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button className="flex-1 px-6 py-3 rounded-lg border border-[rgba(107,114,128,0.2)] text-white font-semibold hover:bg-[#1F2937] transition-colors">
            View on Explorer
          </button>
          <button className="flex-1 px-6 py-3 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold transition-colors">
            Cancel Order
          </button>
        </div>
      </div>
    </AppWrapper>
  );
}
