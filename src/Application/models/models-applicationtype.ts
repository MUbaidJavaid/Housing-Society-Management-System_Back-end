import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ISrApplicationType extends Document {
  applicationName: string;
  applicationDesc?: string;
  applicationFee: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
}

const srApplicationTypeSchema = new Schema<ISrApplicationType>(
  {
    applicationName: {
      type: String,
      required: [true, 'Application Name is required'],
      trim: true,
      minlength: [2, 'Application Name must be at least 2 characters'],
      maxlength: [100, 'Application Name cannot exceed 100 characters'],
      index: true,
    },

    applicationDesc: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    applicationFee: {
      type: Number,
      required: [true, 'Application Fee is required'],
      min: [0, 'Application Fee cannot be negative'],
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

    isActive: {
      type: Boolean,
      default: true,
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
srApplicationTypeSchema.index(
  { applicationName: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Text index for search
srApplicationTypeSchema.index(
  { applicationName: 'text', applicationDesc: 'text' },
  {
    weights: { applicationName: 10, applicationDesc: 5 },
    name: 'srapplicationtype_text_search',
  }
);

const SrApplicationType: Model<ISrApplicationType> = model<ISrApplicationType>(
  'SrApplicationType',
  srApplicationTypeSchema
);

export default SrApplicationType;
