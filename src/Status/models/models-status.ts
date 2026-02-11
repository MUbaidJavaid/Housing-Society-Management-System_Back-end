import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IStatus extends Document {
  statusName: string;
  statusType?: string;
  description?: string;
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

    statusType: {
      type: String,
      trim: true,
      enum: ['general', 'member', 'plot', 'development', 'city', 'state', 'project'],
      default: 'general',
      index: true,
    },

    description: {
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

// Compound index for unique status name within type
statusSchema.index(
  { statusName: 1, statusType: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

const Status: Model<IStatus> =
  (mongoose.models.Status as Model<IStatus>) || mongoose.model<IStatus>('Status', statusSchema);

export default Status;
