import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
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
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_test_xxxxxxxxxxxxxxx');
  const [agentMode, setAgentMode] = useState<'autonomous' | 'supervised' | 'manual'>('autonomous');
  const [autoRetryEnabled, setAutoRetryEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [planDowngradeEnabled, setPlanDowngradeEnabled] = useState(false);
  const [maxEmailsPerDay, setMaxEmailsPerDay] = useState(3);
  const [maxSmsPerDay, setMaxSmsPerDay] = useState(2);

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
      setRazorpayKeyId(policy.razorpayKeyId ?? 'rzp_test_xxxxxxxxxxxxxxx');
      setAgentMode((policy.agentMode as any) ?? 'autonomous');
      setAutoRetryEnabled(policy.autoRetryEnabled ?? true);
      setEmailEnabled(policy.emailEnabled ?? true);
      setSmsEnabled(policy.smsEnabled ?? true);
      setPlanDowngradeEnabled(policy.planDowngradeEnabled ?? false);
      setMaxEmailsPerDay(policy.maxEmailsPerDay ?? 3);
      setMaxSmsPerDay(policy.maxSmsPerDay ?? 2);
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
      razorpayKeyId,
      agentMode,
      autoRetryEnabled,
      emailEnabled,
      smsEnabled,
      planDowngradeEnabled,
      maxEmailsPerDay,
      maxSmsPerDay
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-border border-t-primary animate-spin"></div>
        <p className="text-gray-400 text-sm ml-3">Loading agent policies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" /> Policies & Guardrails
        </h1>
        <p className="text-gray-400">Strict operational boundaries for the autonomous agent.</p>
      </div>

      {saved && (
        <div className="bg-success/10 border border-success/30 text-success p-4 rounded-lg flex items-center gap-3 mb-6 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5" /> Policies updated successfully and enforced across all active agents.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Guardrails */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base text-gray-200">Execution Guardrails</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-white">Maximum Retries</div>
                <div className="text-xs text-gray-400">Limit on payment retries per transaction.</div>
              </div>
              <Input 
                type="number" 
                value={maxRetries} 
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="w-20 text-center" 
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-white">Retry Backoff (minutes)</div>
                <div className="text-xs text-gray-400">Minimum wait time between auto retries.</div>
              </div>
              <Input 
                type="number" 
                value={retryBackoffMin} 
                onChange={(e) => setRetryBackoffMin(Number(e.target.value))}
                className="w-20 text-center" 
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-white">Cooldown Period (hours)</div>
                <div className="text-xs text-gray-400">Wait time before re-contacting customer.</div>
              </div>
              <Input 
                type="number" 
                value={cooldownHours} 
                onChange={(e) => setCooldownHours(Number(e.target.value))}
                className="w-20 text-center" 
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-white">Min Recovery Score</div>
                <div className="text-xs text-gray-400">Only trigger recovery above this threshold.</div>
              </div>
              <Input 
                type="number" 
                value={minRecoveryScore} 
                onChange={(e) => setMinRecoveryScore(Number(e.target.value))}
                className="w-20 text-center" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Human Approval Thresholds */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base text-gray-200">Autonomous Channels & Approvals</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-white">High Value Amount (₹)</div>
                <div className="text-xs text-gray-400">LTV above this triggers priority treatment.</div>
              </div>
              <Input 
                type="number" 
                value={highValueThreshold} 
                onChange={(e) => setHighValueThreshold(Number(e.target.value))}
                className="w-32 text-right" 
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-white">Auto-Retry Payments</div>
                <div className="text-xs text-gray-400">Automatically retry failed payments.</div>
              </div>
              <input 
                type="checkbox" 
                checked={autoRetryEnabled} 
                onChange={(e) => setAutoRetryEnabled(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer" 
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-white">Email Recovery Links</div>
                <div className="text-xs text-gray-400">Send direct payment link reminders via email.</div>
              </div>
              <input 
                type="checkbox" 
                checked={emailEnabled} 
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer" 
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-white">SMS Payment Links</div>
                <div className="text-xs text-gray-400">Send custom recovery links via SMS.</div>
              </div>
              <input 
                type="checkbox" 
                checked={smsEnabled} 
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Escalation Rules */}
        <Card className="md:col-span-2 border-danger/30">
          <CardHeader className="bg-danger/5 border-b border-danger/20">
            <CardTitle className="text-base text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Agent Operational Mode & Escalation Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 text-sm font-semibold text-gray-300">Agent Mode</div>
              <div className="col-span-9">
                <select 
                  value={agentMode} 
                  onChange={(e) => setAgentMode(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary text-gray-200"
                >
                  <option value="autonomous">Autonomous (Full AI control)</option>
                  <option value="supervised">Supervised (Require manual approval)</option>
                  <option value="manual">Manual (Alert only, do not retry)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 text-sm font-semibold text-gray-300">Critical Alert Email</div>
              <div className="col-span-9">
                <Input 
                  type="email" 
                  value={criticalAlertEmail} 
                  onChange={(e) => setCriticalAlertEmail(e.target.value)}
                  className="w-full" 
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 text-sm font-semibold text-gray-300">Webhook Callback URL</div>
              <div className="col-span-9">
                <Input 
                  type="text" 
                  value={webhookUrl} 
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full font-mono text-xs text-gray-400" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="gap-2" disabled={mutation.isPending}>
          <Save className="w-4 h-4" /> {mutation.isPending ? 'Saving...' : 'Enforce Policies'}
        </Button>
      </div>
    </div>
  );
}
