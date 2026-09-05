import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { fetchModelInfo, fetchModelEvaluation } from '../api';
import { Cpu, TrendingUp, ShieldCheck } from 'lucide-react';

export default function ModelPerformance() {
  const { data: info, isLoading: infoLoading } = useQuery({
    queryKey: ['modelInfo'],
    queryFn: fetchModelInfo
  });

  const { data: evaluation, isLoading: evalLoading } = useQuery({
    queryKey: ['modelEvaluation'],
    queryFn: fetchModelEvaluation
  });

  const loading = infoLoading || evalLoading;

  if (loading || !info || !evaluation) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Fetching Scikit-Learn model telemetry & evaluation matrices...
      </div>
    );
  }

  const { confusion_matrix, precision, recall, f1, roc_auc, feature_importances, roc_curve } = evaluation;
  const totalCM = confusion_matrix.tn + confusion_matrix.fp + confusion_matrix.fn + confusion_matrix.tp;

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Machine Learning Model Analytics</h1>
          <p className="text-xs text-slate-400">Scikit-Learn Random Forest prediction accuracy, ROC-AUC benchmarks, and confusion matrices</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MODEL ACTIVE & INFERRING
          </span>
        </div>
      </div>

      {/* Model Metadata Summary Box */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-100">{info.model_name}</h2>
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400 font-mono">
            <span>Algorithm: <strong className="text-blue-400">{info.algorithm}</strong></span>
            <span>•</span>
            <span>Model Version: <strong className="text-slate-200">{info.version}</strong></span>
            <span>•</span>
            <span>Trained Features: <strong className="text-slate-200">10 Parameters</strong></span>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Status: <span className="text-emerald-400 font-semibold uppercase">{info.status}</span>
        </div>
      </div>

      {/* Evaluation Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">ROC-AUC Benchmark</div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight mb-1">{(roc_auc * 100).toFixed(2)}%</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <TrendingUp className="w-3 h-3" /> High Discriminative Power
          </div>
        </div>
        
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">F1-Score</div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight mb-1">{(f1 * 100).toFixed(2)}%</div>
          <div className="text-[11px] text-slate-400">Precision / Recall Balance</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Precision</div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight mb-1">{(precision * 100).toFixed(2)}%</div>
          <div className="text-[11px] text-slate-400">Low False Recovery Rate</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Recall (Sensitivity)</div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight mb-1">{(recall * 100).toFixed(2)}%</div>
          <div className="text-[11px] text-slate-400">Captured Recovery Ratio</div>
        </div>
      </div>

      {/* ROC & Feature Importance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="border-b border-slate-800 pb-3 mb-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">ROC Curve (Receiver Operating Characteristic)</h3>
            <p className="text-[11px] text-slate-400">True Positive Rate vs False Positive Rate curve</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roc_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rocColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="fpr" type="number" domain={[0, 1]} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="tpr" type="number" domain={[0, 1]} stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '11px' }}
                  formatter={(value: any) => [parseFloat(value).toFixed(4), ""]}
                />
                <Area type="monotone" dataKey="tpr" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#rocColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="border-b border-slate-800 pb-3 mb-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">ML Feature Importance Weights</h3>
            <p className="text-[11px] text-slate-400">Feature weight ranking derived from Random Forest trees</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feature_importances} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '11px' }} />
                <Bar dataKey="importance" fill="#0284c7" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
        <div className="border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Empirical Confusion Matrix</h3>
          <p className="text-[11px] text-slate-400">Actual vs Predicted classification outcomes across evaluation test batch</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">True Negatives (TN)</div>
            <div className="text-xl font-bold font-mono text-slate-200 mt-1">{confusion_matrix.tn}</div>
            <div className="text-[11px] text-slate-400 mt-1">Correctly predicted unrecoverable</div>
            <div className="text-[10px] text-slate-500 font-mono mt-2">Rate: {((confusion_matrix.tn / totalCM) * 100).toFixed(1)}%</div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded">
            <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">False Positives (FP)</div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">{confusion_matrix.fp}</div>
            <div className="text-[11px] text-slate-400 mt-1">Incorrectly predicted recoverable</div>
            <div className="text-[10px] text-slate-500 font-mono mt-2">Rate: {((confusion_matrix.fp / totalCM) * 100).toFixed(1)}%</div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded">
            <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">False Negatives (FN)</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">{confusion_matrix.fn}</div>
            <div className="text-[11px] text-slate-400 mt-1">Recoverable charge missed by model</div>
            <div className="text-[10px] text-slate-500 font-mono mt-2">Rate: {((confusion_matrix.fn / totalCM) * 100).toFixed(1)}%</div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded">
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">True Positives (TP)</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{confusion_matrix.tp}</div>
            <div className="text-[11px] text-slate-400 mt-1">Correctly predicted recoverable</div>
            <div className="text-[10px] text-slate-500 font-mono mt-2">Rate: {((confusion_matrix.tp / totalCM) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

