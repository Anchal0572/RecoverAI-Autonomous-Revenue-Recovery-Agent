import { useState, useEffect } from 'react';
import {
  AlertTriangle, Shield, TrendingDown, Activity, Zap,
  RefreshCw, CheckCircle, AlertOctagon, Info
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

const severityConfig: Record<string, { color: string; bg: string; icon: any }> = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertOctagon },
  HIGH: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: AlertTriangle },
  MEDIUM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Info },
  LOW: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Info }
};

const typeIcons: Record<string, any> = {
  SUCCESS_DROP: TrendingDown,
  FAILURE_SPIKE: Zap,
  ABANDONMENT_SPIKE: Activity,
  RECOVERY_DETERIORATION: TrendingDown,
  HIGH_VALUE_CLUSTER: Shield
};

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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
            🔍 Revenue Leakage Detection
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Detect payment success drops, failure spikes, abandonment spikes, and high-value failure clusters
          </p>
        </div>
        <button
          onClick={triggerScan}
          disabled={scanning}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Run Detection Scan'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">Total Alerts</p>
            <p className="text-2xl font-bold text-blue-400">{summary.total}</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">Critical</p>
            <p className="text-2xl font-bold text-red-400">{summary.critical}</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">High Severity</p>
            <p className="text-2xl font-bold text-orange-400">{summary.high}</p>
          </div>
        </div>
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-200">No Leakages Detected</h2>
          <p className="text-sm text-gray-400 mt-2">
            All revenue metrics are within normal ranges. Run a scan to check for new anomalies.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => {
            const sev = severityConfig[alert.severity] || severityConfig.LOW;
            const TypeIcon = typeIcons[alert.type] || AlertTriangle;
            const SevIcon = sev.icon;
            return (
              <div
                key={alert.id}
                className="glass-card p-5 hover:border-gray-600 transition-all"
                style={{ borderLeft: `3px solid ${sev.color}` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: sev.bg }}
                    >
                      <TypeIcon className="w-5 h-5" style={{ color: sev.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                          style={{ color: sev.color, background: sev.bg }}
                        >
                          <SevIcon className="w-3 h-3 inline mr-1" />
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-gray-500">{alert.type.replace(/_/g, ' ')}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-200">{alert.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">{alert.description}</p>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="text-xs">
                          <span className="text-gray-500">Current: </span>
                          <span className="font-semibold text-gray-300">{alert.metric.current} {alert.metric.unit}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">Baseline: </span>
                          <span className="font-semibold text-gray-300">{alert.metric.baseline} {alert.metric.unit}</span>
                        </div>
                        {alert.affectedTransactions !== undefined && (
                          <div className="text-xs">
                            <span className="text-gray-500">Affected: </span>
                            <span className="font-semibold text-gray-300">{alert.affectedTransactions} txns</span>
                          </div>
                        )}
                        {alert.estimatedRevenueLoss !== undefined && alert.estimatedRevenueLoss > 0 && (
                          <div className="text-xs">
                            <span className="text-gray-500">Est. Loss: </span>
                            <span className="font-semibold text-red-400">₹{alert.estimatedRevenueLoss.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-500 flex-shrink-0">
                    {new Date(alert.detectedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
