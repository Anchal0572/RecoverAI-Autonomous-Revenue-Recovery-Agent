/**
 * Simulator Controller — What-If Simulation Engine
 * Pure calculation — no side effects on live data.
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Transaction } from '../models/Transaction';
import { Types } from 'mongoose';

/**
 * POST /api/v1/simulator/what-if
 * Run a what-if simulation with adjusted parameters
 */
export async function runWhatIfSimulation(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const merchantId = new Types.ObjectId(req.user.merchantId);

    const {
      recoveryProbability = 0.65,
      retrySuccessRate = 0.5,
      recoveryWindowDays = 7,
      retryLimit = 3,
      strategy = 'RETRY'
    } = req.body;

    // Validate inputs
    if (recoveryProbability < 0 || recoveryProbability > 1) {
      return res.status(400).json({ error: 'recoveryProbability must be between 0 and 1.' });
    }
    if (retrySuccessRate < 0 || retrySuccessRate > 1) {
      return res.status(400).json({ error: 'retrySuccessRate must be between 0 and 1.' });
    }
    if (recoveryWindowDays < 1 || recoveryWindowDays > 30) {
      return res.status(400).json({ error: 'recoveryWindowDays must be between 1 and 30.' });
    }
    if (retryLimit < 1 || retryLimit > 10) {
      return res.status(400).json({ error: 'retryLimit must be between 1 and 10.' });
    }

    // Get current failed transactions
    const failedTxs = await Transaction.find({ merchantId, status: 'failed' });
    const totalFailedAmount = failedTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalFailedCount = failedTxs.length;

    if (totalFailedCount === 0) {
      return res.json({
        scenario: { recoveryProbability, retrySuccessRate, recoveryWindowDays, retryLimit, strategy },
        results: {
          expectedRecovery: 0,
          expectedRecoveryRate: 0,
          estimatedCasesRecovered: 0,
          roi: 0,
          revenueAtRisk: 0,
          totalFailedTransactions: 0,
          totalFailedAmount: 0
        }
      });
    }

    // Strategy multipliers (different strategies have different effectiveness patterns)
    const strategyMultipliers: Record<string, number> = {
      'RETRY': 1.0,
      'PAYMENT_LINK': 0.85,
      'REMINDER': 0.6,
      'ESCALATE': 0.75,
      'WAIT': 0.4,
      'PLAN_DOWNGRADE': 0.5
    };
    const strategyMult = strategyMultipliers[strategy] || 0.5;

    // Simulate cumulative recovery probability across retries
    // P(recovered) = 1 - (1 - retrySuccessRate)^retryLimit
    const cumulativeRetryProb = 1 - Math.pow(1 - retrySuccessRate, retryLimit);

    // Window factor: shorter windows reduce effectiveness
    const windowFactor = Math.min(1, recoveryWindowDays / 7);

    // Combined recovery rate
    const effectiveRecoveryRate = Math.min(0.95, recoveryProbability * cumulativeRetryProb * strategyMult * windowFactor);

    // Calculate expected recovery amounts
    const expectedRecovery = Math.round(totalFailedAmount * effectiveRecoveryRate);
    const estimatedCasesRecovered = Math.round(totalFailedCount * effectiveRecoveryRate);

    // ROI calculation: (recovered - cost) / cost
    // Assume cost = ₹50 per recovery attempt * retry limit * cases
    const estimatedCost = 50 * retryLimit * totalFailedCount;
    const roi = estimatedCost > 0 ? Math.round(((expectedRecovery - estimatedCost) / estimatedCost) * 100) : 0;

    return res.json({
      scenario: { recoveryProbability, retrySuccessRate, recoveryWindowDays, retryLimit, strategy },
      results: {
        expectedRecovery,
        expectedRecoveryRate: Math.round(effectiveRecoveryRate * 10000) / 100,
        estimatedCasesRecovered,
        roi,
        revenueAtRisk: totalFailedAmount,
        totalFailedTransactions: totalFailedCount,
        totalFailedAmount,
        cumulativeRetryProbability: Math.round(cumulativeRetryProb * 10000) / 100,
        strategyEffectiveness: Math.round(strategyMult * 100),
        windowFactor: Math.round(windowFactor * 100)
      }
    });
  } catch (error: any) {
    console.error('Error running what-if simulation:', error);
    return res.status(500).json({ error: 'What-if simulation failed.' });
  }
}
