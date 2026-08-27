import { Schema, model, Document } from 'mongoose';

export interface IAuditEvent extends Document {
  merchantId: Schema.Types.ObjectId;
  transactionId?: string; // string key pay_xxxx
  customerId?: Schema.Types.ObjectId;
  actionType: 
    | 'PAYMENT_FAILED' 
    | 'RISK_DETECTED' 
    | 'ROOT_CAUSE_IDENTIFIED' 
    | 'PROBABILITY_CALCULATED' 
    | 'STRATEGY_SELECTED' 
    | 'POLICY_APPROVED' 
    | 'HUMAN_APPROVAL_REQUESTED' 
    | 'HUMAN_APPROVED' 
    | 'HUMAN_REJECTED' 
    | 'ACTION_EXECUTED' 
    | 'PAYMENT_CAPTURED' 
    | 'WORKFLOW_STOPPED'
    | 'WEBHOOK_PAYMENT_FAILED_RECEIVED'
    | 'AI_ANALYSIS' 
    | 'POLICY_VALIDATED' 
    | 'PAYMENT_RECOVERED' 
    | 'SYSTEM_INITIALIZED' 
    | 'POLICY_UPDATED';
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
    enum: [
      'PAYMENT_FAILED', 'RISK_DETECTED', 'ROOT_CAUSE_IDENTIFIED', 'PROBABILITY_CALCULATED',
      'STRATEGY_SELECTED', 'POLICY_APPROVED', 'HUMAN_APPROVAL_REQUESTED', 'HUMAN_APPROVED',
      'HUMAN_REJECTED', 'ACTION_EXECUTED', 'PAYMENT_CAPTURED', 'WORKFLOW_STOPPED',
      'WEBHOOK_PAYMENT_FAILED_RECEIVED', 'AI_ANALYSIS', 'POLICY_VALIDATED', 'PAYMENT_RECOVERED',
      'SYSTEM_INITIALIZED', 'POLICY_UPDATED'
    ],
    required: true,
    index: true
  },
  details: { type: String, required: true },
  agentId: { type: String, default: 'v6.0 • Autonomous Engine' },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

AuditEventSchema.index({ merchantId: 1, createdAt: -1 });
AuditEventSchema.index({ merchantId: 1, actionType: 1, createdAt: -1 });

export const AuditEvent = model<IAuditEvent>('AuditEvent', AuditEventSchema);
