import { Schema, model } from 'mongoose';
import { IBatchHead } from '../types/transaction.types';

const batchHeadSchema = new Schema<IBatchHead>(
  {
    batchHdId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    batchId: {
      type: Number,
      ref: 'Batch',
      index: true,
    },
    acHdId: {
      type: Number,
      index: true,
    },
    batchHdDueDate: {
      type: Date,
      required: true,
    },
    batchHdAmnt: {
      type: Number,
      required: true,
      min: 0,
    },
    batchHdFineActive: {
      type: Boolean,
      default: false,
    },
    batchHdIsPrcnt: {
      type: Boolean,
      default: false, // false = Fixed amount, true = Percentage
    },
    batchHdFineAmnt: {
      type: Number,
      default: 0,
      min: 0,
    },
    batchHdRemarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Compound indexes
batchHeadSchema.index({ batchId: 1, batchHdDueDate: 1 });
batchHeadSchema.index({ acHdId: 1, batchHdDueDate: 1 });

batchHeadSchema.pre('save', function (next) {
  if (this.batchHdFineActive && this.batchHdDueDate && this.batchHdDueDate < new Date()) {
    // Auto-calculate fine based on due date
    // Implement fine calculation logic here
    console.log('Fine calculation triggered for batch head:', this.batchHdId);
  }
  next();
});

export const BatchHead = model<IBatchHead>('BatchHead', batchHeadSchema);
