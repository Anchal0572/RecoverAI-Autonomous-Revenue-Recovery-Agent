import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchTransactions, fetchApprovalQueue, approveCase, rejectCase, fetchRevenueMetrics } from '../api';
import {
  Search, Filter, ArrowUpDown, AlertCircle, CheckCircle2, Clock, ShieldAlert, Check, X, Shield, TrendingUp, AlertTriangle, Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function Cases() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL_CASES' | 'APPROVAL_QUEUE'>('ALL_CASES');

  // Queries
  const { data: txData, isLoading: isTxLoading } = useQuery({
    queryKey: ['transactions', filter],
    queryFn: () => fetchTransactions(filter !== 'ALL' ? { status: filter } : {})
  });

  const { data: queueData, isLoading: isQueueLoading } = useQuery({
    queryKey: ['approvalQueue'],
    queryFn: fetchApprovalQueue,
    refetchInterval: 5000
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenueMetrics'],
    queryFn: fetchRevenueMetrics,
    refetchInterval: 10000
  });

  // Mutations
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

  const transactions = txData?.data || [];
  const pendingCases = queueData?.cases || [];

  const filteredTransactions = transactions.filter((tx: any) =>
    tx.customer.name.toLowerCase().includes(search.toLowerCase()) ||
    tx.id.toLowerCase().includes(search.toLowerCase())
  );

  const metrics = revenueData || {
    revenueAtRisk: 145000,
    expectedRecovery: 112000,
    actualRecovery: 88500
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Recovery Cases & Decision Engine
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage active recovery workflows, adaptive stopping rules, and human-in-the-loop approvals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={activeTab === 'APPROVAL_QUEUE' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('APPROVAL_QUEUE')}
            className="relative gap-2 text-xs"
          >
            <ShieldAlert className="w-4 h-4 text-warning" />
            Human Approval Queue
            {pendingCases.length > 0 && (
              <span className="bg-warning text-black text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {pendingCases.length}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === 'ALL_CASES' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('ALL_CASES')}
            className="text-xs"
          >
            All Recovery Cases
          </Button>
        </div>
      </div>

      {/* Revenue Calculation Breakdown Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Revenue At Risk</p>
            <p className="text-xl font-extrabold text-red-400 mt-1">₹{metrics.revenueAtRisk.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Weighted risk score valuation</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Expected Recovery
            </p>
            <p className="text-xl font-extrabold text-blue-400 mt-1">₹{metrics.expectedRecovery.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">ML probability expectation</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Actual Recovery
            </p>
            <p className="text-xl font-extrabold text-emerald-400 mt-1">₹{metrics.actualRecovery.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Realized captured revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab 1: Human Approval Queue */}
      {activeTab === 'APPROVAL_QUEUE' ? (
        <Card className="border-warning/30">
          <CardHeader className="border-b border-border py-4 bg-warning/5">
            <CardTitle className="text-sm font-bold text-warning flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Finance Manager Approval Queue (High-Value Cases &gt; ₹50,000)
              </span>
              <Badge variant="outline" className="border-warning/40 text-warning text-xs">
                {pendingCases.length} Pending Approval
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {pendingCases.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/40" />
                <p className="text-sm font-medium">No pending high-value cases requiring manager approval right now.</p>
                <p className="text-xs text-gray-600 mt-1">High-value failures (&gt; ₹50k) will automatically pause here for human review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCases.map((c: any) => {
                  const tx = c.transactionId || {};
                  const cust = c.customerId || {};
                  return (
                    <div key={c._id} className="bg-background border border-warning/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">₹{(tx.amount || 0).toLocaleString('en-IN')}</span>
                          <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">HIGH VALUE</Badge>
                          <span className="text-xs font-mono text-gray-400">ID: {tx.transactionIdStr || c._id}</span>
                        </div>
                        <div className="text-xs text-gray-300">
                          Customer: <span className="font-semibold">{cust.name || 'Valued Enterprise'}</span> ({cust.email}) • LTV: ₹{(cust.ltv || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-400">
                          Proposed AI Action: <span className="text-primary font-bold">{c.currentStep || 'PAYMENT_LINK'}</span> • Reason: {tx.errorDescription || 'High-value transaction threshold reached'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(c._id)}
                          disabled={approveMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4"
                        >
                          {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" /> Approve Action</>}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => rejectMutation.mutate(c._id)}
                          disabled={rejectMutation.isPending}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs px-4"
                        >
                          {rejectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5 mr-1" /> Reject</>}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Tab 2: All Cases Table */
        <Card>
          <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by customer name or ID..."
                className="pl-9 bg-background text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex bg-background p-1 rounded-lg border border-border">
              {['ALL', 'PENDING', 'IN_PROGRESS', 'RECOVERED', 'FAILED', 'POLICY_BLOCKED', 'REQUIRES_APPROVAL'].map(f => (
                <button
                  key={f}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                    filter === f ? 'bg-surfaceHover text-white shadow-sm font-semibold' : 'text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => setFilter(f)}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-gray-400 uppercase bg-surface/30 border-b border-border">
                <tr>
                  <th className="px-5 py-3.5 font-medium"><div className="flex items-center gap-1">Case ID <ArrowUpDown className="w-3 h-3"/></div></th>
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-5 py-3.5 font-medium"><div className="flex items-center gap-1">Amount <ArrowUpDown className="w-3 h-3"/></div></th>
                  <th className="px-5 py-3.5 font-medium">Risk Score</th>
                  <th className="px-5 py-3.5 font-medium">Root Cause</th>
                  <th className="px-5 py-3.5 font-medium">Workflow Status</th>
                  <th className="px-5 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isTxLoading ? (
                  Array.from({length: 5}).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({length: 7}).map((_, j) => (
                        <td key={j} className="px-5 py-3.5"><div className="h-4 bg-surfaceHover rounded animate-pulse w-24"></div></td>
                      ))}
                    </tr>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      No recovery cases found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-surface/50 transition-colors group">
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-400">
                        <Link to={`/cases/${tx.id}`} className="hover:text-primary transition-colors">
                          {tx.id.substring(0, 16)}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-200">{tx.customer.name}</div>
                        <div className="text-[10px] text-gray-500">{tx.customer.email}</div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-white">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-surfaceHover rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${tx.recoveryScore > 70 ? 'bg-success' : tx.recoveryScore > 55 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${tx.recoveryScore}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-xs">{tx.recoveryScore}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs text-gray-300 max-w-[180px] truncate" title={tx.errorDescription}>
                          {tx.errorDescription}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={
                          tx.recoveryStatus === 'RECOVERED' ? 'success' :
                          tx.recoveryStatus === 'IN_PROGRESS' ? 'warning' :
                          tx.recoveryStatus === 'REQUIRES_APPROVAL' ? 'warning' :
                          tx.recoveryStatus === 'POLICY_BLOCKED' ? 'secondary' :
                          tx.recoveryStatus === 'FAILED' ? 'danger' : 'secondary'
                        }>
                          {tx.recoveryStatus === 'RECOVERED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {tx.recoveryStatus === 'IN_PROGRESS' && <Clock className="w-3 h-3 mr-1" />}
                          {tx.recoveryStatus === 'REQUIRES_APPROVAL' && <ShieldAlert className="w-3 h-3 mr-1" />}
                          {tx.recoveryStatus === 'FAILED' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {tx.recoveryStatus.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/cases/${tx.id}`}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-gray-400">
            <div>Showing {filteredTransactions.length} results</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="text-xs">Previous</Button>
              <Button variant="outline" size="sm" disabled className="text-xs">Next</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
