import { Document, Model, Schema, Types, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IImportLogError {
  row: number;
  field: string;
  message: string;
  data?: any;
}

export interface IImportLog extends Omit<Document, 'errors'> {
  importId: string;
  societyId: Types.ObjectId;
  entityType: string;
  fileName: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  status: string;
  errors: IImportLogError[];
  importedBy: Types.ObjectId;
  completedAt?: Date;
  metadata?: any;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const importLogSchema = new Schema<IImportLog>(
  {
    importId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },
    entityType: {
      type: String,
      enum: ['member', 'plot', 'bill', 'payment', 'installment', 'visitor'],
      required: [true, 'Entity type is required'],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    errors: [
      {
        row: { type: Number },
        field: { type: String },
        message: { type: String },
        data: { type: Schema.Types.Mixed },
      },
    ],
    importedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Imported by user is required'],
      index: true,
    },
    completedAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

importLogSchema.index({ societyId: 1, entityType: 1, status: 1 });
importLogSchema.index({ importedBy: 1, isDeleted: 1 });
importLogSchema.index({ createdAt: -1 });

const ImportLog: Model<IImportLog> = model<IImportLog>('ImportLog', importLogSchema);

export default ImportLog;
