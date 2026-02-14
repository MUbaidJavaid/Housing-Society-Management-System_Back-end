import { Model, Schema, Types, model } from 'mongoose';

export interface ISrTransferType {
  typeName: string;
  description?: string;
  transferFee: number;
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
  transferCount?: number;
}

// Use untyped Schema to avoid extremely deep Mongoose generic types
const srTransferTypeSchema = new Schema(
  {
    typeName: {
      type: String,
      required: [true, 'Type name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Type name cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    transferFee: {
      type: Number,
      required: [true, 'Transfer fee is required'],
      min: [0, 'Transfer fee cannot be negative'],
      default: 0,
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
srTransferTypeSchema.index({ typeName: 1, isDeleted: 1 }, { unique: true });
srTransferTypeSchema.index({ isActive: 1, isDeleted: 1 });
srTransferTypeSchema.index({ transferFee: 1 });

// Text index for search
srTransferTypeSchema.index(
  {
    typeName: 'text',
    description: 'text',
  },
  {
    weights: {
      typeName: 10,
      description: 5,
    },
    name: 'transfer_type_text_search',
  }
);

// Virtual for created by user
srTransferTypeSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for modified by user
srTransferTypeSchema.virtual('modifiedByUser', {
  ref: 'UserStaff',
  localField: 'modifiedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for transfer count (number of transfers using this type)
srTransferTypeSchema.virtual('transferCount', {
  ref: 'SrTransfer',
  localField: '_id',
  foreignField: 'transferTypeId',
  count: true,
});

// Virtual for formatted fee
srTransferTypeSchema.virtual('formattedFee').get(function () {
  return this.transferFee != null
    ? `Rs. ${Number(this.transferFee).toLocaleString('en-US')}`
    : 'Rs. 0';
});

// Pre-save middleware
srTransferTypeSchema.pre('save', function (next) {
  // Ensure type name is properly capitalized
  if (this.isModified('typeName')) {
    this.typeName = this.typeName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  next();
});

// Pre-update middleware
srTransferTypeSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update && update.typeName) {
    // Capitalize type name on update
    update.typeName = update.typeName
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  next();
});

// Static method to find active transfer types
srTransferTypeSchema.statics.findActive = function () {
  return this.find({
    isActive: true,
    isDeleted: false,
  }).sort({ typeName: 1 });
};

// Static method to find by name
srTransferTypeSchema.statics.findByName = function (typeName: string) {
  const formattedName = typeName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return this.findOne({
    typeName: formattedName,
    isDeleted: false,
  });
};

// Static method to get transfer type statistics
srTransferTypeSchema.statics.getStatistics = function () {
  return this.aggregate([
    {
      $match: { isDeleted: false },
    },
    {
      $lookup: {
        from: 'srtransfers',
        localField: '_id',
        foreignField: 'transferTypeId',
        as: 'transfers',
      },
    },
    {
      $project: {
        typeName: 1,
        transferFee: 1,
        isActive: 1,
        transferCount: { $size: '$transfers' },
        totalFeeGenerated: {
          $multiply: ['$transferFee', { $size: '$transfers' }],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalTypes: { $sum: 1 },
        activeTypes: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        totalTransfers: { $sum: '$transferCount' },
        totalFeeGenerated: { $sum: '$totalFeeGenerated' },
        averageFee: { $avg: '$transferFee' },
      },
    },
  ]);
};

// Define interface for static methods
interface ISrTransferTypeModel extends Model<ISrTransferType> {
  findActive(): Promise<ISrTransferType[]>;
  findByName(typeName: string): Promise<ISrTransferType | null>;
  getStatistics(): Promise<any[]>;
}

// Create and export model (cast to keep TS types simple)
const SrTransferType = model('SrTransferType', srTransferTypeSchema) as ISrTransferTypeModel;

export default SrTransferType;
