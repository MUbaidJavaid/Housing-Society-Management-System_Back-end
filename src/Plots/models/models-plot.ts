import { Model, Schema, Types, model } from 'mongoose';

export enum PlotType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  AGRICULTURAL = 'agricultural',
  CORNER = 'corner',
  PARK_FACING = 'park_facing',
  MAIN_BOULEVARD = 'main_boulevard',
  STANDARD = 'standard',
}

export interface IPlot {
  projectId: Types.ObjectId;
  possId?: Types.ObjectId;
  plotNo: string; // Unique within project
  plotBlockId: Types.ObjectId;
  plotSizeId: Types.ObjectId;
  plotTypeId: Types.ObjectId;
  plotCategoryId: Types.ObjectId;
  plotStreet?: string;
  plotLength: number; // in feet/meters
  plotWidth: number; // in feet/meters
  plotArea: number; // calculated: length × width
  plotAreaUnit: string;
  srDevStatId?: Types.ObjectId;
  salesStatusId: Types.ObjectId;
  surchargeAmount: number;
  fileId?: Types.ObjectId;
  plotBasePrice: number;
  plotTotalAmount: number;
  discountAmount: number;
  discountDate?: Date;
  isPossessionReady: boolean;
  plotRegistrationNo?: string; // Auto-generated: PROJ-CODE-BLOCK-PLOTNO
  plotCornerNo?: number; // For corner plots
  plotFacing?: string; // N, S, E, W
  plotDimensions?: string; // "30x60"
  plotRemarks?: string;
  plotLatitude?: number;
  plotLongitude?: number;
  plotBoundaryPoints?: Array<{ lat: number; lng: number }>;
  plotDocuments?: Array<{
    documentType: string;
    documentPath: string;
    uploadedDate: Date;
    uploadedBy: Types.ObjectId;
  }>;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

interface IPlotMethods {
  generateRegistrationNumber(): Promise<string>;
}

export type PlotModel = Model<IPlot, {}, IPlotMethods>;

const plotSchema = new Schema<IPlot, PlotModel, IPlotMethods>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },

    possId: {
      type: Schema.Types.ObjectId,
      ref: 'Possession',
      index: true,
    },

    plotNo: {
      type: String,
      required: [true, 'Plot Number is required'],
      trim: true,
      uppercase: true,
      minlength: [1, 'Plot Number must be at least 1 character'],
      maxlength: [20, 'Plot Number cannot exceed 20 characters'],
      index: true,
    },

    plotBlockId: {
      type: Schema.Types.ObjectId,
      ref: 'PlotBlock',
      required: [true, 'Plot Block is required'],
      index: true,
    },

    plotSizeId: {
      type: Schema.Types.ObjectId,
      ref: 'PlotSize',
      required: [true, 'Plot Size is required'],
      index: true,
    },

    plotTypeId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Plot Type is required'],
      enum: {
        values: Object.values(PlotType),
        message: '{VALUE} is not a valid plot type',
      },
      default: PlotType.RESIDENTIAL,
      index: true,
    },

    plotCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'PlotCategory',
      required: [true, 'Plot Category is required'],
      index: true,
    },

    plotStreet: {
      type: String,
      trim: true,
      maxlength: [100, 'Street name cannot exceed 100 characters'],
      index: true,
    },

    plotLength: {
      type: Number,
      required: [true, 'Plot Length is required'],
      min: [1, 'Plot Length must be greater than 0'],
    },

    plotWidth: {
      type: Number,
      required: [true, 'Plot Width is required'],
      min: [1, 'Plot Width must be greater than 0'],
    },

    plotArea: {
      type: Number,
      required: [true, 'Plot Area is required'],
      min: [1, 'Plot Area must be greater than 0'],
    },

    plotAreaUnit: {
      type: String,
      required: [true, 'Area Unit is required'],
      enum: {
        values: ['sqft', 'sqm', 'marla', 'kanal', 'acre'],
        message: '{VALUE} is not a valid area unit',
      },
      default: 'sqft',
    },

    srDevStatId: {
      type: Schema.Types.ObjectId,
      ref: 'SrDevStatus',
      index: true,
    },

    salesStatusId: {
      type: Schema.Types.ObjectId,
      ref: 'SalesStatus',
      required: [true, 'Sales Status is required'],
      index: true,
    },

    surchargeAmount: {
      type: Number,
      required: [true, 'Surcharge Amount is required'],
      min: [0, 'Surcharge cannot be negative'],
      default: 0,
    },

    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      index: true,
    },

    plotBasePrice: {
      type: Number,
      required: [true, 'Base Price is required'],
      min: [0, 'Base Price cannot be negative'],
    },

    plotTotalAmount: {
      type: Number,
      required: [true, 'Total Amount is required'],
      min: [0, 'Total Amount cannot be negative'],
    },

    discountAmount: {
      type: Number,
      required: [true, 'Discount Amount is required'],
      min: [0, 'Discount cannot be negative'],
      default: 0,
    },

    discountDate: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          return !value || value <= new Date();
        },
        message: 'Discount Date cannot be in the future',
      },
    },

    isPossessionReady: {
      type: Boolean,
      default: false,
      index: true,
    },

    plotRegistrationNo: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [10, 'Registration Number must be at least 10 characters'],
      maxlength: [50, 'Registration Number cannot exceed 50 characters'],
      index: true,
    },

    plotCornerNo: {
      type: Number,
      min: [1, 'Corner Number must be at least 1'],
    },

    plotFacing: {
      type: String,
      enum: {
        values: ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'],
        message: '{VALUE} is not a valid facing direction',
      },
    },

    plotDimensions: {
      type: String,
      trim: true,
      maxlength: [20, 'Dimensions cannot exceed 20 characters'],
    },

    plotRemarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },

    plotLatitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },

    plotLongitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },

    plotBoundaryPoints: [
      {
        lat: {
          type: Number,
          required: true,
          min: -90,
          max: 90,
        },
        lng: {
          type: Number,
          required: true,
          min: -180,
          max: 180,
        },
      },
    ],

    plotDocuments: [
      {
        documentType: {
          type: String,
          required: true,
          enum: ['allotment', 'possession', 'survey', 'map', 'noc', 'other'],
        },
        documentPath: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500,
        },
        uploadedDate: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      },
    ],

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

