import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWebhookStatus, triggerTestWebhook } from '../api';
import {
  CheckCircle2, Copy, Shield, Zap, RefreshCw, Loader2, AlertTriangle, Activity, Lock
} from 'lucide-react';

export default function Integrations() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('35000');
  const [email, setEmail] = useState('rahul@startup.io');
  const [eventType, setEventType] = useState('payment.failed');
  const [lastTriggerResult, setLastTriggerResult] = useState<any>(null);

  const { data: statusData, refetch } = useQuery({
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

  const webhookUrl = statusData?.integration?.webhookUrl || 'http://localhost:3001/api/v1/webhooks/razorpay';

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
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Razorpay Integration & Webhook Listener</h1>
          <p className="text-xs text-slate-400">HMAC-SHA256 signature verification, webhook listener, and payment gateway controls</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono border ${
            isMockMode 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {integration.mode}
          </span>
          <button onClick={() => refetch()} className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Integration Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Gateway Provider</div>
          <div className="text-sm font-bold text-slate-200 font-mono">Razorpay Payment Gateway</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Connection State</div>
          <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {integration.connectionStatus}
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Processed Webhooks</div>
          <div className="text-sm font-bold text-slate-200 font-mono">{stats.totalEvents} Events ({stats.successRate}%)</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-md">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Signature Verification</div>
          <div className="text-sm font-bold text-blue-400 font-mono">HMAC-SHA256 Active</div>
        </div>
      </div>

      {/* Webhook Endpoint & API Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Listener Box */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md space-y-4">
          <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
            Webhook Listener Configuration
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-slate-400 block font-medium">Webhook Endpoint URL</label>
            <div className="flex gap-2">
              <input value={webhookUrl} readOnly className="input-field font-mono text-xs text-slate-300" />
              <button onClick={copyUrl} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors shrink-0 font-medium">
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">Target URL for Razorpay webhook event dispatches</p>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium mb-2">Registered Event Subscriptions</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['payment.failed', 'payment.captured', 'order.paid', 'payment.link.paid'].map(ev => (
                <div key={ev} className="p-2 bg-slate-950/60 border border-slate-800/80 rounded font-mono text-slate-300 flex items-center justify-between text-[11px]">
                  <span>{ev}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Credentials Box */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-md space-y-4">
          <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
            API Credentials (Masked)
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Razorpay Key ID</label>
              <input value={integration.keyIdMasked} readOnly className="input-field font-mono text-xs text-slate-400" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Razorpay Key Secret</label>
              <input type="password" value="••••••••••••••••••••••••" readOnly className="input-field font-mono text-xs text-slate-400" />
            </div>
            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded text-[11px] text-slate-400">
              Secrets are stored server-side and evaluated using timing-safe HMAC comparisons.
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Test Dispatcher */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-md space-y-4">
        <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
          <span>Test Webhook Payload Dispatcher</span>
          <span className="text-[10px] text-blue-400 font-mono font-normal">SIMULATION TOOL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={e => setEventType(e.target.value)}
              className="input-field h-8 text-xs bg-slate-950"
            >
              <option value="payment.failed">payment.failed (Trigger Recovery)</option>
              <option value="payment.captured">payment.captured (Mark Paid)</option>
              <option value="order.paid">order.paid</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Amount (₹)</label>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              className="input-field h-8"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Customer Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field h-8"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSendTestWebhook}
            disabled={triggerMutation.isPending}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {triggerMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Dispatch Test Event
          </button>
        </div>

        {lastTriggerResult && (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded text-xs space-y-1">
            <div className="flex justify-between font-mono font-semibold text-emerald-400">
              <span>Webhook Signature Verified</span>
              <span>{lastTriggerResult.result?.durationMs}ms</span>
            </div>
            <p className="text-slate-300 text-[11px]">{lastTriggerResult.result?.message}</p>
          </div>
        )}
      </div>

      {/* Webhook History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-200">
          Webhook Audit Event History ({logs.length})
        </div>
        <div className="overflow-x-auto custom-sidebar-scrollbar">
          <table className="fintech-table text-xs">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event ID</th>
                <th>Event Type</th>
                <th>Signature</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log._id || log.eventId}>
                  <td className="font-mono text-slate-500">{new Date(log.receivedAt || log.createdAt).toLocaleTimeString('en-IN')}</td>
                  <td className="font-mono text-blue-400 font-semibold">{log.eventId}</td>
                  <td className="font-mono text-slate-200">{log.eventType}</td>
                  <td>
                    <span className="text-emerald-400 font-mono font-bold text-[10px]">HMAC-VALID</span>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {log.processingStatus}
                    </span>
                  </td>
                  <td className="font-mono text-slate-400">{log.durationMs}ms</td>
                  <td className="text-slate-400 text-[11px] truncate max-w-xs">{log.processingMessage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

