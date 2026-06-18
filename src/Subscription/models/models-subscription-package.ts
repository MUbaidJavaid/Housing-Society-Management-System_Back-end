import { Document, Schema, Types, model } from 'mongoose';

export interface ISubscriptionFeatures {
  maxMembers: number;
  maxProjects: number;
  maxStaff: number;
  maxPlots: number;
  modules: string[];
  storageGB: number;
  supportLevel: 'email' | 'priority' | 'dedicated';
  customBranding: boolean;
  apiAccess: boolean;
  visitorManagement: boolean;
  facilityBooking: boolean;
  advancedReporting: boolean;
}

export interface ISubscriptionPackage extends Document {
  packageName: string;
  packageCode: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: ISubscriptionFeatures;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPackageSchema = new Schema<ISubscriptionPackage>(
  {
    packageName: {
      type: String,
      required: [true, 'Package name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Package name must be at least 2 characters'],
      maxlength: [100, 'Package name cannot exceed 100 characters'],
      index: true,
    },

    packageCode: {
      type: String,
      required: [true, 'Package code is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [2, 'Package code must be at least 2 characters'],
      maxlength: [50, 'Package code cannot exceed 50 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },

    monthlyPrice: {
      type: Number,
      required: [true, 'Monthly price is required'],
      min: [0, 'Monthly price cannot be negative'],
    },

    yearlyPrice: {
      type: Number,
      required: [true, 'Yearly price is required'],
      min: [0, 'Yearly price cannot be negative'],
    },

    currency: {
      type: String,
      trim: true,
      default: 'PKR',
    },

    features: {
      type: {
        maxMembers: { type: Number, default: 50, min: 0 },
        maxProjects: { type: Number, default: 1, min: 0 },
        maxStaff: { type: Number, default: 5, min: 0 },
        maxPlots: { type: Number, default: 100, min: 0 },
        modules: { type: [String], default: ['members', 'plots', 'projects', 'installments', 'complaints', 'announcements'] },
        storageGB: { type: Number, default: 1, min: 0 },
        supportLevel: { type: String, enum: ['email', 'priority', 'dedicated'], default: 'email' },
        customBranding: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
        visitorManagement: { type: Boolean, default: false },
        facilityBooking: { type: Boolean, default: false },
        advancedReporting: { type: Boolean, default: false },
      },
      default: {
        maxMembers: 50,
        maxProjects: 1,
        maxStaff: 5,
        maxPlots: 100,
        modules: ['members', 'plots', 'projects', 'installments', 'complaints', 'announcements'],
        storageGB: 1,
        supportLevel: 'email',
        customBranding: false,
        apiAccess: false,
        visitorManagement: false,
        facilityBooking: false,
        advancedReporting: false,
      },
    },

    isPopular: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
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
subscriptionPackageSchema.index({ packageCode: 1 }, { unique: true });
subscriptionPackageSchema.index({ isActive: 1, isDeleted: 1, sortOrder: 1 });

const SubscriptionPackage = model<ISubscriptionPackage>('SubscriptionPackage', subscriptionPackageSchema);

export default SubscriptionPackage;
