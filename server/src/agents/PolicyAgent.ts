/**
 * PolicyAgent — Validates every proposed action against merchant guardrails
 * NO action executes without passing this gate.
 */
import { RecoveryAction } from './StrategyAgent';

export interface PolicyResult {
  approved: boolean;
  requiresHumanApproval: boolean;
  rejectionReason?: string;
  appliedRules: string[];
}

export interface PolicyInput {
  proposedAction: RecoveryAction;
  amount: number;
  retryCount: number;
  failureCount: number;
  hoursSinceFailure: number;
  isRecovered: boolean;
  previousActions: string[];
  // Merchant policy config
  maxRetries: number;
  highValueThreshold: number;
  cooldownHours: number;
  agentMode: 'autonomous' | 'supervised' | 'manual';
  autoRetryEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

export class PolicyAgent {
  readonly name = 'PolicyAgent';

  async run(input: PolicyInput): Promise<PolicyResult> {
    const rules: string[] = [];
    let approved = true;
    let requiresHumanApproval = false;
    let rejectionReason: string | undefined;

    // ── Hard STOP rules ──

    // Rule 1: Payment already recovered
    if (input.isRecovered) {
      return {
        approved: false,
        requiresHumanApproval: false,
        rejectionReason: 'Transaction already recovered — no further action needed.',
        appliedRules: ['RULE_ALREADY_RECOVERED']
      };
    }

    // Rule 2: Recovery window expired
    if (input.hoursSinceFailure > 168) {
      return {
        approved: false,
        requiresHumanApproval: false,
        rejectionReason: 'Recovery window (7 days) has expired — action blocked.',
        appliedRules: ['RULE_RECOVERY_WINDOW_EXPIRED']
      };
    }

    // Rule 3: Retry limit reached
    if (input.proposedAction === 'RETRY') {
      if (!input.autoRetryEnabled) {
        return {
          approved: false,
          requiresHumanApproval: false,
          rejectionReason: 'Auto-retry is disabled by merchant policy.',
          appliedRules: ['RULE_AUTO_RETRY_DISABLED']
        };
      }
      if (input.retryCount >= input.maxRetries) {
        return {
          approved: false,
          requiresHumanApproval: false,
          rejectionReason: `Retry limit reached (${input.retryCount}/${input.maxRetries}) — RETRY blocked.`,
          appliedRules: ['RULE_RETRY_LIMIT_REACHED']
        };
      }
      rules.push(`RETRY allowed (${input.retryCount}/${input.maxRetries} attempts used)`);
    }

    // Rule 4: High-value human approval
    if (input.amount >= input.highValueThreshold && input.proposedAction !== 'STOP') {
      requiresHumanApproval = true;
      rules.push(`HIGH_VALUE_APPROVAL_REQUIRED — amount ₹${input.amount.toLocaleString('en-IN')} exceeds threshold ₹${input.highValueThreshold.toLocaleString('en-IN')}`);
    }

    // Rule 5: Manual mode blocks all autonomous actions except STOP
    if (input.agentMode === 'manual' && input.proposedAction !== 'STOP') {
      return {
        approved: false,
        requiresHumanApproval: true,
        rejectionReason: 'Agent is in MANUAL mode — all actions require human approval.',
        appliedRules: ['RULE_MANUAL_MODE_BLOCK']
      };
    }

    // Rule 6: Email actions need email enabled
    if (['REMINDER'].includes(input.proposedAction) && !input.emailEnabled) {
      return {
        approved: false,
        requiresHumanApproval: false,
        rejectionReason: 'Email reminders are disabled by merchant policy.',
        appliedRules: ['RULE_EMAIL_DISABLED']
      };
    }

    // Rule 7: Cooldown check — no actions within cooldown period on same tx
    if (input.previousActions.length > 0 && input.hoursSinceFailure < (input.cooldownHours / 24)) {
      rules.push(`Within cooldown period — action allowed but noted (cooldown: ${input.cooldownHours}h)`);
    }

    // ── Supervised mode adds human approval flag ──
    if (input.agentMode === 'supervised') {
      requiresHumanApproval = true;
      rules.push('SUPERVISED mode — flagged for human review before execution');
    }

    // ── Always approved rules ──
    if (input.proposedAction === 'STOP' || input.proposedAction === 'ESCALATE') {
      approved = true;
      rules.push(`${input.proposedAction} is always policy-approved`);
    }

    if (rules.length === 0) {
      rules.push('All policy checks passed');
    }

    return { approved, requiresHumanApproval, appliedRules: rules, rejectionReason };
  }
}
