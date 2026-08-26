import { Schema, model, Document } from 'mongoose';

export interface IMerchantPolicy extends Document {
  merchantId: Schema.Types.ObjectId;
  maxRetries: number;
  retryBackoffMin: number;
  cooldownHours: number;
  minRecoveryScore: number;
  highValueThreshold: number;
  criticalAlertEmail: string;
  webhookUrl: string;
  razorpayKeyId: string;
  agentMode: 'autonomous' | 'supervised' | 'manual';
  autoRetryEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  planDowngradeEnabled: boolean;
  maxEmailsPerDay: number;
  maxSmsPerDay: number;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantPolicySchema = new Schema<IMerchantPolicy>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, unique: true, index: true },
  maxRetries: { type: Number, default: 3 },
  retryBackoffMin: { type: Number, default: 5 },
  cooldownHours: { type: Number, default: 24 },
  minRecoveryScore: { type: Number, default: 40 },
  highValueThreshold: { type: Number, default: 50000 },
  criticalAlertEmail: { type: String, default: 'ops@company.com' },
  webhookUrl: { type: String, default: 'https://api.company.com/webhooks/recover' },
  razorpayKeyId: { type: String, default: 'rzp_test_xxxxxxxxxxxxxxx' },
  agentMode: { type: String, enum: ['autonomous', 'supervised', 'manual'], default: 'autonomous' },
  autoRetryEnabled: { type: Boolean, default: true },
  emailEnabled: { type: Boolean, default: true },
  smsEnabled: { type: Boolean, default: true },
  planDowngradeEnabled: { type: Boolean, default: false },
  maxEmailsPerDay: { type: Number, default: 3 },
  maxSmsPerDay: { type: Number, default: 2 }
}, {
  timestamps: true
});

export const MerchantPolicy = model<IMerchantPolicy>('MerchantPolicy', MerchantPolicySchema);
