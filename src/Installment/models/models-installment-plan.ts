import { Document, Schema, Types, model } from 'mongoose';

export interface IInstallmentPlan extends Document {
  projId: Types.ObjectId;
  planName: string;
  totalMonths: number;
  totalAmount: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;

  // Virtuals
  projId_populated?: any;
  createdByUser?: any;
  updatedByUser?: any;
}

const installmentPlanSchema = new Schema<IInstallmentPlan>(
  {
    projId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
      index: true,
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      minlength: [3, 'Plan name must be at least 3 characters'],
      maxlength: [100, 'Plan name cannot exceed 100 characters'],
      index: true,
    },
    totalMonths: {
      type: Number,
      required: [true, 'Total months is required'],
      min: [1, 'Total months must be at least 1'],
      max: [360, 'Total months cannot exceed 360'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// Unique plan name per project (only for non-deleted)
installmentPlanSchema.index(
  { projId: 1, planName: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
installmentPlanSchema.index({ isActive: 1, isDeleted: 1 });

// Virtual for project
installmentPlanSchema.virtual('projId_populated', {
  ref: 'Project',
  localField: 'projId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for created by user
installmentPlanSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for updated by user
installmentPlanSchema.virtual('updatedByUser', {
  ref: 'UserStaff',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

const InstallmentPlan = model<IInstallmentPlan>('InstallmentPlan', installmentPlanSchema);

export default InstallmentPlan;
