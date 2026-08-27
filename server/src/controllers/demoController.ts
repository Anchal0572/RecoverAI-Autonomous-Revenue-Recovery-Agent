/**
 * Demo Controller — Phase 10: Local Demo & Razorpay Test Mode Workflow
 */
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Transaction } from '../models/Transaction';
import { RecoveryCase } from '../models/RecoveryCase';
import { Customer } from '../models/Customer';
import { Merchant } from '../models/Merchant';
import { MerchantPolicy } from '../models/MerchantPolicy';
import { AuditEvent } from '../models/AuditEvent';
import { WebhookEvent } from '../models/WebhookEvent';
import { AgentOrchestrator } from '../agents/AgentOrchestrator';
import { getPaymentProvider } from '../services/payment/paymentProviderFactory';
import { seedDatabase } from '../services/seed';
import { Types } from 'mongoose';

const orchestrator = new AgentOrchestrator();

/**
 * Helper to ensure a valid merchant ID from AuthRequest
 */
async function getEffectiveMerchant(req: AuthRequest): Promise<any> {
  if (req.user?.merchantId) {
    const m = await Merchant.findById(req.user.merchantId);
    if (m) return m;
  }
  let merchant = await Merchant.findOne();
  if (!merchant) {
    merchant = await Merchant.create({
      name: 'Acme Enterprise Inc.',
      workspaceId: `ws_demo_${Date.now()}`
    });
  }
  return merchant;
}

/**
 * GET /api/v1/demo/config
 * Returns active payment environment and configuration readiness
 */
