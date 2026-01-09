import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ISrDevStatus extends Document {
  srDevStatName: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const srDevStatusSchema = new Schema<ISrDevStatus>(
  {
    srDevStatName: {
      type: String,
      required: [true, 'Status Name is required'],
      trim: true,
      minlength: [2, 'Status Name must be at least 2 characters'],
      maxlength: [100, 'Status Name cannot exceed 100 characters'],
      index: true,
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
srDevStatusSchema.index(
  { srDevStatName: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

const SrDevStatus: Model<ISrDevStatus> = model<ISrDevStatus>('SrDevStatus', srDevStatusSchema);

export default SrDevStatus;
