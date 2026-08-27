/**
 * Phase 10 Test Suite — Working Payment Recovery + Local Demo Mode + Razorpay Test Mode
 */
import request from 'supertest';
import app from '../server';
import { connectDB, disconnectDB } from '../config/db';
import { Transaction } from '../models/Transaction';
import { RecoveryCase } from '../models/RecoveryCase';
import { AuditEvent } from '../models/AuditEvent';
import { Merchant } from '../models/Merchant';

describe('Phase 10 — Working Payment Recovery & Local Demo System', () => {
  let authToken: string;
  let merchantId: string;

  beforeAll(async () => {
    await connectDB();

    // Register a test user
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `phase10_tester_${Date.now()}@recoverai.io`,
        password: 'Password123!',
        firstName: 'Phase10',
        lastName: 'DemoTester',
        companyName: 'Phase10 Fintech Inc.'
      });

    authToken = res.body.token;
    merchantId = res.body.user.merchantId;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('Part 2 — Environment Config & Mode Switch', () => {
    it('returns payment mode config with demo mode fallback', async () => {
      const res = await request(app).get('/api/v1/demo/config');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('paymentMode');
      expect(['demo', 'razorpay_test']).toContain(res.body.paymentMode);
      expect(res.body).toHaveProperty('isRazorpayConfigured');
    });

    it('accessible via alias /api/v1/config/config', async () => {
      const res = await request(app).get('/api/v1/config/config');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('paymentMode');
    });
  });

  describe('Part 3 & 4 — Real Failed Payment & Automatic Case Creation', () => {
    let createdTxId: string;
    let createdCaseId: string;

    it('creates a real failed payment with unique ID in database and auto-creates RecoveryCase', async () => {
      const res = await request(app)
        .post('/api/v1/demo/create-failed-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5000,
          failureReason: 'BANK_DECLINE',
          customerEmail: 'demo_user@fintech.io',
          customerName: 'Demo Customer'
        });

      expect(res.status).toBe(201);
      expect(res.body.transaction).toBeDefined();
      expect(res.body.transaction.amount).toBe(5000);
      expect(res.body.transaction.status).toBe('failed');
      expect(res.body.transaction.transactionIdStr).toMatch(/^pay_demo_/);

      expect(res.body.recoveryCase).toBeDefined();
      expect(res.body.recoveryCase.status).toBe('PENDING');
      expect(res.body.recoveryCase.amount).toBe(5000);

      createdTxId = res.body.transaction.transactionIdStr;
      createdCaseId = res.body.recoveryCase.id;

      // Verify in Database
      const dbTx = await Transaction.findOne({ transactionIdStr: createdTxId });
      expect(dbTx).toBeDefined();
      expect(dbTx?.status).toBe('failed');

      const dbCase = await RecoveryCase.findById(createdCaseId);
      expect(dbCase).toBeDefined();
      expect(dbCase?.status).toBe('PENDING');
    });

    it('logs an immutable AuditEvent on failed payment creation', async () => {
      const audit = await AuditEvent.findOne({ transactionId: createdTxId, actionType: 'PAYMENT_FAILED' });
      expect(audit).toBeDefined();
      expect(audit?.details).toContain('5,000');
    });
  });

  describe('Part 5, 6 & 7 — ML Prediction, AI Strategy & Policy Engine', () => {
    let testTxStr: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/demo/create-failed-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 5000, failureReason: 'GATEWAY_TIMEOUT' });
      testTxStr = res.body.transaction.transactionIdStr;
    });

    it('runs ML recovery prediction and selects policy-governed recovery strategy', async () => {
      const res = await request(app)
        .post(`/api/v1/demo/run-recovery-ai/${testTxStr}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pipelineResult).toBeDefined();
      expect(res.body.pipelineResult).toHaveProperty('strategy');
      expect(res.body.pipelineResult).toHaveProperty('recoveryProbability');
      expect(res.body.pipelineResult.recoveryProbability).toBeGreaterThanOrEqual(0);
      expect(res.body.pipelineResult.recoveryProbability).toBeLessThanOrEqual(1);
      expect(res.body.pipelineResult).toHaveProperty('expectedRecovery');
      expect(res.body.pipelineResult.policyApproved).toBe(true);

      // Verify RecoveryCase updated in database
      const dbCase = await RecoveryCase.findOne({ transactionId: (await Transaction.findOne({ transactionIdStr: testTxStr }))?._id });
      expect(dbCase).toBeDefined();
      expect(dbCase?.expectedRecovery).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Part 8, 9 & 12 — Recovery Action Execution & Payment Capture Webhook', () => {
    let caseId: string;
    let txIdStr: string;

    beforeAll(async () => {
      const createRes = await request(app)
        .post('/api/v1/demo/create-failed-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 5000, failureReason: 'BANK_DECLINE' });

      caseId = createRes.body.recoveryCase.id;
      txIdStr = createRes.body.transaction.transactionIdStr;

      // Run AI
      await request(app)
        .post(`/api/v1/demo/run-recovery-ai/${txIdStr}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('executes recovery action and generates a payment session URL', async () => {
      const res = await request(app)
        .post(`/api/v1/demo/execute-recovery/${caseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.paymentUrl).toBeDefined();
      expect(res.body.action).toBeDefined();
      expect(res.body.recoveryCase.status).toBe('IN_PROGRESS');
      expect(res.body.recoveryCase.attemptCount).toBe(1);
    });

    it('simulates payment capture event, credits actual recovered revenue, and closes case', async () => {
      const res = await request(app)
        .post(`/api/v1/demo/simulate-payment-success/${caseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.actualRecovered).toBe(5000);
      expect(res.body.caseStatus).toBe('RECOVERED');
      expect(res.body.transactionStatus).toBe('captured');

      // Verify Database Changes
      const dbTx = await Transaction.findOne({ transactionIdStr: txIdStr });
      expect(dbTx?.status).toBe('captured');
      expect(dbTx?.recoveryStatus).toBe('RECOVERED');

      const dbCase = await RecoveryCase.findById(caseId);
      expect(dbCase?.status).toBe('RECOVERED');
      expect(dbCase?.actualRecovery).toBe(5000);

      // Verify Audit Event
      const audit = await AuditEvent.findOne({ transactionId: txIdStr, actionType: 'PAYMENT_CAPTURED' });
      expect(audit).toBeDefined();
    });
  });

  describe('Part 19 — One-Click Full Recovery Demo', () => {
    it('executes the full 14-step automated recovery scenario seamlessly', async () => {
      const res = await request(app)
        .post('/api/v1/demo/run-full-scenario')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 5000, failureReason: 'BANK_DECLINE' });

      expect(res.status).toBe(200);
      expect(res.body.flow).toBeDefined();
      expect(res.body.flow.step1_failedPayment.amount).toBe(5000);
      expect(res.body.flow.step3_mlPrediction.recoveryProbability).toBeGreaterThan(0);
      expect(res.body.flow.step5_policyCheck.approved).toBe(true);
      expect(res.body.flow.step8_actualRevenueRecovered).toBe(5000);
      expect(res.body.flow.step9_caseClosed.status).toBe('RECOVERED');
    });
  });
});
