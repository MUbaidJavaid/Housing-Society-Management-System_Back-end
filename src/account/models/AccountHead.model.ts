// src/models/account/AccountHead.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IAccountHead } from '../types/account.types';

export interface IAccountHeadDocument extends IAccountHead, Document {}

const AccountHeadSchema = new Schema<IAccountHeadDocument>(
  {
    accountHeadId: { type: Number, required: true, unique: true },
    accountHeadName: { type: String, required: true, trim: true },
    accountMasterId: {
      type: Schema.Types.Mixed,
      required: true,
      ref: 'FinalAccount',
    },
    bookId: {
      type: Schema.Types.Mixed,
      required: true,
      ref: 'Book',
    },
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
    collection: 'account_heads',
  }
);

// Indexes
AccountHeadSchema.index({ accountHeadName: 1 });
AccountHeadSchema.index({ accountMasterId: 1, bookId: 1 });

export const AccountHead = mongoose.model<IAccountHeadDocument>('AccountHead', AccountHeadSchema);
