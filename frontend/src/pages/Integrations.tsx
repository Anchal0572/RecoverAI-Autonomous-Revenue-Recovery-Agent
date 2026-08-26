import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWebhookStatus, triggerTestWebhook } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  CheckCircle2, Copy, Shield, Zap, RefreshCw, Loader2, AlertTriangle, Activity, Lock, ArrowUpRight
} from 'lucide-react';

export default function Integrations() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('35000');
  const [email, setEmail] = useState('rahul@startup.io');
  const [eventType, setEventType] = useState('payment.failed');
  const [lastTriggerResult, setLastTriggerResult] = useState<any>(null);

  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ['webhookStatus'],
    queryFn: fetchWebhookStatus,
    refetchInterval: 5000
  });

  const triggerMutation = useMutation({
    mutationFn: (data: { amount: number; email: string; eventType: string }) => triggerTestWebhook(data),
    onSuccess: (data) => {
      setLastTriggerResult(data);
      queryClient.invalidateQueries({ queryKey: ['webhookStatus'] });
      queryClient.invalidateQueries({ queryKey: ['failedTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['agentRuns'] });
    }
  });

  const webhookUrl = statusData?.integration?.webhookUrl || 'http://localhost:5000/api/v1/webhooks/razorpay';

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestWebhook = () => {
    triggerMutation.mutate({
      amount: Number(amount) || 35000,
      email: email || 'rahul@startup.io',
      eventType
    });
  };

  const integration = statusData?.integration || {
    provider: 'Razorpay',
    mode: 'MOCK / SIMULATION MODE',
    connectionStatus: 'CONNECTED',
    keyIdMasked: 'rzp_test_••••••••',
    hasLiveSecret: false,
    webhookSecretConfigured: true
  };

  const logs = statusData?.logs || [];
  const stats = statusData?.stats || { totalEvents: 0, successfulEvents: 0, successRate: 100 };

  const isMockMode = integration.mode.includes('MOCK') || integration.mode.includes('SIMULATION');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-black text-xl leading-none">R</span>
            </div>
            Razorpay Test Mode Integration
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time webhook listener, signature security, idempotency engine, and agent trigger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isMockMode ? (
            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 px-3 py-1 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> MOCK / SIMULATION MODE
            </Badge>
          ) : (
            <Badge variant="success" className="px-3 py-1 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> RAZORPAY TEST MODE
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-border hover:bg-surface">
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Integration Overview Card */}
      <Card className="border-primary/20 bg-surface/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-background/50 border border-border/50 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Environment Mode</p>
              <p className="text-sm font-bold text-gray-100 mt-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> {integration.mode}
              </p>
            </div>
            <div className="bg-background/50 border border-border/50 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Connection Status</p>
              <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {integration.connectionStatus}
              </p>
            </div>
            <div className="bg-background/50 border border-border/50 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Processed Webhooks</p>
              <p className="text-sm font-bold text-gray-100 mt-1">{stats.totalEvents} events ({stats.successRate}% success)</p>
            </div>
            <div className="bg-background/50 border border-border/50 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Signature Security</p>
              <p className="text-sm font-bold text-cyan-400 mt-1 flex items-center gap-2">
                <Lock className="w-4 h-4" /> HMAC-SHA256 Verified
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration & Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhook Settings */}
        <Card>
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Webhook Listener Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Webhook Endpoint URL</label>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="bg-background font-mono text-xs text-gray-300 border-border" />
                <Button variant="secondary" onClick={copyUrl} className="shrink-0 text-xs px-3">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <><Copy className="w-4 h-4 mr-1.5" /> Copy</>}
                </Button>
              </div>
              <p className="text-[11px] text-gray-500">Configure this URL in your Razorpay Dashboard under Webhook Settings.</p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-gray-300">Active Event Handlers</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'payment.failed', desc: 'Triggers 8-agent recovery pipeline' },
                  { name: 'payment.captured', desc: 'Marks recovery case RECOVERED' },
                  { name: 'order.paid', desc: 'Updates order payment status' },
                  { name: 'payment.link.paid', desc: 'Resolves pending recovery link' }
                ].map(ev => (
                  <div key={ev.name} className="bg-background/60 border border-border/40 p-2.5 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono text-xs font-semibold text-gray-200">{ev.name}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{ev.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Credentials */}
        <Card>
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-400" /> API Credentials (Masked)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Razorpay Key ID</label>
              <Input value={integration.keyIdMasked} readOnly className="font-mono text-xs bg-background text-gray-400 border-border" />
              <p className="text-[11px] text-gray-500">Loaded from environment variables (<code className="text-primary font-mono">RAZORPAY_KEY_ID</code>).</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Razorpay Key Secret</label>
              <Input type="password" value="••••••••••••••••••••••••" readOnly className="font-mono text-xs bg-background text-gray-400 border-border" />
              <p className="text-[11px] text-gray-500">Never exposed on frontend or client APIs (<code className="text-primary font-mono">RAZORPAY_KEY_SECRET</code>).</p>
            </div>
            <div className="bg-background/40 border border-border/30 rounded-lg p-3 text-xs text-gray-400">
              <span className="font-bold text-gray-300">Security Rule:</span> Secret keys are strictly verified server-side using HMAC-SHA256 timing-safe comparisons.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Interactive Webhook Test Trigger ── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="border-b border-primary/20 py-4">
          <CardTitle className="text-sm font-bold text-gray-100 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Interactive Webhook Simulator
            </span>
            <Badge variant="outline" className="text-xs border-primary/40 text-primary">Full Pipeline Integration Test</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs text-gray-400">
            Dispatch a simulated Razorpay webhook payload directly to test signature validation, idempotency checks, database updates, and autonomous agent triggering.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-xs text-gray-200 px-3 py-2 focus:outline-none focus:border-primary/60"
              >
                <option value="payment.failed">payment.failed (Triggers Agents)</option>
                <option value="payment.captured">payment.captured (Marks Recovered)</option>
                <option value="order.paid">order.paid</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Amount (INR)</label>
              <Input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                className="bg-background border-border text-xs text-gray-200"
                placeholder="35000"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Customer Email</label>
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-background border-border text-xs text-gray-200"
                placeholder="customer@email.com"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSendTestWebhook}
              disabled={triggerMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-5"
            >
              {triggerMutation.isPending ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Dispatching Webhook...</>
              ) : (
                <><Zap className="w-3.5 h-3.5 mr-1.5" /> Dispatch Test Webhook Event</>
              )}
            </Button>
          </div>

          {/* Result Banner */}
          {lastTriggerResult && (
            <div className="bg-background/80 border border-primary/30 rounded-lg p-3 space-y-2 mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Webhook Processed cleanly
                </span>
                <span className="font-mono text-gray-500">{lastTriggerResult.result?.durationMs}ms</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{lastTriggerResult.result?.message}</p>
              {lastTriggerResult.result?.agentOutcome && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-gray-500 uppercase">Agent Outcome:</span>
                  <Badge variant="success" className="text-[10px]">{lastTriggerResult.result.agentOutcome}</Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Webhook Event Log Table ── */}
      <Card>
        <CardHeader className="border-b border-border py-4">
          <CardTitle className="text-sm font-bold text-gray-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" /> Webhook Event Log History
            </span>
            <span className="text-xs text-gray-500 font-normal">Last {logs.length} events</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Zap className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p className="text-sm">No webhook events logged yet. Click 'Dispatch Test Webhook Event' above to generate one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-gray-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Event ID</th>
                    <th className="py-2.5 px-3">Event Type</th>
                    <th className="py-2.5 px-3">Signature</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {logs.map((log: any) => (
                    <tr key={log._id || log.eventId} className="hover:bg-surface/60 transition-colors">
                      <td className="py-2.5 px-3 text-gray-400 font-mono">
                        {new Date(log.receivedAt || log.createdAt).toLocaleTimeString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-primary font-medium truncate max-w-[120px]">
                        {log.eventId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-surface border border-border px-2 py-0.5 rounded font-mono text-[11px] text-gray-200">
                          {log.eventType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {log.signatureValid ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="text-red-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Invalid
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {log.processingStatus === 'PROCESSED' && <Badge variant="success">PROCESSED</Badge>}
                        {log.processingStatus === 'DUPLICATE' && <Badge variant="default">DUPLICATE</Badge>}
                        {log.processingStatus === 'IGNORED' && <Badge variant="outline">IGNORED</Badge>}
                        {log.processingStatus === 'FAILED' && <Badge variant="danger">FAILED</Badge>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-500">
                        {log.durationMs}ms
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11px] text-gray-400 truncate max-w-[200px]">
                        {log.processingMessage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
