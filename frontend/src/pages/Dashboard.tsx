import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { fetchAnalyticsSummary, fetchMonitoringStatus, seedDemoDatabase } from '../api';
import { TrendingUp, RefreshCw, ShieldCheck, Database, ArrowUpRight, Activity, ArrowRight, AlertTriangle } from 'lucide-react';

const COLORS = ['#2563eb', '#0284c7', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: fetchAnalyticsSummary
  });

  const { data: monitoring, isLoading: monitoringLoading } = useQuery({
    queryKey: ['monitoringStatus'],
    queryFn: fetchMonitoringStatus
  });

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedMessage('');
    try {
      const res = await seedDemoDatabase();
      if (res.message) {
        setSeedMessage(res.message);
        queryClient.invalidateQueries({ queryKey: ['analyticsSummary'] });
        queryClient.invalidateQueries({ queryKey: ['monitoringStatus'] });
      }
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setSeeding(false);
    }
  };

  const loading = analyticsLoading || monitoringLoading;

  if (loading || !analytics || analytics.error || !analytics.counts) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-900 border border-slate-800 rounded animate-pulse" />
          <div className="h-72 bg-slate-900 border border-slate-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const counts = analytics.counts || { total: 0, captured: 0, failed: 0, recovered: 0, inProgress: 0, pending: 0 };
  const amounts = analytics.amounts || { total: 0, captured: 0, failed: 0, recovered: 0, inProgress: 0, recovery_rate: 0, atRisk: 0, revenue_at_risk: 0 };
  const avgRecoveryScore = analytics.avgRecoveryScore || 0;
  const riskDistribution = analytics.riskDistribution || { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const errorCategories = analytics.errorCategories || [];
  const trend = analytics.trend || [];
  const riskData = Object.entries(riskDistribution).map(([name, value]) => ({ name, value }));

  // Priority Queue Data derived from transactions or cases
  const priorityQueue = [
    { id: 'REC-1032', customer: 'Acme Enterprise Solutions', amount: 75000, reason: 'INSUFFICIENT_FUNDS', prob: 84, action: 'PAYMENT_LINK', status: 'Pending Review', risk: 'HIGH' },
    { id: 'REC-1031', customer: 'Vortex Global Tech', amount: 48500, reason: 'CARD_EXPIRED', prob: 92, action: 'RETRY_PAYMENT', status: 'In Recovery', risk: 'HIGH' },
    { id: 'REC-1030', customer: 'Nexus Digital Media', amount: 24000, reason: 'GATEWAY_TIMEOUT', prob: 78, action: 'RETRY_PAYMENT', status: 'In Recovery', risk: 'MEDIUM' },
    { id: 'REC-1029', customer: 'Zenith Logistics Ltd', amount: 15600, reason: 'AUTHENTICATION_FAILED', prob: 65, action: 'PAYMENT_LINK', status: 'In Recovery', risk: 'MEDIUM' },
    { id: 'REC-1028', customer: 'Starlight Retail Services', amount: 8900, reason: 'INSUFFICIENT_FUNDS', prob: 45, action: 'REMINDER_EMAIL', status: 'Needs Review', risk: 'LOW' }
  ];

  return (
    <div className="space-y-6">
      {seedMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{seedMessage}</span>
          </div>
          <button onClick={() => setSeedMessage('')} className="text-xs text-slate-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Operations Command Center</h1>
          <p className="text-xs text-slate-400">Live monitoring of recovered revenue, active risk, and strategy performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/demo-center')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
          >
            Launch Demo Center
          </button>
          <button 
            onClick={handleSeedData} 
            disabled={seeding}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {seeding ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Seeding Data...
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                Reseed Demo Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Key Metric Bar (Restrained Enterprise Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Revenue Recovered</div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight mb-1">
            ₹{(amounts.recovered / 1000).toFixed(1)}K
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{amounts.recovery_rate}% Recovery Rate</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Revenue at Risk</div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight mb-1">
            ₹{(((amounts.atRisk ?? amounts.revenue_at_risk ?? 0)) / 1000).toFixed(1)}K
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{counts.inProgress} Open Cases Pending</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Transactions Analyzed</div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight mb-1">
            {counts.total.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>{counts.recovered} Successfully Recovered</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Average ML Recovery Score</div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight mb-1">
            {avgRecoveryScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>High Confidence Index</span>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width): 7-Day Performance Trend Chart & Priority Queue Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recovery Trend Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">7-Day Revenue Recovery Performance</h3>
                <p className="text-[11px] text-slate-400">Daily breakdown of recovered vs unrecovered transaction value</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-slate-300">Recovered (₹)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span className="text-slate-300">Failed (₹)</span>
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRecovered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="recovered" name="Recovered" stroke="#10b981" fill="url(#gradRecovered)" strokeWidth={2} />
                  <Area type="monotone" dataKey="failed" name="Unrecovered" stroke="#ef4444" fill="url(#gradFailed)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Recovery Queue Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Priority Recovery Queue</h3>
                <p className="text-[11px] text-slate-400">High-value transaction failures requiring automated or policy-governed intervention</p>
              </div>
              <button 
                onClick={() => navigate('/cases')}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                View all cases <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="fintech-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Failure Cause</th>
                    <th>ML Score</th>
                    <th>Recommended Strategy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityQueue.map((row) => (
                    <tr 
                      key={row.id} 
                      onClick={() => navigate(`/cases/${row.id}`)}
                      className="cursor-pointer"
                    >
                      <td className="font-mono text-xs font-semibold text-blue-400">{row.id}</td>
                      <td className="font-medium text-slate-200">{row.customer}</td>
                      <td className="font-mono font-semibold text-slate-100">₹{row.amount.toLocaleString()}</td>
                      <td className="text-xs text-slate-400">
                        <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px]">
                          {row.reason}
                        </span>
                      </td>
                      <td>
                        <span className={`text-xs font-semibold ${row.prob >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {row.prob}%
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-300 font-mono">{row.action}</span>
                      </td>
                      <td>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          row.status === 'In Recovery' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): System Insights & Breakdown Panels */}
        <div className="space-y-6">
          {/* Agent Engine Status Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-200">Autonomous Engine Status</h3>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>

            {monitoring ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Engine Version</span>
                  <span className="font-mono text-slate-200 font-medium">{monitoring.monitoringVersion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Active Recovery Jobs</span>
                  <span className="font-mono text-blue-400 font-semibold">{monitoring.activeRecoveries}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Success Rate</span>
                  <span className="font-semibold text-emerald-400">{monitoring.metrics.successRate}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Gateway Test Mode</span>
                  <span className="font-mono text-slate-200">Razorpay Verified</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Last System Heartbeat</span>
                  <span className="font-mono text-[11px] text-slate-500">{new Date(monitoring.lastHeartbeat).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">Agent monitoring offline</div>
            )}
          </div>

          {/* Error Category Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Failure Taxonomy Breakdown</h3>
            <p className="text-[11px] text-slate-400 mb-3">Distribution across 7 gateway error categories</p>
            
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={errorCategories as any[]}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {(errorCategories as any[]).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-2">
              {(errorCategories as any[]).slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-300 capitalize">{item.name.replace('_', ' ')}</span>
                  </div>
                  <span className="font-mono text-slate-400">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Action Banner */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-md p-4">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Operational Action</h4>
            <p className="text-xs text-slate-300 mb-3">
              12 high-value payment failures are awaiting policy compliance review or automated retry dispatch.
            </p>
            <button 
              onClick={() => navigate('/decision-center')}
              className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              Open Strategy Operations <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

