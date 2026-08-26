/**
 * Agent Controller — API handlers for triggering agent pipeline and fetching runs
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AgentOrchestrator, OrchestratorInput } from '../agents/AgentOrchestrator';
import { DetectionAgent } from '../agents/DetectionAgent';
import { RootCauseAgent } from '../agents/RootCauseAgent';
import { StrategyAgent } from '../agents/StrategyAgent';
import { PolicyAgent } from '../agents/PolicyAgent';
import { ExecutionAgent } from '../agents/ExecutionAgent';
import { MonitoringAgent } from '../agents/MonitoringAgent';
import { EvaluationAgent } from '../agents/EvaluationAgent';
import { AgentRun } from '../models/AgentRun';
import { Transaction } from '../models/Transaction';
import { Customer } from '../models/Customer';
import { RecoveryCase } from '../models/RecoveryCase';
import { MerchantPolicy } from '../models/MerchantPolicy';
import { AuditEvent } from '../models/AuditEvent';
import { Types } from 'mongoose';

const orchestrator = new AgentOrchestrator();
const evaluationAgent = new EvaluationAgent();
const detectionAgent = new DetectionAgent();
const rootCauseAgent = new RootCauseAgent();
const strategyAgent = new StrategyAgent();
const policyAgent = new PolicyAgent();
const executionAgent = new ExecutionAgent();

/**
 * POST /api/v1/agent/run/:transactionId
 * Trigger the full 7-agent recovery pipeline on a transaction
 */
export async function runAgentPipeline(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { transactionId } = req.params;
    const merchantId = new Types.ObjectId(req.user.merchantId);

    // Find the transaction (support both ObjectId and transactionId string)
    let tx;
    if (Types.ObjectId.isValid(transactionId)) {
      tx = await Transaction.findOne({ _id: transactionId, merchantId }).populate('customerId');
    }
    if (!tx) {
      tx = await Transaction.findOne({ transactionIdStr: transactionId, merchantId }).populate('customerId');
    }

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    // Get customer data
    const customer = await Customer.findById(tx.customerId);
    const ltv = customer?.ltv || 0;
    const successCount = customer ? await Transaction.countDocuments({
      customerId: tx.customerId,
      status: 'captured',
      merchantId
    }) : 0;
    const failureCount = customer ? await Transaction.countDocuments({
      customerId: tx.customerId,
      status: 'failed',
      merchantId
    }) : 1;

    // Get merchant policy
    const policy = await MerchantPolicy.findOne({ merchantId }) || {
      maxRetries: 3,
      highValueThreshold: 50000,
      cooldownHours: 24,
      agentMode: 'autonomous' as const,
      autoRetryEnabled: true,
      emailEnabled: true,
      smsEnabled: true
    };

    // Calculate time since failure
    const hoursSinceFailure = (Date.now() - new Date(tx.createdAt).getTime()) / (1000 * 60 * 60);

    // Find previous actions taken on this tx
    const prevRuns = await AgentRun.find({ transactionObjectId: tx._id, merchantId });
    const previousActions = prevRuns.map(r => r.selectedStrategy);
    const retryCount = previousActions.filter(a => a === 'RETRY').length;

    // Build orchestrator input
    const input: OrchestratorInput = {
      transactionId: tx.transactionIdStr || tx._id.toString(),
      transactionObjectId: tx._id.toString(),
      amount: tx.amount,
      currency: tx.currency || 'INR',
      paymentMethod: tx.paymentMethod || 'card',
      errorCode: (tx as any).errorCode,
      errorCategory: (tx as any).errorCategory || 'unknown',
      errorDescription: (tx as any).errorDescription,
      customerId: (tx.customerId as any)?._id?.toString() || tx.customerId?.toString() || '',
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      ltv,
      failureCount,
      successCount,
      retryCount,
      previousActions,
      hoursSinceFailure,
      isRecovered: tx.status === 'captured',
      merchantId: merchantId.toString(),
      maxRetries: (policy as any).maxRetries || 3,
      highValueThreshold: (policy as any).highValueThreshold || 50000,
      cooldownHours: (policy as any).cooldownHours || 24,
      agentMode: (policy as any).agentMode || 'autonomous',
      autoRetryEnabled: (policy as any).autoRetryEnabled ?? true,
      emailEnabled: (policy as any).emailEnabled ?? true,
      smsEnabled: (policy as any).smsEnabled ?? true
    };

    // Run the full pipeline
    const result = await orchestrator.run(input);

    // Persist AgentRun
    const agentRun = await AgentRun.create({
      merchantId,
      transactionId: input.transactionId,
      transactionObjectId: tx._id,
      steps: result.steps,
      outcome: result.outcome,
      explanation: result.explanation,
      selectedStrategy: result.selectedStrategy,
      policyApproved: result.policyApproved,
      requiresHumanApproval: result.requiresHumanApproval,
      totalDurationMs: result.totalDurationMs,
      triggeredBy: 'manual'
    });

    // Update RecoveryCase status
    await RecoveryCase.findOneAndUpdate(
      { transactionId: tx._id, merchantId },
      {
        $set: {
          status: result.recoveryDetails.caseStatus as any,
          recoveryScore: result.recoveryDetails.riskScore,
          riskLevel: result.recoveryDetails.riskScore >= 70 ? 'HIGH' : result.recoveryDetails.riskScore >= 40 ? 'MEDIUM' : 'LOW',
          recommendedStrategies: [result.selectedStrategy, ...(result.steps.find(s => s.agent === 'StrategyAgent')?.output?.alternativeActions || [])]
        }
      },
      { upsert: true }
    );

    // Update transaction status if recovered
    if (result.outcome === 'RECOVERED') {
      await Transaction.findByIdAndUpdate(tx._id, {
        $set: { status: 'captured', recoveryProbability: result.recoveryDetails.recoveryProbability }
      });
    }

    // Audit log
    await AuditEvent.create({
      merchantId,
      transactionId: input.transactionId,
      actionType: result.outcome === 'RECOVERED' ? 'PAYMENT_RECOVERED' : 'ACTION_EXECUTED',
      details: result.explanation,
      agentId: 'AgentOrchestrator-v4.0'
    });

    return res.json({
      runId: agentRun._id.toString(),
      transactionId: input.transactionId,
      outcome: result.outcome,
      explanation: result.explanation,
      selectedStrategy: result.selectedStrategy,
      policyApproved: result.policyApproved,
      requiresHumanApproval: result.requiresHumanApproval,
      totalDurationMs: result.totalDurationMs,
      steps: result.steps.map(s => ({
        agent: s.agent,
        status: s.status,
        durationMs: s.durationMs,
        output: s.output
      })),
      recoveryDetails: result.recoveryDetails
    });
  } catch (error: any) {
    console.error('AgentPipeline error:', error);
    return res.status(500).json({ error: 'Agent pipeline execution failed.', details: error.message });
  }
}

