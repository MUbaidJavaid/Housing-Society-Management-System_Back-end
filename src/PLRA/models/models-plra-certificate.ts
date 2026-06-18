import { Document, Schema, Types, model } from 'mongoose';

export interface IPropertyDetails {
  area?: number;
  areaUnit?: string;
  boundaries?: string;
  address?: string;
  plotNumber?: string;
  blockName?: string;
}

export interface IOwnerDetails {
  name?: string;
  cnic?: string;
  fatherName?: string;
  address?: string;
}

export interface IPLRACertificate extends Document {
  plotId: Types.ObjectId;
  memberId: Types.ObjectId;
  societyId: Types.ObjectId;
  certificateNumber: string;
  certificateType: 'ownership' | 'allotment' | 'transfer' | 'possession';
  issuedDate: Date;
  validUntil?: Date;
  propertyDetails: IPropertyDetails;
  ownerDetails: IOwnerDetails;
  qrCode?: string;
  digitalSignature?: string;
  plraReferenceNumber?: string;
  syncStatus: 'pending' | 'synced' | 'failed' | 'manual';
  syncError?: string;
  lastSyncAt?: Date;
  pdfUrl?: string;
  status: 'draft' | 'issued' | 'verified' | 'revoked' | 'expired';
  issuedBy: Types.ObjectId;
  metadata: Record<string, any>;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const propertyDetailsSchema = new Schema(
  {
    area: { type: Number },
    areaUnit: { type: String, trim: true },
    boundaries: { type: String, trim: true },
    address: { type: String, trim: true },
    plotNumber: { type: String, trim: true },
    blockName: { type: String, trim: true },
  },
  { _id: false }
);

const ownerDetailsSchema = new Schema(
  {
    name: { type: String, trim: true },
    cnic: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { _id: false }
);

const plraCertificateSchema = new Schema<IPLRACertificate>(
  {
    plotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      required: true,
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    certificateNumber: {
      type: String,
      required: [true, 'Certificate number is required'],
      trim: true,
    },
    certificateType: {
      type: String,
      enum: ['ownership', 'allotment', 'transfer', 'possession'],
      required: [true, 'Certificate type is required'],
    },
    issuedDate: {
      type: Date,
      required: [true, 'Issued date is required'],
    },
    validUntil: {
      type: Date,
    },
    propertyDetails: {
      type: propertyDetailsSchema,
      default: {},
    },
    ownerDetails: {
      type: ownerDetailsSchema,
      default: {},
    },
    qrCode: {
      type: String,
      trim: true,
    },
    digitalSignature: {
      type: String,
    },
    plraReferenceNumber: {
      type: String,
      trim: true,
    },
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed', 'manual'],
      default: 'pending',
    },
    syncError: {
      type: String,
    },
    lastSyncAt: {
      type: Date,
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'verified', 'revoked', 'expired'],
      default: 'draft',
      index: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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
plraCertificateSchema.index(
  { certificateNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
plraCertificateSchema.index({ plotId: 1, certificateType: 1 });
plraCertificateSchema.index({ societyId: 1, status: 1, isDeleted: 1 });
plraCertificateSchema.index({ qrCode: 1 });

const PLRACertificate = model<IPLRACertificate>(
  'PLRACertificate',
  plraCertificateSchema
);

export default PLRACertificate;
