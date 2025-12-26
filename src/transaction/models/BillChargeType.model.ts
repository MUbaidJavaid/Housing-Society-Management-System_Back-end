import { Schema, model } from 'mongoose';
import { IBillChargeType } from '../types/transaction.types';

const billChargeTypeSchema = new Schema<IBillChargeType>(
  {
    billChargeTypeId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    billChargeName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

export const BillChargeType = model<IBillChargeType>('BillChargeType', billChargeTypeSchema);