/**
 * GET /api/v1/agent/runs — List recent agent runs
 */
export async function getAgentRuns(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const merchantId = new Types.ObjectId(req.user.merchantId);
    const { limit = 50, offset = 0 } = req.query;

    const total = await AgentRun.countDocuments({ merchantId });
    const runs = await AgentRun.find({ merchantId })
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .select('-steps.input'); // exclude large input objects

    return res.json({ total, data: runs });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch agent runs.' });
  }
}

/**
 * GET /api/v1/agent/runs/:id — Single run detail
 */
export async function getAgentRunById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const merchantId = new Types.ObjectId(req.user.merchantId);
    const run = await AgentRun.findOne({ _id: req.params.id, merchantId });
    if (!run) return res.status(404).json({ error: 'Agent run not found.' });
    return res.json(run);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch agent run.' });
  }
}

/**
 * GET /api/v1/agent/status — Live agent telemetry for all 7 agents
 */
export async function getAgentStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const merchantId = new Types.ObjectId(req.user.merchantId);

    const runs = await AgentRun.find({ merchantId }).sort({ createdAt: -1 }).limit(200);

    const agentNames = [
      'DetectionAgent', 'RootCauseAgent', 'MLPredictionService',
      'StrategyAgent', 'PolicyAgent', 'ExecutionAgent', 'MonitoringAgent'
    ];

    const agents = agentNames.map(name => {
      let totalTasks = 0;
      let successTasks = 0;
      let totalLatency = 0;
      let latestActivity: Date | null = null;

      for (const run of runs) {
        const step = run.steps.find(s => s.agent === name);
        if (step) {
          totalTasks++;
          if (step.status === 'SUCCESS') successTasks++;
          totalLatency += step.durationMs;
          if (!latestActivity || step.runAt > latestActivity) {
            latestActivity = step.runAt;
          }
        }
      }

      return {
        name,
        status: totalTasks > 0 ? 'ONLINE' : 'IDLE',
        tasksProcessed: totalTasks,
        successRate: totalTasks > 0 ? Math.round((successTasks / totalTasks) * 10000) / 100 : 0,
        avgLatencyMs: totalTasks > 0 ? Math.round(totalLatency / totalTasks) : 0,
        latestActivity: latestActivity?.toISOString() || null
      };
    });

    // Evaluation metrics
    const evalInput = runs.map(r => ({
      outcome: r.outcome,
      selectedStrategy: r.selectedStrategy,
      totalDurationMs: r.totalDurationMs,
      amount: 0,
      recovered: r.outcome === 'RECOVERED'
    }));
    const evalResult = await evaluationAgent.run({ runs: evalInput });

    // Include EvaluationAgent in agent telemetry
    const allAgentNames = [
      'DetectionAgent', 'RootCauseAgent', 'MLPredictionService',
      'StrategyAgent', 'PolicyAgent', 'ExecutionAgent', 'MonitoringAgent', 'EvaluationAgent'
    ];

    const updatedAgents = allAgentNames.map(name => {
      const existing = agents.find(a => a.name === name);
      if (existing) return existing;
      return {
        name,
        status: runs.length > 0 ? 'ONLINE' : 'IDLE',
        tasksProcessed: runs.length,
        successRate: 100,
        avgLatencyMs: 15,
        latestActivity: new Date().toISOString()
      };
    });

    return res.json({
      agents: updatedAgents,
      evaluation: evalResult,
      totalRuns: runs.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch agent status.' });
  }
}

