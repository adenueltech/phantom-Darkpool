'use client';

import { AppWrapper } from '@/app/app-wrapper';
import Link from 'next/link';
import { ArrowDownIcon, ArrowUpIcon, LockIcon, TrendingUpIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

export default function Dashboard() {
  const balances = [
    { asset: 'ETH', amount: '5.24', usdValue: '$12,480', percentage: '+2.4%', trend: 'up' },
    { asset: 'USDC', amount: '50,000', usdValue: '$50,000', percentage: '+0.1%', trend: 'up' },
    { asset: 'DAI', amount: '25,000', usdValue: '$25,000', percentage: '+0.0%', trend: 'flat' },
  ];

  const recentActivity = [
    { type: 'deposit', asset: 'ETH', amount: '2.5', status: 'Confirmed', time: '2 hours ago' },
    { type: 'trade', asset: 'ETH/USDC', amount: '1.0', status: 'Settled', time: '4 hours ago' },
    { type: 'trade', asset: 'USDC/DAI', amount: '10,000', status: 'Settled', time: '1 day ago' },
  ];

  return (
    <AppWrapper currentPage="dashboard">
      <div className="p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Portfolio Overview</h1>
          <p className="text-[#6B7280]">Manage your private trading balances with zero-knowledge proofs</p>
        </div>

        {/* Total Balance */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#6B7280]">Total Balance</h2>
            <LockIcon size={20} className="text-[#8B5CF6]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-bold">$87,480</span>
            <span className="text-[#10B981] text-lg">+$2,100 (+2.5%)</span>
          </div>
          <p className="text-[#6B7280] mt-4">All balances are encrypted and verified with zero-knowledge proofs</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {balances.map((balance) => (
            <div key={balance.asset} className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{balance.asset}</h3>
                {balance.trend === 'up' ? (
                  <TrendingUpIcon size={20} className="text-[#10B981]" />
                ) : (
                  <div className="w-5 h-5 text-[#6B7280]">—</div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{balance.amount}</div>
                <div className="text-[#6B7280]">{balance.usdValue}</div>
                <div className={balance.trend === 'up' ? 'text-[#10B981]' : 'text-[#6B7280]'}>{balance.percentage}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/deposit" className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
            <ArrowDownIcon size={18} />
            Deposit
          </Link>
          <Link href="/withdraw" className="bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0A0A0B] px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
            <ArrowUpIcon size={18} />
            Withdraw
          </Link>
          <Link href="/trading" className="border border-[#22D3EE] text-[#22D3EE] hover:bg-[#22D3EE]/10 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Trade
          </Link>
          <button className="border border-[rgba(107,114,128,0.3)] text-[#E5E7EB] hover:bg-[#1F2937] px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
            <RefreshCwIcon size={18} />
            Refresh
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="bg-[#1F2937]/30 border border-[#8B5CF6]/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircleIcon size={20} className="text-[#8B5CF6] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Your balances are private</h3>
            <p className="text-[#6B7280] text-sm">All balance information is encrypted. Only zero-knowledge proofs are verified on-chain, keeping your trading activity completely confidential.</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
          <div className="border-b border-[rgba(107,114,128,0.2)] p-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
          </div>
          <div className="divide-y divide-[rgba(107,114,128,0.2)]">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="p-6 flex items-center justify-between hover:bg-[#1F2937]/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.type === 'deposit' ? 'bg-[#10B981]/20' : 'bg-[#8B5CF6]/20'}`}>
                    {activity.type === 'deposit' ? (
                      <ArrowDownIcon size={20} className="text-[#10B981]" />
                    ) : (
                      <TrendingUpIcon size={20} className="text-[#8B5CF6]" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold capitalize">{activity.type} - {activity.asset}</div>
                    <div className="text-[#6B7280] text-sm">{activity.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{activity.amount}</div>
                  <div className="text-[#10B981] text-sm">{activity.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppWrapper>
  );
}
