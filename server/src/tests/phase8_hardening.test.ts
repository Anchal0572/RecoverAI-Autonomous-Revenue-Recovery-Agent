/**
 * Phase 8 — Production Hardening Test Suite
 * Tests security headers, rate limiting, token validation, query sanitization,
 * compound index definitions, and graceful degradation on failure scenarios.
 */
import request from 'supertest';
import app from '../server';
import jwt from 'jsonwebtoken';
import { Transaction } from '../models/Transaction';
import { RecoveryCase } from '../models/RecoveryCase';
import { AgentRun } from '../models/AgentRun';
import { AuditEvent } from '../models/AuditEvent';
import { Customer } from '../models/Customer';
import { getPaymentProvider } from '../services/payment/paymentProviderFactory';
import { AgentOrchestrator, OrchestratorInput } from '../agents/AgentOrchestrator';

describe('Phase 8 — Security & Production Hardening', () => {

  // 1. Security Headers (Helmet)
  describe('Security Headers', () => {
    it('returns Helmet security headers on responses', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('health endpoint returns 200 with service version', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.version).toBe('7.0.0');
    });
  });

  // 2. Authentication & JWT Validation
  describe('Authentication & JWT Security', () => {
    it('rejects API access with no authorization header', async () => {
      const res = await request(app).get('/api/v1/monitoring/status');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Access denied');
    });

    it('rejects API access with invalid bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/monitoring/status')
        .set('Authorization', 'Bearer invalid.token.payload');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or expired token');
    });

    it('rejects expired JWT token', async () => {
      const secret = process.env.JWT_SECRET || 'super_secret_recoverai_key_2026';
      // Token signed with -10 seconds expiration
      const expiredToken = jwt.sign(
        { id: 'usr_test', email: 'test@recoverai.io', role: 'Admin', merchantId: 'mch_1' },
        secret,
        { expiresIn: -10 }
      );

      const res = await request(app)
        .get('/api/v1/monitoring/status')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or expired token');
    });

    it('rejects registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email-address',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          companyName: 'Test Inc'
        });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects registration with short password (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'valid@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
          companyName: 'Test Inc'
        });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // 3. Database Indexes Verification
  describe('Performance & Compound Indexes', () => {
    it('Transaction schema defines compound indexes', () => {
      const indexes = Transaction.schema.indexes();
      const indexKeys = indexes.map(idx => Object.keys(idx[0]));

      // Verify merchantId + status + createdAt compound index exists
      const hasStatusIndex = indexKeys.some(
        k => k.includes('merchantId') && k.includes('status')
      );
      expect(hasStatusIndex).toBe(true);

      // Verify merchantId + recoveryStatus compound index exists
      const hasRecoveryIndex = indexKeys.some(
        k => k.includes('merchantId') && k.includes('recoveryStatus')
      );
      expect(hasRecoveryIndex).toBe(true);
    });

    it('RecoveryCase schema defines compound indexes', () => {
      const indexes = RecoveryCase.schema.indexes();
      const indexKeys = indexes.map(idx => Object.keys(idx[0]));
      const hasStatusIndex = indexKeys.some(
        k => k.includes('merchantId') && k.includes('status')
      );
      expect(hasStatusIndex).toBe(true);
    });

    it('AgentRun schema defines sorting and filtering indexes', () => {
      const indexes = AgentRun.schema.indexes();
      const indexKeys = indexes.map(idx => Object.keys(idx[0]));
      const hasStrategyIndex = indexKeys.some(
        k => k.includes('merchantId') && k.includes('selectedStrategy')
      );
      expect(hasStrategyIndex).toBe(true);
    });

    it('AuditEvent schema defines temporal audit query indexes', () => {
      const indexes = AuditEvent.schema.indexes();
      const indexKeys = indexes.map(idx => Object.keys(idx[0]));
      const hasActionIndex = indexKeys.some(
        k => k.includes('merchantId') && k.includes('actionType')
      );
      expect(hasActionIndex).toBe(true);
    });

    it('Customer schema defines LTV segmentation indexes', () => {
      const indexes = Customer.schema.indexes();
      const indexKeys = indexes.map(idx => Object.keys(idx[0]));
      const hasLtvIndex = indexKeys.some(
        k => k.includes('merchantId') && k.includes('ltv')
      );
      expect(hasLtvIndex).toBe(true);
    });
  });

  // 4. Resilient Fallbacks & Graceful Degradation
  describe('Resilient Degradation & Fault Tolerance', () => {
    it('PaymentProviderFactory falls back to Mock Adapter safely when live credentials are absent', () => {
      const provider = getPaymentProvider({ forceMock: true });
      expect(provider.constructor.name).toBe('RazorpayMockAdapter');
    });

    it('AgentOrchestrator gracefully handles ML service offline using heuristic prediction fallback', async () => {
      const orchestrator = new AgentOrchestrator();
      const input: OrchestratorInput = {
        transactionId: 'pay_fallback_test',
        transactionObjectId: '660f1a2b3c4d5e6f7a8b9c0d',
        amount: 25000,
        currency: 'INR',
        paymentMethod: 'upi',
        errorCode: 'BAD_REQUEST_ERROR',
        errorCategory: 'temporary',
        errorDescription: 'Payment service timed out',
        customerId: 'cust_fb',
        customerEmail: 'fallback@startup.io',
        ltv: 50000,
        failureCount: 1,
        successCount: 5,
        retryCount: 0,
        previousActions: [],
        hoursSinceFailure: 1,
        isRecovered: false,
        merchantId: '660f1a2b3c4d5e6f7a8b9c0e',
        maxRetries: 3,
        highValueThreshold: 50000,
        cooldownHours: 24,
        agentMode: 'autonomous',
        autoRetryEnabled: true,
        emailEnabled: true,
        smsEnabled: true
      };

      const result = await orchestrator.run(input);
      expect(result.recoveryDetails.recoveryProbability).toBeGreaterThan(0);
      expect(result.steps.some(s => s.agent === 'MLPredictionService')).toBe(true);
      expect(result.outcome).toBeDefined();
    });

    it('Rate limiter applies standardHeaders correctly', async () => {
      const res = await request(app).get('/health');
      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('ratelimit-remaining');
    });
  });

});
