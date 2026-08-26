/**
 * EvaluationAgent — Calculates merchant-level recovery metrics and ROI
 */

export interface EvaluationResult {
  totalRevenueLost: number;
  totalRecovered: number;
  recoveryRate: number;          // 0–1
  successfulActions: number;
  failedActions: number;
  totalRuns: number;
  avgRecoveryTimeHours: number;
  roi: number;                   // ratio
  topStrategies: { action: string; count: number; successRate: number }[];
  agentEfficiency: number;       // 0–100 score
}

export interface EvaluationInput {
  runs: {
    outcome: string;
    selectedStrategy: string;
    totalDurationMs: number;
    amount: number;
    recovered: boolean;
  }[];
}

export class EvaluationAgent {
  readonly name = 'EvaluationAgent';

  async run(input: EvaluationInput): Promise<EvaluationResult> {
    const runs = input.runs;
    if (runs.length === 0) {
      return this.empty();
    }

    const totalRuns = runs.length;
    const recoveredRuns = runs.filter(r => r.recovered || r.outcome === 'RECOVERED');
    const failedRuns = runs.filter(r => r.outcome === 'FAILED' || r.outcome === 'STOPPED');

    const totalRevenueLost = runs.reduce((s, r) => s + r.amount, 0);
    const totalRecovered = recoveredRuns.reduce((s, r) => s + r.amount, 0);
    const recoveryRate = totalRuns > 0 ? recoveredRuns.length / totalRuns : 0;

    const avgDurationMs = runs.reduce((s, r) => s + r.totalDurationMs, 0) / totalRuns;
    const avgRecoveryTimeHours = avgDurationMs / (1000 * 60 * 60);

    // ROI = (revenue recovered / estimated operational cost)
    // Assume ~₹50 per run as operational cost
    const operationalCost = totalRuns * 50;
    const roi = operationalCost > 0 ? totalRecovered / operationalCost : 0;

    // Strategy breakdown
    const stratMap = new Map<string, { total: number; success: number }>();
    for (const r of runs) {
      const key = r.selectedStrategy || 'UNKNOWN';
      const entry = stratMap.get(key) || { total: 0, success: 0 };
      entry.total++;
      if (r.recovered || r.outcome === 'RECOVERED') entry.success++;
      stratMap.set(key, entry);
    }

    const topStrategies = Array.from(stratMap.entries())
      .map(([action, d]) => ({
        action,
        count: d.total,
        successRate: d.total > 0 ? d.success / d.total : 0
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    // Agent efficiency score (0–100)
    const agentEfficiency = Math.min(100, Math.round(
      (recoveryRate * 40) +
      (Math.min(1, roi / 100) * 30) +
      (topStrategies.length > 0 ? topStrategies[0].successRate * 30 : 0)
    ));

    return {
      totalRevenueLost: Math.round(totalRevenueLost),
      totalRecovered: Math.round(totalRecovered),
      recoveryRate: Math.round(recoveryRate * 10000) / 10000,
      successfulActions: recoveredRuns.length,
      failedActions: failedRuns.length,
      totalRuns,
      avgRecoveryTimeHours: Math.round(avgRecoveryTimeHours * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      topStrategies,
      agentEfficiency
    };
  }

  private empty(): EvaluationResult {
    return {
      totalRevenueLost: 0,
      totalRecovered: 0,
      recoveryRate: 0,
      successfulActions: 0,
      failedActions: 0,
      totalRuns: 0,
      avgRecoveryTimeHours: 0,
      roi: 0,
      topStrategies: [],
      agentEfficiency: 0
    };
  }
}
