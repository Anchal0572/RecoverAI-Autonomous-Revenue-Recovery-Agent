import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AuditEvent } from '../models/AuditEvent';
import { Types } from 'mongoose';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);
    const { limit = 100, offset = 0, startDate, endDate, actionType } = req.query;

    const query: any = { merchantId };

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    // Action type filter
    if (actionType && actionType !== 'ALL') {
      query.actionType = actionType;
    }

    const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 200);
    const safeOffset = Math.max(0, Number(offset) || 0);

    const total = await AuditEvent.countDocuments(query);
    const logs = await AuditEvent.find(query)
      .sort({ timestamp: -1 })
      .skip(safeOffset)
      .limit(safeLimit);

    const formatted = logs.map(l => ({
      id: l._id.toString(),
      transactionId: l.transactionId,
      actionType: l.actionType,
      details: l.details,
      agentId: l.agentId,
      timestamp: l.timestamp.toISOString()
    }));

    return res.json({
      total,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ error: 'Internal server error fetching audit logs.' });
  }
}

