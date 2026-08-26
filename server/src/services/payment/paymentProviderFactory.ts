/**
 * PaymentProviderFactory — Instantiates either real RazorpayAdapter or RazorpayMockAdapter
 */
import { PaymentProvider } from './PaymentProvider';
import { RazorpayAdapter } from './RazorpayAdapter';
import { RazorpayMockAdapter } from './RazorpayMockAdapter';

export interface ProviderConfig {
  keyId?: string;
  keySecret?: string;
  forceMock?: boolean;
}

export function getPaymentProvider(config?: ProviderConfig): PaymentProvider {
  const keyId = config?.keyId || process.env.RAZORPAY_KEY_ID;
  const keySecret = config?.keySecret || process.env.RAZORPAY_KEY_SECRET;

  if (!config?.forceMock && keyId && keySecret && keyId.startsWith('rzp_')) {
    return new RazorpayAdapter(keyId, keySecret);
  }

  return new RazorpayMockAdapter();
}
