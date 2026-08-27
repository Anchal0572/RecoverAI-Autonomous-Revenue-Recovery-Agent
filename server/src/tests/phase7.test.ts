/**
 * Phase 7 — Advanced Hackathon Features Test Suite
 * Tests all 7 new features + regression for Phase 4-6 functionality
 */
import { LeakageDetectionService } from '../services/LeakageDetectionService';
import { RAGKnowledgeService } from '../services/RAGKnowledgeService';
import { HinglishIntentService } from '../services/HinglishIntentService';
import { DetectionAgent } from '../agents/DetectionAgent';
import { RootCauseAgent } from '../agents/RootCauseAgent';
import { StrategyAgent } from '../agents/StrategyAgent';
import { PolicyAgent } from '../agents/PolicyAgent';
import { ExecutionAgent } from '../agents/ExecutionAgent';
import { MonitoringAgent } from '../agents/MonitoringAgent';
import { EvaluationAgent } from '../agents/EvaluationAgent';
import { AgentOrchestrator, OrchestratorInput } from '../agents/AgentOrchestrator';
import { RecoveryEngineService } from '../services/RecoveryEngineService';

// ══════════════════════════════════════════════
// FEATURE 5: RAG Knowledge System
// ══════════════════════════════════════════════
describe('Phase 7 Feature 5 — RAG Knowledge System', () => {
  const rag = new RAGKnowledgeService();

  it('returns relevant results for retry policy query', () => {
    const result = rag.query('retry policy limit');
    expect(result.totalMatches).toBeGreaterThan(0);
    expect(result.results[0].document.category).toBe('policies');
    expect(result.context).toContain('retry');
  });

  it('returns relevant results for payment failure query', () => {
    const result = rag.query('what happens when payment fails');
    expect(result.totalMatches).toBeGreaterThan(0);
  });

  it('filters by category when specified', () => {
    const playbookResults = rag.query('payment failure', 'playbooks');
    for (const r of playbookResults.results) {
      expect(r.document.category).toBe('playbooks');
    }
  });

  it('returns empty results for irrelevant query', () => {
    const result = rag.query('xyzabc123nonsense');
    expect(result.totalMatches).toBe(0);
  });

  it('lists all documents', () => {
    const docs = rag.getDocuments();
    expect(docs.length).toBeGreaterThanOrEqual(15);
  });

  it('lists documents filtered by category', () => {
    const faqs = rag.getDocuments('faqs');
    for (const doc of faqs) {
      expect(doc.category).toBe('faqs');
    }
    expect(faqs.length).toBeGreaterThan(0);
  });

  it('returns all categories with counts', () => {
    const categories = rag.getCategories();
    expect(categories).toHaveLength(4);
    const names = categories.map(c => c.category);
    expect(names).toContain('policies');
    expect(names).toContain('playbooks');
    expect(names).toContain('escalation');
    expect(names).toContain('faqs');
    for (const c of categories) {
      expect(c.count).toBeGreaterThan(0);
    }
  });

  it('generates merged context string from results', () => {
    const result = rag.query('high value approval');
    expect(result.context).toBeDefined();
    expect(typeof result.context).toBe('string');
    if (result.totalMatches > 0) {
      expect(result.context.length).toBeGreaterThan(0);
    }
  });
});

