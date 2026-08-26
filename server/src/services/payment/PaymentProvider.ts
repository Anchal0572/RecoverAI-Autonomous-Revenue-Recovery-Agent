/**
 * PaymentProvider Interface
 * Standardized abstraction for payment lookup, status check, payment link creation, and webhook signature verification.
 */

export interface PaymentLookupResult {
  id: string;
  orderId?: string;
  amount: number; // in INR
  currency: string;
  status: 'captured' | 'failed' | 'authorized' | 'created';
  errorCode?: string;
  errorDescription?: string;
  paymentMethod?: string;
  email?: string;
  contact?: string;
  createdAt: Date;
  rawPayload: Record<string, any>;
}

export interface PaymentStatusResult {
  id: string;
  status: 'captured' | 'failed' | 'authorized' | 'created';
  amount: number;
  currency: string;
  captured: boolean;
}

export interface CreatePaymentLinkParams {
  amount: number;
  currency?: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  expireByHours?: number;
  referenceId: string; // transactionId or orderId
}

export interface PaymentLinkResult {
  id: string;
  url: string;
  status: 'created' | 'paid' | 'expired';
  amount: number;
  shortUrl: string;
  referenceId: string;
  expiresAt: Date;
}

export interface PaymentProvider {
  /** Provider Name */
  readonly name: string;
  
  /** Mode: TEST, LIVE, or MOCK */
  getMode(): 'TEST' | 'LIVE' | 'MOCK';

  /** Fetch payment details by payment ID */
  getPayment(paymentId: string): Promise<PaymentLookupResult>;

  /** Check payment status by payment ID */
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResult>;

  /** Create a payment link for recovery */
  createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult>;

  /** Verify HMAC-SHA256 signature for incoming webhooks */
  verifyWebhookSignature(body: string | Buffer, signature: string, secret: string): boolean;
}
