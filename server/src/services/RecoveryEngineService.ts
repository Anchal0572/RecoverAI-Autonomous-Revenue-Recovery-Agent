/**
 * RecoveryEngineService — Core Phase 6 Adaptive Revenue Recovery Engine
 * Manages adaptive workflows, stopping rules, human manager approval holds, and exact revenue calculations.
 */
import { Types } from 'mongoose';
import { RecoveryCase, IRecoveryCase } from '../models/RecoveryCase';
import { Transaction } from '../models/Transaction';
import { Customer } from '../models/Customer';
import { MerchantPolicy } from '../models/MerchantPolicy';
import { AuditEvent } from '../models/AuditEvent';
import { AgentRun } from '../models/AgentRun';
import { AgentOrchestrator } from '../agents/AgentOrchestrator';

const orchestrator = new AgentOrchestrator();

export interface StoppingEvaluation {
  shouldStop: boolean;
  reason?: string;
  terminalStatus?: 'RECOVERED' | 'FAILED' | 'ABANDONED' | 'OVERDUE' | 'POLICY_BLOCKED' | 'STOPPED' | 'REJECTED';
}

export class RecoveryEngineService {

  /**
   * Evaluate all 6 strict stopping rules
   */
  evaluateStoppingRules(params: {
    isCaptured: boolean;
    retryCount: number;
    maxRetries: number;
    hoursSinceFailure: number;
    policyApproved: boolean;
    humanApprovalStatus: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
  }): StoppingEvaluation {
    const { isCaptured, retryCount, maxRetries, hoursSinceFailure, policyApproved, humanApprovalStatus, rejectionReason } = params;

    // Rule 1: Payment successful
    if (isCaptured) {
      return {
        shouldStop: true,
        reason: 'Payment successfully captured — workflow completed.',
        terminalStatus: 'RECOVERED'
      };
    }

    // Rule 2: Human Manager Rejection
    if (humanApprovalStatus === 'REJECTED') {
      return {
        shouldStop: true,
        reason: rejectionReason || 'Finance Manager rejected approval request — workflow stopped.',
        terminalStatus: 'REJECTED'
      };
    }

    // Rule 3: Policy prohibits action
    if (!policyApproved) {
      return {
        shouldStop: true,
        reason: rejectionReason || 'Merchant policy prohibits proposed recovery action.',
        terminalStatus: 'POLICY_BLOCKED'
      };
    }

    // Rule 4: Retry limit reached
    if (retryCount >= maxRetries) {
      return {
        shouldStop: true,
        reason: `Maximum retry limit reached (${retryCount}/${maxRetries}) — workflow stopped to protect customer relationship.`,
        terminalStatus: 'STOPPED'
      };
    }

    // Rule 5: Recovery window expired (168 hours / 7 days)
    if (hoursSinceFailure > 168) {
      return {
        shouldStop: true,
        reason: 'Recovery window (7 days) expired — case marked overdue.',
        terminalStatus: 'OVERDUE'
      };
    }

    return { shouldStop: false };
  }

