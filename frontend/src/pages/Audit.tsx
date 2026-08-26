import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '../api';
import {
  History, ShieldCheck, Activity, BrainCircuit, CreditCard,
  ChevronDown, Search, Filter, CheckCircle2, AlertTriangle,
  RefreshCw, Calendar, X
} from 'lucide-react';
import { Card } from '../components/ui/card';

// ────── Date range helpers ──────
type RangeKey = 'today' | 'yesterday' | 'last7' | 'last30' | 'all';

function getDateRange(key: RangeKey): { startDate?: string; endDate?: string } {
  const now = new Date();

  const startOf = (d: Date) => {
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    return s;
  };
  const endOf = (d: Date) => {
    const e = new Date(d);
    e.setHours(23, 59, 59, 999);
    return e;
  };

  if (key === 'today') {
    return { startDate: startOf(now).toISOString(), endDate: endOf(now).toISOString() };
  }
  if (key === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { startDate: startOf(y).toISOString(), endDate: endOf(y).toISOString() };
  }
  if (key === 'last7') {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    return { startDate: startOf(s).toISOString(), endDate: endOf(now).toISOString() };
  }
  if (key === 'last30') {
    const s = new Date(now);
    s.setDate(s.getDate() - 29);
    return { startDate: startOf(s).toISOString(), endDate: endOf(now).toISOString() };
  }
  return {}; // 'all' — no date filter
}

// ────── Action type config ──────
const ACTION_TYPES = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'PAYMENT_FAILED', label: 'Payment Failed' },
  { value: 'RISK_DETECTED', label: 'Risk Detected' },
  { value: 'ROOT_CAUSE_IDENTIFIED', label: 'Root Cause Identified' },
  { value: 'PROBABILITY_CALCULATED', label: 'Probability Calculated' },
  { value: 'STRATEGY_SELECTED', label: 'Strategy Selected' },
  { value: 'POLICY_APPROVED', label: 'Policy Approved' },
  { value: 'HUMAN_APPROVAL_REQUESTED', label: 'Human Approval Requested' },
  { value: 'HUMAN_APPROVED', label: 'Human Approved' },
  { value: 'ACTION_EXECUTED', label: 'Action Executed' },
  { value: 'PAYMENT_CAPTURED', label: 'Payment Captured' },
  { value: 'WORKFLOW_STOPPED', label: 'Workflow Stopped' },
];

const DATE_TABS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'all', label: 'All Time' },
];

// ────── Icon mapper ──────
function ActionIcon({ type }: { type: string }) {
  switch (type) {
    case 'RISK_DETECTED':       return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'AI_ANALYSIS':         return <BrainCircuit className="w-4 h-4 text-primary" />;
    case 'STRATEGY_SELECTED':   return <Activity className="w-4 h-4 text-purple-400" />;
    case 'POLICY_VALIDATED':    return <ShieldCheck className="w-4 h-4 text-gray-300" />;
    case 'ACTION_EXECUTED':
    case 'RETRY_PAYMENT':       return <RefreshCw className="w-4 h-4 text-blue-400" />;
    case 'PAYMENT_RECOVERED':   return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'PAYMENT_METHOD_CHANGE': return <CreditCard className="w-4 h-4 text-warning" />;
    case 'EMAIL_REMINDER':      return <span className="text-sm leading-none">📧</span>;
    case 'SMS_OTP':             return <span className="text-sm leading-none">📱</span>;
    default:                    return <History className="w-4 h-4 text-gray-500" />;
  }
}

function actionBadgeColor(type: string) {
  if (['PAYMENT_RECOVERED'].includes(type)) return 'bg-success/10 text-success border-success/20';
  if (['RISK_DETECTED', 'PAYMENT_METHOD_CHANGE'].includes(type)) return 'bg-warning/10 text-warning border-warning/20';
  if (['AI_ANALYSIS', 'STRATEGY_SELECTED'].includes(type)) return 'bg-primary/10 text-primary border-primary/20';
  if (['ACTION_EXECUTED', 'RETRY_PAYMENT', 'EMAIL_REMINDER', 'SMS_OTP'].includes(type)) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  return 'bg-surface/60 text-gray-400 border-border';
}

