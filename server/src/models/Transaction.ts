import { Schema, model, Document } from 'mongoose';

export interface ITransaction extends Document {
  merchantId: Schema.Types.ObjectId;
  customerId: Schema.Types.ObjectId;
  transactionIdStr: string; // pay_xxxx
  orderId: string; // order_xxxx
  amount: number; // in INR
  currency: string;
  status: 'captured' | 'failed' | 'authorized' | 'created';
  errorCode?: string;
  errorDescription?: string;
  errorCategory?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  paymentMethod?: string;
  bank?: string;
  retryCount: number;
  recoveryScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recoveryStatus: 'PENDING' | 'IN_PROGRESS' | 'RECOVERED' | 'FAILED' | 'ABANDONED' | 'OVERDUE';
  isRecurringFailure: boolean;
  isRepeatedFailure: boolean;
  isHighValue: boolean;
  recoveredAt?: Date;
  expectedRecovery?: number;
  recoveryProbability?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  transactionIdStr: { type: String, required: true, index: true },
  orderId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['captured', 'failed', 'authorized', 'created'], required: true, index: true },
  errorCode: { type: String },
  errorDescription: { type: String },
  errorCategory: { type: String, index: true },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  paymentMethod: { type: String },
  bank: { type: String },
  retryCount: { type: Number, default: 0 },
  recoveryScore: { type: Number, default: 0, index: true },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW', index: true },
  recoveryStatus: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'RECOVERED', 'FAILED', 'ABANDONED', 'OVERDUE'], default: 'PENDING', index: true },
  isRecurringFailure: { type: Boolean, default: false, index: true },
  isRepeatedFailure: { type: Boolean, default: false, index: true },
  isHighValue: { type: Boolean, default: false, index: true },
  recoveredAt: { type: Date },
  expectedRecovery: { type: Number, default: 0 },
  recoveryProbability: { type: Number, default: 0 }
}, {
  timestamps: true
});

TransactionSchema.index({ merchantId: 1, transactionIdStr: 1 }, { unique: true });

export const Transaction = model<ITransaction>('Transaction', TransactionSchema);
