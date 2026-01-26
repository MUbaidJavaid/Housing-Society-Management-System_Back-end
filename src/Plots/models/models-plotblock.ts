import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPlotBlock extends Document {
  projectId: Types.ObjectId; // Added: Foreign key to Project
  plotBlockName: string;
  plotBlockDesc?: string;
  blockTotalArea?: number; // Added
  blockAreaUnit?: string; // Added: e.g., 'acres', 'hectares', 'sqft'
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const plotBlockSchema = new Schema<IPlotBlock>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },

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

    blockTotalArea: {
      type: Number,
      min: [0, 'Area cannot be negative'],
      default: 0,
    },

    blockAreaUnit: {
      type: String,
      enum: {
        values: ['acres', 'hectares', 'sqft', 'sqm', 'km²'],
        message: '{VALUE} is not a valid area unit',
      },
      default: 'acres',
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
    timestamps: true, // This automatically creates createdAt and updatedAt
  }
);

// Compound index for name uniqueness within the same project
plotBlockSchema.index(
  { projectId: 1, plotBlockName: 1, isDeleted: 1 },
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

// Index for filtering by project
plotBlockSchema.index({ projectId: 1, isDeleted: 1 });

const PlotBlock: Model<IPlotBlock> = model<IPlotBlock>('PlotBlock', plotBlockSchema);

export default PlotBlock;
