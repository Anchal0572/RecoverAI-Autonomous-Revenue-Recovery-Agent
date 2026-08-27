/**
 * LeakageDetectionService — Phase 7 Revenue Leakage Detection
 * Detects: payment success drops, failure spikes, abandonment spikes,
 * recovery deterioration, and high-value failure clusters.
 *
 * Pure analytics — does NOT modify any existing data or pipeline.
 */
import { Types } from 'mongoose';
import { Transaction } from '../models/Transaction';
import { RecoveryCase } from '../models/RecoveryCase';

export interface LeakageAlert {
  id: string;
  type: 'SUCCESS_DROP' | 'FAILURE_SPIKE' | 'ABANDONMENT_SPIKE' | 'RECOVERY_DETERIORATION' | 'HIGH_VALUE_CLUSTER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  metric: { current: number; baseline: number; unit: string };
  detectedAt: string;
  affectedTransactions?: number;
  estimatedRevenueLoss?: number;
}

export class LeakageDetectionService {
  /**
   * Run all 5 leakage detection algorithms
   */
  async detectLeakages(merchantIdStr: string): Promise<LeakageAlert[]> {
    const merchantId = new Types.ObjectId(merchantIdStr);
    const alerts: LeakageAlert[] = [];

    const [successDrop, failureSpike, abandonmentSpike, recoveryDeterioration, highValueCluster] =
      await Promise.all([
        this.detectSuccessRateDrop(merchantId),
        this.detectFailureSpike(merchantId),
        this.detectAbandonmentSpike(merchantId),
        this.detectRecoveryDeterioration(merchantId),
        this.detectHighValueFailureCluster(merchantId)
      ]);

    if (successDrop) alerts.push(successDrop);
    if (failureSpike) alerts.push(failureSpike);
    if (abandonmentSpike) alerts.push(abandonmentSpike);
    if (recoveryDeterioration) alerts.push(recoveryDeterioration);
    if (highValueCluster) alerts.push(highValueCluster);

    return alerts.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Detection 1: Sudden payment success rate drop
   * Compares last 24h success rate vs 7-day average
   */
  private async detectSuccessRateDrop(merchantId: Types.ObjectId): Promise<LeakageAlert | null> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 7-day baseline
    const baseline7d = await Transaction.aggregate([
      { $match: { merchantId, createdAt: { $gte: last7d } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          captured: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, 1, 0] } }
        }
      }
    ]);

    // Last 24h
    const recent24h = await Transaction.aggregate([
      { $match: { merchantId, createdAt: { $gte: last24h } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          captured: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, 1, 0] } }
        }
      }
    ]);

    const baselineRate = baseline7d[0]?.total > 0 ? (baseline7d[0].captured / baseline7d[0].total) * 100 : 0;
    const recentRate = recent24h[0]?.total > 0 ? (recent24h[0].captured / recent24h[0].total) * 100 : 0;
    const dropPercent = baselineRate - recentRate;

    if (baselineRate > 0 && dropPercent > 15) {
      return {
        id: `leak_success_drop_${Date.now()}`,
        type: 'SUCCESS_DROP',
        severity: dropPercent > 30 ? 'CRITICAL' : dropPercent > 20 ? 'HIGH' : 'MEDIUM',
        title: 'Payment Success Rate Drop Detected',
        description: `Success rate dropped from ${baselineRate.toFixed(1)}% (7-day avg) to ${recentRate.toFixed(1)}% in the last 24 hours — a ${dropPercent.toFixed(1)}% decline.`,
        metric: { current: Math.round(recentRate * 100) / 100, baseline: Math.round(baselineRate * 100) / 100, unit: '%' },
        detectedAt: now.toISOString(),
        affectedTransactions: recent24h[0]?.total || 0
      };
    }

    return null;
  }

  /**
   * Detection 2: Failure spike
   * Compares last 6h failure count vs daily average
   */
  private async detectFailureSpike(merchantId: Types.ObjectId): Promise<LeakageAlert | null> {
    const now = new Date();
    const last6h = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentFailures = await Transaction.countDocuments({
      merchantId, status: 'failed', createdAt: { $gte: last6h }
    });

    const totalFailures7d = await Transaction.countDocuments({
      merchantId, status: 'failed', createdAt: { $gte: last7d }
    });

    // Average 6h period in 7 days = 28 periods
    const avgFailuresPer6h = totalFailures7d / 28;

    if (avgFailuresPer6h > 0 && recentFailures > avgFailuresPer6h * 2) {
      const failedAmount = await Transaction.aggregate([
        { $match: { merchantId, status: 'failed', createdAt: { $gte: last6h } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      return {
        id: `leak_failure_spike_${Date.now()}`,
        type: 'FAILURE_SPIKE',
        severity: recentFailures > avgFailuresPer6h * 4 ? 'CRITICAL' : recentFailures > avgFailuresPer6h * 3 ? 'HIGH' : 'MEDIUM',
        title: 'Payment Failure Spike Detected',
        description: `${recentFailures} failures in the last 6 hours — ${(recentFailures / avgFailuresPer6h).toFixed(1)}x the normal rate (avg ${avgFailuresPer6h.toFixed(1)} per 6h period).`,
        metric: { current: recentFailures, baseline: Math.round(avgFailuresPer6h * 100) / 100, unit: 'failures/6h' },
        detectedAt: now.toISOString(),
        affectedTransactions: recentFailures,
        estimatedRevenueLoss: failedAmount[0]?.total || 0
      };
    }

    return null;
  }

  /**
   * Detection 3: Abandonment spike
   * Checks ABANDONED recovery cases in last 24h vs 7-day average
   */
  private async detectAbandonmentSpike(merchantId: Types.ObjectId): Promise<LeakageAlert | null> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentAbandoned = await RecoveryCase.countDocuments({
      merchantId, status: 'ABANDONED', updatedAt: { $gte: last24h }
    });

    const totalAbandoned7d = await RecoveryCase.countDocuments({
      merchantId, status: 'ABANDONED', updatedAt: { $gte: last7d }
    });

    const avgAbandoned = totalAbandoned7d / 7;

    if (avgAbandoned > 0 && recentAbandoned > avgAbandoned * 2) {
      return {
        id: `leak_abandonment_spike_${Date.now()}`,
        type: 'ABANDONMENT_SPIKE',
        severity: recentAbandoned > avgAbandoned * 3 ? 'HIGH' : 'MEDIUM',
        title: 'Recovery Abandonment Spike',
        description: `${recentAbandoned} cases abandoned in the last 24 hours — ${(recentAbandoned / avgAbandoned).toFixed(1)}x the daily average (${avgAbandoned.toFixed(1)}/day).`,
        metric: { current: recentAbandoned, baseline: Math.round(avgAbandoned * 100) / 100, unit: 'cases/day' },
        detectedAt: now.toISOString(),
        affectedTransactions: recentAbandoned
      };
    }

    return null;
  }

  /**
   * Detection 4: Recovery rate deterioration
   * Compares last 24h recovery rate vs 7-day average
   */
  private async detectRecoveryDeterioration(merchantId: Types.ObjectId): Promise<LeakageAlert | null> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 7-day recovery rate
    const baseline = await RecoveryCase.aggregate([
      { $match: { merchantId, createdAt: { $gte: last7d } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          recovered: { $sum: { $cond: [{ $eq: ['$status', 'RECOVERED'] }, 1, 0] } }
        }
      }
    ]);

    // Last 24h recovery rate
    const recent = await RecoveryCase.aggregate([
      { $match: { merchantId, createdAt: { $gte: last24h } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          recovered: { $sum: { $cond: [{ $eq: ['$status', 'RECOVERED'] }, 1, 0] } }
        }
      }
    ]);

    const baselineRate = baseline[0]?.total > 0 ? (baseline[0].recovered / baseline[0].total) * 100 : 0;
    const recentRate = recent[0]?.total > 0 ? (recent[0].recovered / recent[0].total) * 100 : 0;
    const drop = baselineRate - recentRate;

    if (baselineRate > 0 && drop > 10) {
      return {
        id: `leak_recovery_deterioration_${Date.now()}`,
        type: 'RECOVERY_DETERIORATION',
        severity: drop > 25 ? 'HIGH' : 'MEDIUM',
        title: 'Recovery Rate Deterioration',
        description: `Recovery rate dropped from ${baselineRate.toFixed(1)}% (7-day avg) to ${recentRate.toFixed(1)}% in the last 24 hours.`,
        metric: { current: Math.round(recentRate * 100) / 100, baseline: Math.round(baselineRate * 100) / 100, unit: '%' },
        detectedAt: now.toISOString()
      };
    }

    return null;
  }

  /**
   * Detection 5: High-value failure cluster
   * Groups failed transactions above highValueThreshold in last 24h
   */
  private async detectHighValueFailureCluster(merchantId: Types.ObjectId): Promise<LeakageAlert | null> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const HIGH_VALUE_THRESHOLD = 50000; // Default, could come from MerchantPolicy

    const cluster = await Transaction.aggregate([
      {
        $match: {
          merchantId,
          status: 'failed',
          amount: { $gte: HIGH_VALUE_THRESHOLD },
          createdAt: { $gte: last24h }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const count = cluster[0]?.count || 0;
    if (count >= 3) {
      return {
        id: `leak_hv_cluster_${Date.now()}`,
        type: 'HIGH_VALUE_CLUSTER',
        severity: count >= 8 ? 'CRITICAL' : count >= 5 ? 'HIGH' : 'MEDIUM',
        title: 'High-Value Failure Cluster Detected',
        description: `${count} high-value transactions (≥₹${HIGH_VALUE_THRESHOLD.toLocaleString('en-IN')}) failed in the last 24 hours, totaling ₹${Math.round(cluster[0].totalAmount).toLocaleString('en-IN')}.`,
        metric: { current: count, baseline: 0, unit: 'transactions' },
        detectedAt: now.toISOString(),
        affectedTransactions: count,
        estimatedRevenueLoss: Math.round(cluster[0].totalAmount)
      };
    }

    return null;
  }
}
