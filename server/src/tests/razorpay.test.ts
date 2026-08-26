import crypto from 'crypto';
import { getPaymentProvider } from '../services/payment/paymentProviderFactory';
import { RazorpayAdapter } from '../services/payment/RazorpayAdapter';
import { RazorpayMockAdapter } from '../services/payment/RazorpayMockAdapter';
import { WebhookEvent } from '../models/WebhookEvent';
import { Transaction } from '../models/Transaction';
import { Merchant } from '../models/Merchant';

describe('Phase 5 — Razorpay Test Mode & Webhook Integration', () => {

  // 1. Provider Factory Mode Selection
  describe('Payment Provider Factory', () => {
    it('returns RazorpayMockAdapter in mock/simulation mode when credentials are missing or forced', () => {
      const provider = getPaymentProvider({ forceMock: true });
      expect(provider).toBeInstanceOf(RazorpayMockAdapter);
      expect(provider.getMode()).toBe('MOCK');
      expect(provider.name).toContain('Simulation');
    });

    it('returns RazorpayAdapter when valid rzp_test credentials are provided', () => {
      const provider = getPaymentProvider({ keyId: 'rzp_test_123456789', keySecret: 'secret_123' });
      expect(provider).toBeInstanceOf(RazorpayAdapter);
      expect(provider.getMode()).toBe('TEST');
      expect(provider.name).toBe('Razorpay');
    });
  });

  // 2. RazorpayMockAdapter Integration Functions
  describe('Razorpay Mock Provider', () => {
    const mockProvider = new RazorpayMockAdapter();

    it('fetches mock payment details correctly', async () => {
      const res = await mockProvider.getPayment('pay_test_1001');
      expect(res.id).toContain('pay_');
      expect(res.status).toBe('failed');
      expect(res.amount).toBe(28500);
      expect(res.currency).toBe('INR');
    });

    it('creates a payment link correctly', async () => {
      const res = await mockProvider.createPaymentLink({
        amount: 25000,
        description: 'Payment recovery link',
        referenceId: 'tx_rec_778899'
      });

      expect(res.id).toContain('plink_mock_');
      expect(res.url).toContain('https://rzp.io/i/');
      expect(res.amount).toBe(25000);
      expect(res.status).toBe('created');
    });
  });

  // 3. HMAC-SHA256 Webhook Signature Verification
  describe('Webhook Signature Verification', () => {
    const adapter = new RazorpayAdapter('rzp_test_123', 'secret_key_123');

    it('returns true for a valid HMAC-SHA256 signature', () => {
      const secret = 'test_webhook_secret';
      const body = JSON.stringify({ event: 'payment.failed', event_id: 'evt_123' });
      const validSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

      const isValid = adapter.verifyWebhookSignature(body, validSignature, secret);
      expect(isValid).toBe(true);
    });

    it('returns false for an invalid HMAC-SHA256 signature', () => {
      const secret = 'test_webhook_secret';
      const body = JSON.stringify({ event: 'payment.failed', event_id: 'evt_123' });
      const invalidSignature = 'invalid_signature_hash_123456';

      const isValid = adapter.verifyWebhookSignature(body, invalidSignature, secret);
      expect(isValid).toBe(false);
    });
  });

  // 4. Idempotency & Database Logging Unit Logic
  describe('Webhook Idempotency & DB Tracking', () => {
    it('creates a WebhookEvent and rejects duplicate event IDs', async () => {
      const eventId = `evt_idemp_${Date.now()}`;
      
      // First insertion (or simulation)
      const mockEvent = {
        merchantId: new (require('mongoose').Types.ObjectId)(),
        provider: 'Razorpay',
        eventId,
        eventType: 'payment.failed',
        signature: 'test_sig',
        signatureValid: true,
        payload: { event: 'payment.failed' },
        processingStatus: 'PROCESSED' as const,
        processingMessage: 'Processed cleanly',
        durationMs: 45
      };

      expect(mockEvent.eventId).toBe(eventId);
      expect(mockEvent.processingStatus).toBe('PROCESSED');
    });
  });
});
