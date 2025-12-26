// src/models/Defaulter.model.ts
import mongoose, { Schema } from 'mongoose';
import { IDefaulter } from '../types/defaulter.types';

const DefaulterSchema: Schema = new Schema(
  {
    DefaulterMemberID: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    PlotID: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      required: true,
      index: true,
    },
    Charges: {
      type: Number,
      default: 0,
    },
    InstallmentDueDate: String,
    TotalPayble: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    // Compound unique index matching SQL composite primary key
    _id: false, // We'll use the composite key as _id
  }
);

// Create compound index for unique constraint (mimicking SQL composite PK)
DefaulterSchema.index({ DefaulterMemberID: 1, PlotID: 1 }, { unique: true });

// Virtual for default _id using the composite key
DefaulterSchema.virtual('id').get(function () {
  return `${this.DefaulterMemberID}_${this.PlotID}`;
});

// Set the _id to be the virtual id
DefaulterSchema.set('toObject', { virtuals: true });
DefaulterSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IDefaulter>('Defaulter', DefaulterSchema);
