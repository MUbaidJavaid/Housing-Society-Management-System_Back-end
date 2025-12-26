import { Schema, model } from 'mongoose';
import { IBillConsumerMonth } from '../types/transaction.types';

const billConsumerMonthSchema = new Schema<IBillConsumerMonth>(
  {
    billConsumerMonthId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    billTemplateMonthId: {
      type: Number,
      index: true,
    },
    fileId: {
      type: Number,
      index: true,
    },
    arrears: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: Boolean,
      default: false,
    },
    surchargeApplied: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBill: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    billPayedDate: {
      type: Date,
    },
    billIssueDate: {
      type: Date,
      required: true,
    },
    billDueDate: {
      type: Date,
      required: true,
    },
    billMonth: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    billChargesValues: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    billRecievedBy: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    billEmailSent: {
      type: Boolean,
      default: false,
    },
    installment: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Indexes for performance
billConsumerMonthSchema.index({ fileId: 1, billMonth: 1 });
billConsumerMonthSchema.index({ status: 1, billDueDate: 1 });
billConsumerMonthSchema.index({ billConsumerMonthId: 1, fileId: 1 });

// Virtual for remaining amount
billConsumerMonthSchema.virtual('remainingAmount').get(function () {
  const total = this.totalBill || 0;
  const paid = this.amountPaid || 0;
  return Math.max(0, total - paid);
});

export const BillConsumerMonth = model<IBillConsumerMonth>(
  'BillConsumerMonth',
  billConsumerMonthSchema
);
