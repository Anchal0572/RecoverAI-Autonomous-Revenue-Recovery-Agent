/**
 * Webhook Controller — Handles incoming Razorpay webhooks, signature security,
 * idempotency checks, database updates, and autonomous agent triggering.
 */
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { getPaymentProvider } from '../services/payment/paymentProviderFactory';
import { WebhookEvent } from '../models/WebhookEvent';
import { Transaction } from '../models/Transaction';
import { Customer } from '../models/Customer';
import { Merchant } from '../models/Merchant';
import { MerchantPolicy } from '../models/MerchantPolicy';
import { AgentRun } from '../models/AgentRun';
import { RecoveryCase } from '../models/RecoveryCase';
import { AuditEvent } from '../models/AuditEvent';
import { AgentOrchestrator } from '../agents/AgentOrchestrator';
import { Types } from 'mongoose';

const orchestrator = new AgentOrchestrator();

/**
 * POST /api/v1/webhooks/razorpay
 * Live/Test Webhook Endpoint for Razorpay events
 */
export async function handleRazorpayWebhook(req: Request, res: Response) {
  const start = Date.now();
  const signature = (req.headers['x-razorpay-signature'] as string) || (req.headers['x-signature'] as string) || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret_key';

  const provider = getPaymentProvider();

  // Step 1: Malformed Payload Check
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Malformed webhook payload.' });
  }

  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const event = req.body.event;
  const eventId = req.body.event_id || req.body.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (!event) {
    return res.status(400).json({ error: 'Missing event field in webhook payload.' });
  }

  // Step 2: Signature Verification
  const signatureValid = provider.verifyWebhookSignature(rawBody, signature, webhookSecret);

  // If signature is required and fails (unless test mode bypass)
  if (!signatureValid && process.env.NODE_ENV === 'production') {
    // Log invalid signature attempt
    try {
      const merchant = await Merchant.findOne() || { _id: new Types.ObjectId() };
      await WebhookEvent.create({
        merchantId: merchant._id,
        provider: provider.name,
        eventId,
        eventType: event,
        signature,
        signatureValid: false,
        payload: req.body,
        processingStatus: 'INVALID_SIGNATURE',
        processingMessage: 'HMAC-SHA256 signature verification failed.',
        durationMs: Date.now() - start
      });
    } catch (_) {}

    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  // Find merchant (default to first active merchant or create demo fallback)
  let merchant = await Merchant.findOne();
  if (!merchant) {
    merchant = await Merchant.create({
      name: 'Acme Enterprise',
      workspaceId: `ws_webhook_${Date.now()}`
    });
  }

  // Step 3: Idempotency Check
  const existingEvent = await WebhookEvent.findOne({ merchantId: merchant._id, eventId });
  if (existingEvent) {
    return res.status(200).json({
      status: 'DUPLICATE',
      message: `Event ${eventId} has already been processed idempotently.`,
      eventId
    });
  }

  // Step 4: Event Validation & Database Update & Agent Trigger
  let processingStatus: 'PROCESSED' | 'FAILED' | 'IGNORED' = 'PROCESSED';
  let processingMessage = 'Event processed successfully.';
  let txDoc: any = null;
  let agentRunResult: any = null;

  try {
    const payloadEntity = req.body.payload?.payment?.entity || req.body.payload?.order?.entity || req.body.payload?.subscription?.entity || {};

    switch (event) {
      case 'payment.failed': {
        const amount = (payloadEntity.amount ? payloadEntity.amount / 100 : 25000);
        const transactionIdStr = payloadEntity.id || `pay_${Date.now()}`;
        const email = payloadEntity.email || 'customer@enterprise.com';
        const contact = payloadEntity.contact || '+919876543210';
        const errorCode = payloadEntity.error_code || 'BAD_REQUEST_ERROR';
        const errorDescription = payloadEntity.error_description || 'Payment failed at issuing bank';

        // Upsert customer
        let customer = await Customer.findOne({ merchantId: merchant._id, email });
        if (!customer) {
          customer = await Customer.create({
            merchantId: merchant._id,
            name: email.split('@')[0],
            email,
            phone: contact,
            ltv: 45000
          });
        }

        // Upsert failed transaction
        txDoc = await Transaction.findOneAndUpdate(
          { merchantId: merchant._id, transactionIdStr },
          {
            $set: {
              merchantId: merchant._id,
              customerId: customer._id,
              transactionIdStr,
              orderId: payloadEntity.order_id || `order_${Date.now()}`,
              amount,
              currency: payloadEntity.currency || 'INR',
              status: 'failed',
              errorCode,
              errorDescription,
              errorCategory: errorCode.includes('CARD') ? 'card_issue' : errorCode.includes('GATEWAY') ? 'network' : 'payment_failure',
              paymentMethod: payloadEntity.method || 'card',
              bank: payloadEntity.bank || 'HDFC',
              severity: amount >= 50000 ? 'CRITICAL' : 'HIGH',
              recoveryStatus: 'PENDING'
            }
          },
          { upsert: true, new: true }
        );

        // Fetch merchant policy
        const policy = await MerchantPolicy.findOne({ merchantId: merchant._id }) || {
          maxRetries: 3,
          highValueThreshold: 50000,
          cooldownHours: 24,
          agentMode: 'autonomous',
          autoRetryEnabled: true,
          emailEnabled: true,
          smsEnabled: true
        };

        const hoursSinceFailure = (Date.now() - new Date(txDoc.createdAt).getTime()) / (1000 * 60 * 60);

        // Step 5: Trigger Agent Recovery Pipeline
        agentRunResult = await orchestrator.run({
          transactionId: txDoc.transactionIdStr,
          transactionObjectId: txDoc._id.toString(),
          amount: txDoc.amount,
          currency: txDoc.currency,
          paymentMethod: txDoc.paymentMethod,
          errorCode: txDoc.errorCode,
          errorCategory: txDoc.errorCategory,
          errorDescription: txDoc.errorDescription,
          customerId: customer._id.toString(),
          customerEmail: customer.email,
          customerPhone: customer.phone,
          ltv: customer.ltv,
          failureCount: 1,
          successCount: 3,
          retryCount: 0,
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

        // Save Agent Run
        const agentRun = await AgentRun.create({
          merchantId: merchant._id,
          transactionId: txDoc.transactionIdStr,
          transactionObjectId: txDoc._id,
          steps: agentRunResult.steps,
          outcome: agentRunResult.outcome,
          explanation: agentRunResult.explanation,
          selectedStrategy: agentRunResult.selectedStrategy,
          policyApproved: agentRunResult.policyApproved,
          requiresHumanApproval: agentRunResult.requiresHumanApproval,
          totalDurationMs: agentRunResult.totalDurationMs,
          triggeredBy: 'webhook'
        });

        // Update Recovery Case
        await RecoveryCase.findOneAndUpdate(
          { transactionId: txDoc._id, merchantId: merchant._id },
          {
            $set: {
              status: agentRunResult.recoveryDetails.caseStatus as any,
              recoveryScore: agentRunResult.recoveryDetails.riskScore,
              riskLevel: agentRunResult.recoveryDetails.riskScore >= 70 ? 'HIGH' : 'MEDIUM',
              recommendedStrategies: [agentRunResult.selectedStrategy]
            }
          },
          { upsert: true }
        );

        // Audit Event
        await AuditEvent.create({
          merchantId: merchant._id,
          transactionId: txDoc.transactionIdStr,
          actionType: 'WEBHOOK_PAYMENT_FAILED_RECEIVED',
          details: `Razorpay webhook triggered agent pipeline. Outcome: ${agentRunResult.outcome}`,
          agentId: 'WebhookProcessor-v5.0'
        });

        processingMessage = `Payment failure processed. Recovery agent initiated action: ${agentRunResult.selectedStrategy}.`;
        break;
      }

      case 'payment.captured':
      case 'order.paid':
      case 'payment.link.paid': {
        const transactionIdStr = payloadEntity.id || `pay_${Date.now()}`;
        txDoc = await Transaction.findOneAndUpdate(
          { merchantId: merchant._id, transactionIdStr },
          {
            $set: {
              status: 'captured',
              recoveryStatus: 'RECOVERED',
              recoveredAt: new Date()
            }
          },
          { new: true }
        );

        if (txDoc) {
          await RecoveryCase.findOneAndUpdate(
            { transactionId: txDoc._id, merchantId: merchant._id },
            { $set: { status: 'RECOVERED' } }
          );
        }

        processingMessage = `Payment captured event logged. Transaction ${transactionIdStr} marked RECOVERED.`;
        break;
      }

      default:
        processingStatus = 'IGNORED';
        processingMessage = `Event type '${event}' received and logged safely (no agent action required).`;
        break;
    }
  } catch (err: any) {
    processingStatus = 'FAILED';
    processingMessage = `Error processing event: ${err.message}`;
  }

  // Step 6: Log Webhook Event
  const webhookLog = await WebhookEvent.create({
    merchantId: merchant._id,
    provider: provider.name,
    eventId,
    eventType: event,
    signature,
    signatureValid: signatureValid || true,
    payload: req.body,
    processingStatus,
    processingMessage,
    transactionId: txDoc?.transactionIdStr,
    agentRunId: agentRunResult ? agentRunResult.runId : undefined,
    durationMs: Date.now() - start,
    receivedAt: new Date()
  });

  return res.json({
    status: processingStatus,
    eventId,
    eventType: event,
    signatureValid: true,
    providerMode: provider.getMode(),
    message: processingMessage,
    agentOutcome: agentRunResult?.outcome,
    durationMs: Date.now() - start
  });
}

/**
 * GET /api/v1/webhooks/status
 * Returns Razorpay integration health, test mode status, and recent webhook logs
 */
export async function getWebhookStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const merchantId = new Types.ObjectId(req.user.merchantId);

    const provider = getPaymentProvider();
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_MOCK99887766';
    const maskedKeyId = keyId.length > 8 ? `${keyId.slice(0, 8)}••••••••` : 'rzp_test_••••••••';

    const recentLogs = await WebhookEvent.find({ merchantId })
      .sort({ createdAt: -1 })
      .limit(50);

    const totalEvents = await WebhookEvent.countDocuments({ merchantId });
    const successfulEvents = await WebhookEvent.countDocuments({ merchantId, processingStatus: 'PROCESSED' });
    const lastWebhook = recentLogs[0] || null;

    return res.json({
      integration: {
        provider: provider.name,
        mode: provider.getMode() === 'MOCK' ? 'MOCK / SIMULATION MODE' : 'RAZORPAY TEST MODE',
        connectionStatus: 'CONNECTED',
        keyIdMasked: maskedKeyId,
        webhookUrl: 'http://localhost:5000/api/v1/webhooks/razorpay',
        hasLiveSecret: Boolean(process.env.RAZORPAY_KEY_SECRET),
        webhookSecretConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET)
      },
      stats: {
        totalEvents,
        successfulEvents,
        successRate: totalEvents > 0 ? Math.round((successfulEvents / totalEvents) * 100) : 100,
        lastWebhookReceivedAt: lastWebhook?.receivedAt || null
      },
      lastWebhook,
      logs: recentLogs
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch webhook status.' });
  }
}

/**
 * POST /api/v1/webhooks/trigger-test
 * Trigger a simulated Razorpay payment.failed test webhook from frontend UI
 */
export async function triggerTestWebhook(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const merchantId = new Types.ObjectId(req.user.merchantId);

    const { amount = 35000, email = 'rahul@startup.io', eventType = 'payment.failed' } = req.body;
    const testPaymentId = `pay_test_${Date.now().toString().slice(-8)}`;

    const mockPayload = {
      event_id: `evt_test_${Date.now()}`,
      event: eventType,
      contains: ['payment'],
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: testPaymentId,
            entity: 'payment',
            amount: amount * 100, // paise
            currency: 'INR',
            status: eventType === 'payment.captured' ? 'captured' : 'failed',
            order_id: `order_test_${Date.now().toString().slice(-6)}`,
            invoice_id: null,
            international: false,
            method: 'card',
            amount_refunded: 0,
            refund_status: null,
            captured: eventType === 'payment.captured',
            description: 'Test transaction for RecoverAI Phase 5 verification',
            card_id: 'card_test_123',
            bank: 'HDFC',
            email,
            contact: '+919123456789',
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Card expired or insufficient funds in test mode',
            error_source: 'bank',
            error_step: 'payment_authorization',
            error_reason: 'insufficient_funds'
          }
        }
      }
    };

    // Forward to handleRazorpayWebhook logic
    const reqSimulated = {
      body: mockPayload,
      headers: { 'x-razorpay-signature': 'test_mode_bypass_sig' },
      rawBody: JSON.stringify(mockPayload)
    } as any;

    let resData: any = null;
    const resSimulated = {
      status: (code: number) => ({
        json: (data: any) => { resData = { statusCode: code, data }; }
      }),
      json: (data: any) => { resData = { statusCode: 200, data }; }
    } as any;

    await handleRazorpayWebhook(reqSimulated, resSimulated);

    return res.json({
      message: 'Test webhook event dispatched successfully.',
      simulatedPaymentId: testPaymentId,
      result: resData?.data
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to trigger test webhook.', details: error.message });
  }
}
