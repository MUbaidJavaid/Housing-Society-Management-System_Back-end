import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IApplication extends Document {
  applicationDesc: string;
  applicationTypeID: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    applicationDesc: {
      type: String,
      required: [true, 'Application Description is required'],
      trim: true,
      minlength: [5, 'Application Description must be at least 5 characters'],
      maxlength: [1000, 'Application Description cannot exceed 1000 characters'],
      index: true,
    },

    applicationTypeID: {
      type: Schema.Types.ObjectId,
      ref: 'SrApplicationType',
      required: [true, 'Application Type is required'],
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

// Text index for search
applicationSchema.index(
  { applicationDesc: 'text' },
  {
    weights: {
      applicationDesc: 10,
    },
    name: 'application_text_search',
  }
);

// Indexes for performance
applicationSchema.index({ applicationTypeID: 1, isDeleted: 1 });
applicationSchema.index({ createdBy: 1, isDeleted: 1 });
applicationSchema.index({ createdAt: 1, isDeleted: 1 });

// Ensure virtuals are included
applicationSchema.set('toObject', { virtuals: true });
applicationSchema.set('toJSON', { virtuals: true });

const Application: Model<IApplication> = model<IApplication>('Application', applicationSchema);

export default Application;
