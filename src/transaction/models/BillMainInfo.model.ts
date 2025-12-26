import { Schema, model } from 'mongoose';
import { IBillMainInfo } from '../types/transaction.types';

const billMainInfoSchema = new Schema<IBillMainInfo>(
  {
    billInfoId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    billInfoType: {
      type: Number,
      required: true,
      default: 1,
    },
    billInfoHeader: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    billInfoDescription: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    billInfoBankName: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    billInfoBankAddress: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    billInfoBankAccount: {
      type: String,
      trim: true,
      maxlength: 250,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

export const BillMainInfo = model<IBillMainInfo>('BillMainInfo', billMainInfoSchema);
