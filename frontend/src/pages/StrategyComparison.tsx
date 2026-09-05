import { useState } from 'react';
import { RefreshCw, AlertCircle, Trophy, Clock, Zap } from 'lucide-react';
import { compareStrategies } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STRATEGIES = ['RETRY', 'PAYMENT_LINK', 'REMINDER', 'ESCALATE', 'WAIT', 'STOP', 'PLAN_DOWNGRADE'];
const STRATEGY_COLORS = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#6366f1', '#ef4444', '#0284c7'];

interface StrategyResult {
  strategy: string;
  recoveryRate: number;
  revenueRecovered: number;
  totalRuns: number;
  recoveredCount: number;
  interventions: number;
  averageRecoveryTimeMs: number;
  sampleSize: number;
}

export default function StrategyComparison() {
  const [selected, setSelected] = useState<string[]>(['RETRY', 'PAYMENT_LINK', 'ESCALATE']);
  const [results, setResults] = useState<StrategyResult[]>([]);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = (s: string) => {
    setSelected(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const runComparison = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    try {
      const res = await compareStrategies(selected);
      setResults(res.comparison || []);
      setDisclaimer(res.disclaimer);
    } catch (err) {
      console.error('Comparison failed', err);
    }
    setLoading(false);
  };

  const best = results.length > 0
    ? results.reduce((a, b) => a.recoveryRate > b.recoveryRate ? a : b)
    : null;

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Recovery Strategy Benchmark Matrix</h1>
          <p className="text-xs text-slate-400">Side-by-side empirical performance matrix across execution strategies</p>
        </div>
      </div>

      {/* Strategy Selector Console */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
        <div className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2 mb-3">
          Select Recovery Action Strategies to Compare (Min 2 required)
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {STRATEGIES.map((s, i) => {
            const isSelected = selected.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggle(s)}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors border ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
        <button
          onClick={runComparison}
          disabled={loading || selected.length < 2}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Evaluating Matrix...' : 'Run Strategy Benchmark'}
        </button>
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300 flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{disclaimer}</span>
        </div>
      )}

      {/* Benchmark Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
            <div className="border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Recovery Success Rate (%) Comparison</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} barSize={32} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="strategy" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '11px' }}
                  />
                  <Bar dataKey="recoveryRate" name="Recovery Rate (%)">
                    {results.map((_, i) => (
                      <Cell key={i} fill={STRATEGY_COLORS[STRATEGIES.indexOf(results[i].strategy)] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
            <div className="p-3 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-200">
              Detailed Benchmark Matrix
            </div>
            <div className="overflow-x-auto custom-sidebar-scrollbar">
              <table className="fintech-table text-xs">
                <thead>
                  <tr>
                    <th>Strategy</th>
                    <th className="text-right">Recovery Rate %</th>
                    <th className="text-right">Total Recovered (₹)</th>
                    <th className="text-right">Interventions</th>
                    <th className="text-right">Avg Speed (ms)</th>
                    <th className="text-right">Sample Size</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.strategy}>
                      <td className="font-semibold text-slate-200 font-mono flex items-center gap-2">
                        {r.strategy.replace(/_/g, ' ')}
                        {best && r.strategy === best.strategy && (
                          <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold rounded">TOP PERFORMER</span>
                        )}
                      </td>
                      <td className="text-right font-mono font-bold text-emerald-400">{r.recoveryRate}%</td>
                      <td className="text-right font-mono text-slate-200 font-bold">₹{r.revenueRecovered.toLocaleString('en-IN')}</td>
                      <td className="text-right font-mono text-slate-400">{r.interventions}</td>
                      <td className="text-right font-mono text-slate-400">{r.averageRecoveryTimeMs}ms</td>
                      <td className="text-right font-mono text-slate-400">{r.sampleSize} txns</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

