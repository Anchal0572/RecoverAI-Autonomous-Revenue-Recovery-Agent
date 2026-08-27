/**
 * AgentRun Model — persists each full pipeline run with all agent step outputs
 */
import { Schema, model, Document } from 'mongoose';

export interface IAgentStep {
  agent: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  input: Record<string, any>;
  output: Record<string, any>;
  durationMs: number;
  runAt: Date;
}

export interface IAgentRun extends Document {
  merchantId: Schema.Types.ObjectId;
  transactionId: string;
  transactionObjectId: Schema.Types.ObjectId;
  steps: IAgentStep[];
  outcome: 'RECOVERED' | 'PENDING' | 'FAILED' | 'STOPPED' | 'ESCALATED' | 'WAITING';
  explanation: string;
  selectedStrategy: string;
  policyApproved: boolean;
  requiresHumanApproval: boolean;
  totalDurationMs: number;
  triggeredBy: 'manual' | 'auto';
  createdAt: Date;
  updatedAt: Date;
}

const AgentStepSchema = new Schema<IAgentStep>({
  agent: { type: String, required: true },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'SKIPPED'], required: true },
  input: { type: Schema.Types.Mixed, default: {} },
  output: { type: Schema.Types.Mixed, default: {} },
  durationMs: { type: Number, default: 0 },
  runAt: { type: Date, default: Date.now }
}, { _id: false });

const AgentRunSchema = new Schema<IAgentRun>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  transactionId: { type: String, required: true, index: true },
  transactionObjectId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  steps: [AgentStepSchema],
  outcome: { type: String, enum: ['RECOVERED', 'PENDING', 'FAILED', 'STOPPED', 'ESCALATED', 'WAITING'], default: 'PENDING' },
  explanation: { type: String, default: '' },
  selectedStrategy: { type: String, default: 'WAIT' },
  policyApproved: { type: Boolean, default: false },
  requiresHumanApproval: { type: Boolean, default: false },
  totalDurationMs: { type: Number, default: 0 },
  triggeredBy: { type: String, enum: ['manual', 'auto'], default: 'manual' }
}, { timestamps: true });

AgentRunSchema.index({ merchantId: 1, createdAt: -1 });
AgentRunSchema.index({ merchantId: 1, selectedStrategy: 1 });
AgentRunSchema.index({ merchantId: 1, outcome: 1 });

export const AgentRun = model<IAgentRun>('AgentRun', AgentRunSchema);
