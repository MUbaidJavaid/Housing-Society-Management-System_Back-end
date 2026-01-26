import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPlotCategory extends Document {
  categoryName: string;
  surchargePercentage?: number;
  surchargeFixedAmount?: number;
  categoryDesc?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const plotCategorySchema = new Schema<IPlotCategory>(
  {
    categoryName: {
      type: String,
      required: [true, 'Category Name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Category Name must be at least 2 characters'],
      maxlength: [100, 'Category Name cannot exceed 100 characters'],
      index: true,
    },

    surchargePercentage: {
      type: Number,
      min: [0, 'Surcharge percentage cannot be negative'],
      max: [100, 'Surcharge percentage cannot exceed 100%'],
      default: 0,
      validate: {
        validator: function (this: IPlotCategory, value: number) {
          // Either percentage or fixed amount should be provided, not both
          if (value !== 0 && this.surchargeFixedAmount !== 0) {
            return false;
          }
          return true;
        },
        message: 'Cannot have both percentage and fixed amount surcharge',
      },
    },

    surchargeFixedAmount: {
      type: Number,
      min: [0, 'Surcharge fixed amount cannot be negative'],
      default: 0,
      validate: {
        validator: function (this: IPlotCategory, value: number) {
          // Either percentage or fixed amount should be provided, not both
          if (value !== 0 && this.surchargePercentage !== 0) {
            return false;
          }
          return true;
        },
        message: 'Cannot have both percentage and fixed amount surcharge',
      },
    },

    categoryDesc: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    updatedBy: {
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
  }
);

plotCategorySchema.pre('save', function (next) {
  const percentage = this.surchargePercentage ?? 0;
  const fixed = this.surchargeFixedAmount ?? 0;

  if (percentage > 0 && fixed > 0) {
    next(new Error('Cannot have both percentage and fixed amount surcharge'));
    return; // stop execution
  }
  next();
});

// Pre-update middleware
plotCategorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  // Check if both surcharge types are being set
  if (
    (update.surchargePercentage > 0 && update.surchargeFixedAmount > 0) ||
    (update.surchargePercentage > 0 && this.get('surchargeFixedAmount') > 0) ||
    (update.surchargeFixedAmount > 0 && this.get('surchargePercentage') > 0)
  ) {
    next(new Error('Cannot have both percentage and fixed amount surcharge'));
  }
  next();
});

// Compound index for active, non-deleted categories
plotCategorySchema.index({ isActive: 1, isDeleted: 1 });

// Text index for search
plotCategorySchema.index(
  { categoryName: 'text', categoryDesc: 'text' },
  {
    weights: { categoryName: 10, categoryDesc: 5 },
    name: 'plotcategory_text_search',
  }
);

plotCategorySchema.virtual('surchargeType').get(function () {
  const percentage = this.surchargePercentage ?? 0;
  const fixed = this.surchargeFixedAmount ?? 0;
  if (percentage > 0) return 'percentage';
  if (fixed > 0) return 'fixed';
  return 'none';
});

plotCategorySchema.virtual('formattedSurcharge').get(function () {
  const percentage = this.surchargePercentage ?? 0;
  const fixed = this.surchargeFixedAmount ?? 0;
  if (percentage > 0) return `${percentage}%`;
  if (fixed > 0)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(fixed);
  return 'No surcharge';
});

plotCategorySchema.virtual('calculatePrice').get(function () {
  return (basePrice: number): number => {
    const percentage = this.surchargePercentage ?? 0;
    const fixed = this.surchargeFixedAmount ?? 0;

    if (percentage > 0) return basePrice + (basePrice * percentage) / 100;
    if (fixed > 0) return basePrice + fixed;
    return basePrice;
  };
});

// Ensure virtuals are included in toJSON output
plotCategorySchema.set('toJSON', { virtuals: true });
plotCategorySchema.set('toObject', { virtuals: true });

const PlotCategory: Model<IPlotCategory> = model<IPlotCategory>('PlotCategory', plotCategorySchema);

export default PlotCategory;
