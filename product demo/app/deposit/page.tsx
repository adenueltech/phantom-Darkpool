'use client';

import { AppWrapper } from '@/app/app-wrapper';
import { ArrowDownIcon, AlertCircleIcon, CheckCircleIcon, LockIcon, InfoIcon } from 'lucide-react';
import { useState } from 'react';

export default function Deposit() {
  const [step, setStep] = useState<'select' | 'amount' | 'review' | 'confirming' | 'complete'>('select');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [amount, setAmount] = useState('');

  const assets = [
    { symbol: 'ETH', name: 'Ethereum', balance: '2.5', logo: '🔷' },
    { symbol: 'USDC', name: 'USD Coin', balance: '50,000', logo: '💵' },
    { symbol: 'DAI', name: 'Dai', balance: '10,000', logo: '🔶' },
  ];

  const handleSelectAsset = (symbol: string) => {
    setSelectedAsset(symbol);
    setStep('amount');
  };

  const handleReview = () => {
    if (amount) {
      setStep('review');
    }
  };

  const handleConfirm = () => {
    setStep('confirming');
    setTimeout(() => setStep('complete'), 2000);
  };

  return (
    <AppWrapper currentPage="dashboard">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowDownIcon size={24} className="text-[#10B981]" />
            <h1 className="text-3xl md:text-4xl font-bold">Deposit</h1>
          </div>
          <p className="text-[#6B7280]">Add funds to your private balance</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {(['select', 'amount', 'review', 'confirming', 'complete'] as const).map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  ['select', 'amount', 'review', 'confirming', 'complete'].indexOf(step) >= idx
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[#1F2937] text-[#6B7280]'
                }`}
              >
                {idx + 1}
              </div>
              {idx < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    ['select', 'amount', 'review', 'confirming', 'complete'].indexOf(step) > idx
                      ? 'bg-[#8B5CF6]'
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
            <h2 className="text-xl font-bold mb-6">Select Asset</h2>
            {assets.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => handleSelectAsset(asset.symbol)}
                className="w-full flex items-center justify-between p-4 bg-[#1F2937] hover:bg-[#22D3EE]/10 rounded-lg border border-[rgba(107,114,128,0.2)] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{asset.logo}</span>
                  <div>
                    <div className="font-semibold">{asset.name}</div>
                    <div className="text-[#6B7280] text-sm">Balance: {asset.balance} {asset.symbol}</div>
                  </div>
                </div>
                <ArrowDownIcon size={20} className="text-[#8B5CF6]" />
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Enter Amount */}
        {step === 'amount' && (
          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6 space-y-6">
            <h2 className="text-xl font-bold">Amount</h2>
            
            <div className="bg-[#1F2937]/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B7280]">Selected Asset</span>
                <span className="font-semibold text-[#22D3EE]">{selectedAsset}</span>
              </div>
              {assets.map((a) => {
                if (a.symbol === selectedAsset) {
                  return (
                    <div key={a.symbol} className="text-sm text-[#6B7280]">
                      Available: {a.balance} {a.symbol}
                    </div>
                  );
                }
              })}
            </div>

            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-3">Amount to Deposit</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-[#8B5CF6]"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22D3EE] hover:text-[#06B6D4] font-semibold text-sm">
                  Max
                </button>
              </div>
            </div>

            {/* Fee Info */}
            <div className="bg-[#1F2937]/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-[#6B7280]">
                <span>Gas Fee (estimated)</span>
                <span>0.0045 ETH (~$10.50)</span>
              </div>
              <div className="border-t border-[rgba(107,114,128,0.2)] pt-2 flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{amount || '0.00'} {selectedAsset} + gas</span>
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
                disabled={!amount}
                className="flex-1 px-6 py-3 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h2 className="text-xl font-bold">Review Deposit</h2>

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
                  <span className="text-[#6B7280]">Gas Fee</span>
                  <span className="font-semibold">0.0045 ETH (~$10.50)</span>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-[#1F2937]/30 border border-[#8B5CF6]/30 rounded-lg p-4 flex items-start gap-3">
                <LockIcon size={20} className="text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#8B5CF6] mb-1">Your Privacy is Protected</h3>
                  <p className="text-[#6B7280] text-sm">
                    Your deposit will be converted to a private balance note. The amount becomes encrypted and verified only with zero-knowledge proofs.
                  </p>
                </div>
              </div>

              {/* What Happens */}
              <div className="space-y-3">
                <h3 className="font-semibold">What happens next:</h3>
                <div className="space-y-2 text-[#6B7280] text-sm">
                  <div className="flex gap-3">
                    <CheckCircleIcon size={16} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span>1. Your wallet will prompt you to approve the transaction</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full border border-[#22D3EE] flex-shrink-0 mt-0.5" />
                    <span>2. Transaction is submitted to the blockchain</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full border border-[#22D3EE] flex-shrink-0 mt-0.5" />
                    <span>3. Balance note commitment is added to Merkle tree</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full border border-[#22D3EE] flex-shrink-0 mt-0.5" />
                    <span>4. Your private balance is ready to trade</span>
                  </div>
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
                className="flex-1 px-6 py-3 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ArrowDownIcon size={18} />
                Confirm Deposit
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirming */}
        {step === 'confirming' && (
          <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-12 text-center space-y-6">
            <div className="animate-spin">
              <LockIcon size={48} className="text-[#8B5CF6] mx-auto" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Processing Deposit</h2>
              <p className="text-[#6B7280]">Generating balance note commitment and submitting to blockchain...</p>
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-[#8B5CF6] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#8B5CF6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-[#8B5CF6] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
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
                <h2 className="text-3xl font-bold text-[#10B981] mb-2">Deposit Successful!</h2>
                <p className="text-[#6B7280]">{amount} {selectedAsset} has been added to your private balance</p>
              </div>

              <div className="bg-[#1F2937]/50 rounded-lg p-4 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Transaction Hash</span>
                  <span className="font-mono text-sm text-[#22D3EE]">0x7f3a9c2e...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Commitment Root</span>
                  <span className="font-mono text-sm text-[#22D3EE]">0xabc123...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Status</span>
                  <span className="text-[#10B981] font-semibold">Confirmed</span>
                </div>
              </div>

              <div className="bg-[#1F2937]/30 border border-[#22D3EE]/30 rounded-lg p-4 flex items-start gap-3">
                <InfoIcon size={20} className="text-[#22D3EE] flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h3 className="font-semibold text-[#22D3EE] mb-1">Next Steps</h3>
                  <p className="text-[#6B7280] text-sm">
                    Your balance note is now encrypted on the blockchain. You can start trading immediately or wait for additional confirmations for peace of mind.
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
                  Start Trading
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppWrapper>
  );
}
