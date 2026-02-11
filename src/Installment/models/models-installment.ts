import { Document, Model, Schema, Types, model } from 'mongoose';

export enum InstallmentStatus {
  UNPAID = 'Unpaid',
  PARTIALLY_PAID = 'Partially Paid',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
  REFUNDED = 'Refunded',
}

export enum InstallmentType {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  HALF_YEARLY = 'Half-Yearly',
  YEARLY = 'Yearly',
  BALLOON = 'Balloon',
  DOWN_PAYMENT = 'Down Payment',
  POSSESSION_FEE = 'Possession Fee',
  BALLOTING_FEE = 'Balloting Fee',
  UTILITY_CHARGES = 'Utility Charges',
  DEVELOPMENT_CHARGES = 'Development Charges',
  LEGAL_FEE = 'Legal Fee',
  TRANSFER_FEE = 'Transfer Fee',
  OTHER = 'Other',
}

export enum PaymentMode {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  CHEQUE = 'Cheque',
  ONLINE_PAYMENT = 'Online Payment',
  CREDIT_CARD = 'Credit Card',
  DEBIT_CARD = 'Debit Card',
  MOBILE_WALLET = 'Mobile Wallet',
}

export interface IInstallment extends Document {
  fileId: Types.ObjectId;
  memId: Types.ObjectId;
  plotId: Types.ObjectId;
  installmentCategoryId: Types.ObjectId;
  installmentNo: number;
  installmentTitle: string;
  installmentType: InstallmentType;
  dueDate: Date;
  amountDue: number;
  lateFeeSurcharge?: number;
  totalPayable: number;
  amountPaid: number;
  balanceAmount: number;
  paidDate?: Date;
  paymentMode?: PaymentMode;
  transactionRefNo?: string;
  status: InstallmentStatus;
  installmentRemarks?: string;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  file?: any;
  member?: any;
  plot?: any;
  installmentCategory?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  isOverdue?: boolean;
  daysOverdue?: number;
  paymentStatusColor?: string;
}

