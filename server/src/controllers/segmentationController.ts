/**
 * Segmentation Controller — Customer Segmentation for Recovery
 * Segments: High Value, Likely to Recover, At Risk, Low Probability, Needs Human Review
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Customer } from '../models/Customer';
import { Transaction } from '../models/Transaction';
import { RecoveryCase } from '../models/RecoveryCase';
import { MerchantPolicy } from '../models/MerchantPolicy';
import { Types } from 'mongoose';

interface CustomerSegmentResult {
  segment: string;
  description: string;
  color: string;
  icon: string;
  customerCount: number;
  totalRevenue: number;
  avgRecoveryScore: number;
  customers: {
    customerId: string;
    name: string;
    email: string;
    ltv: number;
    failedTransactions: number;
    recoveredTransactions: number;
    totalAtRisk: number;
  }[];
}

/**
 * GET /api/v1/analytics/segments
 */
export async function getCustomerSegments(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const merchantId = new Types.ObjectId(req.user.merchantId);

    const policy = await MerchantPolicy.findOne({ merchantId });
    const highValueThreshold = policy?.highValueThreshold || 50000;

    const customers = await Customer.find({ merchantId });

    const segments: Record<string, CustomerSegmentResult> = {
      HIGH_VALUE: {
        segment: 'High Value',
        description: 'High-LTV customers requiring priority recovery attention',
        color: '#8b5cf6',
        icon: 'Crown',
        customerCount: 0,
        totalRevenue: 0,
        avgRecoveryScore: 0,
        customers: []
      },
      LIKELY_TO_RECOVER: {
        segment: 'Likely to Recover',
        description: 'Customers with high recovery probability based on history',
        color: '#10b981',
        icon: 'TrendingUp',
        customerCount: 0,
        totalRevenue: 0,
        avgRecoveryScore: 0,
        customers: []
      },
      AT_RISK: {
        segment: 'At Risk',
        description: 'Customers with multiple recent failures and declining metrics',
        color: '#f59e0b',
        icon: 'AlertTriangle',
        customerCount: 0,
        totalRevenue: 0,
        avgRecoveryScore: 0,
        customers: []
      },
      LOW_PROBABILITY: {
        segment: 'Low Probability',
        description: 'Customers with low recovery probability',
        color: '#ef4444',
        icon: 'TrendingDown',
        customerCount: 0,
        totalRevenue: 0,
        avgRecoveryScore: 0,
        customers: []
      },
      NEEDS_HUMAN_REVIEW: {
        segment: 'Needs Human Review',
        description: 'Customers requiring manual assessment due to conflicting signals',
        color: '#3b82f6',
        icon: 'UserCheck',
        customerCount: 0,
        totalRevenue: 0,
        avgRecoveryScore: 0,
        customers: []
      }
    };

    let totalScores: Record<string, { sum: number; count: number }> = {
      HIGH_VALUE: { sum: 0, count: 0 },
      LIKELY_TO_RECOVER: { sum: 0, count: 0 },
      AT_RISK: { sum: 0, count: 0 },
      LOW_PROBABILITY: { sum: 0, count: 0 },
      NEEDS_HUMAN_REVIEW: { sum: 0, count: 0 }
    };

    for (const customer of customers) {
      const failedTxs = await Transaction.find({
        merchantId,
        customerId: customer._id,
        status: 'failed'
      });

      const recoveredTxs = await Transaction.find({
        merchantId,
        customerId: customer._id,
        recoveryStatus: 'RECOVERED'
      });

      const pendingCases = await RecoveryCase.find({
        merchantId,
        customerId: customer._id,
        status: { $in: ['REQUIRES_APPROVAL', 'PENDING'] }
      });

      const failedCount = failedTxs.length;
      const recoveredCount = recoveredTxs.length;
      const totalAtRisk = failedTxs.reduce((sum, t) => sum + t.amount, 0);
      const avgScore = failedTxs.length > 0
        ? failedTxs.reduce((sum, t) => sum + (t.recoveryScore || 50), 0) / failedTxs.length
        : 50;
      const avgProb = failedTxs.length > 0
        ? failedTxs.reduce((sum, t) => sum + (t.recoveryProbability || 0.5), 0) / failedTxs.length
        : 0.5;

      const customerData = {
        customerId: customer.customerIdStr,
        name: customer.name,
        email: customer.email,
        ltv: customer.ltv,
        failedTransactions: failedCount,
        recoveredTransactions: recoveredCount,
        totalAtRisk: Math.round(totalAtRisk)
      };

      // Segmentation logic
      let segmentKey: string;

      if (pendingCases.length > 0) {
        segmentKey = 'NEEDS_HUMAN_REVIEW';
      } else if (customer.ltv >= highValueThreshold) {
        segmentKey = 'HIGH_VALUE';
      } else if (avgProb >= 0.7) {
        segmentKey = 'LIKELY_TO_RECOVER';
      } else if (avgProb < 0.3) {
        segmentKey = 'LOW_PROBABILITY';
      } else if (failedCount >= 3 && avgScore >= 60) {
        segmentKey = 'AT_RISK';
      } else if (failedCount >= 2 && avgProb < 0.5) {
        segmentKey = 'AT_RISK';
      } else {
        segmentKey = 'LIKELY_TO_RECOVER';
      }

      segments[segmentKey].customerCount++;
      segments[segmentKey].totalRevenue += totalAtRisk;
      segments[segmentKey].customers.push(customerData);
      totalScores[segmentKey].sum += avgScore;
      totalScores[segmentKey].count++;
    }

    // Calculate average scores
    for (const key of Object.keys(segments)) {
      if (totalScores[key].count > 0) {
        segments[key].avgRecoveryScore = Math.round(totalScores[key].sum / totalScores[key].count);
      }
      segments[key].totalRevenue = Math.round(segments[key].totalRevenue);
    }

    return res.json({
      segments: Object.values(segments),
      totalCustomers: customers.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating customer segments:', error);
    return res.status(500).json({ error: 'Customer segmentation failed.' });
  }
}
