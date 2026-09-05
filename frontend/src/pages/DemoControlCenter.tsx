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
  Zap,
  ExternalLink,
  Loader2,
  Info,
  Check
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
    addLog('RevPulse Demo Control Center initialized. Ready to execute recovery workflow.', 'info');
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
    const time = new Date().toLocaleTimeString('en-IN');
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

  const stepperItems = [
    { step: 1, label: 'Failure Event' },
    { step: 2, label: 'AI Strategy' },
    { step: 3, label: 'Policy Guardrail' },
    { step: 4, label: 'Action Dispatch' },
    { step: 5, label: 'Customer Session' },
    { step: 6, label: 'Revenue Settled' }
  ];

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Header & Environment Toggle Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-md">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-slate-100">Recovery Demo Operations Control</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
              isDemo 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {isDemo ? 'LOCAL DEMO ENGINE' : 'RAZORPAY TEST GATEWAY'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute end-to-end payment failures, ML agent strategy dispatch, and webhook settlements
          </p>
        </div>

        <button
          id="demo-reset-button"
          onClick={handleReset}
          disabled={busyAction !== null}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${busyAction === 'reset' ? 'animate-spin' : ''}`} /> Reset Demo Data
        </button>
      </div>

      {/* 6-Step Workflow Stepper Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          6-Step Recovery Operations Pipeline
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {stepperItems.map((item) => {
            const isCompleted = currentStep >= item.step;
            const isCurrent = currentStep === item.step - 1;
            return (
              <div 
                key={item.step} 
                className={`p-2.5 rounded border text-xs flex flex-col items-center justify-center text-center transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : isCurrent
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1 font-mono font-bold text-[11px]">
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : <span>0{item.step}</span>}
                </div>
                <div className="text-[11px] font-medium mt-1">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* One-Click Full Demo Bar */}
      <div className="p-4 bg-slate-900 border border-blue-500/30 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-100">One-Click Full Revenue Recovery</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Executes complete 14-step workflow: Failure Injection $\rightarrow$ ML Inference $\rightarrow$ Policy Check $\rightarrow$ Settlement
          </p>
        </div>

        <button
          id="run-full-recovery-demo-btn"
          onClick={handleRunFullDemo}
          disabled={busyAction !== null}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {busyAction === 'full' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing 14 Steps...
            </>
          ) : (
            <>
              <PlayCircle className="w-3.5 h-3.5" /> Execute One-Click Demo
            </>
          )}
        </button>
      </div>

      {/* Workbench Grid: Left Control Panel / Right Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Interactive Step Workbench */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1 Box */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Inject Payment Failure Event</span>
              </div>
              {createdTx && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {createdTx.transactionIdStr}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Transaction Value (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="input-field h-8"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Failure Error Reason</label>
                <select
                  value={failureReason}
                  onChange={e => setFailureReason(e.target.value)}
                  className="input-field h-8 text-xs bg-slate-950"
                >
                  <option value="BANK_DECLINE">BANK_DECLINE (Card Issuer)</option>
                  <option value="INSUFFICIENT_FUNDS">INSUFFICIENT_FUNDS</option>
                  <option value="CARD_EXPIRED">CARD_EXPIRED</option>
                  <option value="GATEWAY_TIMEOUT">GATEWAY_TIMEOUT</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  id="create-failed-payment-btn"
                  onClick={handleCreateFailedPayment}
                  disabled={busyAction !== null}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {busyAction === 'create' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  Inject Failure
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 Box */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>ML Inference & Strategy Selection</span>
              </div>
              <button
                id="run-recovery-ai-btn"
                onClick={handleRunAI}
                disabled={!createdTx || busyAction !== null}
                className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-40"
              >
                {busyAction === 'ai' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3" />}
                Run ML Pipeline
              </button>
            </div>

            {aiResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-2.5 rounded border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Strategy</span>
                  <span className="font-mono font-bold text-blue-400">{aiResult.strategy}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Recovery Score</span>
                  <span className="font-mono font-bold text-emerald-400">{Math.round(aiResult.recoveryProbability * 100)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Expected Revenue</span>
                  <span className="font-mono font-bold text-slate-100">₹{aiResult.expectedRecovery?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Policy Guardrail</span>
                  <span className="font-mono font-bold text-emerald-400">{aiResult.policyApproved ? 'PASSED' : 'BLOCKED'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 3 Box */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Dispatch Action & Checkout Link</span>
              </div>
              <button
                id="execute-recovery-btn"
                onClick={handleExecuteRecovery}
                disabled={!createdCase || busyAction !== null}
                className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-40"
              >
                {busyAction === 'execute' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Dispatch Link
              </button>
            </div>

            {executionResult && (
              <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Session URL:</span>
                  <span className="font-mono text-blue-400 text-[11px]">{executionResult.paymentUrl}</span>
                </div>
                <button
                  onClick={() => {
                    if (executionResult.paymentUrl.startsWith('http')) {
                      window.open(executionResult.paymentUrl, '_blank');
                    } else {
                      navigate(executionResult.paymentUrl);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  Open Checkout <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Step 4 Box */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold">4</span>
                <span>Simulate Webhook Settlement Event</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="simulate-success-btn"
                  onClick={handleSimulateSuccess}
                  disabled={!createdCase || busyAction !== null}
                  className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1 disabled:opacity-40"
                >
                  {busyAction === 'success' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Simulate Capture
                </button>
                <button
                  id="simulate-failure-btn"
                  onClick={handleSimulateFailure}
                  disabled={!createdCase || busyAction !== null}
                  className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-40"
                >
                  {busyAction === 'fail' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                  Simulate Failure
                </button>
              </div>
            </div>

            {paymentResult && (
              <div className="p-3 bg-emerald-500/10 rounded border border-emerald-500/20 text-xs space-y-1">
                <div className="flex justify-between font-mono font-semibold text-emerald-400">
                  <span>Payment Captured: ₹{paymentResult.actualRecovered?.toLocaleString('en-IN')}</span>
                  <span>Case Status: CLOSED</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Webhook event <code className="text-blue-400 font-mono">payment.captured</code> verified and idempotently logged in database.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: System Execution Log Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3 text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" /> Operational System Telemetry Log
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{logMessages.length} Events</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs custom-sidebar-scrollbar">
            {logMessages.map((log, idx) => (
              <div
                key={idx}
                className={`p-2 rounded border text-[11px] leading-relaxed font-mono ${
                  log.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : log.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : log.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="text-[9px] opacity-60 mb-0.5">{log.time}</div>
                <div>{log.text}</div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors text-center"
            >
              Command Center →
            </button>
            <button
              onClick={() => navigate('/audit')}
              className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors text-center"
            >
              Audit Trail →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

