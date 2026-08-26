/**
 * RootCauseAgent — Classifies the root cause of a payment failure
 */
export type FailureCause =
  | 'temporary payment failure'
  | 'repeated failure'
  | 'checkout abandonment'
  | 'subscription failure'
  | 'overdue invoice'
  | 'high-value failure'
  | 'unknown';

export interface RootCauseResult {
  cause: FailureCause;
  confidence: number;     // 0–1
  description: string;
  recoverable: boolean;
  suggestedActions: string[];
}

export interface RootCauseInput {
  errorCode?: string;
  errorCategory?: string;
  errorDescription?: string;
  failureCount: number;
  isRecurringFailure: boolean;
  isHighValue: boolean;
  paymentMethod?: string;
  hoursSinceFailure: number;
  retryCount: number;
  isInvoice?: boolean;
}

export class RootCauseAgent {
  readonly name = 'RootCauseAgent';

  async run(input: RootCauseInput): Promise<RootCauseResult> {
    const desc = (input.errorDescription || '').toLowerCase();
    const code = (input.errorCode || '').toUpperCase();
    const cat  = (input.errorCategory || '').toLowerCase();

    // High-value failure
    if (input.isHighValue && input.failureCount <= 1) {
      return {
        cause: 'high-value failure',
        confidence: 0.85,
        description: 'High-value single payment failure — likely bank gateway limit or security authorization check.',
        recoverable: true,
        suggestedActions: ['PAYMENT_LINK', 'ESCALATE']
      };
    }

    // Repeated failure pattern
    if (input.isRecurringFailure || input.failureCount >= 3) {
      return {
        cause: 'repeated failure',
        confidence: 0.90,
        description: `${input.failureCount} consecutive payment failures on this account — account or card restricted.`,
        recoverable: input.failureCount < 5,
        suggestedActions: ['REMINDER', 'PAYMENT_LINK', 'STOP']
      };
    }

    // Overdue invoice
    if (input.isInvoice || desc.includes('invoice') || desc.includes('due') || code.includes('INVOICE')) {
      return {
        cause: 'overdue invoice',
        confidence: 0.88,
        description: 'Unpaid or overdue invoice — follow-up payment link required.',
        recoverable: true,
        suggestedActions: ['REMINDER', 'PAYMENT_LINK']
      };
    }

    // Subscription / recurring failure
    if (desc.includes('subscription') || desc.includes('mandate') || desc.includes('recurring') || (input.isRecurringFailure && input.retryCount > 0)) {
      return {
        cause: 'subscription failure',
        confidence: 0.84,
        description: 'Recurring subscription mandate failed to auto-debit.',
        recoverable: true,
        suggestedActions: ['REMINDER', 'PAYMENT_LINK', 'ESCALATE']
      };
    }

    // Checkout abandonment (created/abandoned without capture)
    if (input.hoursSinceFailure > 2 && input.failureCount === 0 && !cat) {
      return {
        cause: 'checkout abandonment',
        confidence: 0.75,
        description: 'Checkout session created but left uncompleted — cart abandonment.',
        recoverable: true,
        suggestedActions: ['REMINDER', 'PAYMENT_LINK']
      };
    }

    // Temporary payment failure (transient network, insufficient funds, or gateway issues)
    if (cat === 'card_issue' || cat === 'network' || cat === 'infrastructure' || cat === 'payment_failure' ||
        desc.includes('insufficient') || desc.includes('funds') || desc.includes('temporary') || desc.includes('timeout') || desc.includes('expired')) {
      return {
        cause: 'temporary payment failure',
        confidence: 0.80,
        description: 'Temporary or transient payment failure — likely network/gateway timeout, temporary balance issue, or card check.',
        recoverable: true,
        suggestedActions: ['RETRY', 'PAYMENT_LINK', 'REMINDER']
      };
    }

    return {
      cause: 'unknown',
      confidence: 0.50,
      description: 'Unable to classify root cause with high confidence. Manual review recommended.',
      recoverable: true,
      suggestedActions: ['ESCALATE', 'REMINDER']
    };
  }
}

