'use client';

import { AppWrapper } from '@/app/app-wrapper';
import { WalletIcon, KeyIcon, BellIcon, ShieldIcon, HelpCircleIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'wallet' | 'security' | 'privacy' | 'notifications'>('wallet');
  const [walletConnected, setWalletConnected] = useState(true);

  const connectedAssets = [
    { asset: 'ETH', network: 'Ethereum', address: '0x742d35Cc6634C0532925a3b844Bc9e7595a8' },
    { asset: 'USDC', network: 'Ethereum', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  ];

  const securityKeys = [
    {
      name: 'Master Secret',
      status: 'Protected',
      lastRotated: '30 days ago',
      derivedKeys: 3,
    },
    {
      name: 'Nullifier Secret',
      status: 'Protected',
      lastRotated: '15 days ago',
      derivedKeys: 5,
    },
    {
      name: 'Viewing Key',
      status: 'Protected',
      lastRotated: '45 days ago',
      derivedKeys: 2,
    },
  ];

  return (
    <AppWrapper currentPage="settings">
      <div className="p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
          <p className="text-[#6B7280]">Manage your wallet, security, and privacy preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[rgba(107,114,128,0.2)] flex-wrap">
          {(['wallet', 'security', 'privacy', 'notifications'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-[#8B5CF6] text-[#8B5CF6]'
                  : 'border-transparent text-[#6B7280] hover:text-[#E5E7EB]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Wallet Settings */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            {/* Connected Wallet */}
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <WalletIcon size={24} className="text-[#8B5CF6]" />
                <h2 className="text-xl font-bold">Connected Wallet</h2>
              </div>

              {walletConnected ? (
                <div className="space-y-4">
                  <div className="bg-[#1F2937]/50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon size={20} className="text-[#10B981]" />
                      <div>
                        <div className="font-semibold">Metamask Wallet</div>
                        <div className="text-[#6B7280] text-sm">0x742d...a8F</div>
                      </div>
                    </div>
                    <button className="text-[#EF4444] hover:text-[#DC2626] font-semibold text-sm">
                      Disconnect
                    </button>
                  </div>

                  <div>
                    <label className="block text-[#6B7280] text-sm font-semibold mb-3">Connected Assets</label>
                    <div className="space-y-2">
                      {connectedAssets.map((asset) => (
                        <div key={asset.asset} className="bg-[#1F2937]/50 rounded p-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{asset.asset}</div>
                            <div className="text-[#6B7280] text-xs">{asset.network}</div>
                          </div>
                          <div className="text-right text-[#6B7280] text-xs font-mono">
                            {asset.address.slice(0, 8)}...{asset.address.slice(-4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <button className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  Connect Wallet
                </button>
              )}
            </div>

            {/* Add Asset */}
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
              <h2 className="text-xl font-bold mb-6">Add Asset</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[#6B7280] text-sm font-semibold mb-2">Asset Token Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="block text-[#6B7280] text-sm font-semibold mb-2">Network</label>
                  <select className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]">
                    <option>Ethereum Mainnet</option>
                    <option>Arbitrum</option>
                    <option>Optimism</option>
                  </select>
                </div>

                <button className="w-full bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0A0A0B] px-6 py-3 rounded-lg font-semibold transition-colors">
                  Add Asset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Cryptographic Keys */}
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <KeyIcon size={24} className="text-[#8B5CF6]" />
                <h2 className="text-xl font-bold">Cryptographic Keys</h2>
              </div>

              <div className="space-y-4">
                {securityKeys.map((key) => (
                  <div key={key.name} className="bg-[#1F2937]/50 rounded-lg p-4 border border-[rgba(107,114,128,0.2)]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold">{key.name}</div>
                        <div className="text-[#6B7280] text-sm mt-1">Last rotated {key.lastRotated}</div>
                      </div>
                      <span className="px-2 py-1 bg-[#10B981]/20 text-[#10B981] text-xs font-semibold rounded">
                        {key.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[rgba(107,114,128,0.1)]">
                      <div className="text-[#6B7280] text-sm">{key.derivedKeys} derived keys active</div>
                      <button className="text-[#22D3EE] hover:text-[#06B6D4] font-semibold text-sm">
                        Rotate Key
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Password & Backup */}
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
              <h2 className="text-xl font-bold mb-6">Backup & Recovery</h2>

              <div className="space-y-3">
                <button className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] hover:bg-[#22D3EE]/10 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-left flex items-center justify-between">
                  <span>Download Backup File</span>
                  <span>📥</span>
                </button>
                <button className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] hover:bg-[#22D3EE]/10 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-left flex items-center justify-between">
                  <span>View Recovery Phrase</span>
                  <span>🔐</span>
                </button>
                <button className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] hover:bg-[#22D3EE]/10 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-left flex items-center justify-between">
                  <span>Verify Backup</span>
                  <span>✓</span>
                </button>
              </div>

              <div className="mt-4 p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded flex items-start gap-2">
                <AlertCircleIcon size={16} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <p className="text-[#F59E0B] text-xs">Keep your recovery phrase safe. It's the only way to recover your account if you lose access.</p>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            {/* Privacy Options */}
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <ShieldIcon size={24} className="text-[#8B5CF6]" />
                <h2 className="text-xl font-bold">Privacy Preferences</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Hide Balance from UI</div>
                    <div className="text-[#6B7280] text-sm">Don't show balance amounts on dashboard</div>
                  </div>
                  <input type="checkbox" className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Randomize Transaction Timing</div>
                    <div className="text-[#6B7280] text-sm">Add random delays to break timing correlations</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Split Deposits</div>
                    <div className="text-[#6B7280] text-sm">Automatically split notes to prevent amount linking</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Require Viewing Key for Audits</div>
                    <div className="text-[#6B7280] text-sm">All compliance data requires explicit key approval</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Privacy Info */}
            <div className="bg-[#1F2937]/30 border border-[#22D3EE]/30 rounded-lg p-6">
              <h3 className="font-semibold mb-3">How Your Privacy is Protected</h3>
              <ul className="space-y-2 text-[#6B7280] text-sm">
                <li>• All balances encrypted with commitments verified on-chain</li>
                <li>• Orders hidden from public view, only commitments exposed</li>
                <li>• Trade amounts revealed only to matched counterparty</li>
                <li>• Identity remains private across all transactions</li>
                <li>• Selective disclosure through viewing keys only</li>
              </ul>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <BellIcon size={24} className="text-[#8B5CF6]" />
                <h2 className="text-xl font-bold">Notification Preferences</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Order Matched</div>
                    <div className="text-[#6B7280] text-sm">When your order is partially or fully matched</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Settlement Complete</div>
                    <div className="text-[#6B7280] text-sm">When trade settlement is confirmed on-chain</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Order Expiring Soon</div>
                    <div className="text-[#6B7280] text-sm">Reminder before order expiration</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <div>
                    <div className="font-semibold">System Updates</div>
                    <div className="text-[#6B7280] text-sm">Important security and feature updates</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg">
                  <div>
                    <div className="font-semibold">Viewing Key Access</div>
                    <div className="text-[#6B7280] text-sm">When auditors access your data via viewing key</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-[#1F2937]/30 border border-[#6B7280]/30 rounded-lg p-6 flex items-start gap-4">
          <HelpCircleIcon size={24} className="text-[#6B7280] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-[#6B7280] text-sm mb-3">
              Check our documentation for detailed information about Phantom Darkpool features, security practices, and compliance options.
            </p>
            <button className="text-[#22D3EE] hover:text-[#06B6D4] font-semibold text-sm">
              View Documentation →
            </button>
          </div>
        </div>
      </div>
    </AppWrapper>
  );
}
