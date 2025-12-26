import { model, Schema } from 'mongoose';
import { IBatch } from '../types/transaction.types';

const batchSchema = new Schema<IBatch>(
  {
    batchId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    projId: {
      type: Number,
      index: true,
    },
    plotSizeId: {
      type: Number,
      index: true,
    },
    srBookTypeId: {
      type: Number,
      index: true,
    },
    batchName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    batchRemarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    batchHeads: [
      {
        type: Number, // Using Number instead of ObjectId for compatibility
        ref: 'BatchHead',
      },
    ],
  },
  {
    timestamps: true,
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual population for batch heads
batchSchema.virtual('batchHeadsDetails', {
  ref: 'BatchHead',
  localField: 'batchHeads',
  foreignField: 'batchHdId',
  justOne: false,
});

export const Batch = model<IBatch>('Batch', batchSchema);
