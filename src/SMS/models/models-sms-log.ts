import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ISMSLog extends Document {
  recipient: string;
  message: string;
  messageType: 'otp' | 'payment_reminder' | 'visitor_alert' | 'announcement' | 'emergency' | 'custom';
  provider: 'twilio' | 'zong' | 'jazz_sms' | 'custom_api';
  providerMessageId?: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'rejected';
  errorMessage?: string;
  cost?: number;
  societyId?: Types.ObjectId;
  relatedEntity?: {
    type: string;
    id: Types.ObjectId;
  };
  sentAt?: Date;
  deliveredAt?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISMSLogModel extends Model<ISMSLog> {}

const smsLogSchema = new Schema<ISMSLog>(
  {
    recipient: {
      type: String,
      required: [true, 'Recipient phone number is required'],
      trim: true,
      index: true,
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [640, 'Message cannot exceed 640 characters'],
    },

    messageType: {
      type: String,
      required: [true, 'Message type is required'],
      enum: {
        values: ['otp', 'payment_reminder', 'visitor_alert', 'announcement', 'emergency', 'custom'],
        message: '{VALUE} is not a valid message type',
      },
      index: true,
    },

    provider: {
      type: String,
      enum: {
        values: ['twilio', 'zong', 'jazz_sms', 'custom_api'],
        message: '{VALUE} is not a valid SMS provider',
      },
      default: 'custom_api',
    },

    providerMessageId: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: {
        values: ['queued', 'sent', 'delivered', 'failed', 'rejected'],
        message: '{VALUE} is not a valid SMS status',
      },
      default: 'queued',
      index: true,
    },

    errorMessage: {
      type: String,
      trim: true,
    },

    cost: {
      type: Number,
      min: [0, 'Cost must be a positive number'],
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      index: true,
    },

    relatedEntity: {
      type: {
        type: String,
        trim: true,
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },

    sentAt: {
      type: Date,
    },

    deliveredAt: {
      type: Date,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
smsLogSchema.index(
  { recipient: 1, createdAt: -1 },
  { name: 'recipient_created' }
);

smsLogSchema.index(
  { societyId: 1, messageType: 1 },
  { name: 'society_message_type' }
);

smsLogSchema.index(
  { status: 1 },
  { name: 'sms_status' }
);

// TTL index - auto-delete logs after 90 days
smsLogSchema.index(
  { createdAt: -1 },
  { name: 'created_at_ttl', expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// Ensure virtuals are included in toJSON/toObject output
smsLogSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

smsLogSchema.set('toObject', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const SMSLog: ISMSLogModel = model<ISMSLog, ISMSLogModel>('SMSLog', smsLogSchema);

export default SMSLog;
