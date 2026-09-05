import { useState, useEffect } from 'react';
import {
  Radio, Shield, Activity, DollarSign, AlertTriangle,
  CheckCircle, XCircle, Clock, Users, Zap, Eye, RefreshCw,
  TrendingUp, Lock, Brain
} from 'lucide-react';
import { fetchCommandCenterData } from '../api';

interface AgentInfo {
  name: string;
  status: string;
  tasksProcessed: number;
  successRate: number;
  latestActivity: string | null;
}

interface CommandData {
  agents: AgentInfo[];
  cases: {
    active: number;
    recovered: number;
    policyBlocked: number;
    pendingApprovals: number;
    statusBreakdown: { status: string; count: number }[];
  };
  revenue: { recovered: number; atRisk: number; currency: string };
  recentDecisions: {
    transactionId: string;
    outcome: string;
    strategy: string;
    explanation: string;
    durationMs: number;
    policyApproved: boolean;
    requiresHumanApproval: boolean;
    timestamp: string;
  }[];
  alerts: {
    items: {
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      detectedAt: string;
    }[];
    total: number;
    critical: number;
    high: number;
  };
  recentAudit: {
    actionType: string;
    details: string;
    transactionId: string;
    agentId: string;
    timestamp: string;
  }[];
}

export default function CommandCenter() {
  const [data, setData] = useState<CommandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await fetchCommandCenterData();
      setData(result);
    } catch (err) {
      console.error('Failed to load command center data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Initializing AI Command Center telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Recovery Operations Command Center</h1>
          <p className="text-xs text-slate-400">Real-time operational status for 8 recovery agents, policy guardrails, and decision streams</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Operations
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Recovered Revenue</div>
          <div className="text-xl font-bold text-slate-100 font-mono">₹{(data?.revenue.recovered || 0).toLocaleString('en-IN')}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider mb-1">Revenue At Risk</div>
          <div className="text-xl font-bold text-rose-400 font-mono">₹{(data?.revenue.atRisk || 0).toLocaleString('en-IN')}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Active Cases</div>
          <div className="text-xl font-bold text-blue-400 font-mono">{data?.cases.active || 0}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Pending Approvals</div>
          <div className="text-xl font-bold text-amber-400 font-mono">{data?.cases.pendingApprovals || 0}</div>
        </div>
      </div>

      {/* Agent Telemetry Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-4 space-y-3">
        <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
          Autonomous Agent Telemetry Grid ({data?.agents.length || 0} Micro-Services)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data?.agents.map(agent => (
            <div key={agent.name} className="p-3 bg-slate-950/60 border border-slate-800 rounded text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 truncate">{agent.name.replace('Agent', '').replace('Service', '')}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                <span>{agent.tasksProcessed} Tasks</span>
                <span className="text-blue-400 font-bold">{agent.successRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Stream Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-200">
          Live Decision Stream Audit Log
        </div>
        <div className="overflow-x-auto custom-sidebar-scrollbar">
          <table className="fintech-table text-xs">
            <thead>
              <tr>
                <th>Transaction Reference</th>
                <th>Outcome Status</th>
                <th>Strategy Selected</th>
                <th>Rationale Explanation</th>
                <th>Execution Speed</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentDecisions.map((d, i) => (
                <tr key={i}>
                  <td className="font-mono text-slate-300 font-semibold">{d.transactionId}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      d.outcome === 'RECOVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      d.outcome === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {d.outcome}
                    </span>
                  </td>
                  <td className="font-mono text-blue-400 font-semibold">{d.strategy}</td>
                  <td className="max-w-xs text-slate-400 text-[11px]">{d.explanation}</td>
                  <td className="font-mono text-slate-500">{d.durationMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

