import { Schema, model, Document } from 'mongoose';

export interface IMerchant extends Document {
  name: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema = new Schema<IMerchant>({
  name: { type: String, required: true, trim: true },
  workspaceId: { type: String, required: true, unique: true, index: true, trim: true }
}, {
  timestamps: true
});

export const Merchant = model<IMerchant>('Merchant', MerchantSchema);
