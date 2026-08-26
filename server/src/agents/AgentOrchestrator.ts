/**
 * AgentOrchestrator — Chains all 7 agents in the recovery pipeline:
 * DETECTION → ROOT CAUSE → ML PREDICTION → STRATEGY → POLICY → EXECUTION → MONITORING
 *
 * Each step is independently timed, logged, and persisted.
 * Failures at any step are non-fatal — pipeline continues with degraded info.
 */
import { DetectionAgent, DetectionInput } from './DetectionAgent';
import { RootCauseAgent, RootCauseInput } from './RootCauseAgent';
import { StrategyAgent, StrategyInput } from './StrategyAgent';
import { PolicyAgent, PolicyInput } from './PolicyAgent';
import { ExecutionAgent, ExecutionInput } from './ExecutionAgent';
import { MonitoringAgent, MonitoringInput } from './MonitoringAgent';
import { EvaluationAgent } from './EvaluationAgent';
import { IAgentStep } from '../models/AgentRun';

export interface OrchestratorInput {
  // Transaction data
  transactionId: string;
  transactionObjectId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  errorCode?: string;
  errorCategory?: string;
  errorDescription?: string;

  // Customer history
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  ltv: number;
  failureCount: number;
  successCount: number;
  retryCount: number;
  previousActions: string[];

  // Time context
  hoursSinceFailure: number;
  isRecovered: boolean;

  // Merchant policy (from MerchantPolicy doc)
  merchantId: string;
  maxRetries: number;
  highValueThreshold: number;
  cooldownHours: number;
  agentMode: 'autonomous' | 'supervised' | 'manual';
  autoRetryEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

export interface OrchestratorResult {
  steps: IAgentStep[];
  outcome: 'RECOVERED' | 'PENDING' | 'FAILED' | 'STOPPED' | 'ESCALATED' | 'WAITING';
  explanation: string;
  selectedStrategy: string;
  policyApproved: boolean;
  requiresHumanApproval: boolean;
  totalDurationMs: number;
  recoveryDetails: {
    riskScore: number;
    rootCause: string;
    rootCauseConfidence: number;
    recoveryProbability: number;
    selectedAction: string;
    executionOutcome: string;
    caseStatus: string;
    recovered: boolean;
  };
}

export class AgentOrchestrator {
  private detection = new DetectionAgent();
  private rootCause = new RootCauseAgent();
  private strategy = new StrategyAgent();
  private policy = new PolicyAgent();
  private execution = new ExecutionAgent();
  private monitoring = new MonitoringAgent();
  private evaluation = new EvaluationAgent();

