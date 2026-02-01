import { Document, Model, Schema, Types, model } from 'mongoose';

export enum BillStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  PARTIALLY_PAID = 'Partially Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
  DISPUTED = 'Disputed',
}

export enum BillType {
  MEMBERSHIP_FEE = 'Membership Fee',
  MAINTENANCE_FEE = 'Maintenance Fee',
  ELECTRICITY = 'Electricity',
  WATER = 'Water',
  GAS = 'Gas',
  PROPERTY_TAX = 'Property Tax',
  LEGAL_FEE = 'Legal Fee',
  OTHER = 'Other',
}

export interface IBillInfo extends Document {
  billNo: string;
  billType: BillType;
  fileId: Types.ObjectId;
  memId: Types.ObjectId;
  billMonth: string; // Format: "January 2026"
  previousReading?: number;
  currentReading?: number;
  unitsConsumed?: number;
  billAmount: number;
  fineAmount: number;
  arrears: number;
  totalPayable: number;
  dueDate: Date;
  gracePeriodDays: number;
  status: BillStatus;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  file?: any;
  member?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  isOverdue?: boolean;
  daysOverdue?: number;
  totalPaid?: number;
  remainingBalance?: number;
}

const billInfoSchema = new Schema<IBillInfo>(
  {
    billNo: {
      type: String,
      required: [true, 'Bill number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [5, 'Bill number must be at least 5 characters'],
      maxlength: [50, 'Bill number cannot exceed 50 characters'],
      index: true,
    },
    billType: {
      type: String,
      enum: Object.values(BillType),
      required: [true, 'Bill type is required'],
      index: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },
    memId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    billMonth: {
      type: String,
      required: [true, 'Bill month is required'],
      trim: true,
      match: [
        /^[A-Za-z]+ \d{4}$/,
        'Bill month must be in format "Month Year" (e.g., "January 2026")',
      ],
      index: true,
    },
    previousReading: {
      type: Number,
      min: [0, 'Previous reading cannot be negative'],
    },
    currentReading: {
      type: Number,
      min: [0, 'Current reading cannot be negative'],
      validate: {
        validator: function (this: IBillInfo, value: number) {
          return !this.previousReading || value >= this.previousReading;
        },
        message: 'Current reading must be greater than or equal to previous reading',
      },
    },
    unitsConsumed: {
      type: Number,
      min: [0, 'Units consumed cannot be negative'],
    },
    billAmount: {
      type: Number,
      required: [true, 'Bill amount is required'],
      min: [0, 'Bill amount cannot be negative'],
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: [0, 'Fine amount cannot be negative'],
    },
    arrears: {
      type: Number,
      default: 0,
      min: [0, 'Arrears cannot be negative'],
    },
    totalPayable: {
      type: Number,
      required: [true, 'Total payable is required'],
      min: [0, 'Total payable cannot be negative'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    gracePeriodDays: {
      type: Number,
      default: 7,
      min: [0, 'Grace period days cannot be negative'],
      max: [30, 'Grace period days cannot exceed 30'],
    },
    status: {
      type: String,
      enum: Object.values(BillStatus),
      default: BillStatus.PENDING,
      index: true,
    },
    paymentDate: {
      type: Date,
      index: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
      maxlength: [50, 'Payment method cannot exceed 50 characters'],
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      maxlength: [100, 'Transaction ID cannot exceed 100 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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
billInfoSchema.index({ billNo: 1, isDeleted: 1 }, { unique: true });
billInfoSchema.index({ memId: 1, billMonth: 1, billType: 1 });
billInfoSchema.index({ status: 1, dueDate: 1 });
billInfoSchema.index({ fileId: 1, isActive: 1 });
billInfoSchema.index({ dueDate: -1, isActive: 1 });

// Text index for search
billInfoSchema.index(
  {
    billNo: 'text',
    billMonth: 'text',
    notes: 'text',
    transactionId: 'text',
  },
  {
    weights: {
      billNo: 10,
      billMonth: 5,
      transactionId: 8,
      notes: 3,
    },
    name: 'bill_info_text_search',
  }
);

// Virtual for file
billInfoSchema.virtual('file', {
  ref: 'File',
  localField: 'fileId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for member
billInfoSchema.virtual('member', {
  ref: 'Member',
  localField: 'memId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for created by user
billInfoSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for modified by user
billInfoSchema.virtual('modifiedByUser', {
  ref: 'UserStaff',
  localField: 'modifiedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual to check if bill is overdue
billInfoSchema.virtual('isOverdue').get(function () {
  if (this.status === BillStatus.PAID || this.status === BillStatus.CANCELLED) {
    return false;
  }

  const now = new Date();
  const graceEndDate = new Date(this.dueDate);
  graceEndDate.setDate(graceEndDate.getDate() + this.gracePeriodDays);

  return now > graceEndDate;
});

// Virtual for days overdue
billInfoSchema.virtual('daysOverdue').get(function () {
  if (this.status === BillStatus.PAID || this.status === BillStatus.CANCELLED || !this.isOverdue) {
    return 0;
  }

  const now = new Date();
  const graceEndDate = new Date(this.dueDate);
  graceEndDate.setDate(graceEndDate.getDate() + this.gracePeriodDays);

  const diffTime = Math.abs(now.getTime() - graceEndDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total paid amount (based on status)
billInfoSchema.virtual('totalPaid').get(function () {
  if (this.status === BillStatus.PAID) {
    return this.totalPayable;
  } else if (this.status === BillStatus.PARTIALLY_PAID) {
    // For partially paid, we assume 50% payment (adjust as needed)
    return this.totalPayable * 0.5;
  }
  return 0;
});

// Virtual for remaining balance
billInfoSchema.virtual('remainingBalance').get(function () {
  return this.totalPayable - (this.totalPaid ?? 0);
});

// Virtual for status badge color
billInfoSchema.virtual('statusBadgeColor').get(function () {
  const colors: Record<string, string> = {
    [BillStatus.PENDING]: 'warning',
    [BillStatus.PAID]: 'success',
    [BillStatus.PARTIALLY_PAID]: 'info',
    [BillStatus.OVERDUE]: 'danger',
    [BillStatus.CANCELLED]: 'secondary',
    [BillStatus.DISPUTED]: 'dark',
  };
  return colors[this.status] || 'secondary';
});

// Pre-save middleware
billInfoSchema.pre('save', function (next) {
  // Convert billNo to uppercase
  if (this.isModified('billNo')) {
    this.billNo = this.billNo.toUpperCase();
  }

  // Calculate units consumed if readings are provided
  if (this.isModified('currentReading') || this.isModified('previousReading')) {
    if (this.currentReading !== undefined && this.previousReading !== undefined) {
      this.unitsConsumed = this.currentReading - this.previousReading;
      if (this.unitsConsumed < 0) {
        this.unitsConsumed = 0;
      }
    }
  }

  // Calculate total payable
  if (
    this.isModified('billAmount') ||
    this.isModified('fineAmount') ||
    this.isModified('arrears')
  ) {
    this.totalPayable = this.billAmount + this.fineAmount + this.arrears;
  }

  // Auto-update status based on due date
  if (this.isModified('dueDate') || this.isModified('status')) {
    const now = new Date();
    const graceEndDate = new Date(this.dueDate);
    graceEndDate.setDate(graceEndDate.getDate() + this.gracePeriodDays);

    if (this.status === BillStatus.PENDING && now > graceEndDate) {
      this.status = BillStatus.OVERDUE;
    }
  }

  // Auto-generate bill number if not provided
  if (!this.billNo) {
    const prefix = this.billType.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    this.billNo = `${prefix}-${timestamp}-${random}`;
  }

  next();
});

// Pre-update middleware
billInfoSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update) {
    // Convert billNo to uppercase
    if (update.billNo) {
      update.billNo = update.billNo.toUpperCase();
    }

    // Calculate total payable if amount fields are updated
    if (
      update.billAmount !== undefined ||
      update.fineAmount !== undefined ||
      update.arrears !== undefined
    ) {
      const billAmount = update.billAmount || this.get('billAmount') || 0;
      const fineAmount = update.fineAmount || this.get('fineAmount') || 0;
      const arrears = update.arrears || this.get('arrears') || 0;
      update.totalPayable = billAmount + fineAmount + arrears;
    }

    // Update payment date if status changes to PAID
    if (update.status === BillStatus.PAID && !update.paymentDate) {
      update.paymentDate = new Date();
    }

    // Calculate units consumed if readings are updated
    if (update.currentReading !== undefined || update.previousReading !== undefined) {
      const currentReading = update.currentReading || this.get('currentReading');
      const previousReading = update.previousReading || this.get('previousReading');

      if (currentReading !== undefined && previousReading !== undefined) {
        update.unitsConsumed = currentReading - previousReading;
        if (update.unitsConsumed < 0) {
          update.unitsConsumed = 0;
        }
      }
    }
  }

  next();
});

// Static method to find by bill number
billInfoSchema.statics.findByBillNo = function (billNo: string) {
  return this.findOne({
    billNo: billNo.toUpperCase(),
    isDeleted: false,
  });
};

// Static method to find overdue bills
billInfoSchema.statics.findOverdueBills = function (page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const query = {
    status: BillStatus.OVERDUE,
    isDeleted: false,
    isActive: true,
  };

  return Promise.all([
    this.find(query)
      .populate('member', 'fullName cnic mobileNo')
      .populate('file', 'fileNo')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);
};

// Static method to find bills by member and month
billInfoSchema.statics.findByMemberAndMonth = function (memId: string, month: string) {
  return this.find({
    memId: new Types.ObjectId(memId),
    billMonth: month,
    isDeleted: false,
    isActive: true,
  })
    .populate('file', 'fileNo fileType')
    .sort({ dueDate: 1 });
};

// Static method to get bill statistics
billInfoSchema.statics.getStatistics = function (year?: number) {
  const matchStage: any = {
    isDeleted: false,
    isActive: true,
  };

  if (year) {
    matchStage.$expr = {
      $eq: [{ $year: '$createdAt' }, year],
    };
  }

  return this.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: null,
        totalBills: { $sum: 1 },
        totalAmount: { $sum: '$totalPayable' },
        totalPaid: {
          $sum: {
            $cond: [{ $eq: ['$status', BillStatus.PAID] }, '$totalPayable', 0],
          },
        },
        totalPending: {
          $sum: {
            $cond: [
              { $in: ['$status', [BillStatus.PENDING, BillStatus.PARTIALLY_PAID]] },
              '$totalPayable',
              0,
            ],
          },
        },
        totalOverdue: {
          $sum: {
            $cond: [{ $eq: ['$status', BillStatus.OVERDUE] }, '$totalPayable', 0],
          },
        },
        byType: {
          $push: {
            type: '$billType',
            amount: '$totalPayable',
          },
        },
      },
    },
  ]);
};

// Define interface for static methods
interface IBillInfoModel extends Model<IBillInfo> {
  findByBillNo(billNo: string): Promise<IBillInfo | null>;
  findOverdueBills(page: number, limit: number): Promise<[IBillInfo[], number]>;
  findByMemberAndMonth(memId: string, month: string): Promise<IBillInfo[]>;
  getStatistics(year?: number): Promise<any[]>;
}

// Create and export model
const BillInfo = model<IBillInfo, IBillInfoModel>('BillInfo', billInfoSchema);

export default BillInfo;
