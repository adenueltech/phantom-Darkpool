'use client';

import Link from 'next/link';
import { ArrowRightIcon, LockIcon, ShieldIcon, TrendingUpIcon, CheckCircleIcon, GlobeIcon, BarChart3Icon } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: LockIcon,
      title: 'Complete Privacy',
      description: 'Your trading activity, balances, and order details remain fully encrypted. Only zero-knowledge proofs are verified.'
    },
    {
      icon: ShieldIcon,
      title: 'Zero-Knowledge Proofs',
      description: 'All transactions verified cryptographically without revealing sensitive data. Soundness guaranteed by advanced circuit design.'
    },
    {
      icon: TrendingUpIcon,
      title: 'Private Matching',
      description: 'Orders matched without revealing amounts or prices. Deterministic matching ensures fairness and prevents front-running.'
    },
    {
      icon: GlobeIcon,
      title: 'Non-Custodial',
      description: 'You maintain full control of your assets and keys. No trusted third parties required for operation.'
    },
    {
      icon: CheckCircleIcon,
      title: 'Verifiable Settlement',
      description: 'All trades settle on-chain with cryptographic proof. System solvency is publicly auditable.'
    },
    {
      icon: BarChart3Icon,
      title: 'Selective Disclosure',
      description: 'Share trading data with auditors via viewing keys while maintaining privacy from the public.'
    }
  ];

  const stats = [
    { label: 'Total Users', value: '$847.2M' },
    { label: 'Trading Volume', value: '12,432' },
    { label: 'Transactions', value: '99.99%' },
    { label: 'Uptime', value: '<500ms' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E5E7EB]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-[#0A0A0B]/80 backdrop-blur border-b border-[rgba(107,114,128,0.2)] z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-2xl text-[#8B5CF6] flex items-center gap-2">
            <LockIcon size={28} />
            Phantom Darkpool
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="px-6 py-2 rounded-lg hover:bg-[#1F2937] transition-colors">
              Dashboard
            </Link>
            <Link href="/trading" className="px-6 py-2 rounded-lg hover:bg-[#1F2937] transition-colors">
              Trading
            </Link>
            <Link
              href="/connect"
              className="px-6 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold transition-colors flex items-center gap-2"
            >
              Connect Wallet <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-balance leading-tight">
              <span className="text-[#8B5CF6]">Zero-Knowledge</span> Private Trading
            </h1>
            <p className="text-xl md:text-2xl text-[#6B7280] text-balance max-w-3xl mx-auto leading-relaxed">
              Trade with complete privacy while maintaining cryptographic proof of correctness. Eliminate front-running, MEV exploitation, and strategy leakage forever.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
            <Link
              href="/connect"
              className="px-8 py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg font-bold text-lg transition-colors flex items-center gap-2"
            >
              Connect Wallet <ArrowRightIcon size={20} />
            </Link>
            <button className="px-8 py-4 border-2 border-[#22D3EE] text-[#22D3EE] hover:bg-[#22D3EE]/10 rounded-lg font-bold text-lg transition-colors">
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-[rgba(107,114,128,0.2)]">
            {stats.map((stat, idx) => (
              <div key={idx} className="py-6">
                <div className="text-2xl md:text-3xl font-bold text-[#22D3EE]">{stat.value}</div>
                <div className="text-[#6B7280] text-sm mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8 bg-[#14161A]/50 border-y border-[rgba(107,114,128,0.2)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Why Phantom Darkpool?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-[#1F2937]/50 border border-[rgba(107,114,128,0.2)] rounded-lg p-8 hover:border-[#8B5CF6]/50 transition-colors">
                  <Icon size={32} className="text-[#8B5CF6] mb-4" />
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-[#6B7280]">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">System Architecture</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-[#14161A] border border-[rgba(107,114,128,0.2)] rounded-lg p-8">
              <h3 className="text-2xl font-bold text-[#22D3EE] mb-4">Private Balance Layer</h3>
              <p className="text-[#6B7280] mb-4">
                Maintains shielded asset balances using encrypted UTXO-like notes. Each balance note is a Pedersen commitment that can be spent with zero-knowledge proofs.
              </p>
              <ul className="space-y-2 text-[#6B7280]">
                <li>✓ Balance Note commitments</li>
                <li>✓ Nullifier-based double-spend prevention</li>
                <li>✓ Merkle tree for efficient proofs</li>
              </ul>
            </div>

            <div className="bg-[#14161A] border border-[rgba(107,114,128,0.2)] rounded-lg p-8">
              <h3 className="text-2xl font-bold text-[#22D3EE] mb-4">Order Commitment Layer</h3>
              <p className="text-[#6B7280] mb-4">
                Processes private orders as cryptographic commitments. Order details are encrypted and stored on-chain without revealing sensitive parameters.
              </p>
              <ul className="space-y-2 text-[#6B7280]">
                <li>✓ Encrypted order commitments</li>
                <li>✓ Order validity proofs</li>
                <li>✓ Expiration & cancellation support</li>
              </ul>
            </div>

            <div className="bg-[#14161A] border border-[rgba(107,114,128,0.2)] rounded-lg p-8">
              <h3 className="text-2xl font-bold text-[#22D3EE] mb-4">Matching Engine</h3>
              <p className="text-[#6B7280] mb-4">
                Identifies compatible orders using only public metadata. Generates execution bundles with zero-knowledge proofs of matching correctness.
              </p>
              <ul className="space-y-2 text-[#6B7280]">
                <li>✓ Privacy-preserving matching</li>
                <li>✓ Price-time priority matching</li>
                <li>✓ Deterministic fairness</li>
              </ul>
            </div>

            <div className="bg-[#14161A] border border-[rgba(107,114,128,0.2)] rounded-lg p-8">
              <h3 className="text-2xl font-bold text-[#22D3EE] mb-4">Settlement Layer</h3>
              <p className="text-[#6B7280] mb-4">
                Verifies execution proofs and settles trades on-chain. Creates new encrypted balance notes and updates the commitment tree.
              </p>
              <ul className="space-y-2 text-[#6B7280]">
                <li>✓ On-chain proof verification</li>
                <li>✓ Value conservation proofs</li>
                <li>✓ Atomic settlement</li>
              </ul>
            </div>
          </div>

          {/* Key Technologies */}
          <div className="bg-[#1F2937]/50 border border-[rgba(107,114,128,0.2)] rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Cryptographic Technologies</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-bold text-[#8B5CF6] mb-2">Zero-Knowledge Proofs</h4>
                <p className="text-[#6B7280] text-sm">Groth16 with proven circuits for balance, order validity, trade conservation, and matching correctness</p>
              </div>
              <div>
                <h4 className="font-bold text-[#8B5CF6] mb-2">Cryptographic Commitments</h4>
                <p className="text-[#6B7280] text-sm">Pedersen commitments for balance notes and Poseidon hashing for Merkle trees and nullifiers</p>
              </div>
              <div>
                <h4 className="font-bold text-[#8B5CF6] mb-2">Privacy Preservation</h4>
                <p className="text-[#6B7280] text-sm">Viewing keys for selective disclosure, deterministic matching, and non-custodial operation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-[#14161A]/50 border-t border-[rgba(107,114,128,0.2)]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Trade Privately?</h2>
          <p className="text-xl text-[#6B7280]">
            Join the future of decentralized trading with complete privacy and cryptographic guarantees.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/connect"
              className="px-8 py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg font-bold text-lg transition-colors flex items-center gap-2"
            >
              Connect Wallet <ArrowRightIcon size={20} />
            </Link>
            <button className="px-8 py-4 border-2 border-[#22D3EE] text-[#22D3EE] hover:bg-[#22D3EE]/10 rounded-lg font-bold text-lg transition-colors">
              Read Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(107,114,128,0.2)] py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <div className="font-bold text-lg text-[#8B5CF6] flex items-center gap-2 justify-center md:justify-start">
                <LockIcon size={24} />
                Phantom Darkpool
              </div>
              <p className="text-[#6B7280] text-sm mt-2">Zero-knowledge private trading infrastructure</p>
            </div>
            
            <div className="flex items-center gap-6 text-[#6B7280] text-sm">
              <Link href="#" className="hover:text-[#E5E7EB]">Docs</Link>
              <Link href="#" className="hover:text-[#E5E7EB]">GitHub</Link>
              <Link href="#" className="hover:text-[#E5E7EB]">Twitter</Link>
              <Link href="#" className="hover:text-[#E5E7EB]">Discord</Link>
            </div>
          </div>
          
          <div className="border-t border-[rgba(107,114,128,0.2)] mt-8 pt-8 text-center text-[#6B7280] text-xs">
            <p>© 2024 Phantom Darkpool. All rights reserved. This is a demonstration interface.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
