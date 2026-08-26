import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { fetchModelInfo, fetchModelEvaluation } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Brain, TrendingUp } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-border border-t-primary animate-spin mb-2"></div>
        <p className="text-gray-400 text-sm ml-3">Computing ML evaluation matrices...</p>
      </div>
    );
  }

  const { confusion_matrix, precision, recall, f1, roc_auc, feature_importances, roc_curve } = evaluation;
  const totalCM = confusion_matrix.tn + confusion_matrix.fp + confusion_matrix.fn + confusion_matrix.tp;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" /> ML Engine Performance
        </h1>
        <p className="text-gray-400">Actual performance metrics, weights, and metrics of the payment recovery model.</p>
      </div>

      {/* Model Metadata Banner */}
      <div className="bg-surface/30 border border-border p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold text-white">{info.model_name}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400 font-mono">
            <span>Algorithm: <strong className="text-primary">{info.algorithm}</strong></span>
            <span>•</span>
            <span>Version: <strong className="text-gray-300">{info.version}</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></div>
          <span className="text-sm font-semibold text-success">{info.status}</span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-surface to-surface/50 border-border">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-400">ROC-AUC Score</div>
            <div className="text-3xl font-bold text-white mt-1">{(roc_auc * 100).toFixed(2)}%</div>
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> High discriminative power
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-surface to-surface/50 border-border">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-400">F1-Score</div>
            <div className="text-3xl font-bold text-white mt-1">{(f1 * 100).toFixed(2)}%</div>
            <p className="text-xs text-gray-500 mt-1">Balance of precision & recall</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-surface to-surface/50 border-border">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-400">Precision</div>
            <div className="text-3xl font-bold text-white mt-1">{(precision * 100).toFixed(2)}%</div>
            <p className="text-xs text-gray-500 mt-1">Low false recovery alarm rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-surface to-surface/50 border-border">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-400">Recall (Sensitivity)</div>
            <div className="text-3xl font-bold text-white mt-1">{(recall * 100).toFixed(2)}%</div>
            <p className="text-xs text-gray-500 mt-1">Fraction of actual recoveries captured</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve Chart */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base text-gray-200">Receiver Operating Characteristic (ROC) Curve</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roc_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rocColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="fpr" type="number" domain={[0, 1]} stroke="#94a3b8" />
                <YAxis dataKey="tpr" type="number" domain={[0, 1]} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  formatter={(value: any) => [parseFloat(value).toFixed(4), ""]}
                />
                <Area type="monotone" dataKey="tpr" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#rocColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature Importance Bar Chart */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base text-gray-200">ML Feature Importance Weights</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feature_importances} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Confusion Matrix Section */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base text-gray-200">Confusion Matrix</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface/40 border border-border p-5 rounded-lg flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">True Negatives (TN)</span>
                <h3 className="text-2xl font-bold text-gray-300 mt-2">{confusion_matrix.tn}</h3>
                <p className="text-xs text-gray-400 mt-2">Permanently failed payments correctly predicted as unrecoverable.</p>
              </div>
              <div className="text-xs text-gray-500 font-mono mt-4">
                Rate: {((confusion_matrix.tn / totalCM) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-surface/40 border border-border p-5 rounded-lg flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-danger/80 uppercase tracking-wider">False Positives (FP)</span>
                <h3 className="text-2xl font-bold text-danger mt-2">{confusion_matrix.fp}</h3>
                <p className="text-xs text-gray-400 mt-2">Permanently failed payments incorrectly predicted as recoverable.</p>
              </div>
              <div className="text-xs text-gray-500 font-mono mt-4">
                Rate: {((confusion_matrix.fp / totalCM) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-surface/40 border border-border p-5 rounded-lg flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-warning/80 uppercase tracking-wider">False Negatives (FN)</span>
                <h3 className="text-2xl font-bold text-warning mt-2">{confusion_matrix.fn}</h3>
                <p className="text-xs text-gray-400 mt-2">Recoverable payments incorrectly predicted as unrecoverable.</p>
              </div>
              <div className="text-xs text-gray-500 font-mono mt-4">
                Rate: {((confusion_matrix.fn / totalCM) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-surface/40 border border-border p-5 rounded-lg flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-success/80 uppercase tracking-wider">True Positives (TP)</span>
                <h3 className="text-2xl font-bold text-success mt-2">{confusion_matrix.tp}</h3>
                <p className="text-xs text-gray-400 mt-2">Recovered payments correctly predicted as recoverable.</p>
              </div>
              <div className="text-xs text-gray-500 font-mono mt-4">
                Rate: {((confusion_matrix.tp / totalCM) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
