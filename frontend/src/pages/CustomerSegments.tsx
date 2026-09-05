import { useState, useEffect } from 'react';
import {
  Users, RefreshCw, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { fetchCustomerSegments } from '../api';

interface CustomerData {
  customerId: string;
  name: string;
  email: string;
  ltv: number;
  failedTransactions: number;
  recoveredTransactions: number;
  totalAtRisk: number;
}

interface Segment {
  segment: string;
  description: string;
  color: string;
  icon: string;
  customerCount: number;
  totalRevenue: number;
  avgRecoveryScore: number;
  customers: CustomerData[];
}

export default function CustomerSegments() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchCustomerSegments();
      setSegments(res.segments || []);
      setTotalCustomers(res.totalCustomers || 0);
    } catch (err) {
      console.error('Failed to load segments', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading customer revenue cohorts...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Customer Revenue Intelligence & Cohorts</h1>
          <p className="text-xs text-slate-400">Targeted risk profiles across {totalCustomers} enterprise customer accounts</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded transition-colors flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Cohorts
        </button>
      </div>

      {/* Cohort Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map(seg => {
          const isExpanded = expanded === seg.segment;
          return (
            <div
              key={seg.segment}
              className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden transition-colors hover:border-slate-700"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{seg.segment}</h3>
                    <p className="text-[11px] text-slate-400">{seg.description}</p>
                  </div>
                  <span 
                    className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border"
                    style={{ backgroundColor: `${seg.color}15`, color: seg.color, borderColor: `${seg.color}30` }}
                  >
                    {seg.customerCount} Accounts
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Total Value</div>
                    <div className="font-mono font-bold text-slate-200 mt-0.5">₹{seg.totalRevenue.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Avg Score</div>
                    <div className="font-mono font-semibold text-slate-300 mt-0.5">{seg.avgRecoveryScore} / 100</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Churn Risk</div>
                    <div className={`font-semibold mt-0.5 ${seg.avgRecoveryScore < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {seg.avgRecoveryScore < 50 ? 'HIGH' : 'LOW'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setExpanded(isExpanded ? null : seg.segment)}
                  className="w-full pt-2 border-t border-slate-800/60 text-[11px] text-blue-400 hover:underline flex items-center justify-center gap-1 font-medium"
                >
                  {isExpanded ? 'Hide Customer Table' : 'View Account Table'} {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Expanded Customer Table */}
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/60 p-3">
                  {seg.customers.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 text-xs">No active customers in this cohort</div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto custom-sidebar-scrollbar">
                      <table className="fintech-table text-xs">
                        <thead>
                          <tr>
                            <th>Account Name</th>
                            <th>LTV</th>
                            <th>Failures</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seg.customers.map((c, i) => (
                            <tr key={i}>
                              <td>
                                <div className="font-medium text-slate-200">{c.name}</div>
                                <div className="text-[10px] text-slate-500">{c.email}</div>
                              </td>
                              <td className="font-mono font-semibold text-slate-100">₹{c.ltv.toLocaleString('en-IN')}</td>
                              <td className="font-mono text-slate-400">{c.failedTransactions} Failures</td>
                              <td>
                                <span className="text-[10px] font-mono text-blue-400">DISPATCH_LINK</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

