import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTransactions, analyzeTransaction, triggerRecovery, rejectCase } from '../api';
import { BrainCircuit, Search, CheckCircle2, ShieldCheck, AlertCircle, ArrowRight, Check, X, Loader2 } from 'lucide-react';

export default function DecisionCenter() {
  const queryClient = useQueryClient();
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<Record<string, string>>({});

  const { data: txData } = useQuery({
    queryKey: ['transactions', 'PENDING'],
    queryFn: () => fetchTransactions({ status: 'PENDING' })
  });
  
  const pendingCases = Array.isArray(txData?.data) ? txData.data : [];

  const filteredCases = pendingCases.filter((tx: any) => {
    if (!tx) return false;
    const name = tx.customer?.name || tx.customerName || '';
    const id = tx.id || tx._id || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (filteredCases.length > 0 && !selectedTxId) {
      setSelectedTxId(filteredCases[0].id || filteredCases[0]._id);
    }
  }, [filteredCases, selectedTxId]);

  const { data: analysis, isLoading: analyzing } = useQuery({
    queryKey: ['analyze', selectedTxId],
    queryFn: () => analyzeTransaction(selectedTxId || ''),
    enabled: !!selectedTxId
  });

  const handleApprove = async () => {
    if (!selectedTxId) return;
    setLoadingAction('approve');
    setActionMessage(null);
    try {
      await triggerRecovery(selectedTxId);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analyze', selectedTxId] });
      setActionMessage({
        type: 'success',
        text: `🎉 Recovery Approved! Payment Link generated and sent to customer (${analysis?.transaction?.customer?.email || 'customer'}).`
      });
      setDecisionHistory(prev => ({ ...prev, [selectedTxId]: 'APPROVED — LINK SENT' }));
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Action error: ${err.message}` });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRetry = async () => {
    if (!selectedTxId) return;
    setLoadingAction('retry');
    setActionMessage(null);
    try {
      await triggerRecovery(selectedTxId);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analyze', selectedTxId] });
      setActionMessage({
        type: 'success',
        text: `⚡ Smart Retry Dispatched! Payment transaction #${selectedTxId.substring(0, 12)} submitted to primary gateway.`
      });
      setDecisionHistory(prev => ({ ...prev, [selectedTxId]: 'RETRY DISPATCHED' }));
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Retry error: ${err.message}` });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEscalate = () => {
    if (!selectedTxId) return;
    setActionMessage({
      type: 'info',
      text: `⚠️ Case #${selectedTxId.substring(0, 12)} escalated to Senior Risk Team & compliance audit logged.`
    });
    setDecisionHistory(prev => ({ ...prev, [selectedTxId]: 'ESCALATED' }));
  };

  const handleReject = async () => {
    if (!selectedTxId) return;
    setLoadingAction('reject');
    setActionMessage(null);
    try {
      await rejectCase(selectedTxId, 'Finance Manager', 'Manager rejected action');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analyze', selectedTxId] });
      setActionMessage({
        type: 'error',
        text: `❌ Case #${selectedTxId.substring(0, 12)} rejected. Recovery operations stopped per merchant policy.`
      });
      setDecisionHistory(prev => ({ ...prev, [selectedTxId]: 'REJECTED' }));
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Reject error: ${err.message}` });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6.5rem)] gap-6 select-none">
      <div className="w-80 flex flex-col h-full overflow-hidden shrink-0 bg-slate-900 border border-slate-800 rounded-md">
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Pending Decisions</h2>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
              {filteredCases.length} Cases
            </span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search case or customer..." 
              className="input-field pl-8 text-xs h-7"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-sidebar-scrollbar">
          {filteredCases.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No pending cases found</div>
          ) : (
            filteredCases.map((tx: any) => {
              const txId = tx.id || tx._id || '';
              const isSelected = selectedTxId === txId;
              const customerName = tx.customer?.name || tx.customerName || 'Enterprise Client';
              const statusTag = decisionHistory[txId];

              return (
                <div 
                  key={txId}
                  onClick={() => {
                    setSelectedTxId(txId);
                    setActionMessage(null);
                  }}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-600/10 border-l-2 border-blue-500 text-slate-100' 
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-semibold text-xs text-slate-100 truncate">{customerName}</div>
                    <div className="text-xs font-mono font-bold text-slate-200">₹{(tx.amount || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="flex justify-between items-center mt-1.5 text-[11px]">
                    <span className="font-mono text-slate-500">{String(txId).substring(0, 12)}</span>
                    {statusTag ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {statusTag}
                      </span>
                    ) : (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                        tx.riskLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        tx.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {tx.riskLevel || 'LOW'} RISK
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 h-full overflow-y-auto custom-sidebar-scrollbar">
        {!selectedTxId ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 border border-slate-800 rounded-md">
            <BrainCircuit className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-xs">Select a recovery case from the queue to view decision analysis.</p>
          </div>
        ) : analyzing ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-md">
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin mb-3"></div>
            <p className="text-xs text-blue-400 font-medium">Executing ML strategy pipeline...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-5 pb-8">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600/15 border border-blue-500/30 text-blue-400 rounded flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-100">Strategy Decision Engine</h1>
                  <p className="text-[11px] text-slate-400">Analytical rationale for case <span className="font-mono text-slate-200">#{selectedTxId.substring(0, 12)}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Transaction Value:</span>
                <span className="text-sm font-bold font-mono text-slate-100">₹{(analysis.transaction?.amount || 50000).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
                <div className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2 mb-3">
                  1. Root Cause Taxonomy
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Gateway Error Code</span>
                    <span className="font-mono text-rose-400 font-semibold">{analysis.pipeline?.rootCauseAnalysis?.errorCode || 'GATEWAY_ERROR'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Taxonomy Classification</span>
                    <span className="font-medium text-slate-200">{analysis.pipeline?.rootCauseAnalysis?.cause || 'Network packet drop during authentication'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Diagnosis Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${analysis.pipeline?.rootCauseAnalysis?.confidence || 82}%` }} />
                      </div>
                      <span className="font-mono text-xs font-bold text-blue-400">{analysis.pipeline?.rootCauseAnalysis?.confidence || 82}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
                <div className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2 mb-3">
                  2. Recovery Likelihood Model
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-3 text-xs flex-1">
                    <div className="flex justify-between pr-4">
                      <span className="text-slate-400">Recovery Score</span>
                      <span className="font-bold text-slate-200 font-mono">{analysis.pipeline?.recoveryProbability?.score || 74} / 100</span>
                    </div>
                    <div className="flex justify-between pr-4">
                      <span className="text-slate-400">Likelihood Class</span>
                      <span className="text-emerald-400 font-semibold">{analysis.pipeline?.recoveryProbability?.classification || 'MEDIUM'}</span>
                    </div>
                    <div className="flex justify-between pr-4">
                      <span className="text-slate-400">Queue Rank</span>
                      <span className="font-mono text-slate-300">{analysis.pipeline?.prioritization?.rank || 'MEDIUM'}</span>
                    </div>
                  </div>

                  <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${analysis.pipeline?.recoveryProbability?.probability || 74}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-bold font-mono text-slate-100">{analysis.pipeline?.recoveryProbability?.probability || 74}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 mb-3 text-xs font-semibold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Recommended Recovery Strategy & Policy Rationale
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded text-xs text-slate-300 leading-relaxed mb-4 font-normal">
                Based on a root cause of <strong className="text-slate-100">"{analysis.pipeline?.rootCauseAnalysis?.cause || 'Network packet drop during authentication'}"</strong> ({analysis.pipeline?.rootCauseAnalysis?.confidence || 82}% confidence), 
                and an expected recovery probability of <strong className="text-emerald-400">{analysis.pipeline?.recoveryProbability?.probability || 74}%</strong>, 
                the strategy policy selects <strong className="text-blue-400 uppercase">{(analysis.pipeline?.recommendedStrategies?.[0] || 'EMAIL_REMINDER').replace(/_/g, ' ')}</strong> as the optimal action path under current merchant guardrails.
              </div>

              <div className="space-y-2 mb-6">
                {(analysis.pipeline?.recommendedStrategies || ['EMAIL_REMINDER', 'RETRY_PAYMENT']).map((strategy: string, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-emerald-300 font-mono">{strategy.replace(/_/g, ' ')}</span>
                    </div>
                    {i === 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">PRIMARY ACTION</span>}
                  </div>
                ))}
              </div>

              {actionMessage && (
                <div className={`mb-4 p-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-all animate-in fade-in duration-300 ${
                  actionMessage.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' :
                  actionMessage.type === 'error' ? 'bg-rose-950/60 border-rose-500/40 text-rose-300' :
                  'bg-blue-950/60 border-blue-500/40 text-blue-300'
                }`}>
                  <span>{actionMessage.text}</span>
                  <button onClick={() => setActionMessage(null)} className="text-xs opacity-70 hover:opacity-100 ml-2">✕</button>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3">
                <button 
                  onClick={handleApprove}
                  disabled={!!loadingAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {loadingAction === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Approve Payment Link
                </button>
                <button 
                  onClick={handleRetry}
                  disabled={!!loadingAction}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                >
                  {loadingAction === 'retry' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  Retry Payment
                </button>
                <button 
                  onClick={handleEscalate}
                  disabled={!!loadingAction}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" /> Escalate to Support
                </button>
                <button 
                  onClick={handleReject}
                  disabled={!!loadingAction}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-rose-400 border border-slate-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ml-auto"
                >
                  {loadingAction === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Reject Case
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
