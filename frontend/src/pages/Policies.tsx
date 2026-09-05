import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Save, CheckCircle2 } from 'lucide-react';
import { fetchPolicies, updatePolicies } from '../api';

export default function Policies() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryBackoffMin, setRetryBackoffMin] = useState(5);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [minRecoveryScore, setMinRecoveryScore] = useState(40);
  const [highValueThreshold, setHighValueThreshold] = useState(50000);
  const [criticalAlertEmail, setCriticalAlertEmail] = useState('ops@company.com');
  const [webhookUrl, setWebhookUrl] = useState('https://api.company.com/webhooks/recover');
  const [agentMode, setAgentMode] = useState<'autonomous' | 'supervised' | 'manual'>('autonomous');
  const [autoRetryEnabled, setAutoRetryEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);

  const { data: policy, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: fetchPolicies
  });

  useEffect(() => {
    if (policy) {
      setMaxRetries(policy.maxRetries ?? 3);
      setRetryBackoffMin(policy.retryBackoffMin ?? 5);
      setCooldownHours(policy.cooldownHours ?? 24);
      setMinRecoveryScore(policy.minRecoveryScore ?? 40);
      setHighValueThreshold(policy.highValueThreshold ?? 50000);
      setCriticalAlertEmail(policy.criticalAlertEmail ?? 'ops@company.com');
      setWebhookUrl(policy.webhookUrl ?? 'https://api.company.com/webhooks/recover');
      setAgentMode((policy.agentMode as any) ?? 'autonomous');
      setAutoRetryEnabled(policy.autoRetryEnabled ?? true);
      setEmailEnabled(policy.emailEnabled ?? true);
      setSmsEnabled(policy.smsEnabled ?? true);
    }
  }, [policy]);

  const mutation = useMutation({
    mutationFn: updatePolicies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  });

  const handleSave = () => {
    mutation.mutate({
      maxRetries,
      retryBackoffMin,
      cooldownHours,
      minRecoveryScore,
      highValueThreshold,
      criticalAlertEmail,
      webhookUrl,
      agentMode,
      autoRetryEnabled,
      emailEnabled,
      smsEnabled,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading agent policy guardrails...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Policy Guardrails & Governance Matrix</h1>
          <p className="text-xs text-slate-400">Strict operational boundaries, retry limits, and human-in-the-loop approval thresholds</p>
        </div>

        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {mutation.isPending ? 'Enforcing...' : 'Save Policy Limits'}
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Policy rules active and updated across all 8 microservice agents.
        </div>
      )}

      {/* Policy Guardrails Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-200">
          Operational Limit Rules & Guardrails
        </div>
        <table className="fintech-table text-xs">
          <thead>
            <tr>
              <th>Policy Rule Name</th>
              <th>Guardrail Description</th>
              <th>Operational Threshold</th>
              <th>Enforcement Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-semibold text-slate-200">Max Retry Attempts</td>
              <td className="text-slate-400">Maximum autonomous retry attempts per failed transaction</td>
              <td>
                <input
                  type="number"
                  value={maxRetries}
                  onChange={e => setMaxRetries(Number(e.target.value))}
                  className="input-field h-7 w-20 text-center font-mono"
                />
              </td>
              <td>
                <span className="text-[10px] font-mono text-rose-400">BLOCK_ON_EXCEED</span>
              </td>
            </tr>

            <tr>
              <td className="font-semibold text-slate-200">Retry Backoff Window</td>
              <td className="text-slate-400">Minimum delay (minutes) between payment recovery retries</td>
              <td>
                <input
                  type="number"
                  value={retryBackoffMin}
                  onChange={e => setRetryBackoffMin(Number(e.target.value))}
                  className="input-field h-7 w-20 text-center font-mono"
                />
              </td>
              <td>
                <span className="text-[10px] font-mono text-amber-400">DELAY_DISPATCH</span>
              </td>
            </tr>

            <tr>
              <td className="font-semibold text-slate-200">Customer Cooldown Period</td>
              <td className="text-slate-400">Wait time (hours) before sending follow-up communication</td>
              <td>
                <input
                  type="number"
                  value={cooldownHours}
                  onChange={e => setCooldownHours(Number(e.target.value))}
                  className="input-field h-7 w-20 text-center font-mono"
                />
              </td>
              <td>
                <span className="text-[10px] font-mono text-slate-400">SUPPRESS_NOTIF</span>
              </td>
            </tr>

            <tr>
              <td className="font-semibold text-slate-200">Min Recovery Score Threshold</td>
              <td className="text-slate-400">Minimum ML confidence score (%) required for auto-execution</td>
              <td>
                <input
                  type="number"
                  value={minRecoveryScore}
                  onChange={e => setMinRecoveryScore(Number(e.target.value))}
                  className="input-field h-7 w-20 text-center font-mono"
                />
              </td>
              <td>
                <span className="text-[10px] font-mono text-amber-400">HUMAN_REVIEW</span>
              </td>
            </tr>

            <tr>
              <td className="font-semibold text-slate-200">High-Value Approval Limit</td>
              <td className="text-slate-400">Transaction amount (₹) requiring mandatory human sign-off</td>
              <td>
                <input
                  type="number"
                  value={highValueThreshold}
                  onChange={e => setHighValueThreshold(Number(e.target.value))}
                  className="input-field h-7 w-28 text-right font-mono"
                />
              </td>
              <td>
                <span className="text-[10px] font-mono text-amber-400 font-bold">REQUIRE_APPROVAL</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Autonomous Channel Control */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-md space-y-4">
        <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
          Autonomous Execution Mode & Dispatch Channels
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Agent Control Mode</label>
            <select
              value={agentMode}
              onChange={e => setAgentMode(e.target.value as any)}
              className="input-field h-8 text-xs bg-slate-950"
            >
              <option value="autonomous">Full Autonomous Mode</option>
              <option value="supervised">Supervised (Human Approval)</option>
              <option value="manual">Manual Execution Only</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Escalation Ops Email</label>
            <input
              type="email"
              value={criticalAlertEmail}
              onChange={e => setCriticalAlertEmail(e.target.value)}
              className="input-field h-8"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Callback Webhook URL</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="input-field h-8 font-mono text-xs text-slate-400"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-6 text-xs text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRetryEnabled}
              onChange={e => setAutoRetryEnabled(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <span>Auto-Retry Payments</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={e => setEmailEnabled(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <span>Email Payment Links</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={smsEnabled}
              onChange={e => setSmsEnabled(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <span>SMS Notifications</span>
          </label>
        </div>
      </div>
    </div>
  );
}

