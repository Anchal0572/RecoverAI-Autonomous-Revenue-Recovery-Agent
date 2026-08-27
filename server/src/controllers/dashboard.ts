import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Transaction } from '../models/Transaction';
import { Types } from 'mongoose';

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);

    // Run parallel aggregation calculations
    const statsResult = await Transaction.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          capturedCount: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          recoveredCount: { $sum: { $cond: [{ $eq: ['$recoveryStatus', 'RECOVERED'] }, 1, 0] } },
          inProgressCount: { $sum: { $cond: [{ $eq: ['$recoveryStatus', 'IN_PROGRESS'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$recoveryStatus', 'PENDING'] }, 1, 0] } },
          
          totalAmount: { $sum: '$amount' },
          capturedAmount: { $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$amount', 0] } },
          failedAmount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, '$amount', 0] } },
          recoveredAmount: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'failed'] }, { $eq: ['$recoveryStatus', 'RECOVERED'] }] }, '$amount', 0] } },
          inProgressAmount: { $sum: { $cond: [{ $eq: ['$recoveryStatus', 'IN_PROGRESS'] }, '$amount', 0] } },
          
          avgRecoveryScore: { $avg: '$recoveryScore' }
        }
      }
    ]);

    const stats = statsResult[0] || {
      totalCount: 0, capturedCount: 0, failedCount: 0, recoveredCount: 0, inProgressCount: 0, pendingCount: 0,
      totalAmount: 0, capturedAmount: 0, failedAmount: 0, recoveredAmount: 0, inProgressAmount: 0,
      avgRecoveryScore: 0
    };

    // Calculate Expected Recovery: sum of (amount * recoveryScore / 100) for failures in PENDING/IN_PROGRESS
    const expectedRecoveryResult = await Transaction.aggregate([
      { $match: { merchantId, status: 'failed', recoveryStatus: { $in: ['PENDING', 'IN_PROGRESS'] } } },
      {
        $group: {
          _id: null,
          expected: { $sum: { $multiply: ['$amount', { $divide: ['$recoveryScore', 100] }] } }
        }
      }
    ]);
    const expectedRecovery = expectedRecoveryResult[0]?.expected || 0;

    // Error category distributions
    const errorCategories = await Transaction.aggregate([
      { $match: { merchantId, status: 'failed' } },
      { $group: { _id: '$errorCategory', value: { $sum: 1 } } },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);

    // Risk distribution
    const riskDistribution = {
      HIGH: await Transaction.countDocuments({ merchantId, status: 'failed', riskLevel: 'HIGH' }),
      MEDIUM: await Transaction.countDocuments({ merchantId, status: 'failed', riskLevel: 'MEDIUM' }),
      LOW: await Transaction.countDocuments({ merchantId, status: 'failed', riskLevel: 'LOW' }),
    };

    // Group transactions by date for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendsResult = await Transaction.aggregate([
      { $match: { merchantId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          recovered: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'failed'] }, { $eq: ['$recoveryStatus', 'RECOVERED'] }] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          amount: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'failed'] }, { $eq: ['$recoveryStatus', 'RECOVERED'] }] }, '$amount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const trend = trendsResult.map(t => {
      const dateParts = t._id.split('-');
      const date = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        recovered: t.recovered,
        failed: t.failed,
        amount: t.amount
      };
    });

    const recoveryRate = stats.failedAmount > 0 ? Math.round((stats.recoveredAmount / stats.failedAmount) * 100) : 0;
    const revenueAtRisk = Math.max(0, stats.failedAmount - stats.recoveredAmount);

    return res.json({
      counts: {
        total: stats.totalCount,
        captured: stats.capturedCount,
        failed: stats.failedCount,
        recovered: stats.recoveredCount,
        inProgress: stats.inProgressCount,
        pending: stats.pendingCount
      },
      amounts: {
        total: stats.totalAmount,
        captured: stats.capturedAmount,
        failed: stats.failedAmount,
        recovered: stats.recoveredAmount,
        inProgress: stats.inProgressAmount,
        recovery_rate: recoveryRate,
        revenue_at_risk: revenueAtRisk,
        expected_recovery: Math.round(expectedRecovery)
      },
      avgRecoveryScore: Math.round(stats.avgRecoveryScore || 0),
      riskDistribution,
      errorCategories,
      trend
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ error: 'Internal server error calculating metrics.' });
  }
}

export async function getDashboardTrends(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);

    // Group transactions by date for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendsResult = await Transaction.aggregate([
      { $match: { merchantId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          recovered: { $sum: { $cond: [{ $eq: ['$recoveryStatus', 'RECOVERED'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          amount: { $sum: { $cond: [{ $eq: ['$recoveryStatus', 'RECOVERED'] }, '$amount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format dates to "Month Day" style (e.g. "Aug 26")
    const trend = trendsResult.map(t => {
      const dateParts = t._id.split('-');
      const date = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        recovered: t.recovered,
        failed: t.failed,
        amount: t.amount
      };
    });

    return res.json(trend);
  } catch (error) {
    console.error('Error fetching dashboard trends:', error);
    return res.status(500).json({ error: 'Internal server error calculating trends.' });
  }
}
