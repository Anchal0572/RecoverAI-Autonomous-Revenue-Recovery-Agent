import { Schema, model, Document } from 'mongoose';

export interface IAuditEvent extends Document {
  merchantId: Schema.Types.ObjectId;
  transactionId?: string; // string key pay_xxxx
  customerId?: Schema.Types.ObjectId;
  actionType: 'RISK_DETECTED' | 'AI_ANALYSIS' | 'STRATEGY_SELECTED' | 'POLICY_VALIDATED' | 'ACTION_EXECUTED' | 'PAYMENT_RECOVERED' | 'SYSTEM_INITIALIZED' | 'POLICY_UPDATED';
  details: string;
  agentId: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  transactionId: { type: String, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
  actionType: {
    type: String,
    enum: ['RISK_DETECTED', 'AI_ANALYSIS', 'STRATEGY_SELECTED', 'POLICY_VALIDATED', 'ACTION_EXECUTED', 'PAYMENT_RECOVERED', 'SYSTEM_INITIALIZED', 'POLICY_UPDATED'],
    required: true,
    index: true
  },
  details: { type: String, required: true },
  agentId: { type: String, default: 'v2.0 • Monitoring' },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

export const AuditEvent = model<IAuditEvent>('AuditEvent', AuditEventSchema);
