/**
 * StrategyAgent — Selects the optimal recovery action
 */
import { RootCauseResult } from './RootCauseAgent';

export type RecoveryAction = 'RETRY' | 'PAYMENT_LINK' | 'REMINDER' | 'WAIT' | 'ESCALATE' | 'STOP';

export interface StrategyResult {
  selectedAction: RecoveryAction;
  confidence: number;
  reasoning: string;
  alternativeActions: RecoveryAction[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface StrategyInput {
  recoveryProbability: number;    // 0–1 from ML service
  riskScore: number;              // 0–100 from DetectionAgent
  amount: number;
  failureCount: number;
  retryCount: number;
  rootCause: RootCauseResult;
  previousActions: string[];      // past actions taken for this tx
  ltv: number;
  isHighValue: boolean;
  hoursSinceFailure: number;
}

export class StrategyAgent {
  readonly name = 'StrategyAgent';

  async run(input: StrategyInput): Promise<StrategyResult> {
    const { recoveryProbability: prob, rootCause, amount, retryCount,
            failureCount, previousActions, isHighValue, hoursSinceFailure } = input;

    const already = (action: string) => previousActions.includes(action);

    // ── Terminal conditions ──
    if (failureCount >= 5) {
      return this.result('STOP', 0.95, 'Too many failures — stopping to protect customer relationship.', []);
    }
    if (hoursSinceFailure > 168) {
      return this.result('STOP', 0.90, 'Recovery window (7 days) has expired — stopping agent.', []);
    }
    if (prob < 0.15 && !isHighValue) {
      return this.result('STOP', 0.85, 'Recovery probability too low — not worth pursuing further.', ['ESCALATE']);
    }

    // ── High-value escalation ──
    if (isHighValue && amount >= 100000) {
      return this.result('ESCALATE', 0.92,
        `Very high-value transaction ₹${amount.toLocaleString('en-IN')} — escalating to human team.`,
        ['PAYMENT_LINK']);
    }

    // ── Cause-specific strategy ──
    if (rootCause.cause === 'checkout abandonment' || rootCause.cause === 'overdue invoice') {
      if (!already('PAYMENT_LINK')) {
        return this.result('PAYMENT_LINK', 0.88,
          'Checkout abandonment or overdue invoice — sending direct payment link.',
          ['REMINDER']);
      }
    }

    if (rootCause.cause === 'subscription failure') {
      if (!already('REMINDER')) {
        return this.result('REMINDER', 0.85,
          'Subscription failure — sending payment update reminder to customer.',
          ['PAYMENT_LINK']);
      }
    }

    if (rootCause.cause === 'high-value failure' && amount >= 50000) {
      if (!already('ESCALATE')) {
        return this.result('ESCALATE', 0.90,
          `High-value payment failure (₹${amount.toLocaleString('en-IN')}) — escalating for manager review.`,
          ['PAYMENT_LINK']);
      }
    }

    if (rootCause.cause === 'temporary payment failure' && retryCount < 2 && !already('RETRY')) {
      return this.result('RETRY', 0.85,
        'Temporary payment failure — auto-retrying transaction.',
        ['PAYMENT_LINK', 'REMINDER']);
    }

    // ── ML probability-driven strategy ──
    if (prob >= 0.75 && retryCount < 3 && !already('RETRY')) {
      return this.result('RETRY', prob,
        `High recovery probability (${Math.round(prob * 100)}%) — auto-retrying payment.`,
        ['PAYMENT_LINK', 'REMINDER']);
    }

    if (prob >= 0.50 && !already('REMINDER')) {
      return this.result('REMINDER', prob,
        `Moderate probability (${Math.round(prob * 100)}%) — sending targeted recovery reminder.`,
        ['PAYMENT_LINK', 'WAIT']);
    }

    if (prob >= 0.35 && !already('PAYMENT_LINK')) {
      return this.result('PAYMENT_LINK', prob,
        `Lower probability (${Math.round(prob * 100)}%) — offering alternate payment channel.`,
        ['WAIT', 'ESCALATE']);
    }

    if (isHighValue && !already('ESCALATE')) {
      return this.result('ESCALATE', 0.70,
        'High-value case with low automated recovery prospects — escalating to team.',
        ['STOP']);
    }

    return this.result('STOP', 0.80,
      'All automated recovery options exhausted — stopping agent cleanly.',
      []);
  }

  private result(
    action: RecoveryAction,
    confidence: number,
    reasoning: string,
    alternatives: RecoveryAction[]
  ): StrategyResult {
    const priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
      action === 'STOP' ? 'LOW' :
      action === 'ESCALATE' ? 'CRITICAL' :
      confidence >= 0.80 ? 'HIGH' : 'MEDIUM';

    return { selectedAction: action, confidence, reasoning, alternativeActions: alternatives, priority };
  }
}
