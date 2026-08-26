/**
 * DetectionAgent — Analyzes a failed transaction and scores revenue risk
 */
export interface DetectionResult {
  riskScore: number;       // 0–100
  revenueAtRisk: number;   // INR amount
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  factors: string[];
}

export interface DetectionInput {
  amount: number;
  currency: string;
  failureCount: number;
  successCount: number;
  hoursSinceFailure: number;
  isHighValue: boolean;
  isRecurringFailure: boolean;
  errorCategory?: string;
  paymentMethod?: string;
  ltv: number;
}

export class DetectionAgent {
  readonly name = 'DetectionAgent';

  async run(input: DetectionInput): Promise<DetectionResult> {
    const start = Date.now();

    let riskScore = 50;
    const factors: string[] = [];

    // Amount-based risk
    if (input.isHighValue) {
      riskScore += 20;
      factors.push(`High-value transaction ₹${input.amount.toLocaleString('en-IN')}`);
    }

    // Failure history
    if (input.isRecurringFailure) {
      riskScore += 15;
      factors.push('Recurring payment failure pattern detected');
    }
    if (input.failureCount > 3) {
      riskScore += 10;
      factors.push(`${input.failureCount} failures on this account`);
    }

    // Time sensitivity
    if (input.hoursSinceFailure < 1) {
      riskScore += 10;
      factors.push('Fresh failure — high recovery window');
    } else if (input.hoursSinceFailure > 72) {
      riskScore -= 15;
      factors.push('Stale failure — recovery window narrowing');
    }

    // Error category
    if (input.errorCategory === 'card_issue') {
      riskScore += 5;
      factors.push('Card-related error — often temporary');
    }
    if (input.errorCategory === 'bank_issue') {
      riskScore += 8;
      factors.push('Bank-side rejection detected');
    }

    // Customer value
    if (input.ltv > 100000) {
      riskScore += 10;
      factors.push(`High-LTV customer — ₹${(input.ltv / 1000).toFixed(0)}k lifetime value`);
    }

    riskScore = Math.min(100, Math.max(0, riskScore));

    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
      riskScore >= 80 ? 'CRITICAL' :
      riskScore >= 60 ? 'HIGH' :
      riskScore >= 40 ? 'MEDIUM' : 'LOW';

    // Revenue at risk is weighted by recovery probability drop over time
    const timeDecayFactor = Math.max(0.3, 1 - (input.hoursSinceFailure / 168));
    const revenueAtRisk = Math.round(input.amount * (riskScore / 100) * timeDecayFactor);

    const reason = `Risk score ${riskScore}/100 — ${factors[0] || 'Standard failed payment'}.`;

    return {
      riskScore,
      revenueAtRisk,
      riskLevel,
      reason,
      factors
    };
  }
}
