import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPerformanceReview {
  date: Date;
  rating: number;
  comments: string;
  reviewedBy: Types.ObjectId;
}

export interface IVendorContract extends Document {
  vendorId: Types.ObjectId;
  societyId: Types.ObjectId;
  workOrderId?: Types.ObjectId;
  contractName: string;
  description?: string;
  scope?: string;
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  amount: number;
  paymentFrequency: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
  documents: Array<{ name: string; fileUrl: string }>;
  performanceReviews: IPerformanceReview[];
  autoRenew: boolean;
  terminationReason?: string;
  metadata: any;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vendorContractSchema = new Schema<IVendorContract>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: [true, 'Vendor is required'],
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society is required'],
    },

    workOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkOrder',
    },

    contractName: {
      type: String,
      required: [true, 'Contract name is required'],
      trim: true,
    },

    description: {
      type: String,
    },

    scope: {
      type: String,
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },

    renewalDate: {
      type: Date,
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },

    paymentFrequency: {
      type: String,
      enum: ['one-time', 'monthly', 'quarterly', 'annually'],
      default: 'one-time',
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'expired', 'terminated', 'renewed'],
      default: 'draft',
    },

    documents: [
      {
        name: { type: String },
        fileUrl: { type: String },
      },
    ],

    performanceReviews: [
      {
        date: { type: Date, default: Date.now },
        rating: { type: Number, min: 1, max: 5 },
        comments: { type: String },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],

    autoRenew: {
      type: Boolean,
      default: false,
    },

    terminationReason: {
      type: String,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
vendorContractSchema.index({ vendorId: 1, status: 1, isDeleted: 1 });
vendorContractSchema.index({ societyId: 1, status: 1 });
vendorContractSchema.index({ endDate: 1 });

// Static methods
vendorContractSchema.statics.findActiveContracts = function () {
  return this.find({ status: 'active', isDeleted: false }).sort({ endDate: 1 });
};

vendorContractSchema.statics.findByVendor = function (vendorId: string) {
  return this.find({ vendorId, isDeleted: false }).sort({ createdAt: -1 });
};

interface IVendorContractModel extends Model<IVendorContract> {
  findActiveContracts(): Promise<IVendorContract[]>;
  findByVendor(vendorId: string): Promise<IVendorContract[]>;
}

const VendorContract = model<IVendorContract, IVendorContractModel>(
  'VendorContract',
  vendorContractSchema
);

export default VendorContract;
