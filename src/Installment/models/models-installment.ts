import { Document, Model, Schema, Types, model } from 'mongoose';

export enum InstallmentType {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
}

export enum InstallmentStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export interface IInstallment extends Document {
  memID: Types.ObjectId;
  plotID: Types.ObjectId;
  installmentNo: number;
  installmentType: InstallmentType;
  dueDate: Date;
  amountDue: number;
  amountPaid: number;
  lateFeeSurcharge?: number;
  discountApplied?: number;
  totalReceived: number;
  paidDate?: Date;
  paymentModeID?: Types.ObjectId;
  status: InstallmentStatus;
  installmentRemarks?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  remainingAmount: number;
  isDeleted: boolean;
  deletedAt?: Date;
}

const installmentSchema = new Schema<IInstallment>(
  {
    memID: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member ID is required'],
      index: true,
    },

    plotID: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      required: [true, 'Plot ID is required'],
      index: true,
    },

    installmentNo: {
      type: Number,
      required: [true, 'Installment Number is required'],
      min: [1, 'Installment Number must be at least 1'],
      index: true,
    },

    installmentType: {
      type: String,
      enum: Object.values(InstallmentType),
      required: [true, 'Installment Type is required'],
      index: true,
    },

    dueDate: {
      type: Date,
      required: [true, 'Due Date is required'],
      index: true,
    },

    amountDue: {
      type: Number,
      required: [true, 'Amount Due is required'],
      min: [0, 'Amount Due cannot be negative'],
      set: (val: number) => parseFloat(val.toFixed(2)),
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount Paid cannot be negative'],
      set: (val: number) => parseFloat(val.toFixed(2)),
    },

    lateFeeSurcharge: {
      type: Number,
      default: 0,
      min: [0, 'Late Fee cannot be negative'],
      set: (val: number) => parseFloat(val.toFixed(2)),
    },

    discountApplied: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      set: (val: number) => parseFloat(val.toFixed(2)),
    },

    totalReceived: {
      type: Number,
      default: 0,
      min: [0, 'Total Received cannot be negative'],
      set: (val: number) => parseFloat(val.toFixed(2)),
    },

    paidDate: {
      type: Date,
      index: true,
    },

    paymentModeID: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentMode',
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(InstallmentStatus),
      default: InstallmentStatus.PENDING,
      index: true,
    },

    installmentRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
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

// Compound index for unique installment per plot
installmentSchema.index(
  { plotID: 1, installmentNo: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Index for member and plot queries
installmentSchema.index({ memID: 1, dueDate: 1, isDeleted: 1 });
installmentSchema.index({ plotID: 1, dueDate: 1, isDeleted: 1 });
installmentSchema.index({ status: 1, dueDate: 1, isDeleted: 1 });

// Index for payment mode and date ranges
installmentSchema.index({ paymentModeID: 1, isDeleted: 1 });
installmentSchema.index({ dueDate: 1, isDeleted: 1 });
installmentSchema.index({ paidDate: 1, isDeleted: 1 });

// Text index for search
installmentSchema.index(
  { installmentRemarks: 'text' },
  {
    name: 'installment_text_search',
  }
);

// Virtual for remaining amount
installmentSchema.virtual('remainingAmount').get(function (this: IInstallment) {
  return parseFloat(
    (
      this.amountDue +
      (this.lateFeeSurcharge || 0) -
      this.amountPaid -
      (this.discountApplied || 0)
    ).toFixed(2)
  );
});

// Virtual for isOverdue
installmentSchema.virtual('isOverdue').get(function (this: IInstallment) {
  const now = new Date();
  return (
    this.status === InstallmentStatus.PENDING && this.dueDate < now && this.remainingAmount > 0
  );
});

// Virtual for payment percentage
installmentSchema.virtual('paymentPercentage').get(function (this: IInstallment) {
  if (this.amountDue <= 0) return 100;
  const paid = this.amountPaid + (this.discountApplied || 0);
  return Math.min(100, Math.round((paid / this.amountDue) * 100));
});

// Pre-save middleware to update totalReceived and status
installmentSchema.pre('save', function (next) {
  // Calculate total received
  this.totalReceived = this.amountPaid;

  // Update status based on amounts
  if (this.amountPaid >= this.amountDue) {
    this.status = InstallmentStatus.PAID;
    if (!this.paidDate) {
      this.paidDate = new Date();
    }
  } else if (this.amountPaid > 0) {
    this.status = InstallmentStatus.PARTIALLY_PAID;
  } else {
    // Check if overdue
    const now = new Date();
    if (this.dueDate < now) {
      this.status = InstallmentStatus.OVERDUE;
    } else {
      this.status = InstallmentStatus.PENDING;
    }
  }

  next();
});

// Ensure virtuals are included in toObject() and toJSON()
installmentSchema.set('toObject', { virtuals: true });
installmentSchema.set('toJSON', { virtuals: true });

const Installment: Model<IInstallment> = model<IInstallment>('Installment', installmentSchema);

export default Installment;
