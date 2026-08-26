import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { MerchantPolicy } from '../models/MerchantPolicy';
import { AuditEvent } from '../models/AuditEvent';
import { Types } from 'mongoose';

export async function getPolicy(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);
    let policy = await MerchantPolicy.findOne({ merchantId });
    
    if (!policy) {
      policy = new MerchantPolicy({ merchantId });
      await policy.save();
    }
    
    return res.json(policy);
  } catch (error) {
    console.error('Error fetching merchant policy:', error);
    return res.status(500).json({ error: 'Internal server error fetching policies.' });
  }
}

export async function updatePolicy(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);

    const policy = await MerchantPolicy.findOneAndUpdate(
      { merchantId },
      { $set: req.body },
      { new: true, upsert: true }
    );

    const audit = new AuditEvent({
      merchantId,
      actionType: 'POLICY_UPDATED',
      details: `Guardrail policies were updated by user ${req.user.email} (Role: ${req.user.role}).`,
      agentId: 'SYSTEM',
      timestamp: new Date()
    });
    await audit.save();

    return res.json(policy);
  } catch (error) {
    console.error('Error updating merchant policy:', error);
    return res.status(500).json({ error: 'Internal server error updating policies.' });
  }
}
