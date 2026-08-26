/**
 * RazorpayAdapter — Real Razorpay API / Test Mode adapter implementing PaymentProvider
 */
import crypto from 'crypto';
import {
  PaymentProvider,
  PaymentLookupResult,
  PaymentStatusResult,
  CreatePaymentLinkParams,
  PaymentLinkResult
} from './PaymentProvider';

export class RazorpayAdapter implements PaymentProvider {
  readonly name = 'Razorpay';
  private keyId: string;
  private keySecret: string;
  private isTestMode: boolean;

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.isTestMode = keyId.startsWith('rzp_test_');
  }

  getMode(): 'TEST' | 'LIVE' | 'MOCK' {
    return this.isTestMode ? 'TEST' : 'LIVE';
  }

  private getAuthHeader(): string {
    const authStr = `${this.keyId}:${this.keySecret}`;
    return `Basic ${Buffer.from(authStr).toString('base64')}`;
  }

  async getPayment(paymentId: string): Promise<PaymentLookupResult> {
    const url = `https://api.razorpay.com/v1/payments/${paymentId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Razorpay API Error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      id: data.id,
      orderId: data.order_id,
      amount: data.amount / 100, // convert paise to INR
      currency: data.currency || 'INR',
      status: data.status === 'captured' ? 'captured' : data.status === 'failed' ? 'failed' : 'authorized',
      errorCode: data.error_code,
      errorDescription: data.error_description,
      paymentMethod: data.method,
      email: data.email,
      contact: data.contact,
      createdAt: new Date(data.created_at * 1000),
      rawPayload: data
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    const payment = await this.getPayment(paymentId);
    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      captured: payment.status === 'captured'
    };
  }

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
    const url = 'https://api.razorpay.com/v1/payment_links';
    const expireHours = params.expireByHours || 48;
    const expireTimestamp = Math.floor(Date.now() / 1000) + expireHours * 3600;

    const payload = {
      amount: Math.round(params.amount * 100), // convert INR to paise
      currency: params.currency || 'INR',
      accept_partial: false,
      description: params.description,
      customer: {
        name: params.customerName || 'Valued Customer',
        email: params.customerEmail,
        contact: params.customerPhone
      },
      notify: {
        sms: true,
        email: true
      },
      reminder_enable: true,
      notes: {
        reference_id: params.referenceId,
        source: 'RecoverAI-Agent'
      },
      expire_by: expireTimestamp
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Razorpay Payment Link Error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      id: data.id,
      url: data.short_url || data.url,
      status: data.status === 'paid' ? 'paid' : 'created',
      amount: data.amount / 100,
      shortUrl: data.short_url,
      referenceId: params.referenceId,
      expiresAt: new Date((data.expire_by || expireTimestamp) * 1000)
    };
  }

  verifyWebhookSignature(body: string | Buffer, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    try {
      const payloadStr = typeof body === 'string' ? body : body.toString('utf8');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
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
