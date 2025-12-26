// src/models/system/AccountingYear.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IAccountingYear } from '../../estate/types/estate.types';

export interface IAccountingYearDocument extends IAccountingYear, Document {}

const AccountingYearSchema = new Schema<IAccountingYearDocument>(
  {
    accYrId: { type: Number, required: true, unique: true },
    accYr: { type: String, required: true, trim: true },
    databaseName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: false,
    collection: 'accounting_years',
  }
);

// Only one active accounting year at a time
AccountingYearSchema.index(
  { isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
AccountingYearSchema.index({ accYr: 1 });

export const AccountingYear = mongoose.model<IAccountingYearDocument>(
  'AccountingYear',
  AccountingYearSchema
);
