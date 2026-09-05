import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchTransactions, fetchApprovalQueue, approveCase, rejectCase, fetchRevenueMetrics } from '../api';
import {
  Search, CheckCircle2, Clock, ShieldAlert, Check, X, TrendingUp, Loader2, ArrowUpRight, Filter
} from 'lucide-react';

export default function Cases() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL_CASES' | 'APPROVAL_QUEUE'>('ALL_CASES');

  const { data: txData, isLoading: isTxLoading } = useQuery({
    queryKey: ['transactions', filter],
    queryFn: () => fetchTransactions(filter !== 'ALL' ? { status: filter } : {})
  });

  const { data: queueData } = useQuery({
    queryKey: ['approvalQueue'],
    queryFn: fetchApprovalQueue,
    refetchInterval: 5000
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenueMetrics'],
    queryFn: fetchRevenueMetrics,
    refetchInterval: 10000
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveCase(id, 'Finance Manager'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalQueue'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectCase(id, 'Finance Manager', 'High risk manager override'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalQueue'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const transactions = Array.isArray(txData?.data) ? txData.data : [];
  const pendingCases = Array.isArray(queueData?.cases) ? queueData.cases : [];

  const filteredTransactions = transactions.filter((tx: any) => {
    if (!tx) return false;
    const custName = tx.customer?.name || tx.customerName || '';
    const custEmail = tx.customer?.email || '';
    const txId = tx.id || tx._id || tx.transactionIdStr || '';
    const q = (search || '').toLowerCase();
    return custName.toLowerCase().includes(q) ||
           custEmail.toLowerCase().includes(q) ||
           txId.toLowerCase().includes(q);
  });

  const metrics = revenueData || {
    revenueAtRisk: 145000,
    expectedRecovery: 112000,
    actualRecovery: 88500
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Recovery Cases</h1>
          <p className="text-xs text-slate-400">Enterprise operational view of failed transaction workflows, ML scores, and human approval queue</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('APPROVAL_QUEUE')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors flex items-center gap-2 ${
              activeTab === 'APPROVAL_QUEUE'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Human Approval Queue
            {pendingCases.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded">
                {pendingCases.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ALL_CASES')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
              activeTab === 'ALL_CASES'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Recovery Cases
          </button>
        </div>
      </div>

      {/* Metric Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Revenue At Risk</div>
          <div className="text-lg font-bold text-rose-400 mt-0.5">₹{metrics.revenueAtRisk.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Value of unrecovered failures</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-blue-400" /> Expected Recovery
          </div>
          <div className="text-lg font-bold text-blue-400 mt-0.5">₹{metrics.expectedRecovery.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">ML probability expectation</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Actual Recovered Revenue
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">₹{metrics.actualRecovery.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Realized captured value</div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'APPROVAL_QUEUE' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 bg-amber-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">High-Value Case Approval Queue (&gt; ₹50,000 Threshold)</span>
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-semibold">{pendingCases.length} Pending Approval</span>
          </div>

          <div className="p-4">
            {pendingCases.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
                <p className="text-xs font-medium text-slate-400">No high-value cases requiring manual approval right now.</p>
                <p className="text-[11px] text-slate-500 mt-1">Transactions exceeding ₹50,000 will automatically pause here for human review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCases.map((c: any) => {
                  const tx = c.transactionId || {};
                  const cust = c.customerId || {};
                  return (
                    <div key={c._id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100 text-sm">₹{(tx.amount || 0).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.2 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded">HIGH VALUE</span>
                          <span className="text-xs font-mono text-slate-500">ID: {tx.transactionIdStr || c._id}</span>
                        </div>
                        <div className="text-xs text-slate-300">
                          Customer: <span className="font-semibold text-slate-100">{cust.name || 'Enterprise Client'}</span> ({cust.email}) • LTV: ₹{(cust.ltv || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-slate-400">
                          Proposed Action: <span className="text-blue-400 font-semibold">{c.currentStep || 'PAYMENT_LINK'}</span> • Cause: {tx.errorDescription || 'High value threshold override'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => approveMutation.mutate(c._id)}
                          disabled={approveMutation.isPending}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Approve</>}
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(c._id)}
                          disabled={rejectMutation.isPending}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 text-xs font-medium rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {rejectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5" /> Reject</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* All Cases Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          {/* Table Search & Filter Bar */}
          <div className="p-3 border-b border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-950/40">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                placeholder="Search customer name or case ID..."
                className="input-field pl-8 text-xs h-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
              {['ALL', 'PENDING', 'IN_PROGRESS', 'RECOVERED', 'FAILED', 'POLICY_BLOCKED', 'REQUIRES_APPROVAL'].map(f => (
                <button
                  key={f}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                    filter === f ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  onClick={() => setFilter(f)}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* High Density Table */}
          <div className="overflow-x-auto">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>ML Recovery Score</th>
                  <th>Failure Cause</th>
                  <th>Workflow Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isTxLoading ? (
                  Array.from({length: 5}).map((_, i) => (
                    <tr key={i}>
                      {Array.from({length: 7}).map((_, j) => (
                        <td key={j}><div className="h-4 bg-slate-800/60 rounded animate-pulse w-24"></div></td>
                      ))}
                    </tr>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      No recovery cases found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx: any, idx: number) => {
                    const txId = tx?.id || tx?._id || `tx_${idx}`;
                    const custName = tx?.customer?.name || tx?.customerName || 'Enterprise Client';
                    const custEmail = tx?.customer?.email || 'client@company.com';
                    const amount = Number(tx?.amount) || 0;
                    const score = Number(tx?.recoveryScore) || 0;
                    const status = String(tx?.recoveryStatus || tx?.status || 'PENDING');
                    const errDesc = tx?.errorDescription || tx?.failureReason || 'PAYMENT_FAILED';

                    return (
                      <tr key={txId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="font-mono text-xs font-semibold text-blue-400">
                          <Link to={`/cases/${txId}`} className="hover:underline">
                            {String(txId).substring(0, 16)}
                          </Link>
                        </td>
                        <td>
                          <div className="font-medium text-slate-200 text-xs">{custName}</div>
                          <div className="text-[10px] text-slate-500">{custEmail}</div>
                        </td>
                        <td className="font-mono font-semibold text-slate-100 text-xs">
                          ₹{amount.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${score > 70 ? 'bg-emerald-500' : score > 55 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs text-slate-300">{score}%</span>
                          </div>
                        </td>
                        <td className="text-xs text-slate-300">
                          <span className="px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 rounded text-[11px] font-mono">
                            {errDesc}
                          </span>
                        </td>
                        <td>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            status === 'RECOVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            status === 'REQUIRES_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-right">
                          <Link 
                            to={`/cases/${txId}`}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                          >
                            Details <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
            <div>Showing {filteredTransactions.length} recovery cases</div>
            <div className="flex gap-2">
              <button disabled className="px-2.5 py-1 bg-slate-800/50 border border-slate-800 text-slate-500 rounded text-xs">Previous</button>
              <button disabled className="px-2.5 py-1 bg-slate-800/50 border border-slate-800 text-slate-500 rounded text-xs">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

