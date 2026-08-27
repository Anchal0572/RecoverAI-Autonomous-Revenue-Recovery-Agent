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

const agentColors: Record<string, string> = {
  DetectionAgent: '#3b82f6',
  RootCauseAgent: '#8b5cf6',
  MLPredictionService: '#06b6d4',
  StrategyAgent: '#10b981',
  PolicyAgent: '#f59e0b',
  ExecutionAgent: '#ef4444',
  MonitoringAgent: '#ec4899',
  EvaluationAgent: '#6366f1'
};

const agentIcons: Record<string, any> = {
  DetectionAgent: Eye,
  RootCauseAgent: Brain,
  MLPredictionService: Activity,
  StrategyAgent: Zap,
  PolicyAgent: Shield,
  ExecutionAgent: Radio,
  MonitoringAgent: Activity,
  EvaluationAgent: CheckCircle
};

const outcomeColors: Record<string, string> = {
  RECOVERED: '#10b981',
  PENDING: '#f59e0b',
  FAILED: '#ef4444',
  STOPPED: '#6b7280',
  ESCALATED: '#8b5cf6',
  WAITING: '#3b82f6'
};

const severityColors: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#3b82f6'
};

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
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            ⚡ AI Command Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">Real-time AI operations overview — all agents, cases, revenue & alerts</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">Recovered Revenue</p>
              <p className="text-xl font-bold text-green-400">
                ₹{(data?.revenue.recovered || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">Revenue at Risk</p>
              <p className="text-xl font-bold text-red-400">
                ₹{(data?.revenue.atRisk || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">Active Cases</p>
              <p className="text-xl font-bold text-blue-400">{data?.cases.active || 0}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider">Pending Approvals</p>
              <p className="text-xl font-bold text-amber-400">{data?.cases.pendingApprovals || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Grid + Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Grid — 2/3 */}
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Active Agents ({data?.agents.length || 0})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data?.agents.map(agent => {
              const Icon = agentIcons[agent.name] || Activity;
              const color = agentColors[agent.name] || '#6b7280';
              return (
                <div
                  key={agent.name}
                  className="bg-background/60 border border-border rounded-lg p-3 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ background: `${color}15` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${agent.status === 'ONLINE' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-200 truncate">{agent.name.replace('Agent', '').replace('Service', '')}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">{agent.tasksProcessed} tasks</span>
                    <span className="text-[10px] font-semibold" style={{ color }}>
                      {agent.successRate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts Panel — 1/3 */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Leakage Alerts ({data?.alerts.total || 0})
          </h2>
          {data?.alerts.items.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No active alerts. All systems nominal.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-sidebar-scrollbar">
              {data?.alerts.items.map(alert => (
                <div
                  key={alert.id}
                  className="p-3 bg-background/60 border rounded-lg"
                  style={{ borderColor: `${severityColors[alert.severity]}30` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                      style={{
                        color: severityColors[alert.severity],
                        background: `${severityColors[alert.severity]}15`
                      }}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-gray-500">{alert.type.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-200">{alert.title}</p>
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{alert.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Decisions + Policy Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Decisions */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Recent AI Decisions
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-sidebar-scrollbar">
            {data?.recentDecisions.map((d, i) => (
              <div key={i} className="p-3 bg-background/60 border border-border rounded-lg hover:border-gray-600 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <code className="text-[11px] text-gray-400">{d.transactionId}</code>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: outcomeColors[d.outcome] || '#6b7280',
                      background: `${outcomeColors[d.outcome] || '#6b7280'}15`
                    }}
                  >
                    {d.outcome}
                  </span>
                </div>
                <p className="text-xs text-gray-300 line-clamp-2">{d.explanation}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-gray-500">Strategy: {d.strategy}</span>
                  <span className="text-[10px] text-gray-500">{d.durationMs}ms</span>
                  {d.requiresHumanApproval && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> Approval needed
                    </span>
                  )}
                </div>
              </div>
            ))}
            {(!data?.recentDecisions || data.recentDecisions.length === 0) && (
              <p className="text-xs text-gray-500 text-center py-4">No recent decisions found.</p>
            )}
          </div>
        </div>

        {/* Case Status & Policy */}
        <div className="space-y-6">
          {/* Case Breakdown */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Case Status Breakdown
            </h2>
            <div className="space-y-2">
              {data?.cases.statusBreakdown.map(s => {
                const maxCount = Math.max(...(data?.cases.statusBreakdown.map(x => x.count) || [1]));
                const pct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
                return (
                  <div key={s.status} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400 w-32 truncate">{s.status}</span>
                    <div className="flex-1 h-3 bg-background/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: outcomeColors[s.status] || '#6b7280'
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-300 w-8 text-right">{s.count}</span>
                  </div>
                );
              })}
              {(!data?.cases.statusBreakdown || data.cases.statusBreakdown.length === 0) && (
                <p className="text-xs text-gray-500 text-center py-4">No cases found.</p>
              )}
            </div>
          </div>

          {/* Policy Blocks */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400" />
              Policy Blocks
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{data?.cases.policyBlocked || 0}</p>
                <p className="text-xs text-gray-400">Cases blocked by policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
