import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsSummary, fetchAuditLogs } from '../api';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, Activity, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';

export default function Analytics() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: fetchAnalyticsSummary
  });

  const { data: audit, isLoading: auditLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => fetchAuditLogs()
  });

  if (summaryLoading || auditLoading || !summary || !audit) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-slate-900 border border-slate-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-900 border border-slate-800 rounded animate-pulse"></div>
          <div className="h-72 bg-slate-900 border border-slate-800 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const revenueData = summary.trend.map((t: any) => ({ ...t, amountK: parseFloat((t.amount / 1000).toFixed(1)) }));

  return (
    <div className="space-y-6 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Revenue Risk Analytics</h1>
          <p className="text-xs text-slate-400">Deep financial analysis of transaction failure patterns and recovery performance</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" /> Filter Timeframe (Last 30 Days)
          </button>
        </div>
      </div>

      {/* Top Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Recovered Revenue</div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight font-mono mb-1">₹{(summary.amounts.recovered / 1000).toFixed(1)}K</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Captured by Recovery Engine</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Recovery Success Rate</div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight font-mono mb-1">{summary.amounts.recovery_rate}%</div>
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>Benchmark: High Efficiency</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg Recovery Probability Score</div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight font-mono mb-1">{summary.avgRecoveryScore} / 100</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Calibrated Scikit-Learn Model</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Unrecovered Revenue At Risk</div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight font-mono mb-1">
            ₹{((summary.amounts.total - summary.amounts.recovered) / 1000).toFixed(1)}K
          </div>
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Active Failure Exposure</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Recovered Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Revenue Recovery Volume (₹K)</h3>
            <p className="text-[11px] text-slate-400">Daily gross value of successfully recovered transactions</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '11px' }} />
                <Bar dataKey="amountK" name="Recovered (₹K)" fill="#2563eb" radius={[2, 2, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Success Trajectory */}
        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Transaction Case Outcomes</h3>
            <p className="text-[11px] text-slate-400">Daily comparison of recovered vs unrecovered transaction counts</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="recovered" name="Recovered Cases" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                <Line type="monotone" dataKey="failed" name="Failed Cases" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