// Update the pre-save middleware - add this at the beginning
plotSchema.pre('save', async function (next) {
  // Calculate plot area
  this.plotArea = parseFloat((this.plotLength * this.plotWidth).toFixed(2));

  // Generate dimensions string
  this.plotDimensions = `${this.plotLength}×${this.plotWidth}`;

  // ALWAYS recalculate total amount - remove any condition
  this.plotTotalAmount = this.plotBasePrice + this.surchargeAmount - this.discountAmount;

  // Generate registration number if not provided
  if (!this.plotRegistrationNo) {
    try {
      this.plotRegistrationNo = await this.generateRegistrationNumber();
    } catch (error) {
      console.error('Failed to generate registration number:', error);
      // Generate a fallback registration number
      this.plotRegistrationNo = `PLOT-${this.projectId.toString().slice(-4)}-${this.plotNo}-${Date.now().toString().slice(-6)}`;
    }
  }

  const PlotModel = this.constructor as Model<IPlot, {}, IPlotMethods>;
  const existingPlot = await PlotModel.findOne({
    projectId: this.projectId,
    plotNo: this.plotNo,
    isDeleted: false,
    _id: { $ne: this._id },
  });

  if (existingPlot) {
    next(new Error(`Plot number ${this.plotNo} already exists in this project`));
    return;
  }

  // Remove or modify this validation since we're always recalculating
  // const calculatedTotal = this.plotBasePrice + this.surchargeAmount - this.discountAmount;
  // if (Math.abs(this.plotTotalAmount - calculatedTotal) > 0.01) {
  //   console.warn(`Plot total amount (${this.plotTotalAmount}) differs from calculated total (${calculatedTotal})`);
  // }

  next();
});

// Pre-update middleware - update this to always recalculate
plotSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;

  // Recalculate area if dimensions changed
  if (update.plotLength !== undefined || update.plotWidth !== undefined) {
    const plot = await this.model.findOne(this.getQuery());
    if (plot) {
      const length = update.plotLength !== undefined ? update.plotLength : plot.plotLength;
      const width = update.plotWidth !== undefined ? update.plotWidth : plot.plotWidth;
      update.plotArea = parseFloat((length * width).toFixed(2));
      update.plotDimensions = `${length}×${width}`;
    }
  }

  // ALWAYS recalculate total amount when price components are involved
  // Get the current plot to get current values
  const plot = await this.model.findOne(this.getQuery());
  if (plot) {
    // Get the new values or use current values
    const basePrice =
      update.plotBasePrice !== undefined ? update.plotBasePrice : plot.plotBasePrice;
    const surcharge =
      update.surchargeAmount !== undefined ? update.surchargeAmount : plot.surchargeAmount;
    const discount =
      update.discountAmount !== undefined ? update.discountAmount : plot.discountAmount;

    // Calculate new total amount
    const newTotalAmount = basePrice + surcharge - discount;

    // Update the total amount in the update object
    update.plotTotalAmount = newTotalAmount;
  }

  next();
});