  async run(input: OrchestratorInput): Promise<OrchestratorResult> {
    const pipelineStart = Date.now();
    const steps: IAgentStep[] = [];
    let outcome: OrchestratorResult['outcome'] = 'PENDING';
    let selectedStrategy = 'WAIT';
    let policyApproved = false;
    let requiresHumanApproval = false;

    // Partial state
    let riskScore = 50;
    let rootCauseStr = 'unknown';
    let rootCauseConf = 0.5;
    let recoveryProbability = 0.5;
    let executionOutcome = '';
    let caseStatus = 'PENDING';
    let recovered = false;

    const isHighValue = input.amount >= input.highValueThreshold;
    const isRecurringFailure = input.failureCount >= 2;

    // ═══════════════════════════════════════════
    // STEP 1: DETECTION AGENT
    // ═══════════════════════════════════════════
    try {
      const start = Date.now();
      const detectionInput: DetectionInput = {
        amount: input.amount,
        currency: input.currency,
        failureCount: input.failureCount,
        successCount: input.successCount,
        hoursSinceFailure: input.hoursSinceFailure,
        isHighValue,
        isRecurringFailure,
        errorCategory: input.errorCategory,
        paymentMethod: input.paymentMethod,
        ltv: input.ltv
      };
      const result = await this.detection.run(detectionInput);
      riskScore = result.riskScore;

      steps.push({
        agent: 'DetectionAgent',
        status: 'SUCCESS',
        input: detectionInput,
        output: result,
        durationMs: Date.now() - start,
        runAt: new Date()
      });
    } catch (err: any) {
      steps.push({
        agent: 'DetectionAgent',
        status: 'FAILED',
        input: {},
        output: { error: err.message },
        durationMs: 0,
        runAt: new Date()
      });
    }

    // ═══════════════════════════════════════════
    // STEP 2: ROOT CAUSE AGENT
    // ═══════════════════════════════════════════
    try {
      const start = Date.now();
      const rcInput: RootCauseInput = {
        errorCode: input.errorCode,
        errorCategory: input.errorCategory,
        errorDescription: input.errorDescription,
        failureCount: input.failureCount,
        isRecurringFailure,
        isHighValue,
        paymentMethod: input.paymentMethod,
        hoursSinceFailure: input.hoursSinceFailure,
        retryCount: input.retryCount
      };
      const result = await this.rootCause.run(rcInput);
      rootCauseStr = result.cause;
      rootCauseConf = result.confidence;

      steps.push({
        agent: 'RootCauseAgent',
        status: 'SUCCESS',
        input: rcInput,
        output: result,
        durationMs: Date.now() - start,
        runAt: new Date()
      });
    } catch (err: any) {
      steps.push({
        agent: 'RootCauseAgent',
        status: 'FAILED',
        input: {},
        output: { error: err.message },
        durationMs: 0,
        runAt: new Date()
      });
    }

    // ═══════════════════════════════════════════
    // STEP 3: ML PREDICTION (via Python service)
    // ═══════════════════════════════════════════
    try {
      const start = Date.now();
      const mlPayload = {
        transaction: { amount: input.amount, paymentMethod: input.paymentMethod, bank: 'UNKNOWN' },
        history: {
          ltv: input.ltv,
          failuresCount: input.failureCount,
          successesCount: input.successCount,
          recoveredCount: 0,
          hoursSinceLastFailure: input.hoursSinceFailure
        }
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const mlRes = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlPayload),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (mlRes.ok) {
        const mlData: any = await mlRes.json();
        recoveryProbability = mlData.recovery_probability || 0.5;

        steps.push({
          agent: 'MLPredictionService',
          status: 'SUCCESS',
          input: mlPayload,
          output: mlData,
          durationMs: Date.now() - start,
          runAt: new Date()
        });
      } else {
        throw new Error(`ML service returned ${mlRes.status}`);
      }
    } catch (err: any) {
      // Fallback: heuristic prediction
      recoveryProbability = this.heuristicProbability(input);
      steps.push({
        agent: 'MLPredictionService',
        status: 'FAILED',
        input: {},
        output: { error: err.message, fallback: 'heuristic', probability: recoveryProbability },
        durationMs: 0,
        runAt: new Date()
      });
    }

    // ═══════════════════════════════════════════
    // STEP 4: STRATEGY AGENT
    // ═══════════════════════════════════════════
    let strategyResult: any = { selectedAction: 'WAIT', confidence: 0.5, reasoning: 'Default' };
    try {
      const start = Date.now();
      const rootCauseForStrategy = steps.find(s => s.agent === 'RootCauseAgent' && s.status === 'SUCCESS');
      const stratInput: StrategyInput = {
        recoveryProbability,
        riskScore,
        amount: input.amount,
        failureCount: input.failureCount,
        retryCount: input.retryCount,
        rootCause: rootCauseForStrategy?.output as any || {
          cause: 'unknown', confidence: 0.5, description: '', recoverable: true, suggestedActions: ['WAIT']
        },
        previousActions: input.previousActions,
        ltv: input.ltv,
        isHighValue,
        hoursSinceFailure: input.hoursSinceFailure
      };
      strategyResult = await this.strategy.run(stratInput);
      selectedStrategy = strategyResult.selectedAction;

      steps.push({
        agent: 'StrategyAgent',
        status: 'SUCCESS',
        input: stratInput,
        output: strategyResult,
        durationMs: Date.now() - start,
        runAt: new Date()
      });
    } catch (err: any) {
      steps.push({
        agent: 'StrategyAgent',
        status: 'FAILED',
        input: {},
        output: { error: err.message },
        durationMs: 0,
        runAt: new Date()
      });
    }

    // ═══════════════════════════════════════════
    // STEP 5: POLICY AGENT
    // ═══════════════════════════════════════════
    try {
      const start = Date.now();
      const polInput: PolicyInput = {
        proposedAction: selectedStrategy as any,
        amount: input.amount,
        retryCount: input.retryCount,
        failureCount: input.failureCount,
        hoursSinceFailure: input.hoursSinceFailure,
        isRecovered: input.isRecovered,
        previousActions: input.previousActions,
        maxRetries: input.maxRetries,
        highValueThreshold: input.highValueThreshold,
        cooldownHours: input.cooldownHours,
        agentMode: input.agentMode,
        autoRetryEnabled: input.autoRetryEnabled,
        emailEnabled: input.emailEnabled,
        smsEnabled: input.smsEnabled
      };
      const polResult = await this.policy.run(polInput);
      policyApproved = polResult.approved;
      requiresHumanApproval = polResult.requiresHumanApproval;

      steps.push({
        agent: 'PolicyAgent',
        status: 'SUCCESS',
        input: polInput,
        output: polResult,
        durationMs: Date.now() - start,
        runAt: new Date()
      });

      if (!polResult.approved) {
        outcome = 'STOPPED';
        executionOutcome = polResult.rejectionReason || 'Action blocked by policy.';
        caseStatus = 'ABANDONED';
      }
    } catch (err: any) {
      policyApproved = false;
      outcome = 'FAILED';
      steps.push({
        agent: 'PolicyAgent',
        status: 'FAILED',
        input: {},
        output: { error: err.message },
        durationMs: 0,
        runAt: new Date()
      });
    }

    // ═══════════════════════════════════════════
    // STEP 6: EXECUTION AGENT (only if policy approved)
    // ═══════════════════════════════════════════
    let executionSuccess = false;
    if (policyApproved) {
      try {
        const start = Date.now();
        const execInput: ExecutionInput = {
          action: selectedStrategy as any,
          transactionId: input.transactionId,
          amount: input.amount,
          customerId: input.customerId,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          merchantId: input.merchantId
        };
        const execResult = await this.execution.run(execInput);
        executionSuccess = execResult.success;
        executionOutcome = execResult.outcome;

        steps.push({
          agent: 'ExecutionAgent',
          status: execResult.success ? 'SUCCESS' : 'FAILED',
          input: execInput,
          output: execResult,
          durationMs: Date.now() - start,
          runAt: new Date()
        });
      } catch (err: any) {
        steps.push({
          agent: 'ExecutionAgent',
          status: 'FAILED',
          input: {},
          output: { error: err.message },
          durationMs: 0,
          runAt: new Date()
        });
      }
    } else {
      steps.push({
        agent: 'ExecutionAgent',
        status: 'SKIPPED',
        input: {},
        output: { reason: 'Policy did not approve the proposed action.' },
        durationMs: 0,
        runAt: new Date()
      });
    }

    // ═══════════════════════════════════════════
    // STEP 7: MONITORING AGENT
    // ═══════════════════════════════════════════
    if (policyApproved) {
      try {
        const start = Date.now();
        const monInput: MonitoringInput = {
          executionSuccess,
          executedAction: selectedStrategy as any,
          amount: input.amount,
          retryCount: input.retryCount,
          failureCount: input.failureCount,
          hoursSinceFailure: input.hoursSinceFailure,
          recoveryProbability,
          isHighValue
        };
        const monResult = await this.monitoring.run(monInput);
        recovered = monResult.recovered;
        caseStatus = monResult.caseStatus;

        if (monResult.recovered) {
          outcome = 'RECOVERED';
        } else if (selectedStrategy === 'STOP') {
          outcome = 'STOPPED';
        } else if (selectedStrategy === 'ESCALATE') {
          outcome = 'ESCALATED';
        } else if (selectedStrategy === 'WAIT') {
          outcome = 'WAITING';
        } else {
          outcome = 'PENDING';
        }

        steps.push({
          agent: 'MonitoringAgent',
          status: 'SUCCESS',
          input: monInput,
          output: monResult,
          durationMs: Date.now() - start,
          runAt: new Date()
        });
      } catch (err: any) {
        steps.push({
          agent: 'MonitoringAgent',
          status: 'FAILED',
          input: {},
          output: { error: err.message },
          durationMs: 0,
          runAt: new Date()
        });
      }
    } else {
      steps.push({
        agent: 'MonitoringAgent',
        status: 'SKIPPED',
        input: {},
        output: { reason: 'Execution was skipped — nothing to monitor.' },
        durationMs: 0,
        runAt: new Date()
      });
    }

    // ═══════════════════════════════════════════
    // STEP 8: EVALUATION AGENT
    // ═══════════════════════════════════════════
    try {
      const start = Date.now();
      const evalInput = {
        runs: [{
          outcome,
          selectedStrategy,
          totalDurationMs: Date.now() - pipelineStart,
          amount: input.amount,
          recovered
        }]
      };
      const evalResult = await this.evaluation.run(evalInput);

      steps.push({
        agent: 'EvaluationAgent',
        status: 'SUCCESS',
        input: evalInput,
        output: evalResult,
        durationMs: Date.now() - start,
        runAt: new Date()
      });
    } catch (err: any) {
      steps.push({
        agent: 'EvaluationAgent',
        status: 'FAILED',
        input: {},
        output: { error: err.message },
        durationMs: 0,
        runAt: new Date()
      });
    }

    // ═══════════════════════════════════════════
    // BUILD EXPLANATION (concise, observable-factor only)
    // ═══════════════════════════════════════════
    const explanation = this.buildExplanation({
      selectedStrategy,
      policyApproved,
      requiresHumanApproval,
      recovered,
      riskScore,
      rootCauseStr,
      rootCauseConf,
      recoveryProbability,
      amount: input.amount,
      executionOutcome,
      caseStatus
    });

    const totalDurationMs = Date.now() - pipelineStart;

    return {
      steps,
      outcome,
      explanation,
      selectedStrategy,
      policyApproved,
      requiresHumanApproval,
      totalDurationMs,
      recoveryDetails: {
        riskScore,
        rootCause: rootCauseStr,
        rootCauseConfidence: rootCauseConf,
        recoveryProbability,
        selectedAction: selectedStrategy,
        executionOutcome,
        caseStatus,
        recovered
      }
    };
  }

