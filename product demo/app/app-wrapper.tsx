'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LockIcon, BarChart3Icon, SettingsIcon, LogOutIcon, MenuIcon, XIcon, WalletIcon } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

export function AppWrapper({ children, currentPage }: { children: React.ReactNode; currentPage: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { walletAddress, disconnect } = useWallet();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3Icon, page: 'dashboard' },
    { href: '/trading', label: 'Trading', icon: LockIcon, page: 'trading' },
    { href: '/transactions', label: 'Transactions', icon: BarChart3Icon, page: 'transactions' },
    { href: '/audit', label: 'Audit', icon: SettingsIcon, page: 'audit' },
    { href: '/settings', label: 'Settings', icon: SettingsIcon, page: 'settings' },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E5E7EB]">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#14161A] border-b border-[rgba(107,114,128,0.2)] flex items-center justify-between px-4 z-50">
        <Link href="/" className="font-bold text-lg text-[#8B5CF6]">
          Phantom
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 md:top-0 h-screen w-64 bg-[#14161A] border-r border-[rgba(107,114,128,0.2)] transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:z-40 z-50`}>
        <div className="hidden md:flex items-center justify-center h-16 border-b border-[rgba(107,114,128,0.2)]">
          <Link href="/" className="font-bold text-xl text-[#8B5CF6]">
            Phantom
          </Link>
        </div>

        {/* Wallet Address Display */}
        <div className="p-4 border-b border-[rgba(107,114,128,0.2)]">
          <div className="bg-[#1F2937] rounded-lg p-3 flex items-center gap-2">
            <WalletIcon size={16} className="text-[#8B5CF6]" />
            <span className="text-sm font-mono">{walletAddress ? formatAddress(walletAddress) : 'Not Connected'}</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <Link
                key={item.page}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#8B5CF6] text-[#E5E7EB]'
                    : 'hover:bg-[#1F2937] text-[#E5E7EB]'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button 
            onClick={disconnect}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1F2937] hover:bg-[#22D3EE]/10 transition-colors"
          >
            <LogOutIcon size={20} />
            <span>Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 mt-16 md:mt-0 min-h-screen">
        {children}
      </main>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 md:hidden z-40" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
