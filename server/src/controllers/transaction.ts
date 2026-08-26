import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Transaction } from '../models/Transaction';
import { Customer } from '../models/Customer';
import { AuditEvent } from '../models/AuditEvent';
import { Types } from 'mongoose';

export async function getTransactions(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);
    const { status, riskLevel, search, limit = 50, offset = 0 } = req.query;

    const query: any = { merchantId };

    if (status && status !== 'ALL') {
      if (['captured', 'failed', 'authorized', 'created'].includes(status as string)) {
        query.status = status;
      } else {
        query.recoveryStatus = status;
      }
    }

    if (riskLevel) {
      query.riskLevel = riskLevel;
    }

    let customerIds: Types.ObjectId[] = [];
    if (search) {
      const matchingCustomers = await Customer.find({
        merchantId,
        $or: [
          { name: { $regex: search as string, $options: 'i' } },
          { email: { $regex: search as string, $options: 'i' } }
        ]
      });
      customerIds = matchingCustomers.map(c => c._id as Types.ObjectId);
      
      query.$or = [
        { transactionIdStr: { $regex: search as string, $options: 'i' } },
        { customerId: { $in: customerIds } }
      ];
    }

    const total = await Transaction.countDocuments(query);
    const data = await Transaction.find(query)
      .populate('customerId')
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    // Map properties to match mock structure frontend expects
    const formattedData = data.map((t: any) => ({
      id: t.transactionIdStr,
      orderId: t.orderId,
      customer: t.customerId ? {
        id: t.customerId.customerIdStr,
        name: t.customerId.name,
        email: t.customerId.email,
        phone: t.customerId.phone,
        ltv: t.customerId.ltv
      } : {
        id: 'cust_unk',
        name: 'Unknown Customer',
        email: '',
        phone: '',
        ltv: 0
      },
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      errorCode: t.errorCode,
      errorDescription: t.errorDescription,
      errorCategory: t.errorCategory,
      severity: t.severity,
      paymentMethod: t.paymentMethod,
      bank: t.bank,
      retryCount: t.retryCount,
      recoveryScore: t.recoveryScore,
      riskLevel: t.riskLevel,
      recoveryStatus: t.recoveryStatus,
      isRecurringFailure: t.isRecurringFailure,
      isRepeatedFailure: t.isRepeatedFailure,
      isHighValue: t.isHighValue,
      recoveredAt: t.recoveredAt,
      expectedRecovery: t.expectedRecovery || (t.amount * (t.recoveryScore / 100)),
      recoveryProbability: t.recoveryProbability || (t.recoveryScore / 100),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString()
    }));

    return res.json({
      total,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ error: 'Internal server error fetching transactions.' });
  }
}

export async function getTransactionById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);
    const tx = await Transaction.findOne({ merchantId, transactionIdStr: req.params.id }).populate('customerId');

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    return res.json({
      id: tx.transactionIdStr,
      orderId: tx.orderId,
      customer: tx.customerId ? {
        id: (tx.customerId as any).customerIdStr,
        name: (tx.customerId as any).name,
        email: (tx.customerId as any).email,
        phone: (tx.customerId as any).phone,
        ltv: (tx.customerId as any).ltv
      } : {
        id: 'cust_unk',
        name: 'Unknown Customer',
        email: '',
        phone: '',
        ltv: 0
      },
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      errorCode: tx.errorCode,
      errorDescription: tx.errorDescription,
      errorCategory: tx.errorCategory,
      severity: tx.severity,
      paymentMethod: tx.paymentMethod,
      bank: tx.bank,
      retryCount: tx.retryCount,
      recoveryScore: tx.recoveryScore,
      riskLevel: tx.riskLevel,
      recoveryStatus: tx.recoveryStatus,
      isRecurringFailure: tx.isRecurringFailure,
      isRepeatedFailure: tx.isRepeatedFailure,
      isHighValue: tx.isHighValue,
      recoveredAt: tx.recoveredAt,
      expectedRecovery: tx.expectedRecovery || (tx.amount * (tx.recoveryScore / 100)),
      recoveryProbability: tx.recoveryProbability || (tx.recoveryScore / 100),
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error fetching transaction by id:', error);
    return res.status(500).json({ error: 'Internal server error fetching transaction details.' });
  }
}