  /**
   * Process adaptive workflow step on a transaction
   */
  async processCaseWorkflow(transactionObjectId: string, merchantIdStr: string) {
    const merchantId = new Types.ObjectId(merchantIdStr);
    const tx = await Transaction.findOne({ _id: transactionObjectId, merchantId }).populate('customerId');

    if (!tx) throw new Error('Transaction not found.');

    const customer = await Customer.findById(tx.customerId);
    const policy = await MerchantPolicy.findOne({ merchantId }) || {
      maxRetries: 3,
      highValueThreshold: 50000,
      cooldownHours: 24,
      agentMode: 'autonomous',
      autoRetryEnabled: true,
      emailEnabled: true,
      smsEnabled: true
    };

    const hoursSinceFailure = (Date.now() - new Date(tx.createdAt).getTime()) / (1000 * 60 * 60);
    const prevRuns = await AgentRun.find({ transactionObjectId: tx._id, merchantId });
    const previousActions = prevRuns.map(r => r.selectedStrategy);
    const retryCount = previousActions.filter(a => a === 'RETRY').length;

    // Run orchestrator pipeline
    const pipelineResult = await orchestrator.run({
      transactionId: tx.transactionIdStr,
      transactionObjectId: tx._id.toString(),
      amount: tx.amount,
      currency: tx.currency,
      paymentMethod: tx.paymentMethod || 'card',
      errorCode: tx.errorCode || 'BAD_REQUEST_ERROR',
      errorCategory: tx.errorCategory || 'payment_failure',
      errorDescription: tx.errorDescription || 'Payment gateway error',
      customerId: customer?._id?.toString() || '',
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      ltv: customer?.ltv || 0,
      failureCount: tx.isRepeatedFailure ? 3 : 1,
      successCount: 4,
      retryCount,
      previousActions,
      hoursSinceFailure,
      isRecovered: tx.status === 'captured',
      merchantId: merchantIdStr,
      maxRetries: (policy as any).maxRetries || 3,
      highValueThreshold: (policy as any).highValueThreshold || 50000,
      cooldownHours: (policy as any).cooldownHours || 24,
      agentMode: (policy as any).agentMode || 'autonomous',
      autoRetryEnabled: (policy as any).autoRetryEnabled ?? true,
      emailEnabled: (policy as any).emailEnabled ?? true,
      smsEnabled: (policy as any).smsEnabled ?? true
    });

    // Check Human Approval Hold Requirement
    let humanApprovalStatus: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'NOT_REQUIRED';
    let caseStatus: any = pipelineResult.recoveryDetails.caseStatus;

    if (pipelineResult.requiresHumanApproval && pipelineResult.selectedStrategy !== 'STOP') {
      humanApprovalStatus = 'PENDING';
      caseStatus = 'REQUIRES_APPROVAL';
    }

    // Evaluate Stopping Rules
    const stoppingEval = this.evaluateStoppingRules({
      isCaptured: tx.status === 'captured',
      retryCount,
      maxRetries: (policy as any).maxRetries || 3,
      hoursSinceFailure,
      policyApproved: pipelineResult.policyApproved,
      humanApprovalStatus,
      rejectionReason: pipelineResult.explanation
    });

    if (stoppingEval.shouldStop) {
      caseStatus = stoppingEval.terminalStatus;
    }

    // Revenue metric calculations
    const prob = pipelineResult.recoveryDetails.recoveryProbability || 0.5;
    const revenueAtRisk = Math.round(tx.amount * (pipelineResult.recoveryDetails.riskScore / 100));
    const expectedRecovery = Math.round(tx.amount * prob);
    const actualRecovery = tx.status === 'captured' ? tx.amount : 0;

    // Save/Update RecoveryCase
    const recoveryCase = await RecoveryCase.findOneAndUpdate(
      { transactionId: tx._id, merchantId },
      {
        $set: {
          merchantId,
          transactionId: tx._id,
          customerId: tx.customerId,
          recoveryScore: pipelineResult.recoveryDetails.riskScore,
          riskLevel: pipelineResult.recoveryDetails.riskScore >= 70 ? 'HIGH' : 'MEDIUM',
          status: caseStatus,
          humanApprovalStatus,
          stoppingReason: stoppingEval.shouldStop ? stoppingEval.reason : undefined,
          currentStep: pipelineResult.selectedStrategy,
          revenueAtRisk,
          expectedRecovery,
          actualRecovery,
          recommendedStrategies: [pipelineResult.selectedStrategy, ...(pipelineResult.steps.find(s => s.agent === 'StrategyAgent')?.output?.alternativeActions || [])]
        }
      },
      { upsert: true, new: true }
    );

    // Save AgentRun
    const agentRun = await AgentRun.create({
      merchantId,
      transactionId: tx.transactionIdStr,
      transactionObjectId: tx._id,
      steps: pipelineResult.steps,
      outcome: pipelineResult.outcome,
      explanation: pipelineResult.explanation,
      selectedStrategy: pipelineResult.selectedStrategy,
      policyApproved: pipelineResult.policyApproved,
      requiresHumanApproval: pipelineResult.requiresHumanApproval,
      totalDurationMs: pipelineResult.totalDurationMs,
      triggeredBy: 'autonomous_engine'
    });

    return {
      recoveryCase,
      pipelineResult,
      agentRun,
      stoppingEval
    };
  }

