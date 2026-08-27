import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  PlusCircle,
  Cpu,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  fetchPaymentConfig,
  createDemoFailedPayment,
  runDemoRecoveryAI,
  executeDemoRecoveryAction,
  simulateDemoPaymentSuccess,
  simulateDemoPaymentFailure,
  runFullRecoveryDemo,
  resetDemoState
} from '../api';

export default function DemoControlCenter() {
  const navigate = useNavigate();

  // Mode config state
  const [config, setConfig] = useState<any>({ paymentMode: 'demo', isRazorpayConfigured: false });
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Workflow state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [amount, setAmount] = useState<number>(5000);
  const [failureReason, setFailureReason] = useState<string>('BANK_DECLINE');
  const [createdTx, setCreatedTx] = useState<any>(null);
  const [createdCase, setCreatedCase] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [fullDemoResult, setFullDemoResult] = useState<any>(null);

  // Action loaders
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warning' | 'error' }>>([]);

  useEffect(() => {
    loadConfig();
    addLog('RecoverAI Demo Control Center initialized. Ready to execute recovery workflow.', 'info');
  }, []);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await fetchPaymentConfig();
      if (res) setConfig(res);
    } catch (err) {
      console.error('Failed to load payment config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogMessages(prev => [{ time, text, type }, ...prev.slice(0, 49)]);
  };

  // Step 1: Create Failed Payment
  const handleCreateFailedPayment = async () => {
    try {
      setBusyAction('create');
      addLog(`Creating real database transaction: ₹${amount.toLocaleString('en-IN')} (${failureReason})...`, 'info');
      const res = await createDemoFailedPayment({ amount, failureReason });
      if (res && res.transaction) {
        setCreatedTx(res.transaction);
        setCreatedCase(res.recoveryCase);
        setCurrentStep(1);
        addLog(`✅ Failed payment created: ${res.transaction.transactionIdStr} (Status: FAILED). Automatic Recovery Case ${res.recoveryCase.id} opened.`, 'success');
      }
    } catch (err: any) {
      addLog(`❌ Failed to create payment: ${err.message}`, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  // Step 2: Run Recovery AI
  const handleRunAI = async () => {
    if (!createdTx) {
      addLog('⚠️ Please create a failed payment first.', 'warning');
      return;
    }
    try {
      setBusyAction('ai');
      addLog(`Calling ML Prediction & 7-Agent Recovery Pipeline for ${createdTx.transactionIdStr}...`, 'info');
      const res = await runDemoRecoveryAI(createdTx.transactionIdStr);
      if (res && res.pipelineResult) {
        setAiResult(res.pipelineResult);
        setCreatedCase((prev: any) => ({ ...prev, ...res.recoveryCase }));
        setCurrentStep(2);
        addLog(`✅ AI Strategy: ${res.pipelineResult.strategy} | ML Recovery Prob: ${Math.round(res.pipelineResult.recoveryProbability * 100)}% | Expected: ₹${res.pipelineResult.expectedRecovery.toLocaleString('en-IN')}`, 'success');
      }
    } catch (err: any) {
      addLog(`❌ Error running AI: ${err.message}`, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  // Step 3: Execute Recovery Action
  const handleExecuteRecovery = async () => {
    if (!createdCase) {
      addLog('⚠️ No active recovery case to execute.', 'warning');
      return;
    }
    try {
      setBusyAction('execute');
      addLog(`Executing recovery action ${aiResult?.strategy || 'PAYMENT_LINK'}...`, 'info');
      const res = await executeDemoRecoveryAction(createdCase.id || createdCase._id);
      if (res) {
        setExecutionResult(res);
        setCurrentStep(3);
        addLog(`✅ Recovery action executed! Session Portal: ${res.paymentUrl} (${res.provider})`, 'success');
      }
    } catch (err: any) {
      addLog(`❌ Error executing action: ${err.message}`, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  // Step 4: Simulate Payment Success
  const handleSimulateSuccess = async () => {
    if (!createdCase) {
      addLog('⚠️ No active case to mark paid.', 'warning');
      return;
    }
    try {
      setBusyAction('success');
      addLog('Processing payment capture event through webhook engine...', 'info');
      const res = await simulateDemoPaymentSuccess(createdCase.id || createdCase._id);
      if (res) {
        setPaymentResult(res);
        setCurrentStep(4);
        addLog(`🎉 Payment Captured! ₹${res.actualRecovered.toLocaleString('en-IN')} added to Actual Revenue Recovered. Recovery Case CLOSED.`, 'success');
      }
    } catch (err: any) {
      addLog(`❌ Payment capture error: ${err.message}`, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  // Step 4 (Alt): Simulate Failure
  const handleSimulateFailure = async () => {
    if (!createdCase) {
      addLog('⚠️ No active case to fail.', 'warning');
      return;
    }
    try {
      setBusyAction('fail');
      addLog('Simulating payment decline at issuer gateway...', 'info');
      const res = await simulateDemoPaymentFailure(createdCase.id || createdCase._id);
      if (res) {
        addLog(`⚠️ Payment recovery attempt #${res.attemptCount} failed. Status: ${res.caseStatus}`, 'warning');
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  // One-Click Full Demo Scenario
  const handleRunFullDemo = async () => {
    try {
      setBusyAction('full');
      addLog('⚡ Executing One-Click Complete 14-Step Recovery Demo...', 'info');
      const res = await runFullRecoveryDemo({ amount, failureReason });
      if (res && res.flow) {
        setFullDemoResult(res.flow);
        setCurrentStep(4);
        addLog(`🎉 ONE-CLICK DEMO SUCCESS: ₹${res.flow.step8_actualRevenueRecovered.toLocaleString('en-IN')} recovered autonomously via ${res.flow.step4_aiStrategy.strategy}!`, 'success');
      }
    } catch (err: any) {
      addLog(`❌ Full demo error: ${err.message}`, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  // Reset Demo
  const handleReset = async () => {
    try {
      setBusyAction('reset');
      addLog('Resetting demo environment and re-seeding transactions...', 'info');
      await resetDemoState();
      setCreatedTx(null);
      setCreatedCase(null);
      setAiResult(null);
      setExecutionResult(null);
      setPaymentResult(null);
      setFullDemoResult(null);
      setCurrentStep(0);
      addLog('✅ Demo environment clean and re-seeded with 10,000 transactions.', 'success');
    } catch (err: any) {
      addLog(`❌ Error resetting: ${err.message}`, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const isDemo = config.paymentMode === 'demo';

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Mode Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">RecoverAI Demo Control Center</h1>
              <p className="text-xs text-gray-400">
                Interactive environment switch, local payment simulator, and one-click autonomous recovery testing
              </p>
            </div>
          </div>
        </div>

        {/* Environment Switch Status */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            isDemo 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>{isDemo ? '🟢 LOCAL DEMO MODE' : '🟡 RAZORPAY TEST MODE'}</span>
          </div>

          <button
            id="demo-reset-button"
            onClick={handleReset}
            disabled={busyAction !== null}
            className="px-3.5 py-2 rounded-xl bg-surfaceHover hover:bg-surface border border-border text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${busyAction === 'reset' ? 'animate-spin' : ''}`} /> Reset Demo
          </button>
        </div>
      </div>

      {/* Warning if Razorpay requested but not configured */}
      {config.warning && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{config.warning}</span>
        </div>
      )}

      {/* One-Click Full Demo Hero Banner */}
      <div className="bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent p-6 rounded-2xl border border-primary/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Automated Hackathon Demo</span>
            </div>
            <h2 className="text-lg font-bold text-white">One-Click Full Revenue Recovery</h2>
            <p className="text-xs text-gray-300 max-w-xl">
              Executes the complete 14-step workflow: Creates ₹5,000 failure $\rightarrow$ ML Prediction $\rightarrow$ 7-Agent Policy Check $\rightarrow$ Payment Link $\rightarrow$ Webhook Capture $\rightarrow$ Revenue Credited.
            </p>
          </div>

          <button
            id="run-full-recovery-demo-btn"
            onClick={handleRunFullDemo}
            disabled={busyAction !== null}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busyAction === 'full' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Executing 14 Steps...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" /> RUN FULL RECOVERY DEMO
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Step-by-Step Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Step Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Create Failed Payment */}
          <div className={`p-5 rounded-2xl border transition-all ${
            currentStep >= 1 ? 'bg-surface border-border' : 'bg-surface border-primary/40 shadow-lg shadow-primary/5'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold">1</span>
                <h3 className="text-sm font-semibold text-white">Create Real Failed Payment</h3>
              </div>
              {createdTx && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {createdTx.transactionIdStr}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full bg-surfaceHover border border-border rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Failure Reason</label>
                <select
                  value={failureReason}
                  onChange={e => setFailureReason(e.target.value)}
                  className="w-full bg-surfaceHover border border-border rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="BANK_DECLINE">BANK_DECLINE (Card Issuer)</option>
                  <option value="INSUFFICIENT_FUNDS">INSUFFICIENT_FUNDS</option>
                  <option value="CARD_EXPIRED">CARD_EXPIRED</option>
                  <option value="GATEWAY_TIMEOUT">GATEWAY_TIMEOUT</option>
                  <option value="AUTHENTICATION_FAILED">AUTHENTICATION_FAILED</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  id="create-failed-payment-btn"
                  onClick={handleCreateFailedPayment}
                  disabled={busyAction !== null}
                  className="w-full py-2 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {busyAction === 'create' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  Create Failed Payment
                </button>
              </div>
            </div>

            {createdCase && (
              <div className="p-3 bg-surfaceHover/40 rounded-xl border border-border/50 text-xs flex justify-between items-center">
                <span className="text-gray-400">Auto-Created Recovery Case: <strong className="text-gray-200">{createdCase.id}</strong></span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Status: {createdCase.status}
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Run Recovery AI */}
          <div className={`p-5 rounded-2xl border transition-all ${
            currentStep >= 2 ? 'bg-surface border-border' : currentStep === 1 ? 'bg-surface border-primary/40' : 'bg-surface/50 border-border/50 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="text-sm font-semibold text-white">ML Prediction & 7-Agent Decision</h3>
              </div>
              <button
                id="run-recovery-ai-btn"
                onClick={handleRunAI}
                disabled={!createdTx || busyAction !== null}
                className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                {busyAction === 'ai' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                Run Recovery AI
              </button>
            </div>

            {aiResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surfaceHover/40 p-3 rounded-xl border border-border/50 text-xs">
                <div>
                  <span className="text-gray-500 text-[10px] block">Selected Strategy</span>
                  <span className="font-bold text-primary">{aiResult.strategy}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">Recovery Prob</span>
                  <span className="font-bold text-emerald-400">{Math.round(aiResult.recoveryProbability * 100)}%</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">Expected Recovery</span>
                  <span className="font-bold text-cyan-400">₹{aiResult.expectedRecovery?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">Policy Guardrail</span>
                  <span className="font-bold text-emerald-400">{aiResult.policyApproved ? 'APPROVED' : 'BLOCKED'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Execute Recovery Action */}
          <div className={`p-5 rounded-2xl border transition-all ${
            currentStep >= 3 ? 'bg-surface border-border' : currentStep === 2 ? 'bg-surface border-primary/40' : 'bg-surface/50 border-border/50 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold">3</span>
                <h3 className="text-sm font-semibold text-white">Execute Recovery Action</h3>
              </div>
              <button
                id="execute-recovery-btn"
                onClick={handleExecuteRecovery}
                disabled={!createdCase || busyAction !== null}
                className="py-1.5 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                {busyAction === 'execute' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Execute Recovery
              </button>
            </div>

            {executionResult && (
              <div className="p-3 bg-surfaceHover/40 rounded-xl border border-border/50 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 block">Payment Session Active:</span>
                  <span className="font-mono text-cyan-400 text-[11px]">{executionResult.paymentUrl}</span>
                </div>
                <button
                  onClick={() => {
                    if (executionResult.paymentUrl.startsWith('http')) {
                      window.open(executionResult.paymentUrl, '_blank');
                    } else {
                      navigate(executionResult.paymentUrl);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  Open Checkout Portal <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Step 4: Simulate Payment & Webhook Capture */}
          <div className={`p-5 rounded-2xl border transition-all ${
            currentStep >= 4 ? 'bg-emerald-500/10 border-emerald-500/30' : currentStep === 3 ? 'bg-surface border-primary/40' : 'bg-surface/50 border-border/50 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold">4</span>
                <h3 className="text-sm font-semibold text-white">Simulate Payment Capture / Webhook</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="simulate-success-btn"
                  onClick={handleSimulateSuccess}
                  disabled={!createdCase || busyAction !== null}
                  className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  {busyAction === 'success' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Simulate Success
                </button>
                <button
                  id="simulate-failure-btn"
                  onClick={handleSimulateFailure}
                  disabled={!createdCase || busyAction !== null}
                  className="py-1.5 px-3 rounded-lg bg-surfaceHover hover:bg-danger/10 text-gray-300 hover:text-danger border border-border text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  {busyAction === 'fail' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Simulate Failure
                </button>
              </div>
            </div>

            {paymentResult && (
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs space-y-1">
                <div className="flex justify-between font-semibold text-emerald-400">
                  <span>Payment Captured: ₹{paymentResult.actualRecovered?.toLocaleString('en-IN')}</span>
                  <span>Case Status: CLOSED</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Webhook event <code className="text-cyan-400 font-mono">payment.captured</code> verified and idempotently logged in database.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Live Execution Log & Navigation Links */}
        <div className="space-y-4">
          <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary" /> Live Demo Log Stream
              </h3>
              <span className="text-[10px] text-gray-500 font-mono">{logMessages.length} events</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {logMessages.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                    log.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : log.type === 'error'
                      ? 'bg-danger/10 border-danger/20 text-danger'
                      : log.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      : 'bg-surfaceHover/50 border-border/50 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-70 mb-0.5">
                    <span className="font-mono">{log.time}</span>
                  </div>
                  <div>{log.text}</div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-2 rounded-lg bg-surfaceHover hover:bg-surface border border-border text-xs font-medium text-gray-300 hover:text-white transition-colors text-center"
              >
                Go to Dashboard →
              </button>
              <button
                onClick={() => navigate('/audit')}
                className="w-full py-2 rounded-lg bg-surfaceHover hover:bg-surface border border-border text-xs font-medium text-gray-300 hover:text-white transition-colors text-center"
              >
                Go to Audit Trail →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
