import { Document, Schema, Types, model } from 'mongoose';

export interface IEmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface IMedicalProfile extends Document {
  memberId: Types.ObjectId;
  societyId: Types.ObjectId;
  bloodGroup?: string;
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
  emergencyContact?: IEmergencyContact;
  doctorName?: string;
  doctorPhone?: string;
  hospitalPreference?: string;
  insuranceInfo?: string;
  metadata?: any;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicalProfileSchema = new Schema<IMedicalProfile>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member is required'],
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society is required'],
    },

    bloodGroup: {
      type: String,
    },

    allergies: [{ type: String }],

    medications: [{ type: String }],

    medicalConditions: [{ type: String }],

    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },

    doctorName: {
      type: String,
    },

    doctorPhone: {
      type: String,
    },

    hospitalPreference: {
      type: String,
    },

    insuranceInfo: {
      type: String,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

    isDeleted: {
      type: Boolean,
      default: false,
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

// Unique index with partial filter for non-deleted records
medicalProfileSchema.index(
  { memberId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

medicalProfileSchema.index({ societyId: 1 });

const MedicalProfile = model<IMedicalProfile>('MedicalProfile', medicalProfileSchema);

export default MedicalProfile;
