import { useState, useEffect } from 'react';
import {
  AlertTriangle, RefreshCw, CheckCircle, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import { fetchLeakageAlerts, runLeakageDetection } from '../api';

interface LeakageAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  metric: { current: number; baseline: number; unit: string };
  detectedAt: string;
  affectedTransactions?: number;
  estimatedRevenueLoss?: number;
}

export default function LeakageDetection() {
  const [alerts, setAlerts] = useState<LeakageAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [summary, setSummary] = useState({ total: 0, critical: 0, high: 0 });

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetchLeakageAlerts();
      setAlerts(res.alerts || []);
      setSummary({ total: res.totalAlerts || 0, critical: res.criticalCount || 0, high: res.highCount || 0 });
    } catch (err) {
      console.error('Failed to load alerts', err);
    }
    setLoading(false);
  };

  const triggerScan = async () => {
    setScanning(true);
    try {
      const res = await runLeakageDetection();
      setAlerts(res.alerts || []);
      setSummary({ total: res.totalAlerts || 0, critical: res.criticalCount || 0, high: res.highCount || 0 });
    } catch (err) {
      console.error('Scan failed', err);
    }
    setScanning(false);
  };

  useEffect(() => { loadAlerts(); }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Auditing gateway telemetry for revenue leakage anomalies...
      </div>
    );
  }

  const totalPotentialLoss = alerts.reduce((acc, curr) => acc + (curr.estimatedRevenueLoss || 0), 0);

  return (
    <div className="space-y-6 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Revenue Leakage Detection & Audit</h1>
          <p className="text-xs text-slate-400">Automated financial control audit monitoring success drops, failure spikes, and gateway anomalies</p>
        </div>
        <button
          onClick={triggerScan}
          disabled={scanning}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Auditing Telemetry...' : 'Run Audit Scan'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Anomalies</div>
          <div className="text-xl font-bold text-slate-100 font-mono">{summary.total}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider mb-1">Critical Exposure</div>
          <div className="text-xl font-bold text-rose-400 font-mono">{summary.critical}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">High Severity Warnings</div>
          <div className="text-xl font-bold text-amber-400 font-mono">{summary.high}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Est. Potential Loss</div>
          <div className="text-xl font-bold text-rose-400 font-mono">₹{totalPotentialLoss.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Audit Table */}
      {alerts.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-md">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Zero Revenue Leakages Detected</h2>
          <p className="text-xs text-slate-400 mt-1">All payment gateway metrics remain within normal variance baselines.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-200">
            Detected Anomaly Audit Trail ({alerts.length})
          </div>

          <div className="overflow-x-auto custom-sidebar-scrollbar">
            <table className="fintech-table text-xs">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Anomaly Type</th>
                  <th>Description</th>
                  <th>Current vs Baseline</th>
                  <th>Est. Revenue Loss</th>
                  <th>Detection Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(alert => (
                  <tr key={alert.id}>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        alert.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-200 font-mono">{alert.type}</div>
                      <div className="text-[10px] text-slate-500">{alert.title}</div>
                    </td>
                    <td className="max-w-xs text-slate-400 text-[11px]">
                      {alert.description}
                    </td>
                    <td className="font-mono">
                      <span className="text-slate-200 font-bold">{alert.metric.current}{alert.metric.unit}</span>
                      <span className="text-slate-500 text-[10px] ml-1.5">(Base: {alert.metric.baseline}{alert.metric.unit})</span>
                    </td>
                    <td className="font-mono font-bold text-rose-400">
                      ₹{(alert.estimatedRevenueLoss || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="font-mono text-slate-500 text-[10px]">
                      {new Date(alert.detectedAt).toLocaleTimeString('en-IN')}
                    </td>
                    <td>
                      <button className="text-[11px] text-blue-400 hover:underline font-medium flex items-center gap-1">
                        Inspect <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

