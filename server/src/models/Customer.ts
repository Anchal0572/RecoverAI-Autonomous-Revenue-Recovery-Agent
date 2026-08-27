import { Schema, model, Document } from 'mongoose';

export interface ICustomer extends Document {
  merchantId: Schema.Types.ObjectId;
  customerIdStr: string; // original mock ID like cust_001
  name: string;
  email: string;
  phone: string;
  ltv: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  customerIdStr: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  ltv: { type: Number, default: 0 }
}, {
  timestamps: true
});

CustomerSchema.index({ merchantId: 1, customerIdStr: 1 }, { unique: true });
CustomerSchema.index({ merchantId: 1, ltv: -1 });
CustomerSchema.index({ merchantId: 1, email: 1 });

export const Customer = model<ICustomer>('Customer', CustomerSchema);
