// src/models/transaction/BankPayment.model.ts (مکمل)
import mongoose, { Document, Schema } from 'mongoose';
import { IBankPayment } from '../types/transaction.types';

export interface IBankPaymentDocument extends IBankPayment, Document {}

const BankPaymentSchema = new Schema<IBankPaymentDocument>(
  {
    bPaymentId: { type: Number, required: true, unique: true },
    voucherNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    voucherDate: {
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
    paymentMode: {
      type: String,
      enum: ['CHEQUE', 'RTGS', 'NEFT', 'IMPS', 'OTHER'],
      default: 'CHEQUE',
    },
    bankName: { type: String, trim: true },
    chequeNo: { type: String, trim: true },
    chequeDate: { type: Date },
    isReconciled: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: false,
    collection: 'bank_payments',
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

// Indexes
BankPaymentSchema.index({ voucherDate: -1, voucherNo: 1 });
BankPaymentSchema.index({ cAccountId: 1, voucherDate: -1 });
BankPaymentSchema.index({ dAccountId: 1, voucherDate: -1 });
BankPaymentSchema.index({ paymentMode: 1, voucherDate: -1 });

// Virtual fields
BankPaymentSchema.virtual('formattedVoucherNo').get(function () {
  return `BP/${this.voucherDate.getFullYear()}/${this.voucherNo}`;
});

BankPaymentSchema.virtual('creditAccount', {
  ref: 'Account',
  localField: 'cAccountId',
  foreignField: 'accountId',
  justOne: true,
});

BankPaymentSchema.virtual('debitAccount', {
  ref: 'Account',
  localField: 'dAccountId',
  foreignField: 'accountId',
  justOne: true,
});

// Pre-save hook
BankPaymentSchema.pre('save', async function (next) {
  if (this.isNew) {
    if (!this.voucherNo) {
      const year = new Date().getFullYear();
      const count = await mongoose.model('BankPayment').countDocuments({
        voucherDate: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      });
      this.voucherNo = `BP${year.toString().slice(-2)}${(count + 1).toString().padStart(5, '0')}`;
    }

    if (!this.createdOn) {
      this.createdOn = new Date();
    }
  }

  if (this.isModified()) {
    this.modifiedOn = new Date();
  }

  next();
});

export const BankPayment = mongoose.model<IBankPaymentDocument>('BankPayment', BankPaymentSchema);
