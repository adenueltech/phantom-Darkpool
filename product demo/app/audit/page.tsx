'use client';

import { AppWrapper } from '@/app/app-wrapper';
import { LockIcon, EyeIcon, EyeOffIcon, TrashIcon, CheckCircleIcon, AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { useViewingKeys, DataScope } from '@/hooks/use-viewing-keys';
import { useSolvency } from '@/hooks/use-solvency';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

export default function Audit() {
  const { address, isConnected } = useWallet();
  const { viewingKeys, loading: keysLoading, error: keysError, createViewingKey, revokeViewingKey } = useViewingKeys();
  const { solvencyProofs, loading: solvencyLoading, formatAmount, formatTimestamp } = useSolvency();
  
  const [showKey, setShowKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [dataScope, setDataScope] = useState<DataScope>('BALANCE_NOTE');
  const [auditor, setAuditor] = useState('');
  const [expirationDays, setExpirationDays] = useState(30);
  const [purpose, setPurpose] = useState('');

  const handleCreateViewingKey = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    try {
      const key = await createViewingKey(dataScope, expirationDays, auditor, purpose);
      
      if (key) {
        toast.success('Viewing key created successfully');
        // Reset form
        setAuditor('');
        setPurpose('');
      } else {
        toast.error('Failed to create viewing key');
      }
    } catch (error) {
      toast.error('Error creating viewing key');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    const success = await revokeViewingKey(keyId);
    
    if (success) {
      toast.success('Viewing key revoked successfully');
    } else {
      toast.error('Failed to revoke viewing key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDataScope = (scope: string): string => {
    switch (scope) {
      case 'BALANCE_NOTE':
        return 'Balance Notes';
      case 'ORDER_COMMITMENT':
        return 'Order Commitments';
      case 'TRADE_HISTORY':
        return 'Trade History';
      case 'ALL':
        return 'All Data';
      default:
        return scope;
    }
  };

  const formatExpiration = (expiration: number): string => {
    const now = Date.now();
    if (expiration < now) {
      return 'Expired';
    }
    
    const diff = expiration - now;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days === 0) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `In ${days} day${days !== 1 ? 's' : ''}`;
  };

  const formatCreatedAt = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days === 0) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

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
          
          {!isConnected && (
            <div className="mb-6 p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded flex items-center gap-2">
              <AlertCircleIcon size={20} className="text-[#F59E0B]" />
              <span className="text-[#F59E0B]">Please connect your wallet to create viewing keys</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-2">Data Scope</label>
              <select 
                value={dataScope}
                onChange={(e) => setDataScope(e.target.value as DataScope)}
                className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                disabled={!isConnected}
              >
                <option value="BALANCE_NOTE">Balance Notes</option>
                <option value="ORDER_COMMITMENT">Order Commitments</option>
                <option value="TRADE_HISTORY">Trade History</option>
                <option value="ALL">All Data</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-2">Auditor/Recipient</label>
              <input
                type="text"
                placeholder="Deloitte Audit"
                value={auditor}
                onChange={(e) => setAuditor(e.target.value)}
                className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                disabled={!isConnected}
              />
            </div>
            
            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-2">Expiration</label>
              <select 
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                disabled={!isConnected}
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[#6B7280] text-sm font-semibold mb-2">Purpose</label>
              <input
                type="text"
                placeholder="Tax compliance report"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-[#1F2937] border border-[rgba(107,114,128,0.2)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                disabled={!isConnected}
              />
            </div>
          </div>

          <button 
            onClick={handleCreateViewingKey}
            disabled={!isConnected || isCreating}
            className="mt-6 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreating && <Loader2Icon size={18} className="animate-spin" />}
            {isCreating ? 'Generating...' : 'Generate Viewing Key'}
          </button>
        </div>

        {/* Active Viewing Keys */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
          <div className="border-b border-[rgba(107,114,128,0.2)] p-6">
            <h2 className="text-xl font-bold">Your Viewing Keys</h2>
            <p className="text-[#6B7280] text-sm mt-2">Keys that allow auditors to view your encrypted data</p>
          </div>

          {keysLoading && (
            <div className="p-6 flex items-center justify-center">
              <Loader2Icon size={24} className="animate-spin text-[#8B5CF6]" />
              <span className="ml-2 text-[#6B7280]">Loading viewing keys...</span>
            </div>
          )}

          {keysError && (
            <div className="p-6">
              <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded flex items-center gap-2">
                <AlertCircleIcon size={20} className="text-[#EF4444]" />
                <span className="text-[#EF4444]">{keysError}</span>
              </div>
            </div>
          )}

          {!keysLoading && !keysError && viewingKeys.length === 0 && (
            <div className="p-6 text-center text-[#6B7280]">
              No viewing keys created yet. Create one above to get started.
            </div>
          )}

          {!keysLoading && !keysError && viewingKeys.length > 0 && (
            <div className="divide-y divide-[rgba(107,114,128,0.2)]">
              {viewingKeys.map((key) => (
                <div key={key.keyId} className="p-6 hover:bg-[#1F2937]/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{formatDataScope(key.dataScope)}</h3>
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          key.isValid && !key.revoked
                            ? 'bg-[#10B981]/20 text-[#10B981]'
                            : 'bg-[#6B7280]/20 text-[#6B7280]'
                        }`}>
                          {key.revoked ? 'Revoked' : key.isValid ? 'Active' : 'Expired'}
                        </span>
                      </div>
                      <p className="text-[#6B7280] text-sm">Key ID: {key.keyId.slice(0, 10)}...{key.keyId.slice(-8)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[#6B7280]">
                        Created {formatCreatedAt(key.createdAt)}
                      </div>
                      <div className="text-sm text-[#6B7280]">
                        Expires {formatExpiration(key.expiration)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1F2937]/50 rounded p-4 mb-4 font-mono text-sm text-[#6B7280] break-all">
                    {showKey === key.keyId && key.decryptionKey ? (
                      <>
                        decryptionKey: {key.decryptionKey}
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
                    <button 
                      onClick={() => copyToClipboard(key.decryptionKey || key.keyId)}
                      className="flex items-center gap-2 text-[#22D3EE] hover:text-[#06B6D4] font-semibold text-sm"
                    >
                      📋 Copy
                    </button>
                    {key.isValid && !key.revoked && (
                      <button 
                        onClick={() => handleRevokeKey(key.keyId)}
                        className="flex items-center gap-2 text-[#EF4444] hover:text-[#DC2626] font-semibold text-sm ml-auto"
                      >
                        <TrashIcon size={16} />
                        Revoke
                      </button>
                    )}
                  </div>

                  {key.accessCount > 0 && (
                    <div className="mt-4 p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded flex items-center gap-2">
                      <CheckCircleIcon size={16} className="text-[#10B981]" />
                      <span className="text-[#10B981] text-sm">Accessed {key.accessCount} time{key.accessCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Solvency Proofs */}
        <div className="bg-[#14161A] rounded-lg border border-[rgba(107,114,128,0.2)]">
          <div className="border-b border-[rgba(107,114,128,0.2)] p-6">
            <h2 className="text-xl font-bold">System Solvency Proofs</h2>
            <p className="text-[#6B7280] text-sm mt-2">Public verification that total commitments equal total deposits</p>
          </div>

          {solvencyLoading && (
            <div className="p-6 flex items-center justify-center">
              <Loader2Icon size={24} className="animate-spin text-[#8B5CF6]" />
              <span className="ml-2 text-[#6B7280]">Loading solvency proofs...</span>
            </div>
          )}

          {!solvencyLoading && solvencyProofs.length === 0 && (
            <div className="p-6 text-center text-[#6B7280]">
              No solvency proofs available yet.
            </div>
          )}

          {!solvencyLoading && solvencyProofs.length > 0 && (
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
                      <td className="px-6 py-4 text-[#6B7280]">{formatTimestamp(proof.timestamp)}</td>
                      <td className="px-6 py-4 font-semibold">{formatAmount(proof.totalDeposits)}</td>
                      <td className="px-6 py-4 font-semibold text-[#10B981]">{formatAmount(proof.totalCommitments)}</td>
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
          )}
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
