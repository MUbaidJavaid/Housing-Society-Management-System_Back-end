import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPlotType extends Document {
  plotTypeName: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const plotTypeSchema = new Schema<IPlotType>(
  {
    plotTypeName: {
      type: String,
      required: [true, 'Plot Type Name is required'],
      trim: true,
      minlength: [2, 'Plot Type Name must be at least 2 characters'],
      maxlength: [100, 'Plot Type Name cannot exceed 100 characters'],
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

// Compound index for name uniqueness (excluding deleted)
plotTypeSchema.index(
  { plotTypeName: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Text index for search
plotTypeSchema.index(
  { plotTypeName: 'text' },
  {
    name: 'plottype_text_search',
  }
);

const PlotType: Model<IPlotType> = model<IPlotType>('PlotType', plotTypeSchema);

export default PlotType;
