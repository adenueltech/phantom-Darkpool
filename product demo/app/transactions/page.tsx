'use client';

import { AppWrapper } from '@/app/app-wrapper';
import { CheckCircleIcon, ClockIcon, AlertCircleIcon, ArrowDownIcon, ArrowUpIcon, ArrowLeftRightIcon } from 'lucide-react';
import { useState } from 'react';

export default function Transactions() {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'trade'>('all');

  const transactions = [
    {
      id: '0xabc123...',
      type: 'trade',
      from: 'ETH',
      to: 'USDC',
      amount: '1.5 → 3,675',
      status: 'Settled',
      timestamp: '2 hours ago',
      proofVerified: true,
      details: { gasCost: '0.0045 ETH', fee: '$10.50' }
    },
    {
      id: '0xdef456...',
      type: 'deposit',
      from: 'Wallet',
      to: 'Private Balance',
      amount: '5.0 ETH',
      status: 'Confirmed',
      timestamp: '4 hours ago',
      proofVerified: true,
      details: { gasCost: '0.0032 ETH', blockNumber: '19234567' }
    },
    {
      id: '0xghi789...',
      type: 'trade',
      from: 'USDC',
      to: 'DAI',
      amount: '10,000 → 10,000',
      status: 'Pending',
      timestamp: '6 hours ago',
      proofVerified: false,
      details: { proofStatus: 'Generating', estimatedTime: '~2 minutes' }
    },
    {
      id: '0xjkl012...',
      type: 'withdrawal',
      from: 'Private Balance',
      to: 'Wallet',
      amount: '2.5 ETH',
      status: 'Confirmed',
      timestamp: '1 day ago',
      proofVerified: true,
      details: { gasCost: '0.0038 ETH', recipient: '0x742d...5a8F' }
    },
    {
      id: '0xmno345...',
      type: 'trade',
      from: 'ETH',
      to: 'USDC',
      amount: '0.8 → 1,960',
      status: 'Settled',
      timestamp: '2 days ago',
      proofVerified: true,
      details: { gasCost: '0.0052 ETH', fee: '$12.00' }
    },
  ];

  const filteredTransactions = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownIcon size={20} className="text-[#10B981]" />;
      case 'withdrawal':
        return <ArrowUpIcon size={20} className="text-[#22D3EE]" />;
      case 'trade':
        return <ArrowLeftRightIcon size={20} className="text-[#8B5CF6]" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Settled':
      case 'Confirmed':
        return 'bg-[#10B981]/20 text-[#10B981]';
      case 'Pending':
        return 'bg-[#F59E0B]/20 text-[#F59E0B]';
      case 'Failed':
        return 'bg-[#EF4444]/20 text-[#EF4444]';
      default:
        return 'bg-[#6B7280]/20 text-[#6B7280]';
    }
  };

  return (
    <AppWrapper currentPage="transactions">
      <div className="p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Settlement & Transactions</h1>
          <p className="text-[#6B7280]">View all your trades, deposits, and withdrawals with proof verification</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
            <p className="text-[#6B7280] text-sm mb-2">Total Settled</p>
            <div className="text-2xl font-bold">$147,250</div>
            <p className="text-[#10B981] text-xs mt-2">42 transactions</p>
          </div>
          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
            <p className="text-[#6B7280] text-sm mb-2">Pending</p>
            <div className="text-2xl font-bold">$10,000</div>
            <p className="text-[#F59E0B] text-xs mt-2">1 transaction</p>
          </div>
          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
            <p className="text-[#6B7280] text-sm mb-2">Avg. Settlement Time</p>
            <div className="text-2xl font-bold">~45s</div>
            <p className="text-[#22D3EE] text-xs mt-2">With ZK proofs</p>
          </div>
          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
            <p className="text-[#6B7280] text-sm mb-2">Total Fees</p>
            <div className="text-2xl font-bold">$342.50</div>
            <p className="text-[#8B5CF6] text-xs mt-2">All verified on-chain</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'deposit', 'withdrawal', 'trade'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === f
                  ? 'bg-[#8B5CF6] text-white'
                  : 'bg-[#1F2937] text-[#E5E7EB] hover:bg-[#22D3EE]/10'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(107,114,128,0.2)] bg-[#1F2937]/30">
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Type</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">From → To</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Amount</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Status</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Proof</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Time</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, idx) => (
                  <tr key={idx} className="border-b border-[rgba(107,114,128,0.2)] hover:bg-[#1F2937]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type)}
                        <span className="capitalize">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#6B7280]">{tx.from} → {tx.to}</td>
                    <td className="px-6 py-4 font-semibold">{tx.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.proofVerified ? (
                        <div className="flex items-center gap-1 text-[#10B981]">
                          <CheckCircleIcon size={18} />
                          <span className="text-sm">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[#F59E0B]">
                          <ClockIcon size={18} />
                          <span className="text-sm">Verifying</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#6B7280] text-sm">{tx.timestamp}</td>
                    <td className="px-6 py-4">
                      <button className="text-[#22D3EE] hover:text-[#06B6D4] font-semibold text-sm">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-[#1F2937]/30 border border-[#22D3EE]/30 rounded-lg p-6">
          <div className="flex gap-4">
            <AlertCircleIcon size={24} className="text-[#22D3EE] flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Zero-Knowledge Proof Settlement</h3>
              <p className="text-[#6B7280]">
                All transactions are settled using zero-knowledge proofs. This means settlement contracts verify correctness without revealing your private trading data. Each proof takes 30-60 seconds to generate and 100-500ms to verify on-chain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppWrapper>
  );
}
