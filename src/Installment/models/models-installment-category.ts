import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IInstallmentCategory extends Document {
  instCatName: string;
  instCatDescription?: string;
  isRefundable: boolean;
  isMandatory: boolean;
  sequenceOrder: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const installmentCategorySchema = new Schema<IInstallmentCategory>(
  {
    instCatName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      index: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    instCatDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isRefundable: {
      type: Boolean,
      default: false,
      index: true,
    },
    isMandatory: {
      type: Boolean,
      default: true,
      index: true,
    },
    sequenceOrder: {
      type: Number,
      required: [true, 'Sequence order is required'],
      min: [1, 'Sequence order must be at least 1'],
      default: 1,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      required: true,
      index: true,
    },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        // Add id field for frontend compatibility
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
        // Add id field for frontend compatibility
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        return cleanRet;
      },
    },
  }
);

// Compound indexes for efficient querying
installmentCategorySchema.index({ isActive: 1, sequenceOrder: 1 });
installmentCategorySchema.index({ isMandatory: 1, isActive: 1 });
installmentCategorySchema.index({ isRefundable: 1, isActive: 1 });

// Text index for search
installmentCategorySchema.index(
  {
    instCatName: 'text',
    instCatDescription: 'text',
  },
  {
    weights: {
      instCatName: 5,
      instCatDescription: 2,
    },
    name: 'installment_category_text_search',
  }
);

// Virtual for created by user
installmentCategorySchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for modified by user
installmentCategorySchema.virtual('modifiedByUser', {
  ref: 'UserStaff',
  localField: 'modifiedBy',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware to ensure unique sequence order
installmentCategorySchema.pre('save', async function (next) {
  const doc = this as any;

  // Check for duplicate sequence order (only for active categories)
  if (doc.isModified('sequenceOrder') && doc.isActive) {
    const existingCategory = await InstallmentCategory.findOne({
      _id: { $ne: doc._id },
      sequenceOrder: doc.sequenceOrder,
      isActive: true,
    });

    if (existingCategory) {
      return next(
        new Error(
          `Sequence order ${doc.sequenceOrder} is already assigned to "${existingCategory.instCatName}"`
        )
      );
    }
  }

  next();
});

// Pre-update middleware
installmentCategorySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;

  if (update && update.sequenceOrder !== undefined) {
    const docId = this.getQuery()._id;
    const existingCategory = await InstallmentCategory.findOne({
      _id: { $ne: docId },
      sequenceOrder: update.sequenceOrder,
      isActive: true,
    });

    if (existingCategory) {
      return next(
        new Error(
          `Sequence order ${update.sequenceOrder} is already assigned to "${existingCategory.instCatName}"`
        )
      );
    }
  }

  next();
});

// Static methods
interface IInstallmentCategoryModel extends Model<IInstallmentCategory> {
  getActiveCategories(): Promise<IInstallmentCategory[]>;
  getMandatoryCategories(): Promise<IInstallmentCategory[]>;
  getBySequence(): Promise<IInstallmentCategory[]>;
  findByName(name: string): Promise<IInstallmentCategory | null>;
}

// Get all active categories sorted by sequence
installmentCategorySchema.statics.getActiveCategories = function () {
  return this.find({ isActive: true })
    .sort({ sequenceOrder: 1 })
    .populate('createdByUser', 'userName fullName')
    .populate('modifiedByUser', 'userName fullName');
};

// Get only mandatory categories
installmentCategorySchema.statics.getMandatoryCategories = function () {
  return this.find({ isActive: true, isMandatory: true })
    .sort({ sequenceOrder: 1 })
    .populate('createdByUser', 'userName fullName');
};

// Get categories in sequence order
installmentCategorySchema.statics.getBySequence = function () {
  return this.find({ isActive: true })
    .sort({ sequenceOrder: 1 })
    .select('instCatName instCatDescription sequenceOrder isMandatory isRefundable');
};

// Find by name
installmentCategorySchema.statics.findByName = function (name: string) {
  return this.findOne({ instCatName: new RegExp(`^${name}$`, 'i'), isActive: true });
};

// Create and export model
const InstallmentCategory = model<IInstallmentCategory, IInstallmentCategoryModel>(
  'InstallmentCategory',
  installmentCategorySchema
);

export default InstallmentCategory;
