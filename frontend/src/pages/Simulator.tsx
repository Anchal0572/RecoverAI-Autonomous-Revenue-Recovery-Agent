import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Activity, PlayCircle, Settings2, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

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

export default function Simulator() {
  const [results, setResults] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

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
    
    // Simulate complex calculation
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
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" /> Strategy Simulator
        </h1>
        <p className="text-gray-400">Test different recovery parameters and strategies before deploying them to live production.</p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-warning/10 border border-warning/20 text-warning text-xs font-bold rounded-md self-start">
          <Settings2 className="w-4 h-4" /> SIMULATION ENVIRONMENT
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base text-gray-200">Simulation Parameters</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    Amount at Risk (₹) <HelpCircle className="w-3 h-3 text-gray-500" />
                  </label>
                  <Input type="number" {...form.register('amountAtRisk', { valueAsNumber: true })} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Cases</label>
                    <Input type="number" {...form.register('totalCases', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Base Prob (%)</label>
                    <Input type="number" {...form.register('baseRecoveryProbability', { valueAsNumber: true })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Retry Limit</label>
                    <Input type="number" {...form.register('retryLimit', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recovery Window</label>
                    <Input type="number" {...form.register('recoveryWindowDays', { valueAsNumber: true })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Execution Strategy</label>
                  <select 
                    {...form.register('strategy')}
                    className="w-full h-10 bg-background border border-border rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    <option value="conservative">Conservative (Minimal Customer Friction)</option>
                    <option value="balanced">Balanced (Optimal Revenue/Friction)</option>
                    <option value="aggressive">Aggressive (Maximum Revenue Recovery)</option>
                  </select>
                </div>

                <Button type="submit" className="w-full gap-2 mt-4" disabled={simulating}>
                  {simulating ? (
                    <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Running Simulation...</>
                  ) : (
                    <><PlayCircle className="w-4 h-4" /> Run Simulation</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-7">
          <Card className="h-full border-primary/20 bg-gradient-to-br from-surface to-surfaceHover shadow-xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Projected Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 h-full flex flex-col">
              {!results && !simulating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <Activity className="w-16 h-16 opacity-20 mb-4" />
                  <p>Configure parameters and run the simulation to see projected outcomes.</p>
                </div>
              ) : simulating ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-2 border-4 border-primary/40 rounded-full animate-pulse"></div>
                    <div className="absolute inset-4 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-primary font-mono text-sm tracking-widest animate-pulse">COMPUTING PROJECTIONS...</p>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Expected Revenue Recovery</div>
                    <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-success to-cyan-400">
                      ₹{results.expectedRecovery.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-background/50 border border-border p-4 rounded-xl text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Projected Rate</div>
                      <div className="text-2xl font-bold text-white">{results.recoveryRate}%</div>
                    </div>
                    <div className="bg-background/50 border border-border p-4 rounded-xl text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Successful Cases</div>
                      <div className="text-2xl font-bold text-white">{results.expectedSuccessfulCases}</div>
                    </div>
                    <div className="bg-background/50 border border-border p-4 rounded-xl text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time to Recover</div>
                      <div className="text-lg font-bold text-white mt-1">{results.estimatedRecoveryTime}</div>
                    </div>
                    <div className="bg-background/50 border border-border p-4 rounded-xl text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Churn Risk Profile</div>
                      <div className={`text-lg font-bold mt-1 ${results.risk === 'High' ? 'text-danger' : results.risk === 'Medium' ? 'text-warning' : 'text-success'}`}>
                        {results.risk}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Ensure BarChart3 is imported since it's used in the JSX
import { BarChart3 } from 'lucide-react';
