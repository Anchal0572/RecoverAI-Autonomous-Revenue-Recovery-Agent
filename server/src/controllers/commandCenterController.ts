/**
 * Command Center Controller — AI Operations Center
 * Aggregates all operational data into a single view.
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AgentRun } from '../models/AgentRun';
import { RecoveryCase } from '../models/RecoveryCase';
import { Transaction } from '../models/Transaction';
import { AuditEvent } from '../models/AuditEvent';
import { LeakageDetectionService } from '../services/LeakageDetectionService';
import { Types } from 'mongoose';

const leakageService = new LeakageDetectionService();

/**
 * GET /api/v1/command-center
 */
export async function getCommandCenterData(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const merchantId = new Types.ObjectId(req.user.merchantId);

    // Run all queries in parallel
    const [
      recentRuns,
      activeCases,
      recoveredCases,
      policyBlockedCases,
      pendingApprovals,
      recoveredAmount,
      failedAmount,
      recentAudit,
      alerts
    ] = await Promise.all([
      // Recent agent runs
      AgentRun.find({ merchantId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('transactionId outcome selectedStrategy explanation totalDurationMs policyApproved requiresHumanApproval createdAt'),

      // Active cases
      RecoveryCase.countDocuments({ merchantId, status: { $in: ['PENDING', 'IN_PROGRESS', 'REQUIRES_APPROVAL'] } }),

      // Recovered cases
      RecoveryCase.countDocuments({ merchantId, status: 'RECOVERED' }),

      // Policy blocked
      RecoveryCase.countDocuments({ merchantId, status: 'POLICY_BLOCKED' }),

      // Pending approvals
      RecoveryCase.countDocuments({ merchantId, humanApprovalStatus: 'PENDING' }),

      // Recovered revenue
      Transaction.aggregate([
        { $match: { merchantId, recoveryStatus: 'RECOVERED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Failed revenue (at risk)
      Transaction.aggregate([
        { $match: { merchantId, status: 'failed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Recent audit events
      AuditEvent.find({ merchantId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('actionType details transactionId agentId createdAt'),

      // Leakage alerts
      leakageService.detectLeakages(req.user.merchantId)
    ]);

    // Agent status summary
    const agentNames = [
      'DetectionAgent', 'RootCauseAgent', 'MLPredictionService',
      'StrategyAgent', 'PolicyAgent', 'ExecutionAgent', 'MonitoringAgent', 'EvaluationAgent'
    ];

    const allRuns = await AgentRun.find({ merchantId }).sort({ createdAt: -1 }).limit(100);

    const agents = agentNames.map(name => {
      let totalTasks = 0;
      let successTasks = 0;
      let latestActivity: Date | null = null;

      for (const run of allRuns) {
        const step = run.steps.find(s => s.agent === name);
        if (step) {
          totalTasks++;
          if (step.status === 'SUCCESS') successTasks++;
          if (!latestActivity || step.runAt > latestActivity) latestActivity = step.runAt;
        }
      }

      return {
        name,
        status: totalTasks > 0 ? 'ONLINE' : 'IDLE',
        tasksProcessed: totalTasks,
        successRate: totalTasks > 0 ? Math.round((successTasks / totalTasks) * 10000) / 100 : 0,
        latestActivity: latestActivity?.toISOString() || null
      };
    });

    // Case status breakdown
    const statusBreakdown = await RecoveryCase.aggregate([
      { $match: { merchantId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return res.json({
      agents,
      cases: {
        active: activeCases,
        recovered: recoveredCases,
        policyBlocked: policyBlockedCases,
        pendingApprovals,
        statusBreakdown: statusBreakdown.map(s => ({ status: s._id, count: s.count }))
      },
      revenue: {
        recovered: recoveredAmount[0]?.total || 0,
        atRisk: failedAmount[0]?.total || 0,
        currency: 'INR'
      },
      recentDecisions: recentRuns.map(r => ({
        transactionId: r.transactionId,
        outcome: r.outcome,
        strategy: r.selectedStrategy,
        explanation: r.explanation,
        durationMs: r.totalDurationMs,
        policyApproved: r.policyApproved,
        requiresHumanApproval: r.requiresHumanApproval,
        timestamp: (r as any).createdAt
      })),
      alerts: {
        items: alerts,
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'CRITICAL').length,
        high: alerts.filter(a => a.severity === 'HIGH').length
      },
      recentAudit: recentAudit.map(a => ({
        actionType: a.actionType,
        details: a.details,
        transactionId: a.transactionId,
        agentId: a.agentId,
        timestamp: (a as any).createdAt
      })),
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching command center data:', error);
    return res.status(500).json({ error: 'Failed to load command center.' });
  }
}
