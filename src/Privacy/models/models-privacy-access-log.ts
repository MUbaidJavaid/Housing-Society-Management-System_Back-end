import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPrivacyAccessLog extends Document {
  memberId: Types.ObjectId;
  accessorId: Types.ObjectId;
  accessorRole: string;
  accessType:
    | 'view-profile'
    | 'view-contact'
    | 'view-documents'
    | 'export-data'
    | 'view-financial'
    | 'view-directory';
  fieldsAccessed: string[];
  ipAddress?: string;
  userAgent?: string;
  societyId: Types.ObjectId;
  timestamp: Date;
}

export interface IPrivacyAccessLogModel extends Model<IPrivacyAccessLog> {}

const privacyAccessLogSchema = new Schema<IPrivacyAccessLog>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member ID is required'],
      index: true,
    },

    accessorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Accessor ID is required'],
      index: true,
    },

    accessorRole: {
      type: String,
      required: [true, 'Accessor role is required'],
    },

    accessType: {
      type: String,
      enum: [
        'view-profile',
        'view-contact',
        'view-documents',
        'export-data',
        'view-financial',
        'view-directory',
      ],
      required: [true, 'Access type is required'],
    },

    fieldsAccessed: {
      type: [String],
      default: [],
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No timestamps needed - we use our own timestamp field
    versionKey: false,
  }
);

// Indexes
privacyAccessLogSchema.index({ memberId: 1, timestamp: -1 });
privacyAccessLogSchema.index({ accessorId: 1, timestamp: -1 });
privacyAccessLogSchema.index({ societyId: 1, timestamp: -1 });
privacyAccessLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 63072000, name: 'ttl_2_years' }
);

// toJSON transform
privacyAccessLogSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

privacyAccessLogSchema.set('toObject', { virtuals: true });

const PrivacyAccessLog: IPrivacyAccessLogModel = model<IPrivacyAccessLog, IPrivacyAccessLogModel>(
  'PrivacyAccessLog',
  privacyAccessLogSchema
);

export default PrivacyAccessLog;
