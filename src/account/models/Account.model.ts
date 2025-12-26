// src/models/account/Account.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IAccount } from '../types/account.types';

export interface IAccountDocument extends IAccount, Document {}

const AccountSchema = new Schema<IAccountDocument>(
  {
    accountId: { type: Number, required: true, unique: true },
    accountName: { type: String, required: true, trim: true },
    accountHeadId: {
      type: Schema.Types.Mixed, // Can be number or ObjectId reference
      required: true,
      ref: 'AccountHead',
    },
    address1: { type: String, required: true, trim: true },
    address2: { type: String, trim: true },
    address3: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true },
    TINNo: { type: String, trim: true },
    CSTNo: { type: String, trim: true },
    remarks: { type: String },
    openingBalance: { type: Number, default: 0, min: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdOn: { type: Date, default: Date.now },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    modifiedOn: { type: Date, default: Date.now },
    code: { type: String, trim: true },
    memCNIC: { type: String, trim: true },
    memberId: { type: Number },
    cityId: { type: Number },
  },
  {
    timestamps: false, // We're using custom timestamp fields
    collection: 'accounts',
  }
);

// Compound indexes for frequently queried fields
AccountSchema.index({ accountName: 1 });
AccountSchema.index({ accountHeadId: 1 });
AccountSchema.index({ createdBy: 1, createdOn: -1 });

export const Account = mongoose.model<IAccountDocument>('Account', AccountSchema);
