import { Document, Model, Schema, Types, model } from 'mongoose';

// These are the CATEGORIES - one for each enum being replaced
export enum LookupCategory {
  POSSESSION_STATUS = 'possession_status',
  TRANSFER_STATUS = 'transfer_status',
  DEFAULTER_STATUS = 'defaulter_status',
  COMPLAINT_PRIORITY = 'complaint_priority',
  COMPLAINT_STATUS = 'complaint_status',
  INSTALLMENT_STATUS = 'installment_status',
  INSTALLMENT_TYPE = 'installment_type',
  PAYMENT_MODE = 'payment_mode',
  FILE_STATUS = 'file_status',
  PLOT_TYPE = 'plot_type',
  PROJECT_STATUS = 'project_status',
  PROJECT_TYPE = 'project_type',
  VISITOR_PURPOSE = 'visitor_purpose',
  VISITOR_STATUS = 'visitor_status',
  VEHICLE_TYPE = 'vehicle_type',
  BILL_TYPE_CATEGORY = 'bill_type_category',
  BILL_STATUS = 'bill_status',
  RELATION_TYPE = 'relation_type',
  DEV_CATEGORY = 'dev_category',
  DEV_PHASE = 'dev_phase',
  FACILITY_TYPE = 'facility_type',
  BOOKING_STATUS = 'booking_status',
  SUBSCRIPTION_STATUS = 'subscription_status',
  SOCIETY_STATUS = 'society_status',
}

export interface ILookupValue extends Document {
  category: LookupCategory;
  code: string;
  label: string;
  description?: string;
  colorCode?: string;
  icon?: string;
  sequence: number;
  isActive: boolean;
  isDefault: boolean;
  isSystem: boolean;
  metadata?: Record<string, any>;
  parentId?: Types.ObjectId;
  allowedTransitions?: string[];
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILookupValueModel extends Model<ILookupValue> {
  getByCategory(category: LookupCategory, activeOnly?: boolean): Promise<ILookupValue[]>;
  getByCode(category: LookupCategory, code: string): Promise<ILookupValue | null>;
  getDefault(category: LookupCategory): Promise<ILookupValue | null>;
}

const lookupValueSchema = new Schema<ILookupValue>(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: Object.values(LookupCategory),
        message: '{VALUE} is not a valid lookup category',
      },
      index: true,
    },

    code: {
      type: String,
      required: [true, 'Code is required'],
      trim: true,
      uppercase: true,
      minlength: [1, 'Code must be at least 1 character'],
      maxlength: [50, 'Code cannot exceed 50 characters'],
    },

    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true,
      minlength: [1, 'Label must be at least 1 character'],
      maxlength: [100, 'Label cannot exceed 100 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    colorCode: {
      type: String,
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color code'],
    },

    icon: {
      type: String,
      trim: true,
      maxlength: [100, 'Icon name cannot exceed 100 characters'],
    },

    sequence: {
      type: Number,
      required: [true, 'Sequence is required'],
      min: [1, 'Sequence must be at least 1'],
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'LookupValue',
      index: true,
    },

    allowedTransitions: {
      type: [String],
      default: [],
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

// Unique compound index: category + code (only among non-deleted)
lookupValueSchema.index(
  { category: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    name: 'lookup_category_code_unique',
  }
);

// Index for fetching active values by category
lookupValueSchema.index(
  { category: 1, isActive: 1, isDeleted: 1 },
  { name: 'lookup_category_active' }
);

// Index for ordering within a category
lookupValueSchema.index(
  { category: 1, sequence: 1 },
  { name: 'lookup_category_sequence' }
);

// Text index for search
lookupValueSchema.index(
  { label: 'text', code: 'text', description: 'text' },
  {
    weights: { label: 10, code: 8, description: 5 },
    name: 'lookup_text_search',
  }
);

// Pre-save hook: if isDefault is true, unset isDefault on other values in same category
lookupValueSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.model('LookupValue').updateMany(
      {
        _id: { $ne: this._id },
        category: this.category,
        isDeleted: false,
      },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Pre-update middleware
lookupValueSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;

  if (update?.$set?.isDefault === true || update?.isDefault === true) {
    const query = this.getQuery();
    const doc = await this.model.findOne(query);
    if (doc) {
      await this.model.updateMany(
        {
          _id: { $ne: query._id },
          category: doc.category,
          isDeleted: false,
        },
        { $set: { isDefault: false } }
      );
    }
  }
  next();
});

// Virtual for CSS class
lookupValueSchema.virtual('cssClass').get(function () {
  return `lookup-${this.category}-${this.code.toLowerCase().replace(/_/g, '-')}`;
});

// Virtual for badge variant
lookupValueSchema.virtual('badgeVariant').get(function () {
  if (!this.colorCode) return 'default';

  const colorMap: Record<string, string> = {
    '#10B981': 'success',
    '#059669': 'success',
    '#3B82F6': 'info',
    '#6366F1': 'primary',
    '#8B5CF6': 'primary',
    '#F59E0B': 'warning',
    '#EAB308': 'warning',
    '#F97316': 'warning',
    '#EF4444': 'danger',
    '#DC2626': 'danger',
    '#F43F5E': 'danger',
    '#6B7280': 'secondary',
    '#9CA3AF': 'secondary',
  };

  return colorMap[this.colorCode] || 'default';
});

// Ensure virtuals are included in toJSON/toObject output
lookupValueSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

lookupValueSchema.set('toObject', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

// Static method: get values by category
lookupValueSchema.statics.getByCategory = async function (
  category: LookupCategory,
  activeOnly: boolean = true
): Promise<ILookupValue[]> {
  const query: any = { category, isDeleted: false };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ sequence: 1 });
};

// Static method: get single value by category + code
lookupValueSchema.statics.getByCode = async function (
  category: LookupCategory,
  code: string
): Promise<ILookupValue | null> {
  return this.findOne({
    category,
    code: code.toUpperCase(),
    isDeleted: false,
  });
};

// Static method: get default value for a category
lookupValueSchema.statics.getDefault = async function (
  category: LookupCategory
): Promise<ILookupValue | null> {
  return this.findOne({
    category,
    isDefault: true,
    isActive: true,
    isDeleted: false,
  });
};

const LookupValue: ILookupValueModel = model<ILookupValue, ILookupValueModel>(
  'LookupValue',
  lookupValueSchema
);

export default LookupValue;
