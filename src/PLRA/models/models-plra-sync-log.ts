import { Document, Schema, Types, model } from 'mongoose';

export interface IPLRASyncLog extends Document {
  certificateId: Types.ObjectId;
  societyId: Types.ObjectId;
  action: 'submit' | 'verify' | 'update' | 'download';
  status: 'success' | 'failed' | 'timeout';
  requestPayload?: any;
  responsePayload?: any;
  errorMessage?: string;
  duration?: number;
  initiatedBy: Types.ObjectId;
  timestamp: Date;
}

const plraSyncLogSchema = new Schema<IPLRASyncLog>(
  {
    certificateId: {
      type: Schema.Types.ObjectId,
      ref: 'PLRACertificate',
      required: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    action: {
      type: String,
      enum: ['submit', 'verify', 'update', 'download'],
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'timeout'],
      required: true,
    },
    requestPayload: {
      type: Schema.Types.Mixed,
    },
    responsePayload: {
      type: Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
    duration: {
      type: Number,
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
  }
);

// Indexes
plraSyncLogSchema.index({ certificateId: 1, timestamp: -1 });
plraSyncLogSchema.index({ societyId: 1, timestamp: -1 });
plraSyncLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // TTL 365 days

const PLRASyncLog = model<IPLRASyncLog>('PLRASyncLog', plraSyncLogSchema);

export default PLRASyncLog;
