import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactions, analyzeTransaction } from '../api';
import { BrainCircuit, Search, ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function DecisionCenter() {
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const { data: txData } = useQuery({
    queryKey: ['transactions', 'PENDING'],
    queryFn: () => fetchTransactions({ status: 'PENDING' })
  });
  
  const pendingCases = txData?.data || [];

  useEffect(() => {
    if (pendingCases.length > 0 && !selectedTxId) {
      setSelectedTxId(pendingCases[0].id);
    }
  }, [pendingCases, selectedTxId]);

  const { data: analysis, isLoading: analyzing } = useQuery({
    queryKey: ['analyze', selectedTxId],
    queryFn: () => analyzeTransaction(selectedTxId),
    enabled: !!selectedTxId
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar - Pending Cases */}
      <Card className="w-80 flex flex-col h-full overflow-hidden shrink-0 border-r border-border">
        <div className="p-4 border-b border-border bg-surface/80 backdrop-blur">
          <h2 className="text-sm font-semibold flex items-center justify-between mb-3">
            Pending Cases <Badge variant="warning">{pendingCases.length}</Badge>
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Filter cases..." 
              className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {pendingCases.map((tx: any) => (
            <div 
              key={tx.id}
              onClick={() => setSelectedTxId(tx.id)}
              className={`p-4 border-b border-border/50 cursor-pointer transition-colors ${
                selectedTxId === tx.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-surfaceHover'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-sm text-gray-200">{tx.customer.name}</div>
                <div className="text-xs font-semibold text-white">₹{tx.amount.toLocaleString()}</div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs font-mono text-gray-500">{tx.id.substring(0, 10)}</div>
                <Badge variant={tx.riskLevel === 'HIGH' ? 'danger' : tx.riskLevel === 'MEDIUM' ? 'warning' : 'success'} className="scale-90 origin-right">
                  {tx.riskLevel}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Analysis Area */}
      <div className="flex-1 h-full overflow-y-auto">
        {!selectedTxId ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a case to view AI decision processing.</p>
          </div>
        ) : analyzing ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin mb-4"></div>
            <p className="text-primary font-medium animate-pulse">Running ML pipeline...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6 pb-12">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Decision Logic Explorer</h1>
                <p className="text-sm text-gray-400">Transparent view into the autonomous strategy selection.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm text-gray-300">1. Root Cause Analysis</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Gateway Code</span>
                    <span className="font-mono text-sm text-danger">{analysis.pipeline.rootCauseAnalysis.errorCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Detected Cause</span>
                    <span className="text-sm font-medium">{analysis.pipeline.rootCauseAnalysis.cause}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-surfaceHover rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${analysis.pipeline.rootCauseAnalysis.confidence}%` }}></div>
                      </div>
                      <span className="font-mono text-xs">{analysis.pipeline.rootCauseAnalysis.confidence}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm text-gray-300">2. Recovery Probability Modeling</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Priority Score</span>
                      <span className="text-sm font-bold text-white">{analysis.pipeline.prioritization.score} / 100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Classification</span>
                      <Badge variant="outline" className="border-primary text-primary">{analysis.pipeline.recoveryProbability.classification}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Queue Rank</span>
                      <Badge variant="secondary">{analysis.pipeline.prioritization.rank}</Badge>
                    </div>
                  </div>
                  <div className="w-24 h-24 relative flex items-center justify-center ml-6 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${analysis.pipeline.recoveryProbability.probability}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold leading-none">{analysis.pipeline.recoveryProbability.probability}</span>
                      <span className="text-[9px] text-gray-400">%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <CardHeader className="bg-primary/5 border-b border-primary/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> 3. Final Decision & Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-surfaceHover border border-border rounded-lg p-5 mb-6">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Decision Explanation</div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Based on a root cause of <strong className="text-white">"{analysis.pipeline.rootCauseAnalysis.cause}"</strong> with {analysis.pipeline.rootCauseAnalysis.confidence}% confidence, 
                    and a {analysis.pipeline.recoveryProbability.classification.toLowerCase()} expected recovery probability ({analysis.pipeline.recoveryProbability.probability}%), 
                    the agent policy permits the following workflow actions. Customer LTV of ₹{analysis.customer.ltv.toLocaleString()} elevates priority to {analysis.pipeline.prioritization.rank}.
                  </p>
                </div>

                <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Selected Action Path</div>
                <div className="flex flex-col gap-2">
                  {analysis.pipeline.recommendedStrategies.map((strategy: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-success/30 bg-success/5">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      <div className="font-medium text-success text-sm">{strategy.replace(/_/g, ' ')}</div>
                      {i === 0 && <Badge variant="success" className="ml-auto text-[10px]">Primary Execution</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        ) : null}
      </div>
    </div>
  );
}
