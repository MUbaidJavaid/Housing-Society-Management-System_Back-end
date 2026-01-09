import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPlotBlock extends Document {
  plotBlockName: string;
  plotBlockDesc?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const plotBlockSchema = new Schema<IPlotBlock>(
  {
    plotBlockName: {
      type: String,
      required: [true, 'Plot Block Name is required'],
      trim: true,
      minlength: [2, 'Plot Block Name must be at least 2 characters'],
      maxlength: [100, 'Plot Block Name cannot exceed 100 characters'],
      index: true,
    },

    plotBlockDesc: {
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

// Compound index for name uniqueness (excluding deleted)
plotBlockSchema.index(
  { plotBlockName: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Text index for search
plotBlockSchema.index(
  { plotBlockName: 'text', plotBlockDesc: 'text' },
  {
    weights: { plotBlockName: 10, plotBlockDesc: 5 },
    name: 'plotblock_text_search',
  }
);

const PlotBlock: Model<IPlotBlock> = model<IPlotBlock>('PlotBlock', plotBlockSchema);

export default PlotBlock;