  // Concise human-readable explanation — NO chain-of-thought exposed
  private buildExplanation(ctx: {
    selectedStrategy: string;
    policyApproved: boolean;
    requiresHumanApproval: boolean;
    recovered: boolean;
    riskScore: number;
    rootCauseStr: string;
    rootCauseConf: number;
    recoveryProbability: number;
    amount: number;
    executionOutcome: string;
    caseStatus: string;
  }): string {
    if (ctx.recovered) {
      return `Payment of ₹${ctx.amount.toLocaleString('en-IN')} successfully recovered via ${ctx.selectedStrategy}. Root cause was ${ctx.rootCauseStr.replace(/_/g, ' ')} (${Math.round(ctx.rootCauseConf * 100)}% confidence) with ${Math.round(ctx.recoveryProbability * 100)}% predicted recovery probability.`;
    }

    if (!ctx.policyApproved) {
      return `${ctx.selectedStrategy} was recommended (risk score ${ctx.riskScore}/100, root cause: ${ctx.rootCauseStr.replace(/_/g, ' ')}) but was blocked by merchant policy. ${ctx.executionOutcome}`;
    }

    if (ctx.requiresHumanApproval) {
      return `${ctx.selectedStrategy} selected because recovery probability is ${Math.round(ctx.recoveryProbability * 100)}% and risk score is ${ctx.riskScore}/100. Root cause: ${ctx.rootCauseStr.replace(/_/g, ' ')}. Action requires human approval before execution for ₹${ctx.amount.toLocaleString('en-IN')}.`;
    }

    return `${ctx.selectedStrategy} selected because recovery probability is ${Math.round(ctx.recoveryProbability * 100)}%, risk score is ${ctx.riskScore}/100, root cause is ${ctx.rootCauseStr.replace(/_/g, ' ')} (${Math.round(ctx.rootCauseConf * 100)}% confidence), and the action is permitted by merchant policy. ${ctx.executionOutcome}`;
  }

  // Fallback when ML service is unavailable
  private heuristicProbability(input: OrchestratorInput): number {
    let prob = 0.5;
    if (input.successCount > input.failureCount) prob += 0.15;
    if (input.hoursSinceFailure < 12) prob += 0.1;
    if (input.amount < 10000) prob += 0.05;
    if (input.failureCount > 3) prob -= 0.2;
    return Math.max(0.05, Math.min(0.95, prob));
  }
}
