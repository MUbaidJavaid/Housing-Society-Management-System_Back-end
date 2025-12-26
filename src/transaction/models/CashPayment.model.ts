// src/models/transaction/CashPayment.model.ts (مکمل)
import mongoose, { Document, Schema } from 'mongoose';
import { ICashPayment } from '../types/transaction.types';

export interface ICashPaymentDocument extends ICashPayment, Document {}

const CashPaymentSchema = new Schema<ICashPaymentDocument>(
  {
    cPaymentId: { type: Number, required: true, unique: true },
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
      enum: ['CASH', 'DD', 'ONLINE', 'OTHER'],
      default: 'CASH',
    },
    receivedBy: { type: String, trim: true },
    receivedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isAuthorized: { type: Boolean, default: false, index: true },
    authorizedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    authorizedOn: { type: Date },
  },
  {
    timestamps: false,
    collection: 'cash_payments',
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

// Indexes
CashPaymentSchema.index({ voucherDate: -1, voucherNo: 1 });
CashPaymentSchema.index({ cAccountId: 1, voucherDate: -1 });
CashPaymentSchema.index({ paymentMode: 1, voucherDate: -1 });
CashPaymentSchema.index({ isAuthorized: 1, voucherDate: -1 });

// Virtual fields
CashPaymentSchema.virtual('formattedVoucherNo').get(function () {
  return `CP/${this.voucherDate.getFullYear()}/${this.voucherNo}`;
});

// Pre-save hook
CashPaymentSchema.pre('save', async function (next) {
  if (this.isNew) {
    if (!this.voucherNo) {
      const year = new Date().getFullYear();
      const count = await mongoose.model('CashPayment').countDocuments({
        voucherDate: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      });
      this.voucherNo = `CP${year.toString().slice(-2)}${(count + 1).toString().padStart(5, '0')}`;
    }
  }

  next();
});

export const CashPayment = mongoose.model<ICashPaymentDocument>('CashPayment', CashPaymentSchema);
