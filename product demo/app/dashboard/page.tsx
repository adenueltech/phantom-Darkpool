'use client';

import { AppWrapper } from '@/app/app-wrapper';
import Link from 'next/link';
import { ArrowDownIcon, ArrowUpIcon, LockIcon, TrendingUpIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useBalance } from '@/hooks/use-balance';
import { useTransactions } from '@/hooks/use-transactions';
import { useWebSocket } from '@/hooks/use-websocket';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function Dashboard() {
  const { isConnected } = useWallet();
  const { balances, totalUsdValue, isLoading: balancesLoading, error: balancesError, refresh: refreshBalances } = useBalance();
  const { transactions, isLoading: transactionsLoading, formatTimestamp, refresh: refreshTransactions } = useTransactions();
  const { subscribe, isConnected: wsConnected } = useWebSocket();

  // Subscribe to WebSocket events for real-time balance updates
  useEffect(() => {
    if (!wsConnected) return;

    const unsubscribeDeposit = subscribe('deposit_confirmed', (data: any) => {
      toast.success(`Deposit confirmed: ${data.amount} ${data.asset}`);
      refreshBalances();
      refreshTransactions();
    });

    const unsubscribeWithdrawal = subscribe('withdrawal_confirmed', (data: any) => {
      toast.success(`Withdrawal confirmed: ${data.amount} ${data.asset}`);
      refreshBalances();
      refreshTransactions();
    });

    const unsubscribeSettlement = subscribe('settlement_complete', (data: any) => {
      toast.success('Trade settled successfully');
      refreshBalances();
      refreshTransactions();
    });

    return () => {
      unsubscribeDeposit();
      unsubscribeWithdrawal();
      unsubscribeSettlement();
    };
  }, [wsConnected, subscribe, refreshBalances, refreshTransactions]);

  // Handle refresh button
  const handleRefresh = () => {
    refreshBalances();
    refreshTransactions();
    toast.success('Dashboard refreshed');
  };

  // Show loading state
  if (!isConnected) {
    return (
      <AppWrapper currentPage="dashboard">
        <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <LockIcon size={48} className="text-[#8B5CF6] mx-auto" />
            <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
            <p className="text-[#6B7280]">Please connect your wallet to view your dashboard</p>
            <Link href="/connect" className="inline-block bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Connect Wallet
            </Link>
          </div>
        </div>
      </AppWrapper>
    );
  }

  // Format balance amount for display
  const formatAmount = (amount: bigint): string => {
    const amountInUnits = Number(amount) / 1e18;
    return amountInUnits.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  return (
    <AppWrapper currentPage="dashboard">
      <div className="p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Portfolio Overview</h1>
          <p className="text-[#6B7280]">Manage your private trading balances with zero-knowledge proofs</p>
        </div>

        {/* Error Display */}
        {balancesError && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircleIcon size={20} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#EF4444]">Error Loading Balances</h3>
              <p className="text-[#6B7280] text-sm">{balancesError}</p>
            </div>
          </div>
        )}

        {/* Total Balance */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#6B7280]">Total Balance</h2>
            <div className="flex items-center gap-2">
              {wsConnected && (
                <div className="flex items-center gap-2 text-[#10B981] text-sm">
                  <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                  Live
                </div>
              )}
              <LockIcon size={20} className="text-[#8B5CF6]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            {balancesLoading ? (
              <div className="text-4xl md:text-5xl font-bold text-[#6B7280]">Loading...</div>
            ) : (
              <>
                <span className="text-4xl md:text-5xl font-bold">{totalUsdValue}</span>
                <span className="text-[#10B981] text-lg">+$0 (+0.0%)</span>
              </>
            )}
          </div>
          <p className="text-[#6B7280] mt-4">All balances are encrypted and verified with zero-knowledge proofs</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {balancesLoading ? (
            // Loading skeleton
            Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 animate-pulse">
                <div className="h-6 bg-[#1F2937] rounded mb-4 w-16" />
                <div className="h-8 bg-[#1F2937] rounded mb-2 w-24" />
                <div className="h-4 bg-[#1F2937] rounded mb-2 w-20" />
                <div className="h-4 bg-[#1F2937] rounded w-16" />
              </div>
            ))
          ) : balances.length === 0 ? (
            <div className="col-span-3 bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-8 text-center">
              <p className="text-[#6B7280]">No balances found. Make a deposit to get started.</p>
              <Link href="/deposit" className="inline-block mt-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Make Deposit
              </Link>
            </div>
          ) : (
            balances.map((balance) => (
              <div key={balance.asset} className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{balance.assetSymbol}</h3>
                  {balance.trend === 'up' ? (
                    <TrendingUpIcon size={20} className="text-[#10B981]" />
                  ) : (
                    <div className="w-5 h-5 text-[#6B7280]">—</div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{formatAmount(balance.amount)}</div>
                  <div className="text-[#6B7280]">{balance.usdValue}</div>
                  <div className={balance.trend === 'up' ? 'text-[#10B981]' : 'text-[#6B7280]'}>{balance.percentage}</div>
                  <div className="text-xs text-[#6B7280] mt-2">{balance.notes.length} note{balance.notes.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            ))
          )}
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
          <button 
            onClick={handleRefresh}
            disabled={balancesLoading || transactionsLoading}
            className="border border-[rgba(107,114,128,0.3)] text-[#E5E7EB] hover:bg-[#1F2937] px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCwIcon size={18} className={balancesLoading || transactionsLoading ? 'animate-spin' : ''} />
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
          {transactionsLoading ? (
            <div className="p-6 space-y-4">
              {Array(3).fill(0).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1F2937] rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-4 bg-[#1F2937] rounded w-32" />
                      <div className="h-3 bg-[#1F2937] rounded w-24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-[#1F2937] rounded w-16" />
                    <div className="h-3 bg-[#1F2937] rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center text-[#6B7280]">
              No recent activity
            </div>
          ) : (
            <div className="divide-y divide-[rgba(107,114,128,0.2)]">
              {transactions.map((activity, idx) => (
                <div key={idx} className="p-6 flex items-center justify-between hover:bg-[#1F2937]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'deposit' ? 'bg-[#10B981]/20' : 
                      activity.type === 'withdrawal' ? 'bg-[#22D3EE]/20' :
                      'bg-[#8B5CF6]/20'
                    }`}>
                      {activity.type === 'deposit' ? (
                        <ArrowDownIcon size={20} className="text-[#10B981]" />
                      ) : activity.type === 'withdrawal' ? (
                        <ArrowUpIcon size={20} className="text-[#22D3EE]" />
                      ) : (
                        <TrendingUpIcon size={20} className="text-[#8B5CF6]" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold capitalize">{activity.type} - {activity.asset}</div>
                      <div className="text-[#6B7280] text-sm">{formatTimestamp(activity.timestamp)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{activity.amount}</div>
                    <div className={`text-sm ${
                      activity.status === 'confirmed' ? 'text-[#10B981]' :
                      activity.status === 'pending' ? 'text-[#F59E0B]' :
                      'text-[#EF4444]'
                    }`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppWrapper>
  );
}
