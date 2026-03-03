'use client';

import { AppWrapper } from '@/app/app-wrapper';
import { ArrowUpIcon, AlertCircleIcon, CheckCircleIcon, LockIcon, InfoIcon } from 'lucide-react';
import { useState } from 'react';

export default function Withdraw() {
  const [step, setStep] = useState<'select' | 'amount' | 'review' | 'confirming' | 'complete'>('select');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const balances = [
    { symbol: 'ETH', name: 'Ethereum', balance: '5.24', usdValue: '$12,480', logo: '🔷' },
    { symbol: 'USDC', name: 'USD Coin', balance: '50,000', usdValue: '$50,000', logo: '💵' },
    { symbol: 'DAI', name: 'Dai', balance: '25,000', usdValue: '$25,000', logo: '🔶' },
  ];

  const handleSelectAsset = (symbol: string) => {
    setSelectedAsset(symbol);
    setStep('amount');
  };

  const handleReview = () => {
    if (amount && recipient) {
      setStep('review');
    }
  };

  const handleConfirm = () => {
    setStep('confirming');
    setTimeout(() => setStep('complete'), 3000);
  };

  return (
    <AppWrapper currentPage="dashboard">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowUpIcon size={24} className="text-[#22D3EE]" />
            <h1 className="text-3xl md:text-4xl font-bold">Withdraw</h1>
          </div>
          <p className="text-[#6B7280]">Transfer funds from your private balance to your wallet</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {(['select', 'amount', 'review', 'confirming', 'complete'] as const).map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  ['select', 'amount', 'review', 'confirming', 'complete'].indexOf(step) >= idx
                    ? 'bg-[#22D3EE] text-[#0A0A0B]'
                    : 'bg-[#1F2937] text-[#6B7280]'
                }`}
              >
                {idx + 1}
              </div>
              {idx < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    ['select', 'amount', 'review', 'confirming', 'complete'].indexOf(step) > idx
                      ? 'bg-[#22D3EE]'
                      : 'bg-[#1F2937]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Asset */}
        {step === 'select' && (
          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 space-y-4">
            <h2 className="text-xl font-bold mb-6">Select Asset to Withdraw</h2>
            {balances.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => handleSelectAsset(asset.symbol)}
                className="w-full flex items-center justify-between p-4 bg-[#1F2937] hover:bg-[#22D3EE]/10 rounded-lg border border-[rgba(107,114,128,0.2)] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{asset.logo}</span>
                  <div>
                    <div className="font-semibold">{asset.name}</div>
                    <div className="text-[#6B7280] text-sm">Private Balance: {asset.balance} {asset.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{asset.usdValue}</div>
                  <ArrowUpIcon size={20} className="text-[#22D3EE] ml-auto mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Enter Amount and Recipient */}
        {step === 'amount' && (
          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 space-y-6">
            <h2 className="text-xl font-bold">Withdrawal Details</h2>
            
            <div className="bg-[#1F2937]/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B7280]">Selected Asset</span>
                <span className="font-semibold text-[#22D3EE]">{selectedAsset}</span>
              </div>
              {balances.map((a) => {
                if (a.symbol === selectedAsset) {
                  return (
                    <div key={a.symbol} className="text-sm text-[#6B7280]">
                      Available: {a.balance} {a.symbol} ({a.usdValue})
                    </div>
                  );
                }
              })}
            </div>

            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-3">Amount to Withdraw</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-[#22D3EE]"
                />
                <button 
                  onClick={() => {
                    const asset = balances.find(a => a.symbol === selectedAsset);
                    if (asset) setAmount(asset.balance);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22D3EE] hover:text-[#06B6D4] font-semibold text-sm"
                >
                  Max
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-3">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#22D3EE]"
              />
              <p className="text-[#6B7280] text-xs mt-2">Enter the wallet address where you want to receive the funds</p>
            </div>

            {/* Fee Info */}
            <div className="bg-[#1F2937]/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-[#6B7280]">
                <span>Proof Generation Time</span>
                <span>~2-5 seconds</span>
              </div>
              <div className="flex items-center justify-between text-[#6B7280]">
                <span>Gas Fee (estimated)</span>
                <span>0.0052 ETH (~$12.50)</span>
              </div>
              <div className="border-t border-[rgba(107,114,128,0.2)] pt-2 flex items-center justify-between">
                <span className="font-semibold">You will receive</span>
                <span className="font-semibold">{amount || '0.00'} {selectedAsset}</span>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-[#1F2937]/30 border border-[#22D3EE]/30 rounded-lg p-4 flex items-start gap-3">
              <LockIcon size={20} className="text-[#22D3EE] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#22D3EE] mb-1">Privacy Protection</h3>
                <p className="text-[#6B7280] text-sm">
                  Your withdrawal requires a zero-knowledge proof to verify balance ownership without revealing your private balance history.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('select')}
                className="flex-1 px-6 py-3 rounded-lg border border-[rgba(107,114,128,0.2)] text-white font-semibold hover:bg-[#1F2937] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleReview}
                disabled={!amount || !recipient}
                className="flex-1 px-6 py-3 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0A0A0B] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 space-y-6">
              <h2 className="text-xl font-bold">Review Withdrawal</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <span className="text-[#6B7280]">Asset</span>
                  <span className="font-semibold">{selectedAsset}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <span className="text-[#6B7280]">Amount</span>
                  <span className="font-semibold">{amount} {selectedAsset}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <span className="text-[#6B7280]">Recipient</span>
                  <span className="font-mono text-sm">{recipient.slice(0, 8)}...{recipient.slice(-6)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <span className="text-[#6B7280]">Gas Fee</span>
                  <span className="font-semibold">0.0052 ETH (~$12.50)</span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-[#1F2937]/30 border border-[#8B5CF6]/30 rounded-lg p-4 flex items-start gap-3">
                <LockIcon size={20} className="text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#8B5CF6] mb-1">Zero-Knowledge Withdrawal</h3>
                  <p className="text-[#6B7280] text-sm">
                    Your withdrawal will be verified with a balance proof and nullifier. This ensures you own the funds without revealing your balance history or linking to previous transactions.
                  </p>
                </div>
              </div>

              {/* What Happens */}
              <div className="space-y-3">
                <h3 className="font-semibold">Withdrawal Process:</h3>
                <div className="space-y-2 text-[#6B7280] text-sm">
                  <div className="flex gap-3">
                    <CheckCircleIcon size={16} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span>1. Generate balance proof (~2-5 seconds)</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full border border-[#22D3EE] flex-shrink-0 mt-0.5" />
                    <span>2. Submit proof and nullifier to Shielded Vault</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full border border-[#22D3EE] flex-shrink-0 mt-0.5" />
                    <span>3. Contract verifies proof and marks nullifier as spent</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full border border-[#22D3EE] flex-shrink-0 mt-0.5" />
                    <span>4. Funds transferred to recipient address</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircleIcon size={20} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#F59E0B] mb-1">Important</h3>
                  <p className="text-[#F59E0B] text-sm">
                    Double-check the recipient address. Withdrawals cannot be reversed once confirmed on-chain.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('amount')}
                className="flex-1 px-6 py-3 rounded-lg border border-[rgba(107,114,128,0.2)] text-white font-semibold hover:bg-[#1F2937] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-6 py-3 rounded-lg bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0A0A0B] font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ArrowUpIcon size={18} />
                Confirm Withdrawal
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirming */}
        {step === 'confirming' && (
          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-12 text-center space-y-6">
            <div className="animate-spin">
              <LockIcon size={48} className="text-[#22D3EE] mx-auto" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Processing Withdrawal</h2>
              <p className="text-[#6B7280]">Generating balance proof and submitting to blockchain...</p>
            </div>
            <div className="space-y-2 text-[#6B7280] text-sm">
              <div className="flex items-center justify-center gap-2">
                <CheckCircleIcon size={16} className="text-[#10B981]" />
                <span>Balance proof generated</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
                <span>Verifying on-chain...</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-[#22D3EE] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#22D3EE] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-[#22D3EE] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="space-y-6">
            <div className="bg-[#14161A] rounded-lg border border-[#10B981]/30 p-12 text-center space-y-6">
              <div className="flex items-center justify-center w-16 h-16 bg-[#10B981]/20 rounded-full mx-auto">
                <CheckCircleIcon size={32} className="text-[#10B981]" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#10B981] mb-2">Withdrawal Successful!</h2>
                <p className="text-[#6B7280]">{amount} {selectedAsset} has been sent to your wallet</p>
              </div>

              <div className="bg-[#1F2937]/50 rounded-lg p-4 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Transaction Hash</span>
                  <span className="font-mono text-sm text-[#22D3EE]">0x9f2b8d3e...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Nullifier</span>
                  <span className="font-mono text-sm text-[#22D3EE]">0xdef456...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Recipient</span>
                  <span className="font-mono text-sm text-[#22D3EE]">{recipient.slice(0, 8)}...{recipient.slice(-6)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Status</span>
                  <span className="text-[#10B981] font-semibold">Confirmed</span>
                </div>
              </div>

              <div className="bg-[#1F2937]/30 border border-[#22D3EE]/30 rounded-lg p-4 flex items-start gap-3">
                <InfoIcon size={20} className="text-[#22D3EE] flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h3 className="font-semibold text-[#22D3EE] mb-1">Privacy Maintained</h3>
                  <p className="text-[#6B7280] text-sm">
                    Your withdrawal was verified with a zero-knowledge proof. The nullifier prevents double-spending while keeping your balance history private.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 px-6 py-3 rounded-lg border border-[rgba(107,114,128,0.2)] text-white font-semibold hover:bg-[#1F2937] transition-colors"
                >
                  Back to Dashboard
                </button>
                <button className="flex-1 px-6 py-3 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold transition-colors">
                  View on Explorer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppWrapper>
  );
}