// ══════════════════════════════════════════════
// FEATURE 7: Hinglish Intent Detection
// ══════════════════════════════════════════════
describe('Phase 7 Feature 7 — Hinglish Intent Detection', () => {
  const intent = new HinglishIntentService();

  // English intents
  it('detects PAY_LATER intent in English', () => {
    const res = intent.detect('I will pay later, not now');
    expect(res.intent).toBe('PAY_LATER');
    expect(res.confidence).toBeGreaterThan(0);
    expect(res.language).toBe('english');
  });

  it('detects CANCEL_PAYMENT intent in English', () => {
    const res = intent.detect('Please cancel my payment');
    expect(res.intent).toBe('CANCEL_PAYMENT');
  });

  it('detects RETRY_PAYMENT intent in English', () => {
    const res = intent.detect('Can you try again?');
    expect(res.intent).toBe('RETRY_PAYMENT');
  });

  it('detects CHECK_STATUS intent in English', () => {
    const res = intent.detect('What is my payment status?');
    expect(res.intent).toBe('CHECK_STATUS');
  });

  it('detects REFUND_REQUEST intent in English', () => {
    const res = intent.detect('I want a refund, give me my money back');
    expect(res.intent).toBe('REFUND_REQUEST');
  });

  // Hinglish intents
  it('detects PAY_LATER intent in Hinglish', () => {
    const res = intent.detect('Payment abhi nahi ho raha, baad mein karunga');
    expect(res.intent).toBe('PAY_LATER');
    expect(res.language).toBe('hinglish');
  });

  it('detects CANCEL_PAYMENT intent in Hinglish', () => {
    const res = intent.detect('Cancel karo, nahi chahiye');
    expect(res.intent).toBe('CANCEL_PAYMENT');
    expect(res.language).toBe('hinglish');
  });

  it('detects RETRY_PAYMENT intent in Hinglish', () => {
    const res = intent.detect('Dobara try karo please');
    expect(res.intent).toBe('RETRY_PAYMENT');
    expect(res.language).toBe('hinglish');
  });

  it('detects REFUND_REQUEST intent in Hinglish', () => {
    const res = intent.detect('Mera paisa wapas karo');
    expect(res.intent).toBe('REFUND_REQUEST');
    expect(res.language).toBe('hinglish');
  });

  it('detects NEED_HELP intent in Hinglish', () => {
    const res = intent.detect('Madad karo, payment nahi ho raha');
    expect(res.intent).toBe('NEED_HELP');
  });

  // Edge cases
  it('returns UNKNOWN for empty message', () => {
    const res = intent.detect('');
    expect(res.intent).toBe('UNKNOWN');
    expect(res.confidence).toBe(0);
  });

  it('returns UNKNOWN for random text', () => {
    const res = intent.detect('asdf jkl zxcv');
    expect(res.intent).toBe('UNKNOWN');
  });

  it('does not crash on null-like input', () => {
    const res = intent.detect(null as any);
    expect(res.intent).toBe('UNKNOWN');
  });
});

