import { Schema, model, Document } from 'mongoose';

export interface IRecoveryAction extends Document {
  merchantId: Schema.Types.ObjectId;
  caseId: Schema.Types.ObjectId;
  type: 'RETRY_PAYMENT' | 'EMAIL_REMINDER' | 'SMS_OTP' | 'DOWNGRADE_PLAN' | 'PAYMENT_METHOD_CHANGE' | 'INVOICE_PAUSE';
  label: string;
  description: string;
  result: 'SUCCESS' | 'FAILED' | 'PENDING';
  executedBy: 'SYSTEM' | Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryActionSchema = new Schema<IRecoveryAction>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  caseId: { type: Schema.Types.ObjectId, ref: 'RecoveryCase', required: true, index: true },
  type: { 
    type: String, 
    enum: ['RETRY_PAYMENT', 'EMAIL_REMINDER', 'SMS_OTP', 'DOWNGRADE_PLAN', 'PAYMENT_METHOD_CHANGE', 'INVOICE_PAUSE'], 
    required: true 
  },
  label: { type: String, required: true },
  description: { type: String, required: true },
  result: { type: String, enum: ['SUCCESS', 'FAILED', 'PENDING'], default: 'PENDING', index: true },
  executedBy: { type: Schema.Types.Mixed, required: true }
}, {
  timestamps: true
});

export const RecoveryAction = model<IRecoveryAction>('RecoveryAction', RecoveryActionSchema);
