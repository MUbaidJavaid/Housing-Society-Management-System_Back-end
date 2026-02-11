import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IApplication extends Document {
  applicationNo: string;
  applicationTypeID: Types.ObjectId;
  memId: Types.ObjectId;
  plotId?: Types.ObjectId;
  applicationDate: Date;
  statusId: Types.ObjectId;
  remarks?: string;
  attachmentPath?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    applicationNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },

    applicationTypeID: {
      type: Schema.Types.ObjectId,
      ref: 'SrApplicationType',
      required: [true, 'Application Type is required'],
      index: true,
    },

    memId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member is required'],
      index: true,
    },

    plotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      index: true,
    },

    applicationDate: {
      type: Date,
      required: [true, 'Application Date is required'],
      index: true,
    },

    statusId: {
      type: Schema.Types.ObjectId,
      ref: 'Status',
      required: [true, 'Status is required'],
      index: true,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },

    attachmentPath: {
      type: String,
      trim: true,
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
  { applicationNo: 'text', remarks: 'text' },
  {
    weights: {
      applicationNo: 10,
      remarks: 3,
    },
    name: 'application_text_search',
  }
);

// Indexes for performance
applicationSchema.index({ applicationNo: 1, isDeleted: 1 }, { unique: true });
applicationSchema.index({ applicationTypeID: 1, isDeleted: 1 });
applicationSchema.index({ memId: 1, isDeleted: 1 });
applicationSchema.index({ statusId: 1, isDeleted: 1 });
applicationSchema.index({ createdBy: 1, isDeleted: 1 });
applicationSchema.index({ applicationDate: 1, isDeleted: 1 });

// Auto-generate ApplicationNo
applicationSchema.pre('validate', async function (next) {
  try {
    if (this.applicationNo) {
      this.applicationNo = this.applicationNo.toUpperCase();
      return next();
    }

    const year = (this.applicationDate || new Date()).getFullYear();
    const prefix = `APP-${year}-`;
    const ApplicationModel = this.constructor as Model<IApplication>;

    // Find last application regardless of deletion status to avoid duplicates
    const lastApplication = await ApplicationModel.findOne({
      applicationNo: new RegExp(`^${prefix}\\d{3}$`),
    })
      .sort({ applicationNo: -1 })
      .select('applicationNo')
      .lean();

    let nextSequence = 1;
    if (lastApplication?.applicationNo) {
      const match = lastApplication.applicationNo.match(/(\d{3})$/);
      if (match) {
        nextSequence = parseInt(match[1], 10) + 1;
      }
    }

    this.applicationNo = `${prefix}${String(nextSequence).padStart(3, '0')}`;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Ensure virtuals are included
applicationSchema.set('toObject', { virtuals: true });
applicationSchema.set('toJSON', { virtuals: true });

const Application: Model<IApplication> = model<IApplication>('Application', applicationSchema);

export default Application;
