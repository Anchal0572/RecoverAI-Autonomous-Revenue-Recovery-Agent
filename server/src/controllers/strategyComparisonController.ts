/**
 * Strategy Comparison Controller — Compare recovery strategy performance
 * Does not claim statistical significance without valid data.
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AgentRun } from '../models/AgentRun';
import { Types } from 'mongoose';

/**
 * POST /api/v1/simulator/compare-strategies
 * Compare 2-3 strategies by actual historical performance
 */
export async function compareStrategies(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const merchantId = new Types.ObjectId(req.user.merchantId);

    const { strategies = ['RETRY', 'PAYMENT_LINK', 'ESCALATE'] } = req.body;

    if (!Array.isArray(strategies) || strategies.length < 2 || strategies.length > 5) {
      return res.status(400).json({ error: 'Provide between 2 and 5 strategies to compare.' });
    }

    const results = [];

    for (const strategy of strategies) {
      const runs = await AgentRun.find({
        merchantId,
        selectedStrategy: strategy
      }).sort({ createdAt: -1 }).limit(500);

      const totalRuns = runs.length;
      const recoveredRuns = runs.filter(r => r.outcome === 'RECOVERED');
      const recoveredCount = recoveredRuns.length;

      // Calculate revenue recovered from step outputs
      let revenueRecovered = 0;
      for (const run of recoveredRuns) {
        const execStep = run.steps.find(s => s.agent === 'ExecutionAgent' && s.status === 'SUCCESS');
        revenueRecovered += execStep?.output?.amount || run.steps.find(s => s.agent === 'DetectionAgent')?.input?.amount || 0;
      }

      const totalInterventions = runs.filter(r =>
        r.requiresHumanApproval || r.outcome === 'ESCALATED'
      ).length;

      const avgRecoveryTime = totalRuns > 0
        ? Math.round(runs.reduce((sum, r) => sum + r.totalDurationMs, 0) / totalRuns)
        : 0;

      const recoveryRate = totalRuns > 0
        ? Math.round((recoveredCount / totalRuns) * 10000) / 100
        : 0;

      results.push({
        strategy,
        recoveryRate,
        revenueRecovered: Math.round(revenueRecovered),
        totalRuns,
        recoveredCount,
        interventions: totalInterventions,
        averageRecoveryTimeMs: avgRecoveryTime,
        sampleSize: totalRuns
      });
    }

    // Disclaimer: don't claim statistical significance without sufficient data
    const minSampleSize = Math.min(...results.map(r => r.sampleSize));
    let disclaimer: string | null = null;
    if (minSampleSize < 30) {
      disclaimer = `Comparison is based on limited data (minimum sample size: ${minSampleSize}). Results are indicative only and should not be treated as statistically significant. A minimum of 30 observations per strategy is recommended for reliable comparisons.`;
    }

    return res.json({
      comparison: results,
      disclaimer,
      totalStrategiesCompared: strategies.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error comparing strategies:', error);
    return res.status(500).json({ error: 'Strategy comparison failed.' });
  }
}
