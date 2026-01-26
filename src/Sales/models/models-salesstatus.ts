import { Document, Model, Schema, Types, model } from 'mongoose';

export enum SalesStatusType {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  RESERVED = 'reserved',
  ALLOTTED = 'allotted',
  CONTRACTED = 'contracted',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
  SOLD = 'sold',
  PENDING = 'pending',
  CLOSED = 'closed',
}

export interface ISalesStatus extends Document {
  statusName: string;
  statusCode: string;
  statusType: SalesStatusType;
  description?: string;
  colorCode: string; // For UI display
  isActive: boolean;
  isDefault: boolean;
  sequence: number; // For ordering in dropdowns
  allowsSale: boolean; // Can plots be sold in this status?
  requiresApproval: boolean; // Does this status require admin approval?
  notificationTemplate?: string; // Template for notifications
  allowedTransitions?: SalesStatusType[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const salesStatusSchema = new Schema<ISalesStatus>(
  {
    statusName: {
      type: String,
      required: [true, 'Status Name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Status Name must be at least 2 characters'],
      maxlength: [50, 'Status Name cannot exceed 50 characters'],
      index: true,
    },

    statusCode: {
      type: String,
      required: [true, 'Status Code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      minlength: [2, 'Status Code must be at least 2 characters'],
      maxlength: [20, 'Status Code cannot exceed 20 characters'],
      index: true,
    },

    statusType: {
      type: String,
      required: [true, 'Status Type is required'],
      enum: {
        values: Object.values(SalesStatusType),
        message: '{VALUE} is not a valid status type',
      },
      default: SalesStatusType.AVAILABLE,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    colorCode: {
      type: String,
      required: [true, 'Color Code is required'],
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color code'],
      default: '#808080', // Default gray
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    sequence: {
      type: Number,
      required: [true, 'Sequence is required'],
      min: [1, 'Sequence must be at least 1'],
      default: 1,
    },

    allowsSale: {
      type: Boolean,
      default: false,
      index: true,
    },

    requiresApproval: {
      type: Boolean,
      default: false,
      index: true,
    },

    notificationTemplate: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notification template cannot exceed 1000 characters'],
    },
    // allowedTransitions: {
    //   type: [String],
    //   enum: {
    //     values: Object.values(SalesStatusType),
    //     message: '{VALUE} is not a valid status type',
    //   },
    // },
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

// Pre-save middleware to ensure only one default status
salesStatusSchema.pre('save', async function (next) {
  if (this.isDefault) {
    // Remove default flag from other statuses
    await this.model('SalesStatus').updateMany(
      {
        _id: { $ne: this._id },
        isDeleted: false,
      },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Pre-update middleware
salesStatusSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;

  if (update.isDefault === true) {
    // Remove default flag from other statuses
    await this.model.updateMany(
      {
        _id: { $ne: this.getQuery()._id },
        isDeleted: false,
      },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Compound indexes for common queries
salesStatusSchema.index({ isActive: 1, isDeleted: 1 });
salesStatusSchema.index({ statusType: 1, isActive: 1 });
salesStatusSchema.index({ allowsSale: 1, isActive: 1 });
salesStatusSchema.index({ sequence: 1, isActive: 1 });

// Text index for search
salesStatusSchema.index(
  { statusName: 'text', statusCode: 'text', description: 'text' },
  {
    weights: { statusName: 10, statusCode: 8, description: 5 },
    name: 'salesstatus_text_search',
  }
);

// Virtual for formatted color display
salesStatusSchema.virtual('colorName').get(function () {
  const colors: Record<string, string> = {
    '#FF0000': 'Red',
    '#00FF00': 'Green',
    '#0000FF': 'Blue',
    '#FFFF00': 'Yellow',
    '#FFA500': 'Orange',
    '#800080': 'Purple',
    '#008080': 'Teal',
    '#808080': 'Gray',
    '#A52A2A': 'Brown',
    '#000000': 'Black',
  };

  return colors[this.colorCode] || this.colorCode;
});

// Virtual for CSS class name
salesStatusSchema.virtual('cssClass').get(function () {
  return `status-${this.statusCode.toLowerCase().replace(/_/g, '-')}`;
});

// Virtual for badge variant (for UI components)
salesStatusSchema.virtual('badgeVariant').get(function () {
  const variants: Record<string, string> = {
    [SalesStatusType.AVAILABLE]: 'success',
    [SalesStatusType.BOOKED]: 'info',
    [SalesStatusType.RESERVED]: 'warning',
    [SalesStatusType.ALLOTTED]: 'primary',
    [SalesStatusType.CONTRACTED]: 'success',
    [SalesStatusType.CANCELLED]: 'danger',
    [SalesStatusType.ON_HOLD]: 'warning',
    [SalesStatusType.SOLD]: 'success',
    [SalesStatusType.PENDING]: 'info',
    [SalesStatusType.CLOSED]: 'secondary',
  };

  return variants[this.statusType] || 'default';
});

// Virtual for workflow next steps
salesStatusSchema.virtual('allowedTransitions').get(function () {
  const transitions: Record<SalesStatusType, SalesStatusType[]> = {
    [SalesStatusType.AVAILABLE]: [
      SalesStatusType.BOOKED,
      SalesStatusType.RESERVED,
      SalesStatusType.ALLOTTED,
      SalesStatusType.PENDING,
      SalesStatusType.ON_HOLD,
    ],
    [SalesStatusType.BOOKED]: [
      SalesStatusType.ALLOTTED,
      SalesStatusType.CONTRACTED,
      SalesStatusType.CANCELLED,
      SalesStatusType.ON_HOLD,
    ],
    [SalesStatusType.RESERVED]: [
      SalesStatusType.ALLOTTED,
      SalesStatusType.CONTRACTED,
      SalesStatusType.CANCELLED,
      SalesStatusType.AVAILABLE,
    ],
    [SalesStatusType.ALLOTTED]: [
      SalesStatusType.CONTRACTED,
      SalesStatusType.CANCELLED,
      SalesStatusType.SOLD,
    ],
    [SalesStatusType.CONTRACTED]: [
      SalesStatusType.SOLD,
      SalesStatusType.CLOSED,
      SalesStatusType.CANCELLED,
    ],
    [SalesStatusType.CANCELLED]: [SalesStatusType.AVAILABLE],
    [SalesStatusType.ON_HOLD]: [
      SalesStatusType.AVAILABLE,
      SalesStatusType.BOOKED,
      SalesStatusType.CANCELLED,
    ],
    [SalesStatusType.SOLD]: [SalesStatusType.CLOSED],
    [SalesStatusType.PENDING]: [
      SalesStatusType.BOOKED,
      SalesStatusType.RESERVED,
      SalesStatusType.CANCELLED,
      SalesStatusType.AVAILABLE,
    ],
    [SalesStatusType.CLOSED]: [], // Final state, no transitions
  };

  return transitions[this.statusType] || [];
});

// Ensure virtuals are included in toJSON output
salesStatusSchema.set('toJSON', { virtuals: true });
salesStatusSchema.set('toObject', { virtuals: true });

// Static method to get default status
salesStatusSchema.statics.getDefaultStatus = async function (): Promise<ISalesStatus | null> {
  return this.findOne({ isDefault: true, isActive: true, isDeleted: false });
};

// Static method to get statuses by type
salesStatusSchema.statics.getStatusesByType = function (
  type: SalesStatusType
): Promise<ISalesStatus[]> {
  return this.find({
    statusType: type,
    isActive: true,
    isDeleted: false,
  }).sort({ sequence: 1 });
};

// Static method to get statuses that allow sales
salesStatusSchema.statics.getSalesAllowedStatuses = function (): Promise<ISalesStatus[]> {
  return this.find({
    allowsSale: true,
    isActive: true,
    isDeleted: false,
  }).sort({ sequence: 1 });
};

const SalesStatus: Model<ISalesStatus> = model<ISalesStatus>('SalesStatus', salesStatusSchema);

export default SalesStatus;
