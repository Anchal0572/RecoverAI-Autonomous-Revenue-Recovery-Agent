import { useState, useEffect } from 'react';
import {
  Crown, TrendingUp, AlertTriangle, TrendingDown, UserCheck,
  Users, RefreshCw
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

const iconMap: Record<string, any> = {
  Crown, TrendingUp, AlertTriangle, TrendingDown, UserCheck
};

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
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            👥 Customer Segmentation
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {totalCustomers} customers segmented for targeted recovery strategies
          </p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map(seg => {
          const Icon = iconMap[seg.icon] || Users;
          const isExpanded = expanded === seg.segment;
          return (
            <div
              key={seg.segment}
              className="glass-card overflow-hidden transition-all hover:border-gray-600 cursor-pointer"
              style={{ borderTop: `3px solid ${seg.color}` }}
              onClick={() => setExpanded(isExpanded ? null : seg.segment)}
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${seg.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: seg.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">{seg.segment}</h3>
                    <p className="text-[10px] text-gray-400">{seg.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Customers</p>
                    <p className="text-lg font-bold" style={{ color: seg.color }}>{seg.customerCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Revenue</p>
                    <p className="text-sm font-semibold text-gray-300">₹{seg.totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Avg Score</p>
                    <p className="text-sm font-semibold text-gray-300">{seg.avgRecoveryScore}/100</p>
                  </div>
                </div>
              </div>

              {/* Expanded Customer List */}
              {isExpanded && seg.customers.length > 0 && (
                <div className="border-t border-border p-4 bg-background/50">
                  <div className="max-h-48 overflow-y-auto custom-sidebar-scrollbar space-y-2">
                    {seg.customers.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-surface/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-200 truncate">{c.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{c.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-xs font-semibold text-gray-300">₹{c.ltv.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-gray-500">
                            {c.failedTransactions}F / {c.recoveredTransactions}R
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isExpanded && seg.customers.length === 0 && (
                <div className="border-t border-border p-4 bg-background/50 text-center">
                  <p className="text-xs text-gray-500">No customers in this segment</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
