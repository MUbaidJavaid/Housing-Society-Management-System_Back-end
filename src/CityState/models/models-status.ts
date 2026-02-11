// models-status.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IStatus extends Document {
  statusName: string;
  statusDescription?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const statusSchema = new Schema<IStatus>(
  {
    statusName: {
      type: String,
      required: [true, 'Status Name is required'],
      trim: true,
      minlength: [2, 'Status Name must be at least 2 characters'],
      maxlength: [100, 'Status Name cannot exceed 100 characters'],
      index: true,
    },

    statusDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
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

// Compound index for name uniqueness
statusSchema.index(
  { statusName: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Text index for search
statusSchema.index(
  { statusName: 'text', statusDescription: 'text' },
  {
    weights: { statusName: 10, statusDescription: 5 },
    name: 'status_text_search',
  }
);

const CityStatus: Model<IStatus> =
  (mongoose.models.CityStatus as Model<IStatus>) ||
  mongoose.model<IStatus>('CityStatus', statusSchema);

export default CityStatus;
