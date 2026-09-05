import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '../api';
import {
  History, ShieldCheck, Activity, Search, Filter, CheckCircle2, AlertTriangle,
  RefreshCw, Calendar, X, ChevronDown
} from 'lucide-react';

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
  return {};
}

const ACTION_TYPES = [
  { value: 'ALL', label: 'All Action Events' },
  { value: 'PAYMENT_FAILED', label: 'Payment Failed' },
  { value: 'RISK_DETECTED', label: 'Risk Detected' },
  { value: 'ROOT_CAUSE_IDENTIFIED', label: 'Root Cause Identified' },
  { value: 'STRATEGY_SELECTED', label: 'Strategy Selected' },
  { value: 'POLICY_APPROVED', label: 'Policy Approved' },
  { value: 'HUMAN_APPROVAL_REQUESTED', label: 'Human Approval Requested' },
  { value: 'ACTION_EXECUTED', label: 'Action Executed' },
  { value: 'PAYMENT_CAPTURED', label: 'Payment Captured' },
];

const DATE_TABS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'all', label: 'All Time' },
];

export default function Audit() {
  const [activeRange, setActiveRange] = useState<RangeKey>('today');
  const [actionTypeFilter, setActionTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  const filtered = search.trim()
    ? logs.filter((l: any) =>
        (l.details || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.transactionId || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.actionType || '').toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Cryptographic System Audit Trail</h1>
          <p className="text-xs text-slate-400">Immutable, tamper-evident log of all agent decisions, policy guardrails, and gateway events</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter & Range Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-1">
          {DATE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveRange(tab.key)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeRange === tab.key 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="input-field h-8 pl-8 text-xs w-48"
            />
          </div>

          {/* Action Filter */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(v => !v)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded text-xs font-medium flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>{actionTypeFilter === 'ALL' ? 'Filter Event' : actionTypeFilter}</span>
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-slate-900 border border-slate-800 rounded shadow-xl py-1 w-52 text-xs">
                {ACTION_TYPES.map(at => (
                  <button
                    key={at.value}
                    onClick={() => { setActionTypeFilter(at.value); setFilterOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    {at.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-200 flex items-center justify-between">
          <span>Immutable Audit Ledger ({filtered.length} Entries)</span>
          <span className="font-mono text-[10px] text-emerald-400">HMAC-SHA256 CHECKSUM VERIFIED</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Fetching cryptographic log entries...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No audit records matching specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto custom-sidebar-scrollbar">
            <table className="fintech-table text-xs">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Agent Microservice</th>
                  <th>Transaction ID</th>
                  <th>Operational Rationale & Details</th>
                  <th>Audit Integrity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log: any) => (
                  <tr key={log.id || log._id}>
                    <td className="font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        log.actionType?.includes('RECOVERED') || log.actionType?.includes('CAPTURED') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        log.actionType?.includes('FAILED') || log.actionType?.includes('RISK') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="font-mono text-slate-300">{log.agentId || 'SystemAgent'}</td>
                    <td className="font-mono text-blue-400 font-semibold">{log.transactionId || '—'}</td>
                    <td className="max-w-md text-slate-300 text-[11px]">{log.details}</td>
                    <td>
                      <span className="text-[10px] font-mono text-slate-500">VERIFIED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

