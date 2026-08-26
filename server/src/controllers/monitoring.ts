import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Transaction } from '../models/Transaction';
import { Types } from 'mongoose';

export async function getMonitoringStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);

    const activeRecoveries = await Transaction.countDocuments({ merchantId, recoveryStatus: 'IN_PROGRESS' });
    
    const failedTxCount = await Transaction.countDocuments({ merchantId, status: 'failed' });
    const recoveredTxCount = await Transaction.countDocuments({ merchantId, recoveryStatus: 'RECOVERED' });
    const successRate = failedTxCount > 0 ? Math.round((recoveredTxCount / failedTxCount) * 100) : 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayRecoveredResult = await Transaction.aggregate([
      { $match: { merchantId, recoveryStatus: 'RECOVERED', recoveredAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const revenueRecoveredToday = todayRecoveredResult[0]?.total || 0;

    return res.json({
      agentStatus: 'ONLINE',
      monitoringVersion: 'v2.0 • Monitoring',
      activeRecoveries,
      metrics: {
        successRate,
        revenueRecoveredToday
      },
      lastHeartbeat: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching monitoring status:', error);
    return res.status(500).json({ error: 'Internal server error fetching telemetry.' });
  }
}
