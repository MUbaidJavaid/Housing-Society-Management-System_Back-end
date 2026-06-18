import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IAIInsight extends Document {
  societyId: Types.ObjectId;
  insightType: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  data?: Record<string, any>;
  actionable: boolean;
  actionUrl?: string;
  acknowledgedBy?: Types.ObjectId;
  acknowledgedAt?: Date;
  expiresAt?: Date;
  generatedBy: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IAIInsightModel extends Model<IAIInsight> {}

const aiInsightSchema = new Schema<IAIInsight>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    insightType: {
      type: String,
      enum: ['prediction', 'anomaly', 'recommendation', 'trend', 'alert'],
      required: true,
    },
    category: {
      type: String,
      enum: ['financial', 'complaints', 'members', 'maintenance', 'compliance', 'general'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'low', 'medium', 'high', 'critical'],
      default: 'info',
    },
    data: {
      type: Schema.Types.Mixed,
    },
    actionable: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    generatedBy: {
      type: String,
      default: 'system',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
aiInsightSchema.index({ societyId: 1, insightType: 1, isActive: 1 });
aiInsightSchema.index({ societyId: 1, category: 1, severity: 1 });
aiInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
aiInsightSchema.index({ createdAt: -1 });

// toJSON transform
aiInsightSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const AIInsight = model<IAIInsight, IAIInsightModel>('AIInsight', aiInsightSchema);

export default AIInsight;
