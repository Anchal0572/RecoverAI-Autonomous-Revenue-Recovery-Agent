import { useState } from 'react';
import { RefreshCw, AlertCircle, Trophy, Clock, Users } from 'lucide-react';
import { compareStrategies } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STRATEGIES = ['RETRY', 'PAYMENT_LINK', 'REMINDER', 'ESCALATE', 'WAIT', 'STOP', 'PLAN_DOWNGRADE'];
const STRATEGY_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#6366f1', '#ef4444', '#06b6d4'];

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          📊 Strategy Comparison
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Compare recovery strategies by actual historical performance
        </p>
      </div>

      {/* Strategy Selector */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-gray-200 mb-3">Select Strategies to Compare (2–5)</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {STRATEGIES.map((s, i) => (
            <button
              key={s}
              onClick={() => toggle(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                selected.includes(s)
                  ? 'text-white border-transparent'
                  : 'text-gray-400 border-border hover:border-gray-500'
              }`}
              style={selected.includes(s) ? { background: STRATEGY_COLORS[i], borderColor: STRATEGY_COLORS[i] } : {}}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button
          onClick={runComparison}
          disabled={loading || selected.length < 2}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Comparing...' : 'Compare Strategies'}
        </button>
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">{disclaimer}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Chart */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-200 mb-4">Recovery Rate Comparison</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="strategy"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickLine={false}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#f4f4f5' }}
                  />
                  <Bar dataKey="recoveryRate" name="Recovery Rate (%)">
                    {results.map((_, i) => (
                      <Cell key={i} fill={STRATEGY_COLORS[STRATEGIES.indexOf(results[i].strategy)] || '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="glass-card p-5 overflow-x-auto">
            <h2 className="text-sm font-semibold text-gray-200 mb-4">Detailed Comparison</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-[11px] text-gray-400 uppercase tracking-wider">Strategy</th>
                  <th className="pb-3 text-[11px] text-gray-400 uppercase tracking-wider text-right">Recovery Rate</th>
                  <th className="pb-3 text-[11px] text-gray-400 uppercase tracking-wider text-right">Revenue Recovered</th>
                  <th className="pb-3 text-[11px] text-gray-400 uppercase tracking-wider text-right">Interventions</th>
                  <th className="pb-3 text-[11px] text-gray-400 uppercase tracking-wider text-right">Avg Time</th>
                  <th className="pb-3 text-[11px] text-gray-400 uppercase tracking-wider text-right">Sample Size</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.strategy} className="border-b border-border/50 hover:bg-surfaceHover transition-colors">
                    <td className="py-3 text-sm font-medium text-gray-200 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ background: STRATEGY_COLORS[STRATEGIES.indexOf(r.strategy)] || '#6b7280' }}
                      />
                      {r.strategy.replace('_', ' ')}
                      {best && r.strategy === best.strategy && (
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </td>
                    <td className="py-3 text-sm text-right font-semibold text-green-400">{r.recoveryRate}%</td>
                    <td className="py-3 text-sm text-right text-gray-300">₹{r.revenueRecovered.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-sm text-right text-gray-300 flex items-center justify-end gap-1">
                      <Users className="w-3 h-3 text-gray-500" />{r.interventions}
                    </td>
                    <td className="py-3 text-sm text-right text-gray-300 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />{r.averageRecoveryTimeMs}ms
                    </td>
                    <td className="py-3 text-sm text-right">
                      <span className={`${r.sampleSize < 30 ? 'text-amber-400' : 'text-gray-300'}`}>
                        {r.sampleSize}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