// ────── Main Component ──────
export default function Audit() {
  const [activeRange, setActiveRange] = useState<RangeKey>('today');
  const [actionTypeFilter, setActionTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const dateRange = getDateRange(activeRange);

  const queryParams: Record<string, string> = {};
  if (dateRange.startDate) queryParams.startDate = dateRange.startDate;
  if (dateRange.endDate)   queryParams.endDate   = dateRange.endDate;
  if (actionTypeFilter !== 'ALL') queryParams.actionType = actionTypeFilter;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auditLogs', activeRange, actionTypeFilter],
    queryFn: () => fetchAuditLogs(queryParams),
    staleTime: 30_000,
  });

  const logs = data?.data ?? [];

  // Client-side text search
  const filtered = search.trim()
    ? logs.filter((l: any) =>
        (l.details || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.transactionId || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.actionType || '').toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const activeActionLabel = ACTION_TYPES.find(a => a.value === actionTypeFilter)?.label ?? 'Filter';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <History className="w-8 h-8 text-primary" /> System Audit Trail
        </h1>
        <p className="text-gray-400 text-sm">
          Complete immutable record of all autonomous decisions and actions.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Date range tabs */}
        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 flex-wrap">
          {DATE_TABS.map(tab => (
            <button
              key={tab.key}
              id={`audit-filter-${tab.key}`}
              onClick={() => setActiveRange(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 whitespace-nowrap
                ${activeRange === tab.key
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surfaceHover'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              id="audit-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="bg-surface border border-border text-gray-200 text-sm rounded-lg pl-8 pr-3 py-1.5 w-44 focus:outline-none focus:border-primary/60 placeholder:text-gray-600 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action type filter dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              id="audit-action-filter"
              onClick={() => setFilterOpen(v => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all duration-150
                ${actionTypeFilter !== 'ALL'
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-surface text-gray-400 border-border hover:text-gray-200 hover:border-gray-600'
                }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="text-xs font-medium max-w-[100px] truncate">{activeActionLabel}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-2xl shadow-black/40 py-1 w-48 animate-in fade-in slide-in-from-top-1 duration-150">
                {ACTION_TYPES.map(at => (
                  <button
                    key={at.value}
                    onClick={() => { setActionTypeFilter(at.value); setFilterOpen(false); }}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm transition-colors
                      ${actionTypeFilter === at.value
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-surfaceHover'
                      }`}
                  >
                    <span>{at.label}</span>
                    {actionTypeFilter === at.value && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            id="audit-refresh"
            onClick={() => refetch()}
            className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-surfaceHover rounded-lg border border-border transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        <span>
          Showing <strong className="text-gray-300">{filtered.length}</strong>
          {data?.total && data.total !== filtered.length ? ` of ${data.total}` : ''} events
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {DATE_TABS.find(t => t.key === activeRange)?.label}
        </span>
        {actionTypeFilter !== 'ALL' && (
          <>
            <span>•</span>
            <button
              onClick={() => setActionTypeFilter('ALL')}
              className="flex items-center gap-1 text-primary hover:text-primary/80"
            >
              <X className="w-3 h-3" /> Clear filter
            </button>
          </>
        )}
      </div>

      {/* Log List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading audit logs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
            <History className="w-10 h-10 text-gray-700" />
            <p className="text-sm font-medium">No audit events found</p>
            <p className="text-xs text-gray-600">
              {activeRange === 'today' ? "No events happened today yet." : "Try changing the date range or filter."}
            </p>
            {activeRange !== 'all' && (
              <button
                onClick={() => setActiveRange('all')}
                className="mt-1 text-xs text-primary hover:underline"
              >
                Show all time →
              </button>
            )}
          </div>
        ) : (
          <div className="relative border-l border-border/40 ml-10 my-6 pb-6 space-y-6 pr-6">
            {filtered.map((log: any) => {
              const type = log.actionType || 'AUDIT_LOG';
              return (
                <div key={log.id} className="relative pl-8 group">
                  {/* Timeline icon */}
                  <div className="absolute -left-[1.15rem] top-2 w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:border-primary/60 transition-colors shadow-sm">
                    <ActionIcon type={type} />
                  </div>

                  {/* Card */}
                  <div className="bg-surface/40 border border-border/60 rounded-xl p-4 group-hover:bg-surface/70 group-hover:border-border transition-all duration-150">
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${actionBadgeColor(type)}`}>
                          {type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-mono">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300 mb-3 leading-relaxed">{log.details}</p>

                    <div className="flex flex-wrap gap-4 text-[11px] font-mono text-gray-500 bg-background/40 border border-border/40 p-2 rounded-lg">
                      <span>
                        <span className="text-gray-600 uppercase tracking-wider mr-1">TX:</span>
                        <span className="text-primary">{log.transactionId || '—'}</span>
                      </span>
                      <span>
                        <span className="text-gray-600 uppercase tracking-wider mr-1">AGENT:</span>
                        <span className="text-gray-400">{log.agentId || '—'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
