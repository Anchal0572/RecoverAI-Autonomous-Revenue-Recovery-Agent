/**
 * RazorpayMockAdapter — Transparent Mock Provider implementing PaymentProvider
 * Used when live test credentials are not set. Clearly labeled as MOCK / SIMULATION MODE.
 */
import crypto from 'crypto';
import {
  PaymentProvider,
  PaymentLookupResult,
  PaymentStatusResult,
  CreatePaymentLinkParams,
  PaymentLinkResult
} from './PaymentProvider';

export class RazorpayMockAdapter implements PaymentProvider {
  readonly name = 'Razorpay Mock Provider (Simulation Mode)';

  getMode(): 'TEST' | 'LIVE' | 'MOCK' {
    return 'MOCK';
  }

  async getPayment(paymentId: string): Promise<PaymentLookupResult> {
    // Simulate minor network delay
    await new Promise(res => setTimeout(res, 40));

    return {
      id: paymentId.startsWith('pay_') ? paymentId : `pay_mock_${paymentId}`,
      orderId: `order_mock_${Date.now().toString().slice(-8)}`,
      amount: 28500,
      currency: 'INR',
      status: 'failed',
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: 'Card expired or insufficient funds in test simulation mode',
      paymentMethod: 'card',
      email: 'customer@techcorp.in',
      contact: '+919876543210',
      createdAt: new Date(),
      rawPayload: {
        id: paymentId,
        entity: 'payment',
        amount: 2850000,
        currency: 'INR',
        status: 'failed',
        method: 'card',
        error_code: 'BAD_REQUEST_ERROR',
        error_description: 'Card expired or insufficient funds in test simulation mode',
        notes: { mode: 'MOCK_SIMULATION' }
      }
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    const payment = await this.getPayment(paymentId);
    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      captured: false
    };
  }

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
    await new Promise(res => setTimeout(res, 50));
    const mockId = `plink_mock_${Date.now().toString().slice(-8)}`;
    const url = `https://rzp.io/i/mock_${params.referenceId.slice(-8)}`;

    return {
      id: mockId,
      url,
      status: 'created',
      amount: params.amount,
      shortUrl: url,
      referenceId: params.referenceId,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000)
    };
  }

  verifyWebhookSignature(body: string | Buffer, signature: string, secret: string): boolean {
    if (!signature) return false;
    // Special test bypass string for unit testing & UI sandbox trigger
    if (signature === 'valid_test_signature' || signature === 'test_mode_bypass_sig') {
      return true;
    }

    try {
      const payloadStr = typeof body === 'string' ? body : body.toString('utf8');
      const expectedSignature = crypto
        .createHmac('sha256', secret || 'mock_webhook_secret_key')
        .update(payloadStr)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch (err) {
      return false;
    }
  }
}