export async function simulateWebhook(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);

    // Create a mock customer if pool is empty or choose existing
    let customer = await Customer.findOne({ merchantId });
    if (!customer) {
      customer = new Customer({
        merchantId,
        customerIdStr: 'cust_999',
        name: 'Simulated Customer',
        email: 'simulated@example.com',
        phone: '+91-9900990099',
        ltv: 25000
      });
      await customer.save();
    }

    const txIdStr = `pay_${Math.random().toString(36).substring(2, 16)}`;
    const orderId = `order_${Math.random().toString(36).substring(2, 16)}`;
    const amount = req.body.amount || Math.floor(Math.random() * 25000) + 1000;
    const paymentMethod = req.body.paymentMethod || 'card';
    const bank = req.body.bank || 'ICICI Bank';

    // Calculate customer history
    const successesCount = await Transaction.countDocuments({ customerId: customer._id, status: 'captured' });
    const failuresCount = await Transaction.countDocuments({ customerId: customer._id, status: 'failed' });
    const recoveredCount = await Transaction.countDocuments({ customerId: customer._id, recoveryStatus: 'RECOVERED' });
    const lastFailureTx = await Transaction.findOne({ customerId: customer._id, status: 'failed' }).sort({ createdAt: -1 });
    const hoursSinceLastFailure = lastFailureTx 
      ? (Date.now() - lastFailureTx.createdAt.getTime()) / (3600 * 1000)
      : 720.0;

    let recoveryProbability = 0.50;
    let riskScore = 50.0;
    let expectedRecovery = amount * 0.50;
    let recoveryPriority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

    try {
      console.log('🤖 Invoking Python ML Service (/predict)...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const mlRes = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: { amount, paymentMethod, bank },
          history: { ltv: customer.ltv || 0, failuresCount, successesCount, recoveredCount, hoursSinceLastFailure }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (mlRes.ok) {
        const mlData = (await mlRes.json()) as any;
        recoveryProbability = mlData.recovery_probability;
        riskScore = mlData.risk_score;
        expectedRecovery = mlData.expected_recovery;
        recoveryPriority = mlData.recovery_priority;
        console.log(`✅ ML Service prediction: probability=${recoveryProbability}, priority=${recoveryPriority}`);
      } else {
        throw new Error(`ML service returned status ${mlRes.status}`);
      }
    } catch (err: any) {
      console.warn('⚠️ ML Service offline or timed out. Falling back to rule-based risk calculations:', err.message || err);
      
      // Fallback heuristics
      recoveryProbability = amount >= 50000 ? 0.45 : 0.65;
      if (successesCount > 0) recoveryProbability += 0.15;
      if (failuresCount > 0) recoveryProbability -= 0.10;
      recoveryProbability = Math.max(0.20, Math.min(0.95, recoveryProbability));
      
      riskScore = (1.0 - recoveryProbability) * 100.0;
      expectedRecovery = amount * recoveryProbability;
      recoveryPriority = recoveryProbability >= 0.70 ? 'HIGH' : recoveryProbability >= 0.45 ? 'MEDIUM' : 'LOW';
    }

    // Simulate failed transaction
    const tx = new Transaction({
      merchantId,
      customerId: customer._id,
      transactionIdStr: txIdStr,
      orderId,
      amount,
      currency: 'INR',
      status: 'failed',
      errorCode: req.body.errorCode || 'BAD_REQUEST_ERROR',
      errorDescription: req.body.errorDescription || 'Card blocked by issuer bank',
      errorCategory: req.body.errorCategory || 'card_issue',
      severity: req.body.severity || 'HIGH',
      paymentMethod,
      bank,
      retryCount: 0,
      recoveryScore: Math.round(recoveryProbability * 100),
      riskLevel: recoveryPriority,
      recoveryStatus: 'PENDING',
      isRecurringFailure: failuresCount > 0,
      isRepeatedFailure: failuresCount > 1,
      isHighValue: amount >= 50000,
      recoveryProbability,
      expectedRecovery
    });
    await tx.save();

    // Log the risk detection audit event
    const audit = new AuditEvent({
      merchantId,
      transactionId: txIdStr,
      customerId: customer._id,
      actionType: 'RISK_DETECTED',
      details: `Failed transaction detected from customer ${customer.name}. Amount: ₹${amount.toLocaleString('en-IN')}. ML Prediction: Probability ${Math.round(recoveryProbability * 100)}%, Risk Score ${Math.round(riskScore)}%`,
      agentId: 'v2.0 • Monitoring',
      timestamp: new Date()
    });
    await audit.save();

    return res.status(201).json({
      id: tx.transactionIdStr,
      orderId: tx.orderId,
      amount: tx.amount,
      status: tx.status,
      recoveryStatus: tx.recoveryStatus,
      errorDescription: tx.errorDescription,
      recoveryProbability,
      expectedRecovery,
      riskScore
    });
  } catch (error) {
    console.error('Error simulating webhook transaction:', error);
    return res.status(500).json({ error: 'Internal server error simulating transaction.' });
  }
}

