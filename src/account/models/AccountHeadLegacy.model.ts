// src/models/estate/AccountHeadLegacy.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IAccountHeadLegacy } from '../../estate/types/estate.types';

export interface IAccountHeadLegacyDocument extends IAccountHeadLegacy, Document {}

const AccountHeadLegacySchema = new Schema<IAccountHeadLegacyDocument>(
  {
    acHdId: { type: Number, required: true, unique: true },
    acHdName: { type: String, trim: true },
    acHdIsBasic: { type: Boolean },
    acHdIsNegative: { type: Boolean },
    acHdIdDefAmnt: { type: Number },
    acHdIdRemarks: { type: String, trim: true },
  },
  {
    timestamps: false,
    collection: 'account_head_legacy',
  }
);

AccountHeadLegacySchema.index({ acHdName: 1 });

export const AccountHeadLegacy = mongoose.model<IAccountHeadLegacyDocument>(
  'AccountHeadLegacy',
  AccountHeadLegacySchema
);
