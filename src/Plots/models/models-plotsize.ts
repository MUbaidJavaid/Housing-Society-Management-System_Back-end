import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPlotSize extends Document {
  plotSizeName: string;
  totalArea: number;
  areaUnit: string;
  ratePerUnit: number;
  standardBasePrice: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const plotSizeSchema = new Schema<IPlotSize>(
  {
    plotSizeName: {
      type: String,
      required: [true, 'Plot Size Name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Plot Size Name must be at least 2 characters'],
      maxlength: [100, 'Plot Size Name cannot exceed 100 characters'],
      index: true,
    },

    totalArea: {
      type: Number,
      required: [true, 'Total Area is required'],
      min: [0.01, 'Total Area must be greater than 0'],
    },

    areaUnit: {
      type: String,
      required: [true, 'Area Unit is required'],
      enum: {
        values: ['marla', 'sqft', 'sqm', 'acre', 'hectare', 'kanal'],
        message: '{VALUE} is not a valid area unit',
      },
      default: 'marla',
    },

    ratePerUnit: {
      type: Number,
      required: [true, 'Rate per Unit is required'],
      min: [0, 'Rate per Unit cannot be negative'],
    },

    standardBasePrice: {
      type: Number,
      required: [true, 'Standard Base Price is required'],
      min: [0, 'Standard Base Price cannot be negative'],
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

// Pre-save middleware to calculate standardBasePrice if not provided
plotSizeSchema.pre('save', function (next) {
  // Only calculate if standardBasePrice is not explicitly set
  if (this.isModified('totalArea') || this.isModified('ratePerUnit')) {
    if (!this.isModified('standardBasePrice') || this.isNew) {
      this.standardBasePrice = parseFloat((this.totalArea * this.ratePerUnit).toFixed(2));
    }
  }
  next();
});

// Pre-update middleware for findOneAndUpdate operations
plotSizeSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  // If totalArea or ratePerUnit is being updated, recalculate standardBasePrice
  if (update.totalArea !== undefined || update.ratePerUnit !== undefined) {
    // Get the current document to calculate new price
    this.model
      .findOne(this.getQuery())
      .then((doc: any) => {
        const totalArea = update.totalArea !== undefined ? update.totalArea : doc.totalArea;
        const ratePerUnit = update.ratePerUnit !== undefined ? update.ratePerUnit : doc.ratePerUnit;

        update.standardBasePrice = parseFloat((totalArea * ratePerUnit).toFixed(2));
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

// Index for soft delete filtering
plotSizeSchema.index({ isDeleted: 1 });

// Text index for search
plotSizeSchema.index(
  { plotSizeName: 'text' },
  {
    weights: { plotSizeName: 10 },
    name: 'plotsize_text_search',
  }
);

// Compound index for frequently used queries
plotSizeSchema.index({ areaUnit: 1, isDeleted: 1 });
plotSizeSchema.index({ standardBasePrice: 1, isDeleted: 1 });

// Virtual for formatted price display
plotSizeSchema.virtual('formattedPrice').get(function () {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(this.standardBasePrice);
});

// Virtual for formatted rate display
plotSizeSchema.virtual('formattedRate').get(function () {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(this.ratePerUnit);
});

// Ensure virtuals are included in toJSON output
plotSizeSchema.set('toJSON', { virtuals: true });
plotSizeSchema.set('toObject', { virtuals: true });

const PlotSize: Model<IPlotSize> = model<IPlotSize>('PlotSize', plotSizeSchema);

export default PlotSize;
