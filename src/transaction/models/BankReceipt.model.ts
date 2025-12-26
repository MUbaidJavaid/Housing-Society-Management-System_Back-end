// src/models/transaction/BankReceipt.model.ts (مکمل)
import mongoose, { Document, Schema } from 'mongoose';
import { IBankReceipt } from '../types/transaction.types';

export interface IBankReceiptDocument extends IBankReceipt, Document {}

const BankReceiptSchema = new Schema<IBankReceiptDocument>(
  {
    bReceiptId: { type: Number, required: true, unique: true },
    bReceiptNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    bReceiptDate: {
      type: Date,
      required: true,
      index: true,
      default: Date.now,
    },
    cAccountId: {
      type: Schema.Types.Mixed,
      required: true,
      ref: 'Account',
      index: true,
    },
    dAccountId: {
      type: Schema.Types.Mixed,
      required: true,
      ref: 'Account',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      get: (v: number) => Number(v.toFixed(2)),
      set: (v: number) => Number(v.toFixed(2)),
    },
    narration: { type: String, trim: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdOn: { type: Date, default: Date.now },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedOn: { type: Date },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED', 'REVERSED'],
      default: 'ACTIVE',
      index: true,
    },
    voucherType: {
      type: String,
      enum: ['BANK_RECEIPT', 'BANK_PAYMENT', 'CASH_RECEIPT', 'CASH_PAYMENT'],
      default: 'BANK_RECEIPT',
    },
    referenceNo: { type: String, trim: true },
    bankName: { type: String, trim: true },
    chequeNo: { type: String, trim: true },
    chequeDate: { type: Date },
    isReconciled: { type: Boolean, default: false, index: true },
    reconciledOn: { type: Date },
    reconciledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: false,
    collection: 'bank_receipts',
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

// Compound indexes
BankReceiptSchema.index({ bReceiptDate: -1, bReceiptNo: 1 });
BankReceiptSchema.index({ cAccountId: 1, bReceiptDate: -1 });
BankReceiptSchema.index({ dAccountId: 1, bReceiptDate: -1 });
BankReceiptSchema.index({ amount: 1, bReceiptDate: -1 });
BankReceiptSchema.index({ bankName: 1, chequeNo: 1 });

// Virtual fields
BankReceiptSchema.virtual('formattedReceiptNo').get(function () {
  return `BR/${this.bReceiptDate.getFullYear()}/${this.bReceiptNo}`;
});

BankReceiptSchema.virtual('creditAccount', {
  ref: 'Account',
  localField: 'cAccountId',
  foreignField: 'accountId',
  justOne: true,
});

BankReceiptSchema.virtual('debitAccount', {
  ref: 'Account',
  localField: 'dAccountId',
  foreignField: 'accountId',
  justOne: true,
});

// Pre-save hook for receipt number
BankReceiptSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Auto-generate receipt number if not provided
    if (!this.bReceiptNo) {
      const year = new Date().getFullYear();
      const count = await mongoose.model('BankReceipt').countDocuments({
        bReceiptDate: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      });
      this.bReceiptNo = `BR${year.toString().slice(-2)}${(count + 1).toString().padStart(5, '0')}`;
    }

    // Set createdOn if not set
    if (!this.createdOn) {
      this.createdOn = new Date();
    }
  }

  // Set modifiedOn on update
  if (this.isModified()) {
    this.modifiedOn = new Date();
  }

  next();
});

// Static methods
BankReceiptSchema.statics.findByAccount = function (
  accountId: number,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = {
    $or: [{ cAccountId: accountId }, { dAccountId: accountId }],
    status: 'ACTIVE',
  };

  if (startDate || endDate) {
    query.bReceiptDate = {};
    if (startDate) query.bReceiptDate.$gte = startDate;
    if (endDate) query.bReceiptDate.$lte = endDate;
  }

  return this.find(query).sort({ bReceiptDate: -1 });
};

BankReceiptSchema.statics.getReceiptSummary = async function (startDate: Date, endDate: Date) {
  const result = await this.aggregate([
    {
      $match: {
        bReceiptDate: { $gte: startDate, $lte: endDate },
        status: 'ACTIVE',
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$bReceiptDate' },
          year: { $year: '$bReceiptDate' },
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
  ]);

  return result;
};

export const BankReceipt = mongoose.model<IBankReceiptDocument>('BankReceipt', BankReceiptSchema);
