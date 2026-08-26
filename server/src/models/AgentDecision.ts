import { Schema, model, Document } from 'mongoose';

export interface IAgentDecision extends Document {
  merchantId: Schema.Types.ObjectId;
  transactionId: Schema.Types.ObjectId;
  rootCauseAnalysis: {
    errorCode: string;
    cause: string;
    confidence: number;
  };
  recoveryProbability: {
    probability: number;
    classification: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  prioritization: {
    score: number;
    rank: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  recommendedStrategies: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AgentDecisionSchema = new Schema<IAgentDecision>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, unique: true, index: true },
  rootCauseAnalysis: {
    errorCode: { type: String, required: true },
    cause: { type: String, required: true },
    confidence: { type: Number, required: true }
  },
  recoveryProbability: {
    probability: { type: Number, required: true },
    classification: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true }
  },
  prioritization: {
    score: { type: Number, required: true },
    rank: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true }
  },
  recommendedStrategies: [{ type: String }]
}, {
  timestamps: true
});

export const AgentDecision = model<IAgentDecision>('AgentDecision', AgentDecisionSchema);
