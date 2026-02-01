import { Document, Model, Schema, Types, model } from 'mongoose';

export enum BillTypeCategory {
  UTILITY = 'Utility',
  ADMINISTRATIVE = 'Administrative',
  PENALTY = 'Penalty',
  TAX = 'Tax',
  FEE = 'Fee',
  OTHER = 'Other',
}

export interface IBillType extends Document {
  billTypeName: string;
  billTypeCategory: BillTypeCategory;
  description?: string;
  isRecurring: boolean;
  defaultAmount?: number;
  frequency?: 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'ANNUALLY' | 'ONE_TIME';
  calculationMethod?: 'FIXED' | 'PER_UNIT' | 'PERCENTAGE' | 'TIERED';
  unitType?: string;
  ratePerUnit?: number;
  taxRate?: number;
  isTaxable: boolean;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  createdByUser?: any;
  modifiedByUser?: any;
  billCount?: number;
}

const billTypeSchema = new Schema<IBillType>(
  {
    billTypeName: {
      type: String,
      required: [true, 'Bill type name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Bill type name cannot exceed 100 characters'],
      index: true,
    },
    billTypeCategory: {
      type: String,
      enum: Object.values(BillTypeCategory),
      required: [true, 'Bill type category is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isRecurring: {
      type: Boolean,
      required: [true, 'Is recurring flag is required'],
      default: false,
      index: true,
    },
    defaultAmount: {
      type: Number,
      min: [0, 'Default amount cannot be negative'],
    },
    frequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY', 'ONE_TIME', null],
      default: null,
    },
    calculationMethod: {
      type: String,
      enum: ['FIXED', 'PER_UNIT', 'PERCENTAGE', 'TIERED', null],
      default: null,
    },
    unitType: {
      type: String,
      trim: true,
      maxlength: [50, 'Unit type cannot exceed 50 characters'],
    },
    ratePerUnit: {
      type: Number,
      min: [0, 'Rate per unit cannot be negative'],
    },
    taxRate: {
      type: Number,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
      default: 0,
    },
    isTaxable: {
      type: Boolean,
      default: false,
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

// Compound indexes for efficient querying
billTypeSchema.index({ billTypeName: 1, isDeleted: 1 }, { unique: true });
billTypeSchema.index({ billTypeCategory: 1, isActive: 1 });
billTypeSchema.index({ isRecurring: 1, isActive: 1 });

// Text index for search
billTypeSchema.index(
  {
    billTypeName: 'text',
    description: 'text',
  },
  {
    weights: {
      billTypeName: 10,
      description: 5,
    },
    name: 'bill_type_text_search',
  }
);

// Virtual for created by user
billTypeSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for modified by user
billTypeSchema.virtual('modifiedByUser', {
  ref: 'UserStaff',
  localField: 'modifiedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for bill count (number of bills using this type)
billTypeSchema.virtual('billCount', {
  ref: 'BillInfo',
  localField: '_id',
  foreignField: 'billType',
  count: true,
});

// Virtual for category badge color
billTypeSchema.virtual('categoryBadgeColor').get(function () {
  const colors: Record<string, string> = {
    [BillTypeCategory.UTILITY]: 'info',
    [BillTypeCategory.ADMINISTRATIVE]: 'primary',
    [BillTypeCategory.PENALTY]: 'danger',
    [BillTypeCategory.TAX]: 'warning',
    [BillTypeCategory.FEE]: 'success',
    [BillTypeCategory.OTHER]: 'secondary',
  };
  return colors[this.billTypeCategory] || 'secondary';
});

// Pre-save middleware
billTypeSchema.pre('save', function (next) {
  // Validate frequency based on isRecurring
  if (this.isRecurring && !this.frequency) {
    return next(new Error('Frequency is required for recurring bill types'));
  }

  if (!this.isRecurring && this.frequency && this.frequency !== 'ONE_TIME') {
    return next(new Error('Non-recurring bill types can only have ONE_TIME frequency'));
  }

  // Validate calculation method based on unit type
  if (this.calculationMethod === 'PER_UNIT' && !this.unitType) {
    return next(new Error('Unit type is required for PER_UNIT calculation method'));
  }

  if (this.calculationMethod === 'PER_UNIT' && (!this.ratePerUnit || this.ratePerUnit <= 0)) {
    return next(
      new Error('Rate per unit is required and must be positive for PER_UNIT calculation method')
    );
  }

  // Validate tax rate
  if (this.isTaxable && (!this.taxRate || this.taxRate <= 0)) {
    return next(new Error('Tax rate is required and must be positive for taxable bill types'));
  }

  next();
});

// Pre-update middleware
billTypeSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update) {
    // Prevent changing name if bills exist
    if (update.billTypeName) {
      this.set('billTypeName', update.billTypeName);
    }

    // Validate frequency if isRecurring is being updated
    if (update.isRecurring !== undefined) {
      if (update.isRecurring && !update.frequency && !this.get('frequency')) {
        return next(new Error('Frequency is required for recurring bill types'));
      }
    }
  }

  next();
});

// Static method to find active bill types
billTypeSchema.statics.findActive = function (category?: string) {
  const query: any = {
    isActive: true,
    isDeleted: false,
  };

  if (category) {
    query.billTypeCategory = category;
  }

  return this.find(query).sort({ billTypeName: 1 });
};

// Static method to find recurring bill types
billTypeSchema.statics.findRecurring = function () {
  return this.find({
    isRecurring: true,
    isActive: true,
    isDeleted: false,
  }).sort({ frequency: 1, billTypeName: 1 });
};

// Static method to get bill type statistics
billTypeSchema.statics.getStatistics = function () {
  return this.aggregate([
    {
      $match: {
        isDeleted: false,
        isActive: true,
      },
    },
    {
      $lookup: {
        from: 'billinfos',
        localField: '_id',
        foreignField: 'billType',
        as: 'bills',
      },
    },
    {
      $project: {
        billTypeName: 1,
        billTypeCategory: 1,
        isRecurring: 1,
        billCount: { $size: '$bills' },
        hasBills: { $gt: [{ $size: '$bills' }, 0] },
      },
    },
    {
      $group: {
        _id: '$billTypeCategory',
        count: { $sum: 1 },
        billTypes: {
          $push: {
            name: '$billTypeName',
            isRecurring: '$isRecurring',
            billCount: '$billCount',
            hasBills: '$hasBills',
          },
        },
        totalBillCount: { $sum: '$billCount' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

// Define interface for static methods
interface IBillTypeModel extends Model<IBillType> {
  findActive(category?: string): Promise<IBillType[]>;
  findRecurring(): Promise<IBillType[]>;
  getStatistics(): Promise<any[]>;
}

// Create and export model
const BillType = model<IBillType, IBillTypeModel>('BillType', billTypeSchema);

export default BillType;