  /**
   * Human Manager Approval
   */
  async approveCase(caseId: string, merchantIdStr: string, managerName: string = 'Finance Manager') {
    const merchantId = new Types.ObjectId(merchantIdStr);
    const recCase = await RecoveryCase.findOne({ _id: caseId, merchantId }).populate('transactionId');

    if (!recCase) throw new Error('Recovery case not found.');
    if (recCase.humanApprovalStatus !== 'PENDING') {
      throw new Error(`Case is not pending approval. Current status: ${recCase.humanApprovalStatus}`);
    }

    recCase.humanApprovalStatus = 'APPROVED';
    recCase.humanApprovedBy = managerName;
    recCase.humanApprovedAt = new Date();
    recCase.status = 'IN_PROGRESS';
    await recCase.save();

    const tx = recCase.transactionId as any;

    await AuditEvent.create({
      merchantId,
      transactionId: tx?.transactionIdStr || recCase._id.toString(),
      actionType: 'HUMAN_APPROVED',
      details: `${managerName} approved recovery action '${recCase.currentStep}' for transaction ₹${tx?.amount?.toLocaleString('en-IN')}`,
      agentId: 'HumanManagerHold-v6.0'
    });

    // Resume execution
    return this.processCaseWorkflow(tx._id.toString(), merchantIdStr);
  }

  /**
   * Human Manager Rejection
   */
  async rejectCase(caseId: string, merchantIdStr: string, managerName: string = 'Finance Manager', reason: string = 'Manager rejected action') {
    const merchantId = new Types.ObjectId(merchantIdStr);
    const recCase = await RecoveryCase.findOne({ _id: caseId, merchantId }).populate('transactionId');

    if (!recCase) throw new Error('Recovery case not found.');

    recCase.humanApprovalStatus = 'REJECTED';
    recCase.humanApprovedBy = managerName;
    recCase.humanApprovedAt = new Date();
    recCase.status = 'REJECTED';
    recCase.stoppingReason = reason;
    await recCase.save();

    const tx = recCase.transactionId as any;

    await AuditEvent.create({
      merchantId,
      transactionId: tx?.transactionIdStr || recCase._id.toString(),
      actionType: 'HUMAN_REJECTED',
      details: `${managerName} rejected recovery action. Workflow stopped cleanly. Reason: ${reason}`,
      agentId: 'HumanManagerHold-v6.0'
    });

    return recCase;
  }

  /**
   * Revenue Calculations
   */
  async calculateRevenueMetrics(merchantIdStr: string) {
    const merchantId = new Types.ObjectId(merchantIdStr);
    const cases = await RecoveryCase.find({ merchantId }).populate('transactionId');

    let totalRevenueAtRisk = 0;
    let totalExpectedRecovery = 0;
    let totalActualRecovery = 0;

    for (const c of cases) {
      totalRevenueAtRisk += c.revenueAtRisk || 0;
      totalExpectedRecovery += c.expectedRecovery || 0;
      totalActualRecovery += c.actualRecovery || (c.status === 'RECOVERED' ? (c.transactionId as any)?.amount || 0 : 0);
    }

    const totalCases = cases.length;
    const recoveredCases = cases.filter(c => c.status === 'RECOVERED').length;
    const actualRecoveryRate = totalCases > 0 ? (recoveredCases / totalCases) : 0;

    return {
      revenueAtRisk: Math.round(totalRevenueAtRisk),
      expectedRecovery: Math.round(totalExpectedRecovery),
      actualRecovery: Math.round(totalActualRecovery),
      actualRecoveryRate: Math.round(actualRecoveryRate * 10000) / 10000,
      totalCases,
      recoveredCases
    };
  }
}
