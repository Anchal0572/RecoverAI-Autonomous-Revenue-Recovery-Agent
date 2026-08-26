import { DetectionAgent } from '../agents/DetectionAgent';
import { RootCauseAgent } from '../agents/RootCauseAgent';
import { StrategyAgent } from '../agents/StrategyAgent';
import { PolicyAgent } from '../agents/PolicyAgent';
import { ExecutionAgent } from '../agents/ExecutionAgent';
import { MonitoringAgent } from '../agents/MonitoringAgent';
import { EvaluationAgent } from '../agents/EvaluationAgent';
import { AgentOrchestrator, OrchestratorInput } from '../agents/AgentOrchestrator';

describe('RecoverAI Autonomous Recovery Agents', () => {

  // 1. Revenue Detection Agent
  describe('Revenue Detection Agent', () => {
    const detectionAgent = new DetectionAgent();

    it('scores risk score and revenue at risk correctly for high value transaction', async () => {
      const res = await detectionAgent.run({
        amount: 60000,
        currency: 'INR',
        failureCount: 2,
        successCount: 4,
        hoursSinceFailure: 2,
        isHighValue: true,
        isRecurringFailure: true,
        errorCategory: 'card_issue',
        paymentMethod: 'card',
        ltv: 120000
      });

      expect(res.riskScore).toBeGreaterThanOrEqual(60);
      expect(res.revenueAtRisk).toBeGreaterThan(0);
      expect(res.factors).toContain('High-value transaction ₹60,000');
      expect(res.factors).toContain('Recurring payment failure pattern detected');
    });
  });

  // 2. Root Cause Agent
  describe('Root Cause Agent', () => {
    const rootCauseAgent = new RootCauseAgent();

    it('classifies temporary payment failure correctly', async () => {
      const res = await rootCauseAgent.run({
        errorCode: 'GATEWAY_TIMEOUT',
        errorCategory: 'network',
        errorDescription: 'Network timeout during gateway authorization',
        failureCount: 1,
        isRecurringFailure: false,
        isHighValue: false,
        paymentMethod: 'upi',
        hoursSinceFailure: 1,
        retryCount: 0
      });

      expect(res.cause).toBe('temporary payment failure');
      expect(res.confidence).toBeGreaterThanOrEqual(0.75);
      expect(res.suggestedActions).toContain('RETRY');
    });

    it('classifies high-value failure correctly', async () => {
      const res = await rootCauseAgent.run({
        errorCode: 'BANK_REJECT',
        errorCategory: 'bank_issue',
        errorDescription: 'Large amount payment blocked by issuing bank',
        failureCount: 1,
        isRecurringFailure: false,
        isHighValue: true,
        paymentMethod: 'card',
        hoursSinceFailure: 3,
        retryCount: 0
      });

      expect(res.cause).toBe('high-value failure');
      expect(res.suggestedActions).toContain('PAYMENT_LINK');
    });
  });

  // 3. Recovery Strategy Agent
  describe('Recovery Strategy Agent', () => {
    const strategyAgent = new StrategyAgent();

    it('selects RETRY action when recovery probability is high and retryCount is low', async () => {
      const res = await strategyAgent.run({
        recoveryProbability: 0.85,
        riskScore: 70,
        amount: 15000,
        failureCount: 1,
        retryCount: 0,
        rootCause: {
          cause: 'temporary payment failure',
          confidence: 0.8,
          description: 'Temporary timeout',
          recoverable: true,
          suggestedActions: ['RETRY']
        },
        previousActions: [],
        ltv: 45000,
        isHighValue: false,
        hoursSinceFailure: 2
      });

      expect(res.selectedAction).toBe('RETRY');
      expect(res.confidence).toBe(0.85);
    });

    it('selects PAYMENT_LINK for checkout abandonment or overdue invoice', async () => {
      const res = await strategyAgent.run({
        recoveryProbability: 0.65,
        riskScore: 50,
        amount: 25000,
        failureCount: 1,
        retryCount: 0,
        rootCause: {
          cause: 'checkout abandonment',
          confidence: 0.75,
          description: 'Cart abandoned',
          recoverable: true,
          suggestedActions: ['PAYMENT_LINK']
        },
        previousActions: [],
        ltv: 30000,
        isHighValue: false,
        hoursSinceFailure: 5
      });

      expect(res.selectedAction).toBe('PAYMENT_LINK');
    });
  });

  // 4. Policy Agent
  describe('Policy Agent', () => {
    const policyAgent = new PolicyAgent();

    it('requires human approval for amounts exceeding 50k', async () => {
      const res = await policyAgent.run({
        proposedAction: 'PAYMENT_LINK',
        amount: 75000,
        retryCount: 0,
        failureCount: 1,
        hoursSinceFailure: 4,
        isRecovered: false,
        previousActions: [],
        maxRetries: 3,
        highValueThreshold: 50000,
        cooldownHours: 24,
        agentMode: 'autonomous',
        autoRetryEnabled: true,
        emailEnabled: true,
        smsEnabled: true
      });

      expect(res.approved).toBe(true);
      expect(res.requiresHumanApproval).toBe(true);
      expect(res.appliedRules[0]).toContain('HIGH_VALUE_APPROVAL_REQUIRED');
    });

    it('blocks RETRY action when retry limit is reached', async () => {
      const res = await policyAgent.run({
        proposedAction: 'RETRY',
        amount: 20000,
        retryCount: 3,
        failureCount: 3,
        hoursSinceFailure: 10,
        isRecovered: false,
        previousActions: ['RETRY', 'RETRY', 'RETRY'],
        maxRetries: 3,
        highValueThreshold: 50000,
        cooldownHours: 24,
        agentMode: 'autonomous',
        autoRetryEnabled: true,
        emailEnabled: true,
        smsEnabled: true
      });

      expect(res.approved).toBe(false);
      expect(res.rejectionReason).toContain('Retry limit reached');
    });

    it('blocks any action if payment is already recovered', async () => {
      const res = await policyAgent.run({
        proposedAction: 'REMINDER',
        amount: 15000,
        retryCount: 1,
        failureCount: 1,
        hoursSinceFailure: 2,
        isRecovered: true,
        previousActions: ['RETRY'],
        maxRetries: 3,
        highValueThreshold: 50000,
        cooldownHours: 24,
        agentMode: 'autonomous',
        autoRetryEnabled: true,
        emailEnabled: true,
        smsEnabled: true
      });

      expect(res.approved).toBe(false);
      expect(res.rejectionReason).toContain('already recovered');
    });
  });

  // 5. Execution Agent
  describe('Execution Agent', () => {
    const executionAgent = new ExecutionAgent();

    it('executes PAYMENT_LINK and generates pay URL payload', async () => {
      const res = await executionAgent.run({
        action: 'PAYMENT_LINK',
        transactionId: 'pay_test_998877',
        amount: 25000,
        customerId: 'cust_001',
        customerEmail: 'priya@techcorp.in',
        merchantId: 'mch_001'
      });

      expect(res.success).toBe(true);
      expect(res.action).toBe('PAYMENT_LINK');
      expect(res.simulatedPayload.url).toContain('https://rzp.io/pay/');
    });
  });

  // 6. Monitoring Agent
  describe('Monitoring Agent', () => {
    const monitoringAgent = new MonitoringAgent();

    it('updates case status to RECOVERED when retry succeeds', async () => {
      const res = await monitoringAgent.run({
        executionSuccess: true,
        executedAction: 'RETRY',
        amount: 25000,
        retryCount: 1,
        failureCount: 1,
        hoursSinceFailure: 2,
        recoveryProbability: 0.8,
        isHighValue: false
      });

      expect(res.recovered).toBe(true);
      expect(res.caseStatus).toBe('RECOVERED');
      expect(res.shouldContinue).toBe(false);
    });
  });

  // 7. Evaluation Agent
  describe('Evaluation Agent', () => {
    const evaluationAgent = new EvaluationAgent();

    it('calculates recovery rate, total recovered, and ROI', async () => {
      const res = await evaluationAgent.run({
        runs: [
          { outcome: 'RECOVERED', selectedStrategy: 'RETRY', totalDurationMs: 150, amount: 30000, recovered: true },
          { outcome: 'RECOVERED', selectedStrategy: 'PAYMENT_LINK', totalDurationMs: 200, amount: 20000, recovered: true },
          { outcome: 'STOPPED', selectedStrategy: 'STOP', totalDurationMs: 80, amount: 10000, recovered: false }
        ]
      });

      expect(res.totalRuns).toBe(3);
      expect(res.successfulActions).toBe(2);
      expect(res.failedActions).toBe(1);
      expect(res.totalRecovered).toBe(50000);
      expect(res.recoveryRate).toBeCloseTo(0.6667, 2);
      expect(res.roi).toBeGreaterThan(0);
    });
  });

  // 8. End-to-End Orchestrator Pipeline
  describe('Agent Orchestrator Full Pipeline', () => {
    const orchestrator = new AgentOrchestrator();

    it('executes full sequence: Detection -> Root Cause -> Prediction -> Strategy -> Policy -> Execution -> Monitoring -> Evaluation', async () => {
      const input: OrchestratorInput = {
        transactionId: 'pay_e2e_test_123',
        transactionObjectId: '660f1a2b3c4d5e6f7a8b9c0d',
        amount: 35000,
        currency: 'INR',
        paymentMethod: 'card',
        errorCode: 'BAD_REQUEST_ERROR',
        errorCategory: 'card_issue',
        errorDescription: 'Card verification failed',
        customerId: 'cust_001',
        customerEmail: 'test@company.in',
        ltv: 60000,
        failureCount: 1,
        successCount: 4,
        retryCount: 0,
        previousActions: [],
        hoursSinceFailure: 3,
        isRecovered: false,
        merchantId: '660f1a2b3c4d5e6f7a8b9c0e',
        maxRetries: 3,
        highValueThreshold: 50000,
        cooldownHours: 24,
        agentMode: 'autonomous',
        autoRetryEnabled: true,
        emailEnabled: true,
        smsEnabled: true
      };

      const result = await orchestrator.run(input);

      expect(result.steps.length).toBeGreaterThanOrEqual(7);
      expect(result.explanation).toBeDefined();
      expect(typeof result.explanation).toBe('string');
      expect(result.explanation).not.toContain('step 1'); // No chain of thought exposed
      expect(result.totalDurationMs).toBeGreaterThan(0);
      expect(result.recoveryDetails.riskScore).toBeDefined();
    });
  });
});
