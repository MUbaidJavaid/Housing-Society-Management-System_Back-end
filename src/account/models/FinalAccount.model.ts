// src/models/account/FinalAccount.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IFinalAccount } from '../types/account.types';

export interface IFinalAccountDocument extends IFinalAccount, Document {}

const FinalAccountSchema = new Schema<IFinalAccountDocument>(
  {
    accountMasterId: { type: Number, required: true, unique: true },
    finalAccountName: { type: String, required: true, trim: true },
    firstColumnType: { type: String, required: true, trim: true },
    firstColumnHeading: { type: String, required: true, trim: true },
    secondColumnHeading: { type: String, required: true, trim: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdOn: { type: Date, default: Date.now },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedOn: { type: Date, default: Date.now },
    code: { type: String, trim: true },
  },
  {
    timestamps: false,
    collection: 'final_accounts',
  }
);

FinalAccountSchema.index({ finalAccountName: 1 });
FinalAccountSchema.index({ code: 1 }, { sparse: true });

export const FinalAccount = mongoose.model<IFinalAccountDocument>(
  'FinalAccount',
  FinalAccountSchema
);