export async function manualRecovery(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);
    const tx = await Transaction.findOne({ merchantId, transactionIdStr: req.params.id }).populate('customerId');

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    tx.recoveryStatus = 'IN_PROGRESS';
    tx.updatedAt = new Date();
    await tx.save();

    // Log audit event for strategy execution
    const audit = new AuditEvent({
      merchantId,
      transactionId: tx.transactionIdStr,
      customerId: (tx.customerId as any)._id,
      actionType: 'ACTION_EXECUTED',
      details: `Initiated autonomous recovery actions (SMS OTP + Email reminder) for transaction ${tx.transactionIdStr}`,
      agentId: 'v2.0 • Monitoring',
      timestamp: new Date()
    });
    await audit.save();

    // Simulate recovery result after 3 seconds asynchronously
    setTimeout(async () => {
      try {
        const freshTx = await Transaction.findById(tx._id);
        if (freshTx && freshTx.recoveryStatus === 'IN_PROGRESS') {
          const recovered = Math.random() > 0.35;
          freshTx.recoveryStatus = recovered ? 'RECOVERED' : 'FAILED';
          freshTx.status = recovered ? 'captured' : 'failed';
          if (recovered) {
            freshTx.recoveredAt = new Date();
            await Customer.findByIdAndUpdate(freshTx.customerId, { $inc: { ltv: freshTx.amount } });
          }
          await freshTx.save();

          const resultAudit = new AuditEvent({
            merchantId,
            transactionId: freshTx.transactionIdStr,
            customerId: freshTx.customerId,
            actionType: recovered ? 'PAYMENT_RECOVERED' : 'ACTION_EXECUTED',
            details: recovered 
              ? `Recovered successfully! Customer payment captured for ₹${freshTx.amount.toLocaleString('en-IN')}`
              : `Recovery sequence finalized. Sequence failed to collect funds.`,
            agentId: 'v2.0 • Monitoring',
            timestamp: new Date()
          });
          await resultAudit.save();
        }
      } catch (err) {
        console.error('Async recovery simulation error:', err);
      }
    }, 3000);

    return res.json({
      message: 'Recovery process initiated',
      transaction: {
        id: tx.transactionIdStr,
        status: tx.status,
        recoveryStatus: tx.recoveryStatus
      }
    });
  } catch (error) {
    console.error('Error triggering recovery:', error);
    return res.status(500).json({ error: 'Internal server error triggering recovery.' });
  }
}
