/**
 * ExecutionAgent — Executes only policy-approved actions (simulated, not real gateway calls)
 */
import { RecoveryAction } from './StrategyAgent';

export interface ExecutionResult {
  success: boolean;
  action: RecoveryAction;
  outcome: string;
  simulatedPayload: Record<string, any>;
  executedAt: Date;
  durationMs: number;
}

export interface ExecutionInput {
  action: RecoveryAction;
  transactionId: string;
  amount: number;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  merchantId: string;
}

export class ExecutionAgent {
  readonly name = 'ExecutionAgent';

  async run(input: ExecutionInput): Promise<ExecutionResult> {
    const start = Date.now();
    const executedAt = new Date();

    switch (input.action) {
      case 'RETRY':
        return this.simulate(input.action, {
          type: 'payment_charge',
          transactionId: input.transactionId,
          amount: input.amount,
          currency: 'INR',
          retrySource: 'RecoverAI-AgentV4',
          timestamp: executedAt.toISOString()
        }, `Auto-retry initiated for ₹${input.amount.toLocaleString('en-IN')}`, start);

      case 'PAYMENT_LINK': {
        const link = `https://rzp.io/pay/recover_${input.transactionId.slice(-8)}`;
        return this.simulate(input.action, {
          type: 'payment_link_created',
          url: link,
          amount: input.amount,
          currency: 'INR',
          expiresIn: '48h',
          sentTo: input.customerEmail || 'customer@email.com'
        }, `Payment link generated and sent: ${link}`, start);
      }

      case 'REMINDER': {
        const channel = input.customerEmail ? 'email' : 'sms';
        return this.simulate(input.action, {
          type: 'reminder_sent',
          channel,
          recipient: input.customerEmail || input.customerPhone || 'customer',
          template: 'payment_recovery_v2',
          transactionId: input.transactionId,
          amount: input.amount
        }, `${channel.toUpperCase()} reminder dispatched to customer`, start);
      }

      case 'WAIT':
        return this.simulate(input.action, {
          type: 'scheduled_retry',
          scheduledAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          reason: 'Waiting 48h for customer funds availability'
        }, 'Case set to WAITING — scheduled for re-evaluation in 48h', start);

      case 'ESCALATE':
        return this.simulate(input.action, {
          type: 'escalation_ticket',
          ticketId: `ESC-${Date.now()}`,
          assignedTo: 'recovery-ops@company.com',
          priority: 'HIGH',
          transactionId: input.transactionId,
          amount: input.amount
        }, `Escalation ticket created and assigned to recovery operations team`, start);

      case 'STOP':
        return this.simulate(input.action, {
          type: 'pipeline_stopped',
          reason: 'Policy or strategy determined further action would be counterproductive',
          transactionId: input.transactionId
        }, 'Agent pipeline cleanly stopped — no further automated actions', start);

      default:
        return {
          success: false,
          action: input.action,
          outcome: 'Unknown action — skipped',
          simulatedPayload: {},
          executedAt,
          durationMs: Date.now() - start
        };
    }
  }

  private simulate(
    action: RecoveryAction,
    payload: Record<string, any>,
    outcome: string,
    startMs: number
  ): ExecutionResult {
    // Simulate realistic latency (50–200ms)
    const simulatedDelay = 50 + Math.floor(Math.random() * 150);
    return {
      success: true,
      action,
      outcome,
      simulatedPayload: payload,
      executedAt: new Date(),
      durationMs: simulatedDelay
    };
  }
}
