import { Model, Schema, Types, model } from 'mongoose';

export enum TransferStatus {
  PENDING = 'Pending',
  UNDER_REVIEW = 'Under Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  ON_HOLD = 'On Hold',
  DOCUMENTS_REQUIRED = 'Documents Required',
  FEE_PENDING = 'Fee Pending',
}

export interface ISrTransfer {
  fileId: Types.ObjectId;
  transferTypeId: Types.ObjectId;
  sellerMemId: Types.ObjectId;
  buyerMemId: Types.ObjectId;
  applicationId?: Types.ObjectId;

  ndcDocPath?: string; // NEW: NDC document path
  transferFeePaid: boolean;
  transferFeeAmount?: number;
  transferFeePaidDate?: Date;
  transferInitDate: Date;
  transferExecutionDate?: Date; // NEW: Actual signing date
  witness1Name?: string; // NEW
  witness1CNIC?: string; // NEW
  witness2Name?: string; // NEW
  witness2CNIC?: string; // NEW
  officerName?: string; // NEW: Society officer
  officerDesignation?: string; // NEW: Officer designation
  transfIsAtt: boolean;
  transfClearanceCertPath?: string;
  nomineeId?: Types.ObjectId;
  status: TransferStatus;
  remarks?: string;
  legalReviewNotes?: string;
  cancellationReason?: string;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  file?: any;
  transferType?: any;
  seller?: any;
  buyer?: any;
  application?: any;
  ndc?: any;
  nominee?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  transferAge?: number;
  statusBadgeColor?: string;
  isOverdue?: boolean;
}

