// src/models/File.model.ts
import mongoose, { Schema } from 'mongoose';
import { IFile } from '../types/file.types';

const FileSchema: Schema = new Schema(
  {
    FileID: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    ProjID: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    MemID: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      index: true,
    },
    PlotID: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      index: true,
    },
    FileRegNo: {
      type: String,
      index: true,
    },
    FileAppNo: String,
    StatusID: {
      type: Number,
      default: 0,
    },
    BookOffID: {
      type: Schema.Types.ObjectId,
      ref: 'BookOffice',
    },
    BookOffPerson: String,
    BookDate: Date,
    BatchID: Number,
    PlotTypeID: {
      type: Schema.Types.ObjectId,
      ref: 'PlotType',
    },
    PlotSizeID: {
      type: Schema.Types.ObjectId,
      ref: 'PlotSize',
    },
    PlotBlockID: {
      type: Schema.Types.ObjectId,
      ref: 'PlotBlock',
    },
    FileNomName: String,
    FileNomNic: String,
    FileNomFHName: String,
    FileNomRelation: String,
    FileNomImg: {
      type: Buffer,
      select: false,
    },
    FileRemarks: String,
    PlotNo: String,
    MemRegNo: String,
    ApplicationDate: Date,
    installment: String,
    installmentAmount: String,

    // Additional fields
    OID_scheme_type_code: String,
    OID_phase_code: String,
    OID_member_code: String,
    FileBarCd: String,
    FileIsAdj: {
      type: Boolean,
      default: false,
    },
    FileAdjRequest: String,
    SrBookTypeID: Number,
    RRID: {
      type: Schema.Types.ObjectId,
      ref: 'RateReference',
    },
    Temp_DataImport: {
      type: Boolean,
      default: false,
    },
    Temp_PlotID: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
FileSchema.index({ MemID: 1, PlotID: 1 });
FileSchema.index({ FileRegNo: 1, StatusID: 1 });
FileSchema.index({ PlotID: 1, StatusID: 1 });

// Virtual population for related data
FileSchema.virtual('member', {
  ref: 'Member',
  localField: 'MemID',
  foreignField: '_id',
  justOne: true,
});

FileSchema.virtual('plot', {
  ref: 'Plot',
  localField: 'PlotID',
  foreignField: '_id',
  justOne: true,
});

export default mongoose.model<IFile>('File', FileSchema);