export async function getPaymentModeConfig(req: Request, res: Response) {
  try {
    const rawMode = (process.env.PAYMENT_MODE || 'demo').toLowerCase();
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    const isRazorpayConfigured = Boolean(
      keyId && 
      keySecret && 
      keyId.startsWith('rzp_test_') && 
      !keyId.includes('MOCK')
    );

    let effectiveMode: 'demo' | 'razorpay_test' = 'demo';
    let warning: string | undefined;

    if (rawMode === 'razorpay_test') {
      if (isRazorpayConfigured) {
        effectiveMode = 'razorpay_test';
      } else {
        effectiveMode = 'demo';
        warning = 'Razorpay Test Mode is requested but test credentials are missing or mock. RecoverAI is safely running in Local Demo Mode.';
      }
    } else {
      effectiveMode = 'demo';
    }

    return res.json({
      paymentMode: effectiveMode,
      configuredMode: rawMode,
      isRazorpayConfigured,
      hasWebhookSecret: Boolean(webhookSecret),
      keyIdMasked: keyId ? `${keyId.slice(0, 8)}...` : undefined,
      warning
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/v1/demo/create-failed-payment
 * Creates real failed transaction and automatic RecoveryCase
 */
export async function createDemoFailedPayment(req: AuthRequest, res: Response) {
  try {
    const merchant = await getEffectiveMerchant(req);
    const amount = Number(req.body.amount) || 5000;
    const failureReason = req.body.failureReason || 'BANK_DECLINE';
    const email = req.body.customerEmail || 'demo.customer@enterprise.io';
    const name = req.body.customerName || 'Demo Customer';
    const phone = req.body.customerPhone || '+919876543210';
    const paymentMethod = req.body.paymentMethod || 'card';

    // 1. Upsert Customer
    let customer = await Customer.findOne({ merchantId: merchant._id, email });
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (!customer) {
      customer = await Customer.create({
        merchantId: merchant._id,
        customerIdStr: `cust_demo_${uniqueSuffix}`,
        name,
        email,
        phone,
        ltv: 55000
      });
    }

    // 2. Generate unique transaction ID
    const transactionIdStr = `pay_demo_${uniqueSuffix}`;
    const orderId = `order_demo_${uniqueSuffix}`;

    // 3. Create real failed Transaction in DB
    const transaction = await Transaction.create({
      merchantId: merchant._id,
      customerId: customer._id,
      transactionIdStr,
      orderId,
      amount,
      currency: 'INR',
      status: 'failed',
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: failureReason,
      errorCategory: failureReason.toLowerCase().includes('card') ? 'card_issue' : 'payment_failure',
      paymentMethod,
      bank: 'HDFC',
      severity: amount >= 50000 ? 'CRITICAL' : 'MEDIUM',
      recoveryStatus: 'PENDING',
      recoveryScore: 0,
      retryCount: 0
    });

    // 4. Automatically create RecoveryCase (Status: PENDING / OPEN)
    const recoveryCase = await RecoveryCase.create({
      merchantId: merchant._id,
      transactionId: transaction._id,
      customerId: customer._id,
      status: 'PENDING',
      recoveryScore: 0,
      riskLevel: 'MEDIUM',
      revenueAtRisk: amount,
      expectedRecovery: 0,
      actualRecovery: 0,
      recommendedStrategies: ['RETRY', 'PAYMENT_LINK'],
      currentStep: 'DETECTION'
    });

    // 5. Immutable Audit Event
    await AuditEvent.create({
      merchantId: merchant._id,
      transactionId: transactionIdStr,
      actionType: 'PAYMENT_FAILED',
      details: `Failed transaction ₹${amount.toLocaleString('en-IN')} recorded (${failureReason}). Automatic recovery case ${recoveryCase._id} opened.`,
      agentId: 'DetectionAgent-v5.0'
    });

    return res.status(201).json({
      message: 'Failed payment and automatic recovery case created successfully.',
      transaction: {
        id: transaction._id,
        transactionIdStr: transaction.transactionIdStr,
        amount: transaction.amount,
        status: transaction.status,
        failureReason: transaction.errorDescription,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt
      },
      recoveryCase: {
        id: recoveryCase._id,
        status: recoveryCase.status,
        amount,
        failureReason,
        attemptCount: transaction.retryCount,
        created_at: recoveryCase.createdAt
      },
      customer: {
        name: customer.name,
        email: customer.email,
        ltv: customer.ltv
      }
    });
  } catch (err: any) {
    console.error('Error creating demo failed payment:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/v1/demo/run-recovery-ai/:transactionId
 * Executes ML prediction and 7-Agent recovery pipeline for a case
 */
export async function runDemoRecoveryAI(req: AuthRequest, res: Response) {
  try {
    const merchant = await getEffectiveMerchant(req);
    const { transactionId } = req.params;

    // Find transaction by ID or transactionIdStr
    let tx = await Transaction.findOne({
      merchantId: merchant._id,
      $or: [
        { _id: Types.ObjectId.isValid(transactionId) ? new Types.ObjectId(transactionId) : undefined },
        { transactionIdStr: transactionId }
      ].filter(Boolean) as any
    }).populate('customerId');

    if (!tx) {
      return res.status(404).json({ error: `Transaction '${transactionId}' not found.` });
    }

    const customer: any = tx.customerId || {
      _id: new Types.ObjectId(),
      name: 'Customer',
      email: 'customer@enterprise.com',
      ltv: 50000
    };

    // Load merchant policy
    const policy = await MerchantPolicy.findOne({ merchantId: merchant._id }) || {
      maxRetries: 3,
      highValueThreshold: 50000,
      cooldownHours: 24,
      agentMode: 'autonomous',
      autoRetryEnabled: true,
      emailEnabled: true,
      smsEnabled: true
    };

    const hoursSinceFailure = (Date.now() - new Date(tx.createdAt).getTime()) / (1000 * 60 * 60);

    // Run 7-Agent Orchestrator Pipeline
    const pipelineResult = await orchestrator.run({
      transactionId: tx.transactionIdStr,
      transactionObjectId: tx._id.toString(),
      amount: tx.amount,
      currency: tx.currency,
      paymentMethod: tx.paymentMethod || 'card',
      errorCode: tx.errorCode || 'BAD_REQUEST_ERROR',
      errorCategory: tx.errorCategory || 'payment_failure',
      errorDescription: tx.errorDescription || 'Payment declined',
      customerId: customer._id.toString(),
      customerEmail: customer.email,
      customerPhone: customer.phone,
      ltv: customer.ltv || 50000,
      failureCount: tx.retryCount || 1,
      successCount: 4,
      retryCount: tx.retryCount || 0,
      previousActions: [],
      hoursSinceFailure,
      isRecovered: false,
      merchantId: merchant._id.toString(),
      maxRetries: (policy as any).maxRetries || 3,
      highValueThreshold: (policy as any).highValueThreshold || 50000,
      cooldownHours: (policy as any).cooldownHours || 24,
      agentMode: (policy as any).agentMode || 'autonomous',
      autoRetryEnabled: (policy as any).autoRetryEnabled ?? true,
      emailEnabled: (policy as any).emailEnabled ?? true,
      smsEnabled: (policy as any).smsEnabled ?? true
    });

    const recoveryProb = pipelineResult.recoveryDetails.recoveryProbability;
    const expectedRecovery = Math.round(tx.amount * recoveryProb);
    const riskScore = pipelineResult.recoveryDetails.riskScore;

    // Update Transaction
    tx.recoveryScore = riskScore;
    tx.riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';
    await tx.save();

    // Update RecoveryCase
    const recoveryCase = await RecoveryCase.findOneAndUpdate(
      { transactionId: tx._id, merchantId: merchant._id },
      {
        $set: {
          recoveryScore: riskScore,
          expectedRecovery,
          riskLevel: tx.riskLevel,
          recommendedStrategies: [pipelineResult.selectedStrategy],
          status: pipelineResult.requiresHumanApproval ? 'REQUIRES_APPROVAL' : 'IN_PROGRESS',
          humanApprovalStatus: pipelineResult.requiresHumanApproval ? 'PENDING' : 'NOT_REQUIRED',
          currentStep: 'STRATEGY'
        }
      },
      { upsert: true, new: true }
    );

    // Audit Event
    await AuditEvent.create({
      merchantId: merchant._id,
      transactionId: tx.transactionIdStr,
      actionType: 'STRATEGY_SELECTED',
      details: `AI selected ${pipelineResult.selectedStrategy} strategy (Recovery Prob: ${Math.round(recoveryProb * 100)}%, Expected: ₹${expectedRecovery.toLocaleString('en-IN')}). Policy approved: ${pipelineResult.policyApproved}`,
      agentId: 'StrategyAgent-v5.0'
    });

    return res.json({
      message: 'AI Recovery Pipeline executed successfully.',
      pipelineResult: {
        strategy: pipelineResult.selectedStrategy,
        confidence: pipelineResult.recoveryDetails.rootCauseConfidence,
        businessReason: pipelineResult.explanation,
        requiresApproval: pipelineResult.requiresHumanApproval,
        policyApproved: pipelineResult.policyApproved,
        recoveryProbability: recoveryProb,
        expectedRecovery,
        riskScore,
        steps: pipelineResult.steps
      },
      recoveryCase: {
        id: recoveryCase._id,
        status: recoveryCase.status,
        expectedRecovery: recoveryCase.expectedRecovery,
        recoveryScore: recoveryCase.recoveryScore,
        recommendedStrategy: pipelineResult.selectedStrategy
      }
    });
  } catch (err: any) {
    console.error('Error running demo AI recovery:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/v1/demo/execute-recovery/:recoveryCaseId
 * Dispatches the recovery action (Demo portal link or Razorpay test payment link)
 */
export async function executeDemoRecoveryAction(req: AuthRequest, res: Response) {
  try {
    const merchant = await getEffectiveMerchant(req);
    const { recoveryCaseId } = req.params;

    const recoveryCase = await RecoveryCase.findOne({
      merchantId: merchant._id,
      _id: Types.ObjectId.isValid(recoveryCaseId) ? new Types.ObjectId(recoveryCaseId) : undefined
    }).populate('transactionId').populate('customerId');

    if (!recoveryCase) {
      return res.status(404).json({ error: 'Recovery case not found.' });
    }

    const tx: any = recoveryCase.transactionId;
    const customer: any = recoveryCase.customerId;
    const strategy = recoveryCase.recommendedStrategies?.[0] || 'PAYMENT_LINK';

    const paymentMode = (process.env.PAYMENT_MODE || 'demo').toLowerCase();
    const isRazorpayTest = paymentMode === 'razorpay_test';

    const provider = getPaymentProvider({ forceMock: !isRazorpayTest });

    let paymentUrl = `/demo-payment/${recoveryCase._id}`;
    let externalLinkId = `mock_link_${Date.now()}`;

    // Create payment link using the appropriate provider
    try {
      const linkResult = await provider.createPaymentLink({
        amount: tx.amount,
        currency: 'INR',
        description: `RecoverAI Recovery for ${tx.transactionIdStr}`,
        customerName: customer?.name || 'Demo Customer',
        customerEmail: customer?.email || 'customer@demo.io',
        customerPhone: customer?.phone || '+919876543210',
        referenceId: tx.transactionIdStr
      });

      if (isRazorpayTest && linkResult.shortUrl && !linkResult.shortUrl.includes('mock')) {
        paymentUrl = linkResult.shortUrl;
        externalLinkId = linkResult.id;
      }
    } catch (linkErr: any) {
      console.warn('Payment link generation warning (falling back to local demo link):', linkErr.message);
    }

    // Update case & transaction
    tx.retryCount = (tx.retryCount || 0) + 1;
    await tx.save();

    recoveryCase.status = 'IN_PROGRESS';
    recoveryCase.currentStep = 'EXECUTION';
    await recoveryCase.save();

    // Audit Event
    await AuditEvent.create({
      merchantId: merchant._id,
      transactionId: tx.transactionIdStr,
      actionType: 'ACTION_EXECUTED',
      details: `Recovery action ${strategy} executed. Payment portal session active. Mode: ${provider.getMode()}`,
      agentId: 'ExecutionAgent-v5.0'
    });

    return res.json({
      message: 'Recovery action executed successfully.',
      action: strategy,
      paymentUrl,
      externalLinkId,
      provider: provider.name,
      mode: provider.getMode(),
      recoveryCase: {
        id: recoveryCase._id,
        status: recoveryCase.status,
        attemptCount: tx.retryCount
      }
    });
  } catch (err: any) {
    console.error('Error executing demo recovery action:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/v1/demo/simulate-payment-success/:recoveryCaseId
 * Simulates successful payment capture via central recovery webhook logic
 */
export async function simulateDemoPaymentSuccess(req: AuthRequest, res: Response) {
  try {
    const merchant = await getEffectiveMerchant(req);
    const { recoveryCaseId } = req.params;

    const recoveryCase = await RecoveryCase.findOne({
      merchantId: merchant._id,
      _id: Types.ObjectId.isValid(recoveryCaseId) ? new Types.ObjectId(recoveryCaseId) : undefined
    }).populate('transactionId').populate('customerId');

    if (!recoveryCase) {
      return res.status(404).json({ error: 'Recovery case not found.' });
    }

    const tx: any = recoveryCase.transactionId;
    const amount = tx?.amount || 5000;

    // 1. Update Transaction to captured and RECOVERED
    tx.status = 'captured';
    tx.recoveryStatus = 'RECOVERED';
    tx.recoveredAt = new Date();
    await tx.save();

    // 2. Update Recovery Case to RECOVERED and close case
    recoveryCase.status = 'RECOVERED';
    recoveryCase.actualRecovery = amount;
    recoveryCase.currentStep = 'COMPLETED';
    await recoveryCase.save();

    // 3. Record WebhookEvent for audit trace
    const eventId = `evt_demo_captured_${Date.now()}`;
    await WebhookEvent.create({
      merchantId: merchant._id,
      provider: 'RecoverAIDemoSimulator',
      eventId,
      eventType: 'payment.captured',
      signature: 'simulated_valid_signature',
      signatureValid: true,
      payload: {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: tx.transactionIdStr,
              amount: amount * 100,
              currency: 'INR',
              status: 'captured'
            }
          }
        }
      },
      processingStatus: 'PROCESSED',
      processingMessage: `Payment capture verified. Transaction ${tx.transactionIdStr} marked RECOVERED.`,
      durationMs: 12
    });

    // 4. Immutable Audit Event
    await AuditEvent.create({
      merchantId: merchant._id,
      transactionId: tx.transactionIdStr,
      actionType: 'PAYMENT_CAPTURED',
      details: `Monitoring Agent verified payment capture of ₹${amount.toLocaleString('en-IN')}. Case ${recoveryCase._id} closed as RECOVERED.`,
      agentId: 'MonitoringAgent-v5.0'
    });

    return res.json({
      message: 'Payment capture simulated successfully. Case marked RECOVERED.',
      actualRecovered: amount,
      caseStatus: 'RECOVERED',
      transactionStatus: 'captured',
      eventId,
      closedAt: new Date()
    });
  } catch (err: any) {
    console.error('Error simulating payment success:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/v1/demo/simulate-payment-failure/:recoveryCaseId
 * Simulates failed recovery attempt
 */
export async function simulateDemoPaymentFailure(req: AuthRequest, res: Response) {
  try {
    const merchant = await getEffectiveMerchant(req);
    const { recoveryCaseId } = req.params;

    const recoveryCase = await RecoveryCase.findOne({
      merchantId: merchant._id,
      _id: Types.ObjectId.isValid(recoveryCaseId) ? new Types.ObjectId(recoveryCaseId) : undefined
    }).populate('transactionId');

    if (!recoveryCase) {
      return res.status(404).json({ error: 'Recovery case not found.' });
    }

    const tx: any = recoveryCase.transactionId;
    tx.retryCount = (tx.retryCount || 0) + 1;
    await tx.save();

    if (tx.retryCount >= 3) {
      recoveryCase.status = 'STOPPED';
      recoveryCase.stoppingReason = 'MAX_RETRIES_EXCEEDED';
    } else {
      recoveryCase.status = 'FAILED';
    }

    await recoveryCase.save();

    await AuditEvent.create({
      merchantId: merchant._id,
      transactionId: tx?.transactionIdStr || 'tx_unknown',
      actionType: tx.retryCount >= 3 ? 'WORKFLOW_STOPPED' : 'ACTION_EXECUTED',
      details: `Recovery attempt #${tx.retryCount} failed. Case status: ${recoveryCase.status}`,
      agentId: 'MonitoringAgent-v5.0'
    });

    return res.json({
      message: 'Payment recovery failure simulated.',
      caseStatus: recoveryCase.status,
      attemptCount: tx.retryCount
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/v1/demo/run-full-scenario
 * One-click execution of the entire 14-step recovery scenario
 */
export async function runFullRecoveryDemo(req: AuthRequest, res: Response) {
  try {
    const merchant = await getEffectiveMerchant(req);
    const amount = Number(req.body.amount) || 5000;
    const failureReason = req.body.failureReason || 'BANK_DECLINE';

    // 1. Create failed payment
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const transactionIdStr = `pay_demo_${uniqueSuffix}`;

    let customer = await Customer.findOne({ merchantId: merchant._id });
    if (!customer) {
      customer = await Customer.create({
        merchantId: merchant._id,
        customerIdStr: `cust_demo_${uniqueSuffix}`,
        name: 'Demo Enterprise User',
        email: 'user@enterprise.io',
        phone: '+919999888877',
        ltv: 60000
      });
    }

    const transaction = await Transaction.create({
      merchantId: merchant._id,
      customerId: customer._id,
      transactionIdStr,
      orderId: `order_${uniqueSuffix}`,
      amount,
      currency: 'INR',
      status: 'failed',
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: failureReason,
      errorCategory: 'payment_failure',
      paymentMethod: 'card',
      bank: 'HDFC',
      severity: 'MEDIUM',
      recoveryStatus: 'PENDING',
      recoveryScore: 0,
      retryCount: 0
    });

    const recoveryCase = await RecoveryCase.create({
      merchantId: merchant._id,
      transactionId: transaction._id,
      customerId: customer._id,
      status: 'PENDING',
      recoveryScore: 0,
      riskLevel: 'MEDIUM',
      revenueAtRisk: amount,
      expectedRecovery: 0,
      actualRecovery: 0,
      recommendedStrategies: ['PAYMENT_LINK'],
      currentStep: 'DETECTION'
    });

    // 2. Run 7-Agent AI Pipeline
    const pipelineResult = await orchestrator.run({
      transactionId: transaction.transactionIdStr,
      transactionObjectId: transaction._id.toString(),
      amount,
      currency: 'INR',
      paymentMethod: 'card',
      errorCode: 'BAD_REQUEST_ERROR',
      errorCategory: 'payment_failure',
      errorDescription: failureReason,
      customerId: customer._id.toString(),
      customerEmail: customer.email,
      ltv: customer.ltv,
      failureCount: 1,
      successCount: 4,
      retryCount: 0,
      previousActions: [],
      hoursSinceFailure: 0.1,
      isRecovered: false,
      merchantId: merchant._id.toString(),
      maxRetries: 3,
      highValueThreshold: 50000,
      cooldownHours: 24,
      agentMode: 'autonomous',
      autoRetryEnabled: true,
      emailEnabled: true,
      smsEnabled: true
    });

    const recoveryProb = pipelineResult.recoveryDetails.recoveryProbability;
    const expectedRecovery = Math.round(amount * recoveryProb);

    // 3. Dispatch Payment Link
    const paymentUrl = `/demo-payment/${recoveryCase._id}`;

    // 4. Simulate Payment Capture Event & Case Closure
    transaction.status = 'captured';
    transaction.recoveryStatus = 'RECOVERED';
    transaction.recoveredAt = new Date();
    await transaction.save();

    recoveryCase.status = 'RECOVERED';
    recoveryCase.actualRecovery = amount;
    recoveryCase.expectedRecovery = expectedRecovery;
    recoveryCase.recoveryScore = pipelineResult.recoveryDetails.riskScore;
    recoveryCase.currentStep = 'COMPLETED';
    await recoveryCase.save();

    // 5. Audit Log
    await AuditEvent.create({
      merchantId: merchant._id,
      transactionId: transactionIdStr,
      actionType: 'PAYMENT_CAPTURED',
      details: `Full one-click recovery demo completed. ₹${amount.toLocaleString('en-IN')} recovered autonomously.`,
      agentId: 'Orchestrator-v5.0'
    });

    return res.json({
      message: 'Full recovery demo scenario completed successfully!',
      flow: {
        step1_failedPayment: { transactionId: transactionIdStr, amount, failureReason },
        step2_recoveryCase: { caseId: recoveryCase._id, status: 'OPEN' },
        step3_mlPrediction: { recoveryProbability: recoveryProb, expectedRecovery },
        step4_aiStrategy: { strategy: pipelineResult.selectedStrategy, confidence: pipelineResult.recoveryDetails.rootCauseConfidence },
        step5_policyCheck: { approved: pipelineResult.policyApproved, humanApprovalRequired: pipelineResult.requiresHumanApproval },
        step6_recoveryAction: { action: pipelineResult.selectedStrategy, paymentUrl },
        step7_paymentCapture: { status: 'captured', event: 'payment.captured' },
        step8_actualRevenueRecovered: amount,
        step9_caseClosed: { status: 'RECOVERED', closedAt: new Date() }
      }
    });
  } catch (err: any) {
    console.error('Error running full demo scenario:', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/v1/demo/reset
 * Resets demo state and re-seeds fresh database
 */
export async function resetDemoState(req: AuthRequest, res: Response) {
  try {
    const merchant = await getEffectiveMerchant(req);
    await seedDatabase(merchant._id, true);
    return res.json({ message: 'Demo environment reset and re-seeded successfully with 10,000 transactions.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
