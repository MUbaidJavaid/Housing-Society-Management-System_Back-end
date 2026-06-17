import { Document, Schema, Types, model } from 'mongoose';

export interface ISubscriptionHistory extends Document {
  societyId: Types.ObjectId;
  packageId: Types.ObjectId;
  action: 'subscribe' | 'upgrade' | 'downgrade' | 'renew' | 'cancel' | 'expire';
  previousPackageId?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  remarks?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionHistorySchema = new Schema<ISubscriptionHistory>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society is required'],
      index: true,
    },

    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPackage',
      required: [true, 'Package is required'],
      index: true,
    },

    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: ['subscribe', 'upgrade', 'downgrade', 'renew', 'cancel', 'expire'],
      index: true,
    },

    previousPackageId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPackage',
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },

    billingCycle: {
      type: String,
      required: [true, 'Billing cycle is required'],
      enum: ['monthly', 'yearly'],
    },

    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },

    paymentReference: {
      type: String,
      trim: true,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
subscriptionHistorySchema.index({ societyId: 1, createdAt: -1 });
subscriptionHistorySchema.index({ societyId: 1, action: 1 });
subscriptionHistorySchema.index({ paymentStatus: 1, isDeleted: 1 });

const SubscriptionHistory = model<ISubscriptionHistory>('SubscriptionHistory', subscriptionHistorySchema);

export default SubscriptionHistory;
