'use client';

import { AppWrapper } from '@/app/app-wrapper';
import { LockIcon, UnlockIcon, EyeIcon, EyeOffIcon, TrashIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';
import { useState } from 'react';

export default function Audit() {
  const [showKey, setShowKey] = useState<string | null>(null);

  const viewingKeys = [
    {
      id: '0x5a8f...',
      keyId: 'key-001',
      scope: 'Balance Notes',
      status: 'Active',
      created: '5 days ago',
      expires: 'In 25 days',
      auditor: 'Deloitte Audit',
      disclosed: true,
    },
    {
      id: '0x7b9e...',
      keyId: 'key-002',
      scope: 'Trade History',
      status: 'Active',
      created: '10 days ago',
      expires: 'In 20 days',
      auditor: 'Internal Compliance',
      disclosed: false,
    },
    {
      id: '0x3c2d...',
      keyId: 'key-003',
      scope: 'Order Commitments',
      status: 'Expired',
      created: '30 days ago',
      expires: 'Expired',
      auditor: 'Tax Authority',
      disclosed: true,
    },
  ];

  const solvencyProofs = [
    {
      id: 'proof-2024-001',
      timestamp: '2 hours ago',
      totalDeposits: '$1,245,680',
      totalCommitments: '$1,245,680',
      verified: true,
      participants: 342,
    },
    {
      id: 'proof-2024-002',
      timestamp: '1 day ago',
      totalDeposits: '$1,238,450',
      totalCommitments: '$1,238,450',
      verified: true,
      participants: 340,
    },
  ];

  return (
    <AppWrapper currentPage="audit">
      <div className="p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Audit & Compliance</h1>
          <p className="text-[#6B7280]">Selectively disclose trading data to auditors while maintaining privacy</p>
        </div>

        {/* Create Viewing Key */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)] p-6">
          <h2 className="text-xl font-bold mb-6">Create Viewing Key</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-2">Data Scope</label>
              <select className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]">
                <option>Balance Notes</option>
                <option>Order Commitments</option>
                <option>Trade History</option>
                <option>All Data</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-2">Auditor/Recipient</label>
              <input
                type="text"
                placeholder="Deloitte Audit"
                className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            
            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-2">Expiration</label>
              <select className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]">
                <option>7 days</option>
                <option>30 days</option>
                <option>90 days</option>
                <option>1 year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-2">Purpose</label>
              <input
                type="text"
                placeholder="Tax compliance report"
                className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          <button className="mt-6 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full md:w-auto">
            Generate Viewing Key
          </button>
        </div>

        {/* Active Viewing Keys */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
          <div className="border-b border-[rgba(107,114,128,0.2)] p-6">
            <h2 className="text-xl font-bold">Your Viewing Keys</h2>
            <p className="text-[#6B7280] text-sm mt-2">Keys that allow auditors to view your encrypted data</p>
          </div>

          <div className="divide-y divide-[rgba(107,114,128,0.2)]">
            {viewingKeys.map((key) => (
              <div key={key.keyId} className="p-6 hover:bg-[#1F2937]/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{key.scope}</h3>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        key.status === 'Active'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : 'bg-[#6B7280]/20 text-[#6B7280]'
                      }`}>
                        {key.status}
                      </span>
                    </div>
                    <p className="text-[#6B7280] text-sm">Auditor: {key.auditor}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#6B7280]">
                      Created {key.created}
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      Expires {key.expires}
                    </div>
                  </div>
                </div>

                <div className="bg-[#1F2937]/50 rounded p-4 mb-4 font-mono text-sm text-[#6B7280] break-all">
                  {showKey === key.keyId ? (
                    <>
                      decryptionKey: 0x{key.id}
                      <span className="text-[#8B5CF6]">7f3a9c2e1b6d5f8a...</span>
                    </>
                  ) : (
                    '••••••••••••••••••••••••••••••••••••••••••'
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setShowKey(showKey === key.keyId ? null : key.keyId)}
                    className="flex items-center gap-2 text-[#22D3EE] hover:text-[#06B6D4] font-semibold text-sm"
                  >
                    {showKey === key.keyId ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    {showKey === key.keyId ? 'Hide' : 'Show'} Key
                  </button>
                  <button className="flex items-center gap-2 text-[#22D3EE] hover:text-[#06B6D4] font-semibold text-sm">
                    📋 Copy
                  </button>
                  {key.status === 'Active' && (
                    <button className="flex items-center gap-2 text-[#EF4444] hover:text-[#DC2626] font-semibold text-sm ml-auto">
                      <TrashIcon size={16} />
                      Revoke
                    </button>
                  )}
                </div>

                {key.disclosed && (
                  <div className="mt-4 p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded flex items-center gap-2">
                    <CheckCircleIcon size={16} className="text-[#10B981]" />
                    <span className="text-[#10B981] text-sm">Auditor has accessed this key</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Solvency Proofs */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
          <div className="border-b border-[rgba(107,114,128,0.2)] p-6">
            <h2 className="text-xl font-bold">System Solvency Proofs</h2>
            <p className="text-[#6B7280] text-sm mt-2">Public verification that total commitments equal total deposits</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(107,114,128,0.2)] bg-[#1F2937]/30">
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Proof ID</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Timestamp</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Total Deposits</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Total Commitments</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Status</th>
                  <th className="px-6 py-4 text-left text-[#6B7280] font-semibold text-sm">Participants</th>
                </tr>
              </thead>
              <tbody>
                {solvencyProofs.map((proof) => (
                  <tr key={proof.id} className="border-b border-[rgba(107,114,128,0.2)] hover:bg-[#1F2937]/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm">{proof.id}</td>
                    <td className="px-6 py-4 text-[#6B7280]">{proof.timestamp}</td>
                    <td className="px-6 py-4 font-semibold">{proof.totalDeposits}</td>
                    <td className="px-6 py-4 font-semibold text-[#10B981]">{proof.totalCommitments}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-[#10B981]">
                        <CheckCircleIcon size={18} />
                        <span className="text-sm">Verified</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{proof.participants}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1F2937]/30 border border-[#8B5CF6]/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <LockIcon size={24} className="text-[#8B5CF6]" />
              <h3 className="font-semibold text-lg">Privacy-Preserving Audits</h3>
            </div>
            <p className="text-[#6B7280]">Auditors can verify your compliance without seeing your full trading history or balance amounts.</p>
          </div>
          
          <div className="bg-[#1F2937]/30 border border-[#22D3EE]/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircleIcon size={24} className="text-[#22D3EE]" />
              <h3 className="font-semibold text-lg">Selective Disclosure</h3>
            </div>
            <p className="text-[#6B7280]">Choose exactly which data to share and for how long viewing keys remain valid.</p>
          </div>
        </div>
      </div>
    </AppWrapper>
  );
}
