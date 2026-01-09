import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IDevelopment extends Document {
  plotId: Types.ObjectId;
  memId: Types.ObjectId;
  developmentStatusName: string;
  applicationId: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedOn?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const developmentSchema = new Schema<IDevelopment>(
  {
    plotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      required: true,
      index: true,
    },

    memId: {
      type: Schema.Types.ObjectId,
      ref: 'Member', // Assuming you have a Member model
      required: true,
      index: true,
    },

    developmentStatusName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Status Name cannot exceed 100 characters'],
      index: true,
    },

    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'SrApplicationType',
      required: true,
      index: true,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    approvedOn: {
      type: Date,
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

// Compound index for unique development per plot
developmentSchema.index(
  { plotId: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Indexes for common queries
developmentSchema.index({ memId: 1, isDeleted: 1 });
developmentSchema.index({ applicationId: 1, isDeleted: 1 });
developmentSchema.index({ createdBy: 1, isDeleted: 1 });

const Development: Model<IDevelopment> = model<IDevelopment>('Development', developmentSchema);

export default Development;
