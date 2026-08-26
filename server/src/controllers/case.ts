import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { RecoveryCase } from '../models/RecoveryCase';
import { AgentDecision } from '../models/AgentDecision';
import { Transaction } from '../models/Transaction';
import { Types } from 'mongoose';

export async function getCases(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);
    
    const cases = await RecoveryCase.find({ merchantId })
      .populate({
        path: 'transactionId',
        populate: { path: 'customerId' }
      })
      .populate('customerId')
      .sort({ createdAt: -1 });

    const formatted = cases.map((c: any) => {
      const tx = c.transactionId || {};
      const cust = c.customerId || tx.customerId || {};
      return {
        id: tx.transactionIdStr || 'pay_unk',
        customer: {
          id: cust.customerIdStr || 'cust_unk',
          name: cust.name || 'Unknown Customer',
          email: cust.email || '',
          phone: cust.phone || '',
          ltv: cust.ltv || 0
        },
        amount: tx.amount || 0,
        recoveryScore: c.recoveryScore,
        riskLevel: c.riskLevel,
        recoveryStatus: c.status,
        errorDescription: tx.errorDescription || 'Payment gateway error',
        createdAt: c.createdAt.toISOString()
      };
    });

    return res.json({
      total: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching recovery cases:', error);
    return res.status(500).json({ error: 'Internal server error fetching recovery cases.' });
  }
}

export async function getCaseDetails(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);
    const txIdStr = req.params.id;

    const tx = await Transaction.findOne({ merchantId, transactionIdStr: txIdStr });
    const query = tx ? { transactionId: tx._id } : (Types.ObjectId.isValid(txIdStr) ? { _id: txIdStr } : null);

    if (!query) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const c = await RecoveryCase.findOne({ merchantId, ...query })
      .populate({ path: 'transactionId', populate: { path: 'customerId' } })
      .populate('customerId');

    if (!c) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const matchedTx = c.transactionId as any;
    const cust = c.customerId as any;

    return res.json({
      id: matchedTx.transactionIdStr,
      customer: {
        id: cust.customerIdStr,
        name: cust.name,
        email: cust.email,
        phone: cust.phone,
        ltv: cust.ltv
      },
      amount: matchedTx.amount,
      recoveryScore: c.recoveryScore,
      riskLevel: c.riskLevel,
      recoveryStatus: c.status,
      recommendedStrategies: c.recommendedStrategies,
      errorDescription: matchedTx.errorDescription,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error fetching case details:', error);
    return res.status(500).json({ error: 'Internal server error fetching case details.' });
  }
}

export async function getAgentAnalysis(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);
    const txIdStr = req.params.id;

    const tx = await Transaction.findOne({ merchantId, transactionIdStr: txIdStr });
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const decision = await AgentDecision.findOne({ merchantId, transactionId: tx._id })
      .populate('transactionId')
      .populate({ path: 'transactionId', populate: { path: 'customerId' } });

    if (!decision) {
      const mockDecision = new AgentDecision({
        merchantId,
        transactionId: tx._id,
        rootCauseAnalysis: {
          errorCode: tx.errorCode || 'UNKNOWN_ERROR',
          cause: tx.errorDescription || 'Gateway failure during auth',
          confidence: Math.floor(Math.random() * 20) + 75
        },
        recoveryProbability: {
          probability: tx.recoveryScore,
          classification: tx.riskLevel
        },
        prioritization: {
          score: tx.recoveryScore,
          rank: tx.riskLevel
        },
        recommendedStrategies: ['EMAIL_REMINDER', 'RETRY_PAYMENT']
      });
      await mockDecision.save();
      
      const populated = await mockDecision.populate({ path: 'transactionId', populate: { path: 'customerId' } });
      const cust = (populated.transactionId as any).customerId;
      return res.json({
        customer: { ltv: cust.ltv },
        pipeline: populated
      });
    }

    const cust = (decision.transactionId as any).customerId;
    return res.json({
      customer: { ltv: cust?.ltv || 0 },
      pipeline: decision
    });
  } catch (error) {
    console.error('Error fetching agent decision analysis:', error);
    return res.status(500).json({ error: 'Internal server error fetching decision details.' });
  }
}

// ── Phase 6 Human Manager Approval Controllers ──

export async function approveCaseController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { managerName = 'Finance Manager' } = req.body;
    const merchantIdStr = req.user.merchantId;

    const { RecoveryEngineService } = await import('../services/RecoveryEngineService');
    const engine = new RecoveryEngineService();

    const result = await engine.approveCase(id, merchantIdStr, managerName);
    return res.json({
      message: 'Case successfully approved by manager. Workflow resumed.',
      result
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to approve case.' });
  }
}

export async function rejectCaseController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { managerName = 'Finance Manager', reason = 'Manager rejected action' } = req.body;
    const merchantIdStr = req.user.merchantId;

    const { RecoveryEngineService } = await import('../services/RecoveryEngineService');
    const engine = new RecoveryEngineService();

    const result = await engine.rejectCase(id, merchantIdStr, managerName, reason);
    return res.json({
      message: 'Case approval rejected by manager. Workflow stopped cleanly.',
      result
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to reject case.' });
  }
}

export async function getApprovalQueueController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const merchantId = new Types.ObjectId(req.user.merchantId);

    const pendingCases = await RecoveryCase.find({ merchantId, humanApprovalStatus: 'PENDING' })
      .populate({ path: 'transactionId', populate: { path: 'customerId' } })
      .populate('customerId')
      .sort({ createdAt: -1 });

    return res.json({
      total: pendingCases.length,
      cases: pendingCases
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch approval queue.' });
  }
}

