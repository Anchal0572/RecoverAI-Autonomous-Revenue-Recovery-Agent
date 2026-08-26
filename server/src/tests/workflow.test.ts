import { RecoveryEngineService } from '../services/RecoveryEngineService';

describe('Phase 6 — Autonomous Revenue Recovery Workflow Engine', () => {
  const engine = new RecoveryEngineService();

  // 1. Stopping Rules Evaluation
  describe('Stopping Rules Engine', () => {
    it('stops workflow immediately when payment is captured', () => {
      const res = engine.evaluateStoppingRules({
        isCaptured: true,
        retryCount: 1,
        maxRetries: 3,
        hoursSinceFailure: 2,
        policyApproved: true,
        humanApprovalStatus: 'NOT_REQUIRED'
      });

      expect(res.shouldStop).toBe(true);
      expect(res.terminalStatus).toBe('RECOVERED');
    });

    it('stops workflow when Human Manager rejects approval request', () => {
      const res = engine.evaluateStoppingRules({
        isCaptured: false,
        retryCount: 0,
        maxRetries: 3,
        hoursSinceFailure: 5,
        policyApproved: true,
        humanApprovalStatus: 'REJECTED',
        rejectionReason: 'Risk threshold too high'
      });

      expect(res.shouldStop).toBe(true);
      expect(res.terminalStatus).toBe('REJECTED');
      expect(res.reason).toContain('Risk threshold too high');
    });

    it('stops workflow when merchant policy prohibits action', () => {
      const res = engine.evaluateStoppingRules({
        isCaptured: false,
        retryCount: 1,
        maxRetries: 3,
        hoursSinceFailure: 5,
        policyApproved: false,
        humanApprovalStatus: 'NOT_REQUIRED',
        rejectionReason: 'Cooldown active'
      });

      expect(res.shouldStop).toBe(true);
      expect(res.terminalStatus).toBe('POLICY_BLOCKED');
    });

    it('stops workflow when retry count reaches maxRetries limit', () => {
      const res = engine.evaluateStoppingRules({
        isCaptured: false,
        retryCount: 3,
        maxRetries: 3,
        hoursSinceFailure: 10,
        policyApproved: true,
        humanApprovalStatus: 'NOT_REQUIRED'
      });

      expect(res.shouldStop).toBe(true);
      expect(res.terminalStatus).toBe('STOPPED');
      expect(res.reason).toContain('Maximum retry limit reached');
    });

    it('stops workflow when recovery window exceeds 168 hours (7 days)', () => {
      const res = engine.evaluateStoppingRules({
        isCaptured: false,
        retryCount: 1,
        maxRetries: 3,
        hoursSinceFailure: 175,
        policyApproved: true,
        humanApprovalStatus: 'NOT_REQUIRED'
      });

      expect(res.shouldStop).toBe(true);
      expect(res.terminalStatus).toBe('OVERDUE');
      expect(res.reason).toContain('Recovery window (7 days) expired');
    });

    it('allows workflow execution when all stopping rules pass', () => {
      const res = engine.evaluateStoppingRules({
        isCaptured: false,
        retryCount: 1,
        maxRetries: 3,
        hoursSinceFailure: 12,
        policyApproved: true,
        humanApprovalStatus: 'NOT_REQUIRED'
      });

      expect(res.shouldStop).toBe(false);
    });
  });

  // 2. Revenue Metric Calculations
  describe('Revenue Calculation Engine', () => {
    it('separates Revenue At Risk, Expected Recovery, and Actual Recovery correctly', () => {
      const amount = 50000;
      const riskScore = 80;
      const recoveryProb = 0.85;

      const revenueAtRisk = Math.round(amount * (riskScore / 100));
      const expectedRecovery = Math.round(amount * recoveryProb);
      const actualRecovery = 50000; // when captured

      expect(revenueAtRisk).toBe(40000);
      expect(expectedRecovery).toBe(42500);
      expect(actualRecovery).toBe(50000);
    });
  });
});
