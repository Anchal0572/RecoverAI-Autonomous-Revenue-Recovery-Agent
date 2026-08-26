import { Schema, model, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  merchantId: Schema.Types.ObjectId;
  provider: string;
  eventId: string;
  eventType: string;
  signature: string;
  signatureValid: boolean;
  payload: Record<string, any>;
  processingStatus: 'PROCESSED' | 'DUPLICATE' | 'FAILED' | 'IGNORED' | 'INVALID_SIGNATURE' | 'MALFORMED_PAYLOAD';
  processingMessage?: string;
  transactionId?: string;
  agentRunId?: string;
  durationMs: number;
  receivedAt: Date;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  provider: { type: String, required: true, default: 'Razorpay' },
  eventId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, index: true },
  signature: { type: String, default: '' },
  signatureValid: { type: Boolean, default: false },
  payload: { type: Schema.Types.Mixed, required: true },
  processingStatus: {
    type: String,
    enum: ['PROCESSED', 'DUPLICATE', 'FAILED', 'IGNORED', 'INVALID_SIGNATURE', 'MALFORMED_PAYLOAD'],
    required: true,
    index: true
  },
  processingMessage: { type: String },
  transactionId: { type: String },
  agentRunId: { type: String },
  durationMs: { type: Number, default: 0 },
  receivedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

WebhookEventSchema.index({ merchantId: 1, eventId: 1 }, { unique: true });

export const WebhookEvent = model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