const installmentSchema = new Schema<IInstallment>(
  {
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
    plotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      required: true,
      index: true,
    },
    installmentCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'InstallmentCategory',
      required: true,
      index: true,
    },
    installmentNo: {
      type: Number,
      required: [true, 'Installment number is required'],
      min: [1, 'Installment number must be at least 1'],
      index: true,
    },
    installmentTitle: {
      type: String,
      required: [true, 'Installment title is required'],
      trim: true,
      maxlength: [200, 'Installment title cannot exceed 200 characters'],
    },
    installmentType: {
      type: String,
      enum: Object.values(InstallmentType),
      required: [true, 'Installment type is required'],
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    amountDue: {
      type: Number,
      required: [true, 'Amount due is required'],
      min: [0, 'Amount due cannot be negative'],
    },
    lateFeeSurcharge: {
      type: Number,
      min: [0, 'Late fee surcharge cannot be negative'],
      default: 0,
    },
    totalPayable: {
      type: Number,
      required: [true, 'Total payable is required'],
      min: [0, 'Total payable cannot be negative'],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    balanceAmount: {
      type: Number,
      default: 0,
      min: [0, 'Balance amount cannot be negative'],
    },
    paidDate: {
      type: Date,
      index: true,
    },
    paymentMode: {
      type: String,
      enum: Object.values(PaymentMode),
      index: true,
    },
    transactionRefNo: {
      type: String,
      trim: true,
      maxlength: [100, 'Transaction reference number cannot exceed 100 characters'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(InstallmentStatus),
      default: InstallmentStatus.UNPAID,
      index: true,
    },
    installmentRemarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
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
installmentSchema.index({ fileId: 1, installmentNo: 1 });
installmentSchema.index({ memId: 1, status: 1 });
installmentSchema.index({ plotId: 1, dueDate: 1 });
installmentSchema.index({ status: 1, dueDate: 1 });
installmentSchema.index({ dueDate: 1, isDeleted: 1 });
installmentSchema.index({ installmentCategoryId: 1, status: 1 });
installmentSchema.index({ createdBy: 1, createdAt: -1 });

// Text index for search
installmentSchema.index(
  {
    installmentTitle: 'text',
    transactionRefNo: 'text',
    installmentRemarks: 'text',
  },
  {
    weights: {
      installmentTitle: 5,
      transactionRefNo: 4,
      installmentRemarks: 3,
    },
    name: 'installment_text_search',
  }
);

// Virtual for file
installmentSchema.virtual('file', {
  ref: 'File',
  localField: 'fileId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for member
installmentSchema.virtual('member', {
  ref: 'Member',
  localField: 'memId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for plot
installmentSchema.virtual('plot', {
  ref: 'Plot',
  localField: 'plotId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for installment category
installmentSchema.virtual('installmentCategory', {
  ref: 'InstallmentCategory',
  localField: 'installmentCategoryId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for created by user
installmentSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for modified by user
installmentSchema.virtual('modifiedByUser', {
  ref: 'UserStaff',
  localField: 'modifiedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual to check if installment is overdue
installmentSchema.virtual('isOverdue').get(function () {
  if (this.status === InstallmentStatus.PAID || this.status === InstallmentStatus.CANCELLED) {
    return false;
  }

  const now = new Date();
  return this.dueDate < now;
});

// Virtual for days overdue
installmentSchema.virtual('daysOverdue').get(function () {
  if (!this.isOverdue) {
    return 0;
  }

  const now = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = Math.abs(now.getTime() - dueDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for payment status color
installmentSchema.virtual('paymentStatusColor').get(function () {
  const colors: Record<string, string> = {
    [InstallmentStatus.UNPAID]: 'warning',
    [InstallmentStatus.PARTIALLY_PAID]: 'info',
    [InstallmentStatus.PAID]: 'success',
    [InstallmentStatus.OVERDUE]: 'danger',
    [InstallmentStatus.CANCELLED]: 'secondary',
    [InstallmentStatus.REFUNDED]: 'light',
  };
  return colors[this.status] || 'secondary';
});

// Helper function to calculate late fee
const calculateLateFee = (amountDue: number, daysOverdue: number): number => {
  if (daysOverdue <= 0) return 0;

  // Late fee formula: 0.5% per day, capped at 25% of amount due
  const dailyRate = 0.005; // 0.5%
  const maxLateFee = amountDue * 0.25; // 25% cap
  const calculatedFee = amountDue * dailyRate * daysOverdue;

  return Math.min(calculatedFee, maxLateFee);
};

// Pre-save middleware
installmentSchema.pre('save', function (next) {
  const doc = this as any;

  // Calculate total payable
  doc.totalPayable = doc.amountDue + (doc.lateFeeSurcharge || 0);

  // Calculate balance amount
  doc.balanceAmount = doc.totalPayable - doc.amountPaid;

  // Auto-update status based on payments
  if (doc.amountPaid === 0) {
    if (doc.dueDate < new Date() && doc.status !== InstallmentStatus.CANCELLED) {
      doc.status = InstallmentStatus.OVERDUE;
    } else if (doc.status !== InstallmentStatus.CANCELLED) {
      doc.status = InstallmentStatus.UNPAID;
    }
  } else if (doc.amountPaid >= doc.totalPayable) {
    doc.status = InstallmentStatus.PAID;
    doc.balanceAmount = 0;
    if (!doc.paidDate) {
      doc.paidDate = new Date();
    }
  } else if (doc.amountPaid > 0) {
    doc.status = InstallmentStatus.PARTIALLY_PAID;
  }

  // Calculate late fee if overdue
  if (
    doc.dueDate < new Date() &&
    doc.status !== InstallmentStatus.PAID &&
    doc.status !== InstallmentStatus.CANCELLED
  ) {
    const now = new Date();
    const dueDate = new Date(doc.dueDate);
    const diffTime = Math.abs(now.getTime() - dueDate.getTime());
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    doc.lateFeeSurcharge = calculateLateFee(doc.amountDue, daysOverdue);
    doc.totalPayable = doc.amountDue + doc.lateFeeSurcharge;
    doc.balanceAmount = doc.totalPayable - doc.amountPaid;
  }

  next();
});

// Pre-update middleware
installmentSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update) {
    // If amount paid is being updated, recalculate balance and status
    if (update.amountPaid !== undefined) {
      const totalPayable = update.totalPayable || 0;
      const amountPaid = update.amountPaid;

      // Calculate balance
      update.balanceAmount = totalPayable - amountPaid;

      // Update status based on payment
      if (amountPaid === 0) {
        update.status = InstallmentStatus.UNPAID;
      } else if (amountPaid >= totalPayable) {
        update.status = InstallmentStatus.PAID;
        update.balanceAmount = 0;
        if (!update.paidDate) {
          update.paidDate = new Date();
        }
      } else if (amountPaid > 0) {
        update.status = InstallmentStatus.PARTIALLY_PAID;
      }
    }

    // Set paid date if status changes to PAID
    if (update.status === InstallmentStatus.PAID && !update.paidDate) {
      update.paidDate = new Date();
    }
  }

  next();
});

// Static methods
interface IInstallmentModel extends Model<IInstallment> {
  findByFile(fileId: string): Promise<IInstallment[]>;
  findByMember(memId: string): Promise<IInstallment[]>;
  findByPlot(plotId: string): Promise<IInstallment[]>;
  findOverdue(): Promise<IInstallment[]>;
  findDueToday(): Promise<IInstallment[]>;
  getInstallmentSummary(memId: string): Promise<any>;
  findNextDue(memId: string): Promise<IInstallment | null>;
}

// Find by file
installmentSchema.statics.findByFile = function (fileId: string) {
  return this.find({
    fileId: new Types.ObjectId(fileId),
    isDeleted: false,
  })
    .populate('installmentCategory', 'instCatName instCatDescription')
    .populate('member', 'memName memNic')
    .populate('plot', 'plotNo plotSize')
    .sort({ installmentNo: 1 });
};

// Find by member
installmentSchema.statics.findByMember = function (memId: string) {
  return this.find({
    memId: new Types.ObjectId(memId),
    isDeleted: false,
  })
    .populate('installmentCategory', 'instCatName instCatDescription')
    .populate('file', 'fileRegNo')
    .populate('plot', 'plotNo plotSize')
    .sort({ dueDate: 1 });
};

// Find by plot
installmentSchema.statics.findByPlot = function (plotId: string) {
  return this.find({
    plotId: new Types.ObjectId(plotId),
    isDeleted: false,
  })
    .populate('installmentCategory', 'instCatName instCatDescription')
    .populate('member', 'memName memNic')
    .populate('file', 'fileRegNo')
    .sort({ dueDate: 1 });
};

// Find overdue installments
installmentSchema.statics.findOverdue = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    dueDate: { $lt: today },
    status: { $in: [InstallmentStatus.UNPAID, InstallmentStatus.PARTIALLY_PAID] },
    isDeleted: false,
  })
    .populate('member', 'memName memNic mobileNo')
    .populate('installmentCategory', 'instCatName')
    .populate('file', 'fileRegNo')
    .populate('plot', 'plotNo')
    .sort({ dueDate: 1 });
};

// Find installments due today
installmentSchema.statics.findDueToday = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    dueDate: { $gte: today, $lt: tomorrow },
    status: { $in: [InstallmentStatus.UNPAID, InstallmentStatus.PARTIALLY_PAID] },
    isDeleted: false,
  })
    .populate('member', 'memName memNic mobileNo')
    .populate('installmentCategory', 'instCatName')
    .populate('file', 'fileRegNo')
    .populate('plot', 'plotNo')
    .sort({ dueDate: 1 });
};

// Get installment summary for member
installmentSchema.statics.getInstallmentSummary = function (memId: string) {
  return this.aggregate([
    {
      $match: {
        memId: new Types.ObjectId(memId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalInstallments: { $sum: 1 },
        totalAmountDue: { $sum: '$amountDue' },
        totalAmountPaid: { $sum: '$amountPaid' },
        totalBalance: { $sum: '$balanceAmount' },
        totalLateFee: { $sum: '$lateFeeSurcharge' },
        byStatus: {
          $push: {
            status: '$status',
            amount: '$amountDue',
            paid: '$amountPaid',
            balance: '$balanceAmount',
          },
        },
        byCategory: {
          $push: {
            categoryId: '$installmentCategoryId',
            amount: '$amountDue',
            paid: '$amountPaid',
          },
        },
      },
    },
  ]);
};

// Find next due installment for member
installmentSchema.statics.findNextDue = function (memId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.findOne({
    memId: new Types.ObjectId(memId),
    dueDate: { $gte: today },
    status: { $in: [InstallmentStatus.UNPAID, InstallmentStatus.PARTIALLY_PAID] },
    isDeleted: false,
  })
    .populate('installmentCategory', 'instCatName instCatDescription')
    .populate('file', 'fileRegNo')
    .populate('plot', 'plotNo plotSize')
    .sort({ dueDate: 1 });
};

// Create and export model
const Installment = model<IInstallment, IInstallmentModel>('Installment', installmentSchema);

export default Installment;
