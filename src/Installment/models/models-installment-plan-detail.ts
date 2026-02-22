import { Document, Schema, Types, model } from 'mongoose';

export interface IInstallmentPlanDetail extends Document {
  planId: Types.ObjectId;
  instCatId: Types.ObjectId;
  occurrence: number;
  percentageAmount: number;
  fixedAmount: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;

  // Virtuals
  planId_populated?: any;
  instCatId_populated?: any;
  createdByUser?: any;
  updatedByUser?: any;
}

const installmentPlanDetailSchema = new Schema<IInstallmentPlanDetail>(
  {
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'InstallmentPlan',
      required: [true, 'Plan is required'],
      index: true,
    },
    instCatId: {
      type: Schema.Types.ObjectId,
      ref: 'InstallmentCategory',
      required: [true, 'Installment category is required'],
      index: true,
    },
    occurrence: {
      type: Number,
      required: [true, 'Occurrence is required'],
      min: [1, 'Occurrence must be at least 1'],
      index: true,
    },
    percentageAmount: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
      default: 0,
    },
    fixedAmount: {
      type: Number,
      min: [0, 'Fixed amount cannot be negative'],
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      required: [true, 'Created by is required'],
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
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
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        return cleanRet;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        return cleanRet;
      },
    },
  }
);

installmentPlanDetailSchema.index({ planId: 1, occurrence: 1 });
installmentPlanDetailSchema.index(
  { planId: 1, occurrence: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

installmentPlanDetailSchema.virtual('planId_populated', {
  ref: 'InstallmentPlan',
  localField: 'planId',
  foreignField: '_id',
  justOne: true,
});

installmentPlanDetailSchema.virtual('instCatId_populated', {
  ref: 'InstallmentCategory',
  localField: 'instCatId',
  foreignField: '_id',
  justOne: true,
});

installmentPlanDetailSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

installmentPlanDetailSchema.virtual('updatedByUser', {
  ref: 'UserStaff',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

const InstallmentPlanDetail = model<IInstallmentPlanDetail>(
  'InstallmentPlanDetail',
  installmentPlanDetailSchema
);

export default InstallmentPlanDetail;