/**
 * POST /api/v1/agent/test/:agentName — Test an individual agent
 */
export async function testIndividualAgent(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { agentName } = req.params;
    const customInput = req.body || {};

    const start = Date.now();
    let output: any = null;

    switch (agentName) {
      case 'DetectionAgent':
        output = await detectionAgent.run({
          amount: customInput.amount || 25000,
          currency: customInput.currency || 'INR',
          failureCount: customInput.failureCount || 1,
          successCount: customInput.successCount || 5,
          hoursSinceFailure: customInput.hoursSinceFailure || 4,
          isHighValue: (customInput.amount || 25000) >= 50000,
          isRecurringFailure: (customInput.failureCount || 1) >= 2,
          errorCategory: customInput.errorCategory || 'card_issue',
          paymentMethod: customInput.paymentMethod || 'card',
          ltv: customInput.ltv || 45000
        });
        break;

      case 'RootCauseAgent':
        output = await rootCauseAgent.run({
          errorCode: customInput.errorCode || 'BAD_REQUEST_ERROR',
          errorCategory: customInput.errorCategory || 'card_issue',
          errorDescription: customInput.errorDescription || 'Card expired during transaction',
          failureCount: customInput.failureCount || 1,
          isRecurringFailure: customInput.isRecurringFailure || false,
          isHighValue: customInput.isHighValue || false,
          paymentMethod: customInput.paymentMethod || 'card',
          hoursSinceFailure: customInput.hoursSinceFailure || 4,
          retryCount: customInput.retryCount || 0
        });
        break;

      case 'StrategyAgent':
        output = await strategyAgent.run({
          recoveryProbability: customInput.recoveryProbability || 0.78,
          riskScore: customInput.riskScore || 65,
          amount: customInput.amount || 25000,
          failureCount: customInput.failureCount || 1,
          retryCount: customInput.retryCount || 0,
          rootCause: customInput.rootCause || {
            cause: 'temporary payment failure',
            confidence: 0.80,
            description: 'Temporary card issue',
            recoverable: true,
            suggestedActions: ['RETRY', 'PAYMENT_LINK']
          },
          previousActions: customInput.previousActions || [],
          ltv: customInput.ltv || 45000,
          isHighValue: customInput.isHighValue || false,
          hoursSinceFailure: customInput.hoursSinceFailure || 4
        });
        break;

      case 'PolicyAgent':
        output = await policyAgent.run({
          proposedAction: customInput.proposedAction || 'RETRY',
          amount: customInput.amount || 25000,
          retryCount: customInput.retryCount || 0,
          failureCount: customInput.failureCount || 1,
          hoursSinceFailure: customInput.hoursSinceFailure || 4,
          isRecovered: customInput.isRecovered || false,
          previousActions: customInput.previousActions || [],
          maxRetries: customInput.maxRetries || 3,
          highValueThreshold: customInput.highValueThreshold || 50000,
          cooldownHours: customInput.cooldownHours || 24,
          agentMode: customInput.agentMode || 'autonomous',
          autoRetryEnabled: customInput.autoRetryEnabled ?? true,
          emailEnabled: customInput.emailEnabled ?? true,
          smsEnabled: customInput.smsEnabled ?? true
        });
        break;

      case 'ExecutionAgent':
        output = await executionAgent.run({
          action: customInput.action || 'PAYMENT_LINK',
          transactionId: customInput.transactionId || 'tx_test_123',
          amount: customInput.amount || 25000,
          customerId: customInput.customerId || 'cust_test_1',
          customerEmail: customInput.customerEmail || 'test@example.com',
          merchantId: req.user.merchantId
        });
        break;

      case 'EvaluationAgent':
        output = await evaluationAgent.run({
          runs: customInput.runs || [
            { outcome: 'RECOVERED', selectedStrategy: 'RETRY', totalDurationMs: 120, amount: 25000, recovered: true },
            { outcome: 'STOPPED', selectedStrategy: 'STOP', totalDurationMs: 95, amount: 12000, recovered: false }
          ]
        });
        break;

      default:
        return res.status(400).json({ error: `Unknown agent: ${agentName}` });
    }

    return res.json({
      agentName,
      status: 'SUCCESS',
      durationMs: Date.now() - start,
      output
    });
  } catch (error: any) {
    return res.status(500).json({ error: `Agent ${req.params.agentName} test failed.`, details: error.message });
  }
}

