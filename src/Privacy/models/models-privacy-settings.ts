import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IConsentHistoryEntry {
  consentType: string;
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
}

export interface INotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  digest: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export interface IPrivacySettings extends Document {
  memberId: Types.ObjectId;
  userId: Types.ObjectId;
  societyId: Types.ObjectId;
  profileVisibility: 'everyone' | 'committee-only' | 'hidden';
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  directoryOptOut: boolean;
  allowAnonymousComplaints: boolean;
  thirdPartySharing: boolean;
  showOnLeaderboard: boolean;
  notificationPreferences: INotificationPreferences;
  dataRetentionConsent: boolean;
  marketingConsent: boolean;
  consentHistory: IConsentHistoryEntry[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrivacySettingsModel extends Model<IPrivacySettings> {}

const consentHistoryEntrySchema = new Schema<IConsentHistoryEntry>(
  {
    consentType: { type: String, required: true },
    granted: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String },
  },
  { _id: false }
);

const privacySettingsSchema = new Schema<IPrivacySettings>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member ID is required'],
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
    },

    profileVisibility: {
      type: String,
      enum: ['everyone', 'committee-only', 'hidden'],
      default: 'everyone',
    },

    showEmail: {
      type: Boolean,
      default: true,
    },

    showPhone: {
      type: Boolean,
      default: true,
    },

    showAddress: {
      type: Boolean,
      default: false,
    },

    directoryOptOut: {
      type: Boolean,
      default: false,
    },

    allowAnonymousComplaints: {
      type: Boolean,
      default: true,
    },

    thirdPartySharing: {
      type: Boolean,
      default: false,
    },

    showOnLeaderboard: {
      type: Boolean,
      default: true,
    },

    notificationPreferences: {
      type: Schema.Types.Mixed,
      default: {
        email: true,
        push: true,
        sms: false,
        digest: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      },
    },

    dataRetentionConsent: {
      type: Boolean,
      default: true,
    },

    marketingConsent: {
      type: Boolean,
      default: false,
    },

    consentHistory: {
      type: [consentHistoryEntrySchema],
      default: [],
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
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
privacySettingsSchema.index(
  { memberId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    name: 'uniq_active_member_privacy',
  }
);
privacySettingsSchema.index({ userId: 1, isDeleted: 1 });
privacySettingsSchema.index({ societyId: 1, isDeleted: 1 });

// toJSON transform
privacySettingsSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

privacySettingsSchema.set('toObject', { virtuals: true });

const PrivacySettings: IPrivacySettingsModel = model<IPrivacySettings, IPrivacySettingsModel>(
  'PrivacySettings',
  privacySettingsSchema
);

export default PrivacySettings;
