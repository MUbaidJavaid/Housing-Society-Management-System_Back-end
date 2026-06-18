import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface IAIConversation extends Document {
  userId: Types.ObjectId;
  societyId: Types.ObjectId;
  agentType: string;
  title?: string;
  messages: IAIMessage[];
  status: string;
  messageCount: number;
  lastMessageAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IAIConversationModel extends Model<IAIConversation> {}

const aiMessageSchema = new Schema<IAIMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const aiConversationSchema = new Schema<IAIConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    agentType: {
      type: String,
      enum: ['resident-assistant', 'committee-advisor', 'financial-analyst', 'compliance-monitor'],
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    messages: [aiMessageSchema],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
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
aiConversationSchema.index({ userId: 1, status: 1, isDeleted: 1 });
aiConversationSchema.index({ societyId: 1, agentType: 1 });
aiConversationSchema.index({ lastMessageAt: -1 });

// toJSON transform
aiConversationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const AIConversation = model<IAIConversation, IAIConversationModel>(
  'AIConversation',
  aiConversationSchema
);

export default AIConversation;
