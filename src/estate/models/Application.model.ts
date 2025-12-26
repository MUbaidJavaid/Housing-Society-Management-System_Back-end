// src/models/estate/Application.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IApplication } from '../types/estate.types';

export interface IApplicationDocument extends IApplication, Document {}

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    applicationId: { type: Number, required: true, unique: true },
    projId: { type: Number },
    memId: { type: Number },
    oidSchemeTypeCode: { type: String, trim: true },
    oidPhaseCode: { type: String, trim: true },
    oidMemberCode: { type: String, trim: true },
    applicationBarCd: { type: String, trim: true },
    applicationRegNo: { type: String, trim: true },
    applicationAppNo: { type: String, trim: true },
    statusId: { type: Number },
    tempPlotId: { type: Number },
    oidPlotTypeCode: { type: String, trim: true },
    applicationIsAdj: { type: Boolean, default: false },
    applicationAdjRequest: { type: String, trim: true },
    srBookTypeId: { type: Number },
    bookOffId: { type: Number },
    bookOffPerson: { type: String, trim: true },
    bookDate: { type: Date },
    batchId: { type: Number },
    plotTypeId: { type: Number },
    plotSizeId: { type: Number },
    plotBlockId: { type: Number },
    applicationNomName: { type: String, trim: true },
    applicationNomNic: { type: String, trim: true },
    applicationNomFHName: { type: String, trim: true },
    applicationNomRelation: { type: String, trim: true },
    applicationNomImg: { type: Buffer },
    tempDataImport: { type: Boolean, default: false },
    rrid: { type: Number },
    applicationRemarks: { type: String },
    plotNo: { type: String, trim: true },
    memRegNo: { type: String, trim: true },
    plotId: { type: Number },
  },
  {
    timestamps: false,
    collection: 'applications',
  }
);

// Indexes for frequently queried fields
ApplicationSchema.index({ applicationRegNo: 1 });
ApplicationSchema.index({ applicationAppNo: 1 });
ApplicationSchema.index({ memId: 1 });
ApplicationSchema.index({ statusId: 1 });
ApplicationSchema.index({ plotId: 1 });

export const Application = mongoose.model<IApplicationDocument>('Application', ApplicationSchema);
