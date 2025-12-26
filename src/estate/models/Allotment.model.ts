// src/models/estate/Allotment.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IAllotment } from '../types/estate.types';

export interface IAllotmentDocument extends IAllotment, Document {}

const AllotmentSchema = new Schema<IAllotmentDocument>(
  {
    allotId: { type: Number, required: true, unique: true },
    fileId: { type: Number },
    plotId: { type: Number },
    srRouteId: { type: Number },
    allotDate: { type: Date, default: Date.now },
    allotIsCollect: { type: Boolean, default: false },
    allotCollectName: { type: String, trim: true },
    allotCollectNic: { type: String, trim: true },
    allotAttach1: { type: Buffer },
    allotAttach2: { type: Buffer },
    allotRemarks: { type: String, trim: true },
    attach3: { type: Buffer },
    allotAttach3: { type: Buffer },
  },
  {
    timestamps: false,
    collection: 'allotments',
  }
);

// Indexes
AllotmentSchema.index({ fileId: 1 });
AllotmentSchema.index({ plotId: 1 });
AllotmentSchema.index({ allotDate: -1 });

export const Allotment = mongoose.model<IAllotmentDocument>('Allotment', AllotmentSchema);