// Use untyped Schema to avoid extremely deep Mongoose generic types
const srTransferSchema = new Schema(
  {
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },
    transferTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'SrTransferType',
      required: true,
      index: true,
    },
    sellerMemId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    buyerMemId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
    },

    ndcDocPath: {
      type: String,
      trim: true,
    },
    transferFeePaid: {
      type: Boolean,
      default: false,
      index: true,
    },
    transferFeeAmount: {
      type: Number,
      min: [0, 'Transfer fee amount cannot be negative'],
    },
    transferFeePaidDate: {
      type: Date,
      index: true,
    },
    transferInitDate: {
      type: Date,
      required: [true, 'Transfer initiation date is required'],
      index: true,
    },
    transferExecutionDate: {
      type: Date,
      index: true,
    },
    witness1Name: {
      type: String,
      trim: true,
      maxlength: [100, 'Witness 1 name cannot exceed 100 characters'],
    },
    witness1CNIC: {
      type: String,
      trim: true,
      match: [/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, 'Please provide a valid CNIC (XXXXX-XXXXXXX-X)'],
    },
    witness2Name: {
      type: String,
      trim: true,
      maxlength: [100, 'Witness 2 name cannot exceed 100 characters'],
    },
    witness2CNIC: {
      type: String,
      trim: true,
      match: [/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, 'Please provide a valid CNIC (XXXXX-XXXXXXX-X)'],
    },
    officerName: {
      type: String,
      trim: true,
      maxlength: [100, 'Officer name cannot exceed 100 characters'],
    },
    officerDesignation: {
      type: String,
      trim: true,
      maxlength: [100, 'Officer designation cannot exceed 100 characters'],
    },
    transfIsAtt: {
      type: Boolean,
      default: false,
      index: true,
    },
    transfClearanceCertPath: {
      type: String,
      trim: true,
      maxlength: [500, 'Clearance certificate path cannot exceed 500 characters'],
    },
    nomineeId: {
      type: Schema.Types.ObjectId,
      ref: 'Nominee',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TransferStatus),
      default: TransferStatus.PENDING,
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },
    legalReviewNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Legal review notes cannot exceed 2000 characters'],
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
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
    isActive: {
      type: Boolean,
      default: true,
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
srTransferSchema.index({ fileId: 1, isDeleted: 1 });
srTransferSchema.index({ sellerMemId: 1, buyerMemId: 1 });
srTransferSchema.index({ status: 1, isActive: 1 });
srTransferSchema.index({ transferTypeId: 1, isDeleted: 1 });
srTransferSchema.index({ transferInitDate: -1, status: 1 });
srTransferSchema.index({ transferFeePaid: 1, status: 1 });
srTransferSchema.index({ ndcDocPath: 1, transfIsAtt: 1 });

// Text index for search
srTransferSchema.index(
  {
    witness1Name: 'text',
    witness2Name: 'text',
    officerName: 'text',
    remarks: 'text',
    legalReviewNotes: 'text',
    cancellationReason: 'text',
  },
  {
    weights: {
      witness1Name: 5,
      witness2Name: 5,
      officerName: 5,
      remarks: 3,
      legalReviewNotes: 2,
      cancellationReason: 2,
    },
    name: 'transfer_text_search',
  }
);

// Virtual for file
srTransferSchema.virtual('file', {
  ref: 'File',
  localField: 'fileId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for transfer type
srTransferSchema.virtual('transferType', {
  ref: 'SrTransferType',
  localField: 'transferTypeId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for seller
srTransferSchema.virtual('seller', {
  ref: 'Member',
  localField: 'sellerMemId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for buyer
srTransferSchema.virtual('buyer', {
  ref: 'Member',
  localField: 'buyerMemId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for application
srTransferSchema.virtual('application', {
  ref: 'Application',
  localField: 'applicationId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for nominee
srTransferSchema.virtual('nominee', {
  ref: 'Nominee',
  localField: 'nomineeId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for created by user
srTransferSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for modified by user
srTransferSchema.virtual('modifiedByUser', {
  ref: 'UserStaff',
  localField: 'modifiedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for transfer age in days
srTransferSchema.virtual('transferAge').get(function () {
  const now = new Date();
  const initDate = new Date(this.transferInitDate);
  const diffTime = Math.abs(now.getTime() - initDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for status badge color
srTransferSchema.virtual('statusBadgeColor').get(function () {
  const colors: Record<string, string> = {
    [TransferStatus.PENDING]: 'warning',
    [TransferStatus.UNDER_REVIEW]: 'info',
    [TransferStatus.APPROVED]: 'primary',
    [TransferStatus.REJECTED]: 'danger',
    [TransferStatus.COMPLETED]: 'success',
    [TransferStatus.CANCELLED]: 'secondary',
    [TransferStatus.ON_HOLD]: 'dark',
    [TransferStatus.DOCUMENTS_REQUIRED]: 'orange',
    [TransferStatus.FEE_PENDING]: 'purple',
  };
  return colors[this.status] || 'secondary';
});

// Virtual to check if transfer is overdue (> 30 days pending)
srTransferSchema.virtual('isOverdue').get(function () {
  if (this.status !== TransferStatus.PENDING && this.status !== TransferStatus.FEE_PENDING) {
    return false;
  }

  const now = new Date();
  const initDate = new Date(this.transferInitDate);
  const diffTime = Math.abs(now.getTime() - initDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 30;
});

// Pre-save middleware
srTransferSchema.pre('save', function (next) {
  const doc = this as any;
  // Format CNICs
  if (doc.isModified('witness1CNIC') && doc.witness1CNIC) {
    doc.witness1CNIC = srTransferSchema.methods.formatCNIC(doc.witness1CNIC);
  }

  if (doc.isModified('witness2CNIC') && doc.witness2CNIC) {
    doc.witness2CNIC = srTransferSchema.methods.formatCNIC(doc.witness2CNIC);
  }

  // Set transfer execution date if status changes to COMPLETED
  if (
    this.isModified('status') &&
    this.status === TransferStatus.COMPLETED &&
    !this.transferExecutionDate
  ) {
    this.transferExecutionDate = new Date();
  }

  // Set cancellation date if status changes to CANCELLED
  if (
    this.isModified('status') &&
    this.status === TransferStatus.CANCELLED &&
    !this.cancellationReason
  ) {
    this.cancellationReason = 'Cancelled by system';
  }

  next();
});

// Pre-update middleware
srTransferSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update) {
    // Format CNICs if being updated
    if (update.witness1CNIC) {
      update.witness1CNIC = srTransferSchema.methods.formatCNIC(update.witness1CNIC);
    }

    if (update.witness2CNIC) {
      update.witness2CNIC = srTransferSchema.methods.formatCNIC(update.witness2CNIC);
    }

    // Set transfer execution date if status changes to COMPLETED
    if (update.status === TransferStatus.COMPLETED && !update.transferExecutionDate) {
      update.transferExecutionDate = new Date();
    }

    // Update fee paid date if fee status changes
    if (update.transferFeePaid === true && !update.transferFeePaidDate) {
      update.transferFeePaidDate = new Date();
    }

    // Set officer designation if not provided
    if (update.officerName && !update.officerDesignation) {
      update.officerDesignation = 'Society Officer';
    }
  }

  next();
});

// Method to format CNIC
srTransferSchema.methods.formatCNIC = function (cnic: string): string {
  let formatted = cnic.replace(/[^\d-]/g, '');
  if (!formatted.includes('-') && formatted.length === 13) {
    formatted = `${formatted.slice(0, 5)}-${formatted.slice(5, 12)}-${formatted.slice(12)}`;
  }
  return formatted;
};

// Static method to find by file
srTransferSchema.statics.findByFile = function (fileId: string) {
  return this.find({
    fileId: new Types.ObjectId(fileId),
    isDeleted: false,
  })
    .populate('transferType', 'typeName transferFee')
    .populate('seller', 'fullName cnic')
    .populate('buyer', 'fullName cnic')
    .sort({ transferInitDate: -1 });
};

// Static method to find pending transfers
srTransferSchema.statics.findPending = function (page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const query = {
    status: { $in: [TransferStatus.PENDING, TransferStatus.FEE_PENDING] },
    isDeleted: false,
    isActive: true,
  };

  return Promise.all([
    this.find(query)
      .populate('file', 'fileRegNo')
      .populate('seller', 'fullName')
      .populate('buyer', 'fullName')
      .populate('transferType', 'typeName')
      .sort({ transferInitDate: 1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);
};

// Static method to find by member (as seller or buyer)
srTransferSchema.statics.findByMember = function (memId: string) {
  return this.find({
    $or: [{ sellerMemId: new Types.ObjectId(memId) }, { buyerMemId: new Types.ObjectId(memId) }],
    isDeleted: false,
    isActive: true,
  })
    .populate('file', 'fileRegNo plotId')
    .populate('transferType', 'typeName')
    .populate('seller', 'fullName cnic')
    .populate('buyer', 'fullName cnic')
    .sort({ transferInitDate: -1 });
};

// Static method to get transfer statistics
srTransferSchema.statics.getStatistics = function () {
  return this.aggregate([
    {
      $match: { isDeleted: false },
    },
    {
      $group: {
        _id: null,
        totalTransfers: { $sum: 1 },
        pendingTransfers: {
          $sum: { $cond: [{ $eq: ['$status', TransferStatus.PENDING] }, 1, 0] },
        },
        completedTransfers: {
          $sum: { $cond: [{ $eq: ['$status', TransferStatus.COMPLETED] }, 1, 0] },
        },
        cancelledTransfers: {
          $sum: { $cond: [{ $eq: ['$status', TransferStatus.CANCELLED] }, 1, 0] },
        },
        feePendingTransfers: {
          $sum: { $cond: [{ $eq: ['$status', TransferStatus.FEE_PENDING] }, 1, 0] },
        },
        totalFeeCollected: { $sum: '$transferFeeAmount' },
        byStatus: {
          $push: {
            status: '$status',
            fee: '$transferFeeAmount',
          },
        },
      },
    },
  ]);
};

// Define interface for static methods
interface ISrTransferModel extends Model<ISrTransfer> {
  findByFile(fileId: string): Promise<ISrTransfer[]>;
  findPending(page: number, limit: number): Promise<[ISrTransfer[], number]>;
  findByMember(memId: string): Promise<ISrTransfer[]>;
  getStatistics(): Promise<any[]>;
}

// Create and export model while avoiding overly complex union types error
const SrTransfer = model<ISrTransfer, ISrTransferModel>('SrTransfer', srTransferSchema);

export default SrTransfer;
