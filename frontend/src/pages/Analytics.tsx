import { useQuery } from '@tanstack/react-query';
import { fetchAnalyticsSummary, fetchAuditLogs } from '../api';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function Analytics() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: fetchAnalyticsSummary
  });

  const { data: audit, isLoading: auditLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => fetchAuditLogs()
  });

  if (summaryLoading || auditLoading || !summary || !audit) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-surface/50 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-surface/50 rounded-xl animate-pulse"></div>
          <div className="h-80 bg-surface/50 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const revenueData = summary.trend.map((t: any) => ({ ...t, amountK: parseFloat((t.amount / 1000).toFixed(1)) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-white">Revenue Risk Analytics</h1>
        <p className="text-gray-400">Comprehensive recovery analytics and deep financial insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="w-10 h-10 bg-success-bg rounded-lg flex items-center justify-center text-success mb-3 text-lg">💰</div>
            <div className="text-2xl font-extrabold text-white mb-1">₹{(summary.amounts.recovered / 1000).toFixed(1)}K</div>
            <div className="text-xs text-gray-400 font-medium">Total Recovered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-3 text-lg">📊</div>
            <div className="text-2xl font-extrabold text-white mb-1">{summary.amounts.recovery_rate}%</div>
            <div className="text-xs text-gray-400 font-medium">Recovery Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="w-10 h-10 bg-warning-bg rounded-lg flex items-center justify-center text-warning mb-3 text-lg">🎯</div>
            <div className="text-2xl font-extrabold text-white mb-1">{summary.avgRecoveryScore}</div>
            <div className="text-xs text-gray-400 font-medium">Avg Recovery Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 mb-3 text-lg">⚠️</div>
            <div className="text-2xl font-extrabold text-danger mb-1">
              ₹{((summary.amounts.total - summary.amounts.recovered) / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-400 font-medium">Revenue At Risk</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">💰 Revenue Recovered vs Lost (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px' }} />
                  <Bar dataKey="amountK" name="Recovered (₹K)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">📈 Recovery Success Trajectory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#121214', borderColor: '#27272a', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="recovered" name="Recovered Txs" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="failed" name="Lost Txs" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
