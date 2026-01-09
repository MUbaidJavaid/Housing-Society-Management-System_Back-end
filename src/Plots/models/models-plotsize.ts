import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPlotSize extends Document {
  plotSizeName: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const plotSizeSchema = new Schema<IPlotSize>(
  {
    plotSizeName: {
      type: String,
      required: [true, 'Plot Size Name is required'],
      trim: true,
      minlength: [1, 'Plot Size Name must be at least 1 character'],
      maxlength: [50, 'Plot Size Name cannot exceed 50 characters'],
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
plotSizeSchema.index(
  { plotSizeName: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Text index for search
plotSizeSchema.index(
  { plotSizeName: 'text' },
  {
    name: 'plotsize_text_search',
  }
);

const PlotSize: Model<IPlotSize> = model<IPlotSize>('PlotSize', plotSizeSchema);

export default PlotSize;
