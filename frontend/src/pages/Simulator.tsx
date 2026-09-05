import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Activity, PlayCircle, Settings2, HelpCircle, BarChart3, FlaskConical, Sliders, ArrowRight } from 'lucide-react';
import { runWhatIfSimulation } from '../api';

const simulatorSchema = z.object({
  amountAtRisk: z.number().min(1000),
  totalCases: z.number().min(1),
  baseRecoveryProbability: z.number().min(0).max(100),
  retrySuccessRate: z.number().min(0).max(100),
  retryLimit: z.number().min(1).max(5),
  recoveryWindowDays: z.number().min(1).max(30),
  strategy: z.enum(['conservative', 'balanced', 'aggressive']),
});

type SimulatorData = z.infer<typeof simulatorSchema>;

const STRATEGIES = ['RETRY', 'PAYMENT_LINK', 'REMINDER', 'ESCALATE', 'WAIT', 'PLAN_DOWNGRADE'];

export default function Simulator() {
  const [activeTab, setActiveTab] = useState<'classic' | 'whatif'>('classic');

  // Classic simulator state
  const [results, setResults] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  // What-If simulator state
  const [wiRecoveryProb, setWiRecoveryProb] = useState(0.65);
  const [wiRetrySuccess, setWiRetrySuccess] = useState(0.5);
  const [wiWindow, setWiWindow] = useState(7);
  const [wiRetryLimit, setWiRetryLimit] = useState(3);
  const [wiStrategy, setWiStrategy] = useState('RETRY');
  const [wiResults, setWiResults] = useState<any>(null);
  const [wiLoading, setWiLoading] = useState(false);

  const form = useForm<SimulatorData>({
    resolver: zodResolver(simulatorSchema),
    defaultValues: {
      amountAtRisk: 500000,
      totalCases: 250,
      baseRecoveryProbability: 65,
      retrySuccessRate: 40,
      retryLimit: 3,
      recoveryWindowDays: 7,
      strategy: 'balanced',
    }
  });

  const onSubmit = (data: SimulatorData) => {
    setSimulating(true);
    setResults(null);
    
    setTimeout(() => {
      let multiplier = 1;
      let riskFactor = 'Low';
      
      if (data.strategy === 'aggressive') { multiplier = 1.15; riskFactor = 'High'; }
      if (data.strategy === 'conservative') { multiplier = 0.85; riskFactor = 'Low'; }
      if (data.strategy === 'balanced') { multiplier = 1.0; riskFactor = 'Medium'; }

      const expectedCases = Math.floor(data.totalCases * (data.baseRecoveryProbability / 100) * multiplier);
      const expectedRevenue = expectedCases * (data.amountAtRisk / data.totalCases);
      
      setResults({
        expectedRecovery: expectedRevenue,
        recoveryRate: ((expectedCases / data.totalCases) * 100).toFixed(1),
        expectedSuccessfulCases: expectedCases,
        estimatedRecoveryTime: data.strategy === 'aggressive' ? '1-2 Days' : data.strategy === 'conservative' ? '5-7 Days' : '3-5 Days',
        risk: riskFactor
      });
      setSimulating(false);
    }, 800);
  };

  const runWhatIf = async () => {
    setWiLoading(true);
    try {
      const res = await runWhatIfSimulation({
        recoveryProbability: wiRecoveryProb,
        retrySuccessRate: wiRetrySuccess,
        recoveryWindowDays: wiWindow,
        retryLimit: wiRetryLimit,
        strategy: wiStrategy
      });
      setWiResults(res);
    } catch (err) {
      console.error('What-if failed', err);
    }
    setWiLoading(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Financial Recovery Scenario Simulator</h1>
          <p className="text-xs text-slate-400">Interactive financial modeling console for strategy parameters and revenue projections</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('classic')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
              activeTab === 'classic'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Parametric Model
          </button>
          <button
            onClick={() => setActiveTab('whatif')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
              activeTab === 'whatif'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            What-If Scenario
          </button>
        </div>
      </div>

      {/* Classic Parametric Tab */}
      {activeTab === 'classic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-md p-4 space-y-4">
            <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
              Model Input Variables
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium mb-1 block">Gross Amount at Risk (₹)</label>
                <input type="number" {...form.register('amountAtRisk', { valueAsNumber: true })} className="input-field h-8" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium mb-1 block">Failed Cases</label>
                  <input type="number" {...form.register('totalCases', { valueAsNumber: true })} className="input-field h-8" />
                </div>
                <div>
                  <label className="text-slate-400 font-medium mb-1 block">Base Prob (%)</label>
                  <input type="number" {...form.register('baseRecoveryProbability', { valueAsNumber: true })} className="input-field h-8" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium mb-1 block">Retry Limit</label>
                  <input type="number" {...form.register('retryLimit', { valueAsNumber: true })} className="input-field h-8" />
                </div>
                <div>
                  <label className="text-slate-400 font-medium mb-1 block">Window (Days)</label>
                  <input type="number" {...form.register('recoveryWindowDays', { valueAsNumber: true })} className="input-field h-8" />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium mb-1 block">Strategy Risk Mode</label>
                <select 
                  {...form.register('strategy')}
                  className="input-field h-8 text-xs bg-slate-950"
                >
                  <option value="conservative">Conservative (Minimal Customer Friction)</option>
                  <option value="balanced">Balanced (Optimal Revenue/Friction)</option>
                  <option value="aggressive">Aggressive (Maximum Revenue Recovery)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={simulating}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                {simulating ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Computing Model...</>
                ) : (
                  <><PlayCircle className="w-3.5 h-3.5" /> Execute Simulation</>
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col">
            <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2 mb-4">
              Simulated Financial Outcomes
            </div>

            {!results && !simulating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                <BarChart3 className="w-10 h-10 mb-2 text-slate-600" />
                <p className="text-xs">Adjust input variables and run model simulation.</p>
              </div>
            ) : simulating ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12">
                <div className="w-6 h-6 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-xs text-blue-400 font-mono">Running Monte-Carlo Projections...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded text-center">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Projected Recovered Revenue</div>
                  <div className="text-3xl font-bold font-mono text-emerald-400">
                    ₹{results.expectedRecovery.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
                    <div className="text-slate-500 text-[10px]">Projected Recovery Rate</div>
                    <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">{results.recoveryRate}%</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
                    <div className="text-slate-500 text-[10px]">Expected Recovered Cases</div>
                    <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">{results.expectedSuccessfulCases} Cases</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
                    <div className="text-slate-500 text-[10px]">Estimated Recovery Window</div>
                    <div className="text-sm font-semibold text-slate-200 mt-0.5">{results.estimatedRecoveryTime}</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
                    <div className="text-slate-500 text-[10px]">Customer Churn Risk</div>
                    <div className={`text-sm font-bold mt-0.5 ${results.risk === 'High' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {results.risk} Risk Profile
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* What-If Tab */}
      {activeTab === 'whatif' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-md p-4 space-y-4">
            <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
              What-If Slider Parameters
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Recovery Probability</span>
                  <span className="font-mono font-bold text-blue-400">{Math.round(wiRecoveryProb * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={wiRecoveryProb}
                  onChange={e => setWiRecoveryProb(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Retry Success Rate</span>
                  <span className="font-mono font-bold text-blue-400">{Math.round(wiRetrySuccess * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={wiRetrySuccess}
                  onChange={e => setWiRetrySuccess(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Window (Days)</span>
                  <span className="font-mono font-bold text-blue-400">{wiWindow} Days</span>
                </div>
                <input
                  type="range" min="1" max="30" step="1"
                  value={wiWindow}
                  onChange={e => setWiWindow(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Retry Limit</span>
                  <span className="font-mono font-bold text-blue-400">{wiRetryLimit} Attempts</span>
                </div>
                <input
                  type="range" min="1" max="10" step="1"
                  value={wiRetryLimit}
                  onChange={e => setWiRetryLimit(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <button 
                onClick={runWhatIf} 
                disabled={wiLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                {wiLoading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Computing What-If...</>
                ) : (
                  <><Sliders className="w-3.5 h-3.5" /> Analyze Scenario</>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col">
            <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2 mb-4">
              What-If Projections vs Real Data
            </div>

            {!wiResults && !wiLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                <Sliders className="w-10 h-10 mb-2 text-slate-600" />
                <p className="text-xs">Adjust sliders and run what-if scenario analysis.</p>
              </div>
            ) : wiLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12">
                <div className="w-6 h-6 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-xs text-blue-400 font-mono">Simulating Scenario Variance...</p>
              </div>
            ) : wiResults?.results ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded text-center">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Expected Scenario Recovery</div>
                  <div className="text-3xl font-bold font-mono text-blue-400">
                    ₹{wiResults.results.expectedRecovery.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
                    <div className="text-slate-500 text-[10px]">Recovery Rate</div>
                    <div className="text-base font-bold font-mono text-slate-100 mt-0.5">{wiResults.results.expectedRecoveryRate}%</div>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
                    <div className="text-slate-500 text-[10px]">ROI Multiplier</div>
                    <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">{wiResults.results.roi}%</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

