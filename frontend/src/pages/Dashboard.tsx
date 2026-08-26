import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { fetchAnalyticsSummary, fetchMonitoringStatus, seedDemoDatabase } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { TrendingUp, RefreshCw, AlertTriangle, ShieldCheck, Database } from 'lucide-react';

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: fetchAnalyticsSummary
  });

  const { data: monitoring, isLoading: monitoringLoading } = useQuery({
    queryKey: ['monitoringStatus'],
    queryFn: fetchMonitoringStatus
  });

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedMessage('');
    try {
      const res = await seedDemoDatabase();
      if (res.message) {
        setSeedMessage(res.message);
        queryClient.invalidateQueries({ queryKey: ['analyticsSummary'] });
        queryClient.invalidateQueries({ queryKey: ['monitoringStatus'] });
      }
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setSeeding(false);
    }
  };

  const loading = analyticsLoading || monitoringLoading;

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-surface/50 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-surface/50 rounded-xl animate-pulse" />
          <div className="h-80 bg-surface/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { counts, amounts, avgRecoveryScore, riskDistribution, errorCategories, trend } = analytics;
  const riskData = Object.entries(riskDistribution).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {seedMessage && (
        <div className="bg-success/15 border border-success/30 text-success p-4 rounded-xl flex items-center gap-3 mb-4 animate-in fade-in duration-300">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{seedMessage}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Real-time overview of your revenue recovery pipeline</p>
        </div>
        <Button 
          onClick={handleSeedData} 
          disabled={seeding}
          className="bg-primary hover:bg-primary/90 text-white px-5 h-11 flex items-center gap-2 border border-primary/20 shrink-0 shadow-lg shadow-primary/10 transition-all duration-200"
        >
          {seeding ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Seeding 10K Records...
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              Generate Demo Data
            </>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-t-2 border-t-success relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-16 h-16" />
          </div>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-success-bg rounded-lg flex items-center justify-center text-success mb-4">
              <span className="text-xl">💰</span>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">
              ₹{(amounts.recovered / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-gray-400 font-medium mb-3">Revenue Recovered</div>
            <div className="text-xs font-semibold text-success flex items-center gap-1">
              ↑ {amounts.recovery_rate}% recovery rate
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-2 border-t-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="w-16 h-16" />
          </div>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
              <span className="text-xl">📊</span>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">
              {counts.total}
            </div>
            <div className="text-sm text-gray-400 font-medium mb-3">Total Transactions</div>
            <div className="text-xs font-semibold text-primary flex items-center gap-1">
              ↑ {counts.recovered} recovered
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-2 border-t-warning relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <RefreshCw className="w-16 h-16" />
          </div>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-warning-bg rounded-lg flex items-center justify-center text-warning mb-4">
              <span className="text-xl">🔄</span>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">
              {counts.inProgress}
            </div>
            <div className="text-sm text-gray-400 font-medium mb-3">Active Recoveries</div>
            <div className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              {counts.pending} pending analysis
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-2 border-t-purple-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 mb-4">
              <span className="text-xl">🎯</span>
            </div>
            <div className="text-3xl font-extrabold text-white mb-1">
              {avgRecoveryScore}
            </div>
            <div className="text-sm text-gray-400 font-medium mb-3">Avg Recovery Score</div>
            <div className="text-xs font-semibold text-success flex items-center gap-1">
              ↑ above threshold
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>📈</span> Recovery Trend (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="gradRecovered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                  />
                  <Area type="monotone" dataKey="recovered" stroke="#10b981" fill="url(#gradRecovered)" strokeWidth={2} />
                  <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#gradFailed)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>🎯</span> Error Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center h-64">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorCategories as any[]}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {(errorCategories as any[]).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col gap-3 pl-4">
                {(errorCategories as any[]).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-sm text-gray-300 capitalize">{item.name.replace('_', ' ')}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>⚡</span> Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'HIGH' ? '#ef4444' : entry.name === 'MEDIUM' ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>🤖</span> Agent Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monitoring ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-gray-400 text-sm">Status</span>
                  <Badge variant="success" className="gap-1 animate-pulse"><span className="w-1.5 h-1.5 bg-success rounded-full inline-block"></span> {monitoring.agentStatus}</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-gray-400 text-sm">Active Version</span>
                  <span className="font-mono text-sm">{monitoring.monitoringVersion}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-gray-400 text-sm">Active Recoveries</span>
                  <Badge variant="default">{monitoring.activeRecoveries}</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-gray-400 text-sm">Success Rate</span>
                  <span className="text-sm font-semibold">{monitoring.metrics.successRate}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-gray-400 text-sm">Total Recovered Today</span>
                  <span className="text-sm font-semibold">₹{(monitoring.metrics.revenueRecoveredToday / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-400 text-sm">Last Heartbeat</span>
                  <span className="font-mono text-xs text-gray-500">{new Date(monitoring.lastHeartbeat).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">Agent Offline</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
