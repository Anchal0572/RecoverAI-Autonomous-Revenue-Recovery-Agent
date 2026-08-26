import { Schema, model, Document } from 'mongoose';

export interface IRecoveryCase extends Document {
  merchantId: Schema.Types.ObjectId;
  transactionId: Schema.Types.ObjectId;
  customerId: Schema.Types.ObjectId;
  recoveryScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'RECOVERED' | 'FAILED' | 'ABANDONED' | 'OVERDUE';
  recommendedStrategies: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryCaseSchema = new Schema<IRecoveryCase>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, unique: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  recoveryScore: { type: Number, required: true, index: true },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true, index: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'RECOVERED', 'FAILED', 'ABANDONED', 'OVERDUE'], default: 'PENDING', index: true },
  recommendedStrategies: [{ type: String }]
}, {
  timestamps: true
});

export const RecoveryCase = model<IRecoveryCase>('RecoveryCase', RecoveryCaseSchema);
