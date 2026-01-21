import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPlot extends Document {
  plotNo: string;
  projectId?: Types.ObjectId;
  plotBlockId: Types.ObjectId;
  plotSizeId: Types.ObjectId;
  plotTypeId: Types.ObjectId;
  plotStreet?: string;
  statusId: Types.ObjectId;
  plotRemarks?: string;
  plotAmount: number;
  discountAmount?: number;
  discountDate?: Date;
  // developmentStatusId: Types.ObjectId;
  applicationTypeId: Types.ObjectId;
  developmentChargeMethod?: string;
  discountMethod?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const plotSchema = new Schema<IPlot>(
  {
    plotNo: {
      type: String,
      required: [true, 'Plot Number is required'],
      trim: true,
      uppercase: true,
      minlength: [1, 'Plot Number must be at least 1 character'],
      maxlength: [20, 'Plot Number cannot exceed 20 characters'],
      index: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },

    plotBlockId: {
      type: Schema.Types.ObjectId,
      ref: 'PlotBlock',
      required: true,
      index: true,
    },

    plotSizeId: {
      type: Schema.Types.ObjectId,
      ref: 'PlotSize',
      required: true,
      index: true,
    },

    plotTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'PlotType',
      required: true,
      index: true,
    },

    plotStreet: {
      type: String,
      trim: true,
      maxlength: [100, 'Street cannot exceed 100 characters'],
    },

    statusId: {
      type: Schema.Types.ObjectId,
      ref: 'Status', // You need to create this model
      index: true,
    },

    plotRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },

    plotAmount: {
      type: Number,
      required: [true, 'Plot Amount is required'],
      min: [0, 'Plot Amount cannot be negative'],
    },

    discountAmount: {
      type: Number,
      min: [0, 'Discount Amount cannot be negative'],
      validate: {
        validator: function (this: IPlot, value: number) {
          return value === undefined || value <= this.plotAmount;
        },
        message: 'Discount Amount cannot exceed Plot Amount',
      },
    },

    discountDate: {
      type: Date,
    },

    // developmentStatusId: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'DevelopmentStatus',
    //   required: true,
    //   index: true,
    // },

    applicationTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'SrApplicationType',
      required: true,
      index: true,
    },

    developmentChargeMethod: {
      type: String,
      trim: true,
      maxlength: [50, 'Charge Method cannot exceed 50 characters'],
    },

    discountMethod: {
      type: String,
      trim: true,
      maxlength: [50, 'Discount Method cannot exceed 50 characters'],
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

// Compound index for unique plot number within project
plotSchema.index(
  { plotNo: 1, projId: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Text index for search
plotSchema.index(
  { plotNo: 'text', plotStreet: 'text', plotRemarks: 'text' },
  {
    weights: { plotNo: 10, plotStreet: 5, plotRemarks: 3 },
    name: 'plot_text_search',
  }
);

// Index for common queries
plotSchema.index({ plotBlockId: 1, isDeleted: 1 });
plotSchema.index({ plotSizeId: 1, isDeleted: 1 });
plotSchema.index({ plotTypeId: 1, isDeleted: 1 });
plotSchema.index({ statusId: 1, isDeleted: 1 });
plotSchema.index({ projectId: 1, isDeleted: 1 });
// plotSchema.index({ developmentStatusId: 1, isDeleted: 1 });
plotSchema.index({ applicationTypeId: 1, isDeleted: 1 });
plotSchema.index({ createdBy: 1, isDeleted: 1 });

const Plot: Model<IPlot> = model<IPlot>('Plot', plotSchema);

export default Plot;
