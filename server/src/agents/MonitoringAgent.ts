/**
 * MonitoringAgent — Observes execution results, updates case, decides next step
 */
import { RecoveryAction } from './StrategyAgent';

export interface MonitoringResult {
  recovered: boolean;
  caseStatus: 'PENDING' | 'IN_PROGRESS' | 'RECOVERED' | 'FAILED' | 'ABANDONED' | 'OVERDUE' | 'WAITING';
  shouldContinue: boolean;
  nextAction: RecoveryAction | null;
  observation: string;
}

export interface MonitoringInput {
  executionSuccess: boolean;
  executedAction: RecoveryAction;
  amount: number;
  retryCount: number;
  failureCount: number;
  hoursSinceFailure: number;
  recoveryProbability: number;
  isHighValue: boolean;
}

export class MonitoringAgent {
  readonly name = 'MonitoringAgent';

  async run(input: MonitoringInput): Promise<MonitoringResult> {

    // If execution failed entirely
    if (!input.executionSuccess) {
      return {
        recovered: false,
        caseStatus: 'FAILED',
        shouldContinue: false,
        nextAction: 'ESCALATE',
        observation: 'Execution failed — escalating to human review.'
      };
    }

    // Action-specific monitoring
    switch (input.executedAction) {
      case 'RETRY': {
        // Simulate ~40% chance of successful recovery on retry
        const recovered = input.recoveryProbability >= 0.55;
        if (recovered) {
          return {
            recovered: true,
            caseStatus: 'RECOVERED',
            shouldContinue: false,
            nextAction: null,
            observation: `Payment of ₹${input.amount.toLocaleString('en-IN')} successfully recovered via RETRY.`
          };
        }
        return {
          recovered: false,
          caseStatus: 'IN_PROGRESS',
          shouldContinue: input.retryCount < 3,
          nextAction: input.retryCount < 3 ? 'REMINDER' : 'ESCALATE',
          observation: `Retry attempt ${input.retryCount + 1} did not succeed. ${input.retryCount < 3 ? 'Will follow up with reminder.' : 'Max retries reached — escalating.'}`
        };
      }

      case 'PAYMENT_LINK':
        return {
          recovered: false,
          caseStatus: 'IN_PROGRESS',
          shouldContinue: false,
          nextAction: 'WAIT',
          observation: 'Payment link sent to customer. Monitoring for 48h click-through and completion.'
        };

      case 'REMINDER':
        return {
          recovered: false,
          caseStatus: 'IN_PROGRESS',
          shouldContinue: false,
          nextAction: null,
          observation: 'Reminder dispatched. Awaiting customer response — no immediate action needed.'
        };

      case 'WAIT':
        return {
          recovered: false,
          caseStatus: 'WAITING',
          shouldContinue: false,
          nextAction: null,
          observation: 'Case set to WAITING state. Will re-evaluate after scheduled period.'
        };

      case 'ESCALATE':
        return {
          recovered: false,
          caseStatus: 'IN_PROGRESS',
          shouldContinue: false,
          nextAction: null,
          observation: 'Escalation ticket created. Human review team will take over.'
        };

      case 'STOP':
        return {
          recovered: false,
          caseStatus: input.hoursSinceFailure > 168 ? 'OVERDUE' : 'ABANDONED',
          shouldContinue: false,
          nextAction: null,
          observation: 'Agent pipeline stopped. Case moved to terminal state.'
        };

      default:
        return {
          recovered: false,
          caseStatus: 'IN_PROGRESS',
          shouldContinue: false,
          nextAction: null,
          observation: 'Unknown action completed. No further automated steps.'
        };
    }
  }
}
