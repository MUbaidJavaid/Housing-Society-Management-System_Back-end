// src/models/transaction/CashReceipt.model.ts (مکمل)
import mongoose, { Document, Schema } from 'mongoose';
import { ICashReceipt } from '../types/transaction.types';

export interface ICashReceiptDocument extends ICashReceipt, Document {}

const CashReceiptSchema = new Schema<ICashReceiptDocument>(
  {
    cReceiptId: { type: Number, required: true, unique: true },
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
    receiptMode: {
      type: String,
      enum: ['CASH', 'CHEQUE', 'DD', 'ONLINE'],
      default: 'CASH',
    },
    receivedFrom: { type: String, trim: true },
    receivedFromId: { type: Number }, // Account ID
    isAuthorized: { type: Boolean, default: false, index: true },
    authorizedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    authorizedOn: { type: Date },
    bankName: { type: String, trim: true },
    chequeNo: { type: String, trim: true },
    chequeDate: { type: Date },
  },
  {
    timestamps: false,
    collection: 'cash_receipts',
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

// Indexes
CashReceiptSchema.index({ voucherDate: -1, voucherNo: 1 });
CashReceiptSchema.index({ cAccountId: 1, voucherDate: -1 });
CashReceiptSchema.index({ receiptMode: 1, voucherDate: -1 });
CashReceiptSchema.index({ isAuthorized: 1, voucherDate: -1 });

// Virtual fields
CashReceiptSchema.virtual('formattedVoucherNo').get(function () {
  return `CR/${this.voucherDate.getFullYear()}/${this.voucherNo}`;
});

// Pre-save hook
CashReceiptSchema.pre('save', async function (next) {
  if (this.isNew) {
    if (!this.voucherNo) {
      const year = new Date().getFullYear();
      const count = await mongoose.model('CashReceipt').countDocuments({
        voucherDate: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      });
      this.voucherNo = `CR${year.toString().slice(-2)}${(count + 1).toString().padStart(5, '0')}`;
    }
  }

  next();
});

export const CashReceipt = mongoose.model<ICashReceiptDocument>('CashReceipt', CashReceiptSchema);