// Compound indexes for common queries
plotSchema.index({ projectId: 1, plotNo: 1, isDeleted: 1 }, { unique: true });
plotSchema.index({ projectId: 1, isDeleted: 1 });
plotSchema.index({ plotBlockId: 1, isDeleted: 1 });
plotSchema.index({ salesStatusId: 1, isDeleted: 1 });
plotSchema.index({ fileId: 1, isDeleted: 1 });
plotSchema.index({ srDevStatId: 1, isDeleted: 1 });
plotSchema.index({ plotType: 1, isDeleted: 1 });
plotSchema.index({ isPossessionReady: 1, isDeleted: 1 });
plotSchema.index({ createdBy: 1, isDeleted: 1 });

// Text index for search
plotSchema.index(
  {
    plotNo: 'text',
    plotRegistrationNo: 'text',
    plotStreet: 'text',
    plotRemarks: 'text',
    plotDimensions: 'text',
  },
  {
    weights: {
      plotRegistrationNo: 10,
      plotNo: 9,
      plotStreet: 8,
      plotDimensions: 7,
      plotRemarks: 5,
    },
    name: 'plot_text_search',
  }
);

// 2dsphere index for geospatial queries
plotSchema.index({ plotLatitude: 1, plotLongitude: 1 });

// Virtual for formatted price
plotSchema.virtual('formattedTotalAmount').get(function () {
  if (!this.plotTotalAmount && this.plotTotalAmount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(this.plotTotalAmount);
});

// Virtual for formatted area
plotSchema.virtual('formattedArea').get(function () {
  if (!this.plotArea && this.plotArea !== 0) return 'N/A';
  if (!this.plotAreaUnit) return `${this.plotArea.toLocaleString()}`;
  return `${this.plotArea.toLocaleString()} ${this.plotAreaUnit}`;
});

// Virtual for dimensions with unit
plotSchema.virtual('dimensionsWithUnit').get(function () {
  if (!this.plotLength || !this.plotWidth) return 'N/A';
  return `${this.plotLength}ft × ${this.plotWidth}ft`;
});

// Virtual for net price (base + surcharge - discount)
plotSchema.virtual('plotNetPrice').get(function () {
  if (!this.plotBasePrice && this.plotBasePrice !== 0) return 0;
  if (!this.surchargeAmount && this.surchargeAmount !== 0) return this.plotBasePrice;
  if (!this.discountAmount && this.discountAmount !== 0)
    return this.plotBasePrice + this.surchargeAmount;
  return this.plotBasePrice + this.surchargeAmount - this.discountAmount;
});

// Virtual for price per square unit
plotSchema.virtual('pricePerUnit').get(function () {
  if (!this.plotArea || this.plotArea === 0) return 0;
  if (!this.plotBasePrice && this.plotBasePrice !== 0) return 0;
  return parseFloat((this.plotBasePrice / this.plotArea).toFixed(2));
});

// Virtual for discount percentage
plotSchema.virtual('discountPercentage').get(function () {
  if (!this.plotBasePrice || this.plotBasePrice === 0) return 0;
  if (!this.discountAmount && this.discountAmount !== 0) return 0;
  return parseFloat(((this.discountAmount / this.plotBasePrice) * 100).toFixed(2));
});
// Virtual for plot status (combination of sales and development status)
plotSchema.virtual('plotStatus').get(function () {
  return {
    salesStatus: this.salesStatusId,
    developmentStatus: this.srDevStatId,
    isAvailable: !this.fileId,
    isPossessionReady: this.isPossessionReady || false,
  };
});

// Virtual for next actions
plotSchema.virtual('nextActions').get(function () {
  const actions = [];

  if (!this.fileId) {
    actions.push('Assign to Customer');
  }

  if (!this.isPossessionReady && this.srDevStatId) {
    actions.push('Mark Possession Ready');
  }

  if (this.fileId && !this.possId) {
    actions.push('Initiate Possession');
  }

  return actions;
});

// Virtual for plot location description
plotSchema.virtual('locationDescription').get(function () {
  const parts = [];
  if (this.plotStreet) parts.push(this.plotStreet);
  if (this.plotBlockId) {
    // Will be populated with actual block name when populated
    parts.push('Block');
  }
  if (this.projectId) {
    // Will be populated with actual project name when populated
    parts.push('Project');
  }
  return parts.length > 0 ? parts.join(', ') : 'Location not specified';
});

// Ensure virtuals are included in toJSON output
plotSchema.set('toJSON', { virtuals: true });
plotSchema.set('toObject', { virtuals: true });

// Instance method to generate registration number
// Update the generateRegistrationNumber method in models-plot.ts

plotSchema.methods.generateRegistrationNumber = async function (): Promise<string> {
  try {
    // Get project and block details
    const project = await this.model('Project')
      .findById(this.projectId)
      .lean<{ projCode: string; projPrefix?: string }>();

    const block = await this.model('PlotBlock')
      .findById(this.plotBlockId)
      .lean<{ plotBlockName: string }>();

    if (!project) {
      throw new Error('Project not found');
    }

    // Use fallback values if block or block name is not found
    const prefix = project.projPrefix || project.projCode.substring(0, 3) || 'PLOT';
    // Replace line 521 in models-plot.ts
    const blockCode = block?.plotBlockName
      ? block.plotBlockName.substring(0, 3).toUpperCase().replace(/\s/g, '')
      : 'BLK';

    const PlotModel = this.constructor as Model<IPlot>;

    // Find the last plot with similar registration pattern
    const lastPlot = await PlotModel.findOne({
      projectId: this.projectId,
      plotBlockId: this.plotBlockId,
      plotRegistrationNo: new RegExp(`^${prefix}-${blockCode}-`),
      isDeleted: false,
    }).sort({ plotRegistrationNo: -1 });

    let counter = 1;
    if (lastPlot && lastPlot.plotRegistrationNo) {
      const match = lastPlot.plotRegistrationNo.match(/\d+$/);
      if (match) {
        const lastNumber = parseInt(match[0], 10);
        counter = lastNumber + 1;
      }
    }

    // Generate the registration number
    const registrationNo = `${prefix}-${blockCode}-${counter.toString().padStart(4, '0')}`;

    return registrationNo;
  } catch (error) {
    // Fallback registration number if something goes wrong
    console.error('Error generating registration number:', error);

    // Use timestamp as fallback
    const timestamp = Date.now().toString().slice(-6);
    return `PLOT-${this.plotNo.toUpperCase()}-${timestamp}`;
  }
};

// Static method to get available plots
plotSchema.statics.getAvailablePlots = function (
  projectId?: Types.ObjectId,
  blockId?: Types.ObjectId
): Promise<IPlot[]> {
  const query: any = {
    isDeleted: false,
    fileId: { $exists: false },
    salesStatusId: { $exists: true },
  };

  if (projectId) query.projectId = projectId;
  if (blockId) query.plotBlockId = blockId;

  return this.find(query)
    .populate('plotBlockId', 'plotBlockName')
    .populate('plotSizeId', 'plotSizeName totalArea areaUnit')
    .populate('plotCategoryId', 'categoryName surchargePercentage surchargeFixedAmount')
    .populate('salesStatusId', 'statusName statusCode')
    .sort({ plotNo: 1 });
};

// Static method to calculate project statistics
plotSchema.statics.getProjectPlotStatistics = async function (
  projectId: Types.ObjectId
): Promise<any> {
  const stats = await this.aggregate([
    {
      $match: {
        projectId: projectId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalPlots: { $sum: 1 },
        totalArea: { $sum: '$plotArea' },
        totalValue: { $sum: '$plotTotalAmount' },
        availablePlots: {
          $sum: { $cond: [{ $eq: [{ $ifNull: ['$fileId', null] }, null] }, 1, 0] },
        },
        soldPlots: {
          $sum: { $cond: [{ $ne: [{ $ifNull: ['$fileId', null] }, null] }, 1, 0] },
        },
        avgPrice: { $avg: '$plotTotalAmount' },
        totalDiscount: { $sum: '$discountAmount' },
        totalSurcharge: { $sum: '$surchargeAmount' },
      },
    },
  ]);

  const typeStats = await this.aggregate([
    {
      $match: {
        projectId: projectId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$plotType',
        count: { $sum: 1 },
        totalArea: { $sum: '$plotArea' },
        totalValue: { $sum: '$plotTotalAmount' },
      },
    },
  ]);

  const blockStats = await this.aggregate([
    {
      $match: {
        projectId: projectId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$plotBlockId',
        count: { $sum: 1 },
        available: {
          $sum: { $cond: [{ $eq: [{ $ifNull: ['$fileId', null] }, null] }, 1, 0] },
        },
        totalArea: { $sum: '$plotArea' },
        totalValue: { $sum: '$plotTotalAmount' },
      },
    },
  ]);

  return {
    ...(stats[0] || {
      totalPlots: 0,
      totalArea: 0,
      totalValue: 0,
      availablePlots: 0,
      soldPlots: 0,
      avgPrice: 0,
      totalDiscount: 0,
      totalSurcharge: 0,
    }),
    byType: typeStats,
    byBlock: blockStats,
  };
};

const Plot = model<IPlot, PlotModel>('Plot', plotSchema);
export default Plot;
