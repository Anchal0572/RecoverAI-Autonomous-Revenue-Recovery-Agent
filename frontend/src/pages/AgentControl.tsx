import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAgentStatus, fetchAgentRuns, fetchTransactions, runAgentPipeline, testIndividualAgent } from '../api';
import {
  Power, Cpu, Zap, Shield, Play, CheckCircle2, XCircle,
  Clock, Activity, BrainCircuit, Search, Target, Eye, BarChart3,
  ChevronRight, AlertTriangle, Loader2, Wrench
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const AGENT_META: Record<string, { icon: any; color: string; bg: string; desc: string }> = {
  'DetectionAgent':       { icon: Search,       color: 'text-yellow-400', bg: 'bg-yellow-400/10', desc: 'Scores revenue risk for each failed payment' },
  'RootCauseAgent':       { icon: Target,       color: 'text-orange-400', bg: 'bg-orange-400/10', desc: 'Classifies failure root cause into 7 categories' },
  'MLPredictionService':  { icon: BrainCircuit, color: 'text-primary',    bg: 'bg-primary/10',    desc: 'Predicts recovery probability via ML engine' },
  'StrategyAgent':        { icon: Zap,          color: 'text-purple-400', bg: 'bg-purple-400/10', desc: 'Selects optimal recovery action' },
  'PolicyAgent':          { icon: Shield,       color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   desc: 'Validates actions against merchant guardrails' },
  'ExecutionAgent':       { icon: Play,         color: 'text-green-400',  bg: 'bg-green-400/10',  desc: 'Executes approved recovery actions' },
  'MonitoringAgent':      { icon: Eye,          color: 'text-blue-400',   bg: 'bg-blue-400/10',   desc: 'Observes results and updates case status' },
  'EvaluationAgent':      { icon: BarChart3,    color: 'text-emerald-400',bg: 'bg-emerald-400/10',desc: 'Calculates performance metrics & ROI' },
};

function outcomeBadge(outcome: string) {
  if (outcome === 'RECOVERED')  return <Badge variant="success">RECOVERED</Badge>;
  if (outcome === 'FAILED')     return <Badge variant="danger">FAILED</Badge>;
  if (outcome === 'STOPPED')    return <Badge variant="default">STOPPED</Badge>;
  if (outcome === 'ESCALATED')  return <Badge variant="warning">ESCALATED</Badge>;
  if (outcome === 'WAITING')    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">WAITING</Badge>;
  return <Badge variant="default">PENDING</Badge>;
}

function stepStatusIcon(status: string) {
  if (status === 'SUCCESS') return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
  if (status === 'FAILED')  return <XCircle className="w-3.5 h-3.5 text-danger" />;
  return <Clock className="w-3.5 h-3.5 text-gray-500" />;
}

export default function AgentControl() {
  const queryClient = useQueryClient();
  const [selectedTxId, setSelectedTxId] = useState('');
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testingAgent, setTestingAgent] = useState<string>('');

  const { data: agentStatus } = useQuery({
    queryKey: ['agentStatus'],
    queryFn: fetchAgentStatus,
    refetchInterval: 5000
  });

  const { data: runsData } = useQuery({
    queryKey: ['agentRuns'],
    queryFn: fetchAgentRuns,
    refetchInterval: 10000
  });

  const { data: txData } = useQuery({
    queryKey: ['failedTransactions'],
    queryFn: () => fetchTransactions({ status: 'failed', limit: '20' })
  });

  const runMutation = useMutation({
    mutationFn: (txId: string) => runAgentPipeline(txId),
    onSuccess: (data) => {
      setPipelineResult(data);
      queryClient.invalidateQueries({ queryKey: ['agentStatus'] });
      queryClient.invalidateQueries({ queryKey: ['agentRuns'] });
    }
  });

  const testMutation = useMutation({
    mutationFn: (agentName: string) => testIndividualAgent(agentName),
    onSuccess: (data) => {
      setTestResult(data);
      setTestingAgent('');
    },
    onError: () => setTestingAgent('')
  });

  const agents = agentStatus?.agents || [];
  const runs = runsData?.data || [];
  const failedTxs = txData?.data || [];

  const handleRun = () => {
    if (selectedTxId) {
      setPipelineResult(null);
      runMutation.mutate(selectedTxId);
    }
  };

  const handleTestAgent = (name: string) => {
    setTestingAgent(name);
    setTestResult(null);
    testMutation.mutate(name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-primary" /> Agent Control Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Live telemetry and controls for the 7-agent autonomous recovery pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="animate-pulse text-xs px-3 py-1">SYSTEM ONLINE</Badge>
          <span className="text-xs text-gray-500">{agents.filter((a: any) => a.status === 'ONLINE').length}/7 agents active</span>
        </div>
      </div>

      {/* ── Run Pipeline Trigger ── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-200 mb-1">Run Full Agent Pipeline</h3>
              <p className="text-xs text-gray-500">Trigger the 7-agent sequence: Detection → Root Cause → Prediction → Strategy → Policy → Execution → Monitoring → Evaluation.</p>
            </div>
            <select
              id="agent-tx-select"
              value={selectedTxId}
              onChange={e => setSelectedTxId(e.target.value)}
              className="bg-surface border border-border rounded-lg text-sm text-gray-300 px-3 py-2 min-w-[220px] focus:outline-none focus:border-primary/60"
            >
              <option value="">Select failed transaction...</option>
              {failedTxs.map((tx: any) => (
                <option key={tx._id || tx.id} value={tx._id || tx.id}>
                  {tx.transactionId || tx._id} — ₹{tx.amount?.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
            <Button
              id="run-pipeline-btn"
              onClick={handleRun}
              disabled={!selectedTxId || runMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-6"
            >
              {runMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</>
              ) : (
                <><Activity className="w-4 h-4 mr-2" /> Run Pipeline</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Pipeline Result ── */}
      {pipelineResult && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Pipeline Result
              </span>
              <div className="flex items-center gap-2">
                {outcomeBadge(pipelineResult.outcome)}
                <span className="text-xs text-gray-500 font-mono">{pipelineResult.totalDurationMs}ms</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Explanation */}
            <div className="bg-background/60 border border-border/40 rounded-lg p-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">AI Explanation</p>
              <p className="text-sm text-gray-200 leading-relaxed">{pipelineResult.explanation}</p>
            </div>

            {/* Step trace */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pipeline Steps</p>
              {pipelineResult.steps?.map((step: any, i: number) => {
                const meta = AGENT_META[step.agent] || { icon: Cpu, color: 'text-gray-400', bg: 'bg-gray-400/10', desc: '' };
                const Icon = meta.icon;
                return (
                  <div key={i} className="flex items-center gap-3 bg-surface/40 border border-border/40 rounded-lg px-3 py-2 hover:bg-surface/70 transition-colors">
                    <div className={`w-7 h-7 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-gray-200">{step.agent}</span>
                    </div>
                    {stepStatusIcon(step.status)}
                    <span className="text-[10px] font-mono text-gray-500 w-12 text-right">{step.durationMs}ms</span>
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                  </div>
                );
              })}
            </div>

            {/* Recovery details */}
            {pipelineResult.recoveryDetails && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Risk Score', value: `${pipelineResult.recoveryDetails.riskScore}/100` },
                  { label: 'Root Cause', value: pipelineResult.recoveryDetails.rootCause },
                  { label: 'ML Probability', value: `${Math.round(pipelineResult.recoveryDetails.recoveryProbability * 100)}%` },
                  { label: 'Strategy', value: pipelineResult.recoveryDetails.selectedAction }
                ].map((m, i) => (
                  <div key={i} className="bg-background/40 border border-border/30 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{m.label}</p>
                    <p className="text-sm font-bold text-gray-200">{m.value || '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Test Individual Agent Result ── */}
      {testResult && (
        <Card className="border-accent/40 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-sm text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-accent" /> Individual Agent Test Output: <span className="font-mono text-primary">{testResult.agentName}</span>
              </span>
              <Badge variant="success">{testResult.durationMs}ms</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-background/80 border border-border/40 p-3 rounded-lg text-xs font-mono text-green-300 overflow-x-auto max-h-60">
              {JSON.stringify(testResult.output, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* ── Agent Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(AGENT_META).map(([name, meta]) => {
          const agent = agents.find((a: any) => a.name === name);
          const Icon = meta.icon;
          const isOnline = agent?.status === 'ONLINE' || name === 'EvaluationAgent';
          const isTestingThis = testingAgent === name;

          return (
            <Card key={name} className={`transition-all duration-200 hover:border-primary/40 ${isOnline ? 'border-border' : 'border-border/50 opacity-80'}`}>
              <CardContent className="pt-4 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-200 leading-tight">{name}</p>
                      <p className="text-[10px] text-gray-500 leading-tight">{meta.desc}</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-gray-600'}`} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/40 rounded-md p-1.5 text-center">
                    <p className="text-[10px] text-gray-500">Tasks</p>
                    <p className="text-sm font-bold text-gray-200">{agent?.tasksProcessed || 0}</p>
                  </div>
                  <div className="bg-background/40 rounded-md p-1.5 text-center">
                    <p className="text-[10px] text-gray-500">Success</p>
                    <p className="text-sm font-bold text-gray-200">{agent?.successRate || 100}%</p>
                  </div>
                  <div className="bg-background/40 rounded-md p-1.5 text-center">
                    <p className="text-[10px] text-gray-500">Avg Latency</p>
                    <p className="text-sm font-bold text-gray-200">{agent?.avgLatencyMs || 15}ms</p>
                  </div>
                  <div className="bg-background/40 rounded-md p-1.5 text-center">
                    <p className="text-[10px] text-gray-500">Status</p>
                    <p className={`text-[10px] font-bold uppercase ${isOnline ? 'text-success' : 'text-gray-500'}`}>
                      {isOnline ? 'ONLINE' : 'IDLE'}
                    </p>
                  </div>
                </div>

                {name !== 'MLPredictionService' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-7 border-border hover:border-primary/50 text-gray-300"
                    onClick={() => handleTestAgent(name)}
                    disabled={isTestingThis}
                  >
                    {isTestingThis ? (
                      <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Testing...</>
                    ) : (
                      <><Wrench className="w-3 h-3 mr-1 text-primary" /> Test Agent</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Evaluation Metrics ── */}
      {agentStatus?.evaluation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Agent Performance Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Runs', value: agentStatus.evaluation.totalRuns },
                { label: 'Recovered', value: agentStatus.evaluation.successfulActions },
                { label: 'Recovery Rate', value: `${Math.round(agentStatus.evaluation.recoveryRate * 100)}%` },
                { label: 'Failed', value: agentStatus.evaluation.failedActions },
                { label: 'Avg Time', value: `${agentStatus.evaluation.avgRecoveryTimeHours}h` },
                { label: 'Efficiency', value: `${agentStatus.evaluation.agentEfficiency}/100` },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{m.label}</p>
                  <p className="text-lg font-bold text-gray-200">{m.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Runs ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Pipeline Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p className="text-sm">No pipeline runs yet. Select a failed transaction above and run the agent pipeline.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {runs.slice(0, 20).map((run: any) => (
                <div key={run._id} className="flex items-center gap-3 bg-surface/40 border border-border/40 rounded-lg px-4 py-2 hover:bg-surface/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary truncate">{run.transactionId}</span>
                      {outcomeBadge(run.outcome)}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{run.explanation}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-gray-500 font-mono">{run.totalDurationMs}ms</p>
                    <p className="text-[10px] text-gray-600">{new Date(run.createdAt).toLocaleTimeString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