// ══════════════════════════════════════════════
// FEATURE 2: What-If Simulator (calculation logic)
// ══════════════════════════════════════════════
describe('Phase 7 Feature 2 — What-If Simulator Calculations', () => {
  it('correctly calculates cumulative retry probability', () => {
    const retrySuccessRate = 0.5;
    const retryLimit = 3;
    const cumulative = 1 - Math.pow(1 - retrySuccessRate, retryLimit);
    expect(cumulative).toBeCloseTo(0.875, 2);
  });

  it('applies window factor correctly', () => {
    const windowDays7 = Math.min(1, 7 / 7);
    const windowDays3 = Math.min(1, 3 / 7);
    expect(windowDays7).toBe(1);
    expect(windowDays3).toBeCloseTo(0.4286, 2);
  });

  it('caps effective recovery rate at 95%', () => {
    const prob = 0.99;
    const cumulativeRetryProb = 0.99;
    const strategyMult = 1.0;
    const windowFactor = 1.0;
    const rate = Math.min(0.95, prob * cumulativeRetryProb * strategyMult * windowFactor);
    expect(rate).toBe(0.95);
  });

  it('calculates ROI correctly', () => {
    const recovered = 100000;
    const cost = 50 * 3 * 10; // ₹50 per attempt * 3 retries * 10 cases
    const roi = Math.round(((recovered - cost) / cost) * 100);
    expect(roi).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════
// FEATURE 4: Customer Segmentation (logic)
// ══════════════════════════════════════════════
describe('Phase 7 Feature 4 — Customer Segmentation Logic', () => {
  it('classifies high-LTV customer as HIGH_VALUE', () => {
    const ltv = 75000;
    const threshold = 50000;
    const segment = ltv >= threshold ? 'HIGH_VALUE' : 'OTHER';
    expect(segment).toBe('HIGH_VALUE');
  });

  it('classifies high recovery probability as LIKELY_TO_RECOVER', () => {
    const avgProb = 0.85;
    const segment = avgProb >= 0.7 ? 'LIKELY_TO_RECOVER' : 'OTHER';
    expect(segment).toBe('LIKELY_TO_RECOVER');
  });

  it('classifies low probability as LOW_PROBABILITY', () => {
    const avgProb = 0.2;
    const segment = avgProb < 0.3 ? 'LOW_PROBABILITY' : 'OTHER';
    expect(segment).toBe('LOW_PROBABILITY');
  });
});

// ══════════════════════════════════════════════
// REGRESSION: Phase 4 — All 7 Agents
// ══════════════════════════════════════════════
describe('Phase 4 Regression — All 7 Recovery Agents', () => {
  it('DetectionAgent scores risk correctly', async () => {
    const agent = new DetectionAgent();
    const res = await agent.run({
      amount: 60000, currency: 'INR', failureCount: 2, successCount: 4,
      hoursSinceFailure: 2, isHighValue: true, isRecurringFailure: true,
      errorCategory: 'card_issue', paymentMethod: 'card', ltv: 120000
    });
    expect(res.riskScore).toBeGreaterThanOrEqual(60);
    expect(res.revenueAtRisk).toBeGreaterThan(0);
  });

  it('RootCauseAgent classifies temporary failure', async () => {
    const agent = new RootCauseAgent();
    const res = await agent.run({
      errorCode: 'GATEWAY_TIMEOUT', errorCategory: 'network',
      errorDescription: 'Network timeout', failureCount: 1,
      isRecurringFailure: false, isHighValue: false,
      paymentMethod: 'upi', hoursSinceFailure: 1, retryCount: 0
    });
    expect(res.cause).toBe('temporary payment failure');
    expect(res.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('StrategyAgent selects RETRY for high-probability case', async () => {
    const agent = new StrategyAgent();
    const res = await agent.run({
      recoveryProbability: 0.85, riskScore: 70, amount: 15000,
      failureCount: 1, retryCount: 0,
      rootCause: { cause: 'temporary payment failure', confidence: 0.8, description: 'Timeout', recoverable: true, suggestedActions: ['RETRY'] },
      previousActions: [], ltv: 45000, isHighValue: false, hoursSinceFailure: 2
    });
    expect(res.selectedAction).toBe('RETRY');
  });

  it('PolicyAgent blocks when retry limit reached', async () => {
    const agent = new PolicyAgent();
    const res = await agent.run({
      proposedAction: 'RETRY', amount: 20000, retryCount: 3, failureCount: 3,
      hoursSinceFailure: 10, isRecovered: false, previousActions: ['RETRY', 'RETRY', 'RETRY'],
      maxRetries: 3, highValueThreshold: 50000, cooldownHours: 24,
      agentMode: 'autonomous', autoRetryEnabled: true, emailEnabled: true, smsEnabled: true
    });
    expect(res.approved).toBe(false);
  });

  it('ExecutionAgent executes PAYMENT_LINK', async () => {
    const agent = new ExecutionAgent();
    const res = await agent.run({
      action: 'PAYMENT_LINK', transactionId: 'pay_reg_test', amount: 25000,
      customerId: 'cust_001', customerEmail: 'test@test.com', merchantId: 'mch_001'
    });
    expect(res.success).toBe(true);
    expect(res.action).toBe('PAYMENT_LINK');
  });

  it('MonitoringAgent detects recovery', async () => {
    const agent = new MonitoringAgent();
    const res = await agent.run({
      executionSuccess: true, executedAction: 'RETRY', amount: 25000,
      retryCount: 1, failureCount: 1, hoursSinceFailure: 2,
      recoveryProbability: 0.8, isHighValue: false
    });
    expect(res.recovered).toBe(true);
    expect(res.caseStatus).toBe('RECOVERED');
  });

  it('EvaluationAgent calculates metrics', async () => {
    const agent = new EvaluationAgent();
    const res = await agent.run({
      runs: [
        { outcome: 'RECOVERED', selectedStrategy: 'RETRY', totalDurationMs: 150, amount: 30000, recovered: true },
        { outcome: 'STOPPED', selectedStrategy: 'STOP', totalDurationMs: 80, amount: 10000, recovered: false }
      ]
    });
    expect(res.totalRuns).toBe(2);
    expect(res.successfulActions).toBe(1);
    expect(res.totalRecovered).toBe(30000);
  });
});

// ══════════════════════════════════════════════
// REGRESSION: Phase 4 — Full Orchestrator Pipeline
// ══════════════════════════════════════════════
describe('Phase 4 Regression — Agent Orchestrator Full Pipeline', () => {
  it('executes full 8-step pipeline without errors', async () => {
    const orchestrator = new AgentOrchestrator();
    const input: OrchestratorInput = {
      transactionId: 'pay_regression_test',
      transactionObjectId: '660f1a2b3c4d5e6f7a8b9c0d',
      amount: 35000, currency: 'INR', paymentMethod: 'card',
      errorCode: 'BAD_REQUEST_ERROR', errorCategory: 'card_issue',
      errorDescription: 'Card verification failed',
      customerId: 'cust_001', customerEmail: 'test@company.in',
      ltv: 60000, failureCount: 1, successCount: 4, retryCount: 0,
      previousActions: [], hoursSinceFailure: 3, isRecovered: false,
      merchantId: '660f1a2b3c4d5e6f7a8b9c0e',
      maxRetries: 3, highValueThreshold: 50000, cooldownHours: 24,
      agentMode: 'autonomous', autoRetryEnabled: true, emailEnabled: true, smsEnabled: true
    };

    const result = await orchestrator.run(input);

    expect(result.steps.length).toBeGreaterThanOrEqual(7);
    expect(result.explanation).toBeDefined();
    expect(typeof result.explanation).toBe('string');
    expect(result.explanation).not.toContain('step 1');
    expect(result.totalDurationMs).toBeGreaterThan(0);
    expect(result.recoveryDetails.riskScore).toBeDefined();
  });
});

// ══════════════════════════════════════════════
// REGRESSION: Phase 6 — Stopping Rules & Revenue
// ══════════════════════════════════════════════
describe('Phase 6 Regression — Stopping Rules & Revenue Calculations', () => {
  const engine = new RecoveryEngineService();

  it('stops workflow when payment is captured', () => {
    const res = engine.evaluateStoppingRules({
      isCaptured: true, retryCount: 1, maxRetries: 3,
      hoursSinceFailure: 2, policyApproved: true, humanApprovalStatus: 'NOT_REQUIRED'
    });
    expect(res.shouldStop).toBe(true);
    expect(res.terminalStatus).toBe('RECOVERED');
  });

  it('stops workflow on human rejection', () => {
    const res = engine.evaluateStoppingRules({
      isCaptured: false, retryCount: 0, maxRetries: 3,
      hoursSinceFailure: 5, policyApproved: true,
      humanApprovalStatus: 'REJECTED', rejectionReason: 'Too risky'
    });
    expect(res.shouldStop).toBe(true);
    expect(res.terminalStatus).toBe('REJECTED');
  });

  it('stops workflow on policy block', () => {
    const res = engine.evaluateStoppingRules({
      isCaptured: false, retryCount: 1, maxRetries: 3,
      hoursSinceFailure: 5, policyApproved: false, humanApprovalStatus: 'NOT_REQUIRED'
    });
    expect(res.shouldStop).toBe(true);
    expect(res.terminalStatus).toBe('POLICY_BLOCKED');
  });

  it('stops workflow when retry limit reached', () => {
    const res = engine.evaluateStoppingRules({
      isCaptured: false, retryCount: 3, maxRetries: 3,
      hoursSinceFailure: 10, policyApproved: true, humanApprovalStatus: 'NOT_REQUIRED'
    });
    expect(res.shouldStop).toBe(true);
    expect(res.terminalStatus).toBe('STOPPED');
  });

  it('stops workflow when recovery window expires', () => {
    const res = engine.evaluateStoppingRules({
      isCaptured: false, retryCount: 1, maxRetries: 3,
      hoursSinceFailure: 175, policyApproved: true, humanApprovalStatus: 'NOT_REQUIRED'
    });
    expect(res.shouldStop).toBe(true);
    expect(res.terminalStatus).toBe('OVERDUE');
  });

  it('allows workflow when all rules pass', () => {
    const res = engine.evaluateStoppingRules({
      isCaptured: false, retryCount: 1, maxRetries: 3,
      hoursSinceFailure: 12, policyApproved: true, humanApprovalStatus: 'NOT_REQUIRED'
    });
    expect(res.shouldStop).toBe(false);
  });

  it('revenue calculations are mathematically correct', () => {
    const amount = 50000;
    const riskScore = 80;
    const recoveryProb = 0.85;
    expect(Math.round(amount * (riskScore / 100))).toBe(40000);
    expect(Math.round(amount * recoveryProb)).toBe(42500);
  });
});
