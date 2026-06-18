import { Document, Schema, Types, model } from 'mongoose';

export interface IResponder {
  userId: Types.ObjectId;
  respondedAt: Date;
  action?: string;
}

export interface ITriggerLocation {
  latitude?: number;
  longitude?: number;
}

export interface IAttachment {
  name: string;
  fileUrl: string;
}

export interface IEmergencyAlert extends Document {
  societyId: Types.ObjectId;
  alertType: 'sos' | 'fire' | 'medical' | 'security' | 'natural_disaster' | 'gas_leak' | 'other';
  title: string;
  description?: string;
  triggeredBy: Types.ObjectId;
  triggerLocation?: ITriggerLocation;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'responding' | 'resolved' | 'false_alarm';
  responders: IResponder[];
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  resolutionNotes?: string;
  affectedArea?: string;
  notificationsSent: number;
  attachments: IAttachment[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyAlertSchema = new Schema<IEmergencyAlert>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society is required'],
    },

    alertType: {
      type: String,
      required: [true, 'Alert type is required'],
      enum: ['sos', 'fire', 'medical', 'security', 'natural_disaster', 'gas_leak', 'other'],
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
    },

    description: {
      type: String,
    },

    triggeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Triggered by is required'],
    },

    triggerLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },

    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high',
    },

    status: {
      type: String,
      enum: ['active', 'responding', 'resolved', 'false_alarm'],
      default: 'active',
    },

    responders: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        respondedAt: { type: Date, default: Date.now },
        action: { type: String },
      },
    ],

    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    resolvedAt: {
      type: Date,
    },

    resolutionNotes: {
      type: String,
    },

    affectedArea: {
      type: String,
    },

    notificationsSent: {
      type: Number,
      default: 0,
    },

    attachments: [
      {
        name: { type: String },
        fileUrl: { type: String },
      },
    ],

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

// Compound indexes
emergencyAlertSchema.index({ societyId: 1, status: 1, isDeleted: 1 });
emergencyAlertSchema.index({ alertType: 1, severity: 1 });
emergencyAlertSchema.index({ createdAt: -1 });

const EmergencyAlert = model<IEmergencyAlert>('EmergencyAlert', emergencyAlertSchema);

export default EmergencyAlert;
