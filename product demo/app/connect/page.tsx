'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LockIcon, WalletIcon, ShieldIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

export default function ConnectWallet() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const walletOptions = [
    {
      id: 'argent',
      name: 'Argent X',
      description: 'Connect using Argent X wallet for Starknet',
      icon: '🛡️',
      popular: true,
      starknet: true
    },
    {
      id: 'braavos',
      name: 'Braavos',
      description: 'Connect using Braavos wallet for Starknet',
      icon: '⚔️',
      popular: true,
      starknet: true
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using MetaMask browser extension',
      icon: '🦊',
      popular: true
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Scan QR code with your mobile wallet',
      icon: '📱',
      popular: false
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect using Coinbase Wallet',
      icon: '🔵',
      popular: false
    },
    {
      id: 'phantom',
      name: 'Phantom',
      description: 'Connect using Phantom wallet',
      icon: '👻',
      popular: false
    }
  ];

  const handleConnect = async (walletId: string) => {
    setConnecting(true);
    setError('');

    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store connection state (in real app, this would be proper wallet connection)
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_type', walletId);
      localStorage.setItem('wallet_address', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E5E7EB]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-[#0A0A0B]/80 backdrop-blur border-b border-[rgba(107,114,128,0.2)] z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-2xl text-[#8B5CF6] flex items-center gap-2">
            <LockIcon size={28} />
            Phantom Darkpool
          </Link>
          <Link href="/" className="px-6 py-2 rounded-lg hover:bg-[#1F2937] transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                <WalletIcon size={40} className="text-[#8B5CF6]" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Connect Your Wallet</h1>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
              Connect your wallet to access private trading with zero-knowledge proofs
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircleIcon size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Wallet Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {walletOptions.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={connecting}
                className="bg-[#14161A] border border-[rgba(107,114,128,0.2)] rounded-lg p-6 hover:border-[#8B5CF6]/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                {wallet.popular && (
                  <div className="absolute top-4 right-4 bg-[#8B5CF6] text-white text-xs px-2 py-1 rounded">
                    Popular
                  </div>
                )}
                {wallet.starknet && (
                  <div className="absolute top-4 left-4 bg-[#22D3EE] text-[#0A0A0B] text-xs px-2 py-1 rounded font-semibold">
                    Starknet
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{wallet.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{wallet.name}</h3>
                    <p className="text-[#6B7280] text-sm">{wallet.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Loading State */}
          {connecting && (
            <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-5 h-5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#8B5CF6] font-semibold">Connecting wallet...</p>
              </div>
              <p className="text-[#6B7280] text-sm">Please approve the connection in your wallet</p>
            </div>
          )}

          {/* Security Features */}
          <div className="bg-[#14161A] border border-[rgba(107,114,128,0.2)] rounded-lg p-8 mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Connect Your Wallet?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <ShieldIcon size={32} className="text-[#8B5CF6]" />
                </div>
                <h3 className="font-bold mb-2">Non-Custodial</h3>
                <p className="text-[#6B7280] text-sm">You maintain full control of your private keys and assets</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <LockIcon size={32} className="text-[#8B5CF6]" />
                </div>
                <h3 className="font-bold mb-2">Zero-Knowledge</h3>
                <p className="text-[#6B7280] text-sm">All proofs are generated locally in your wallet</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <CheckCircleIcon size={32} className="text-[#8B5CF6]" />
                </div>
                <h3 className="font-bold mb-2">Secure</h3>
                <p className="text-[#6B7280] text-sm">No personal data required, only wallet signature</p>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-[#6B7280] text-sm">
              Don't have a wallet?{' '}
              <a href="https://www.argent.xyz/argent-x/" target="_blank" rel="noopener noreferrer" className="text-[#8B5CF6] hover:text-[#7C3AED]">
                Get Argent X
              </a>
              {' or '}
              <a href="https://braavos.app/" target="_blank" rel="noopener noreferrer" className="text-[#8B5CF6] hover:text-[#7C3AED]">
                Get Braavos
              </a>
            </p>
            <p className="text-[#6B7280] text-xs">
              Built for Starknet Hackathon 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
