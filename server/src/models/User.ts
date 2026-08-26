import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Finance Manager' | 'Recovery Operator' | 'Viewer';
  merchantId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Finance Manager', 'Recovery Operator', 'Viewer'], default: 'Viewer' },
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true }
}, {
  timestamps: true
});

export const User = model<IUser>('User', UserSchema);
