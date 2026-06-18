import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IVendorProfile extends Document {
  vendorName: string;
  companyName?: string;
  email: string;
  phone: string;
  address?: string;
  vendorType: string;
  registrationNumber?: string;
  taxId?: string;
  serviceAreas: Types.ObjectId[];
  documents: Array<{ name: string; fileUrl: string; fileType: string }>;
  bankDetails: {
    bankName?: string;
    accountNumber?: string;
    accountTitle?: string;
    branchCode?: string;
  };
  status: 'pending-verification' | 'active' | 'suspended' | 'blacklisted';
  verifiedBy?: Types.ObjectId;
  verificationDate?: Date;
  rating: number;
  totalRatings: number;
  totalContracts: number;
  completedContracts: number;
  userId?: Types.ObjectId;
  metadata: any;
  createdBy?: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vendorProfileSchema = new Schema<IVendorProfile>(
  {
    vendorName: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },

    companyName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    vendorType: {
      type: String,
      required: [true, 'Vendor type is required'],
      enum: ['plumber', 'electrician', 'security', 'landscaping', 'cleaning', 'construction'],
    },

    registrationNumber: {
      type: String,
      trim: true,
    },

    taxId: {
      type: String,
      trim: true,
    },

    serviceAreas: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Society',
      },
    ],

    documents: [
      {
        name: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
      },
    ],

    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountTitle: { type: String },
      branchCode: { type: String },
    },

    status: {
      type: String,
      enum: ['pending-verification', 'active', 'suspended', 'blacklisted'],
      default: 'pending-verification',
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    verificationDate: {
      type: Date,
    },

    rating: {
      type: Number,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },

    totalContracts: {
      type: Number,
      default: 0,
    },

    completedContracts: {
      type: Number,
      default: 0,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
vendorProfileSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
vendorProfileSchema.index({ vendorType: 1, status: 1, isDeleted: 1 });
vendorProfileSchema.index({ status: 1 });
vendorProfileSchema.index(
  { vendorName: 'text', companyName: 'text' },
  {
    weights: { vendorName: 10, companyName: 5 },
    name: 'vendor_profile_text_search',
  }
);

// Static methods
vendorProfileSchema.statics.findActiveVendors = function () {
  return this.find({ status: 'active', isDeleted: false }).sort({ vendorName: 1 });
};

vendorProfileSchema.statics.findByVendorType = function (vendorType: string) {
  return this.find({ vendorType, status: 'active', isDeleted: false }).sort({ rating: -1 });
};

// Interface for static methods
interface IVendorProfileModel extends Model<IVendorProfile> {
  findActiveVendors(): Promise<IVendorProfile[]>;
  findByVendorType(vendorType: string): Promise<IVendorProfile[]>;
}

const VendorProfile = model<IVendorProfile, IVendorProfileModel>(
  'VendorProfile',
  vendorProfileSchema
);

export default VendorProfile;
