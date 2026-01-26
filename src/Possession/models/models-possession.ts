import { Document, HydratedDocument, Model, Schema, Types, model } from 'mongoose';

export enum PossessionStatus {
  REQUESTED = 'requested',
  SURVEYED = 'surveyed',
  READY = 'ready',
  HANDED_OVER = 'handed_over',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}
export interface IPossession extends Document {
  possessionCode: string;
  possessionStatus: PossessionStatus;

  possessionInitDate: Date;
  possessionHandoverDate?: Date;
  possessionSurveyDate?: Date;

  possessionIsCollected?: boolean;
  possessionCollectorName?: string;
  possessionCollectorNic?: string;

  possessionSurveyPerson?: string;

  possessionAttachment1?: string;
  possessionAttachment2?: string;

  allowedNextStatuses?: string[];
  possessionDurationDays?: number;

  statusDisplayName?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;

  isDeleted: boolean;
}

/* ---------------- BASE DATA ---------------- */
export interface PossessionBase {
  fileId: Types.ObjectId;
  plotId: Types.ObjectId;
  possessionStatus: PossessionStatus;
  possessionCode: string;
  allowedNextStatuses?: PossessionStatus[]; // 👈 ADD THIS
  statusDisplayName?: string;
  possessionInitDate: Date;
  possessionHandoverDate?: Date;
  possessionSurveyPerson?: string;
  possessionSurveyDate?: Date;
  possessionDurationDays?: number;
  possessionIsCollected: boolean;
  possessionCollectorName?: string;
  possessionCollectorNic?: string;
  possessionCollectionDate?: Date;

  possessionHandoverCSR: Types.ObjectId;

  possessionAttachment1?: string;
  possessionAttachment2?: string;
  possessionAttachment3?: string;

  possessionRemarks?: string;
  possessionSurveyRemarks?: string;
  possessionHandoverRemarks?: string;

  possessionLatitude?: number;
  possessionLongitude?: number;
  updatedAt?: Date;
  createdAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

/* ---------------- VIRTUALS ---------------- */
export interface PossessionVirtuals {
  possessionDurationDays?: number;
  possessionAgeDays?: number;
  statusDisplayName?: string;
  allowedNextStatuses?: PossessionStatus[];
}

/* ---------------- METHODS ---------------- */
export interface PossessionMethods {}

/* ---------------- STATICS ---------------- */
export interface PossessionStatics {
  generatePossessionCode(): Promise<string>;
  getPossessionStatistics(
    start?: Date,
    end?: Date
  ): Promise<{ _id: PossessionStatus; count: number }[]>;
}
export interface PossessionModel extends Model<PossessionBase> {
  generatePossessionCode(): Promise<string>;
  getPossessionStatistics(start?: Date, end?: Date): Promise<any>;
}

/* ---------------- DOCUMENT ---------------- */
export type PossessionDocument = HydratedDocument<
  PossessionBase,
  PossessionMethods & PossessionVirtuals
>;

/* ---------------- MODEL ---------------- */
// export type PossessionModel = Model<PossessionBase, {}, PossessionMethods, PossessionVirtuals> &
//   PossessionStatics;

const possessionSchema = new Schema<PossessionBase, PossessionModel>(
  {
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: [true, 'File ID is required'],
      index: true,
    },

    plotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      required: [true, 'Plot ID is required'],
      index: true,
    },

    possessionStatus: {
      type: String,
      required: [true, 'Possession Status is required'],
      enum: {
        values: Object.values(PossessionStatus),
        message: '{VALUE} is not a valid possession status',
      },
      default: PossessionStatus.REQUESTED,
      index: true,
    },

    possessionCode: {
      type: String,
      required: [true, 'Possession Code is required'],
      unique: true,
      uppercase: true,
      minlength: [10, 'Possession Code must be at least 10 characters'],
      maxlength: [50, 'Possession Code cannot exceed 50 characters'],
      index: true,
    },

    possessionInitDate: {
      type: Date,
      required: [true, 'Application Date is required'],
      validate: {
        validator: function (value: Date) {
          return value <= new Date();
        },
        message: 'Application Date cannot be in the future',
      },
    },

    possessionHandoverDate: {
      type: Date,
      validate: {
        validator: function (this: IPossession, value: Date) {
          return !value || value >= this.possessionInitDate;
        },
        message: 'Handover Date must be after Application Date',
      },
    },

    possessionSurveyPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Surveyor Name cannot exceed 100 characters'],
    },

    possessionSurveyDate: {
      type: Date,
      validate: {
        validator: function (this: IPossession, value: Date) {
          return !value || value >= this.possessionInitDate;
        },
        message: 'Survey Date must be after Application Date',
      },
    },

    possessionIsCollected: {
      type: Boolean,
      default: false,
      index: true,
    },

    possessionCollectorName: {
      type: String,
      trim: true,
      maxlength: [100, 'Collector Name cannot exceed 100 characters'],
    },

    possessionCollectorNic: {
      type: String,
      trim: true,
      match: [
        /^\d{5}-\d{7}-\d{1}$|^\d{13}$/,
        'Please enter a valid CNIC (XXXXX-XXXXXXX-X or 13 digits)',
      ],
    },

    possessionCollectionDate: {
      type: Date,
      validate: {
        validator: function (this: IPossession, value: Date) {
          return !value || value >= this.possessionInitDate;
        },
        message: 'Collection Date must be after Application Date',
      },
    },

    possessionHandoverCSR: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Handover CSR is required'],
      index: true,
    },

    possessionAttachment1: {
      type: String,
      trim: true,
      maxlength: [500, 'Attachment path cannot exceed 500 characters'],
    },

    possessionAttachment2: {
      type: String,
      trim: true,
      maxlength: [500, 'Attachment path cannot exceed 500 characters'],
    },

    possessionAttachment3: {
      type: String,
      trim: true,
      maxlength: [500, 'Attachment path cannot exceed 500 characters'],
    },

    possessionRemarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },

    possessionSurveyRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Survey Remarks cannot exceed 500 characters'],
    },

    possessionHandoverRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Handover Remarks cannot exceed 500 characters'],
    },

    possessionLatitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },

    possessionLongitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
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

// Pre-save middleware to validate status transitions
possessionSchema.pre('save', function (next) {
  // Set handover date when status changes to HANDED_OVER
  if (this.possessionStatus === PossessionStatus.HANDED_OVER && !this.possessionHandoverDate) {
    this.possessionHandoverDate = new Date();
  }

  // Set survey date when status changes to SURVEYED
  if (this.possessionStatus === PossessionStatus.SURVEYED && !this.possessionSurveyDate) {
    this.possessionSurveyDate = new Date();
  }

  // Set collection date when letter is collected
  if (this.possessionIsCollected && !this.possessionCollectionDate) {
    this.possessionCollectionDate = new Date();
  }

  // Validate collector info when letter is collected
  if (
    this.possessionIsCollected &&
    (!this.possessionCollectorName || !this.possessionCollectorNic)
  ) {
    next(new Error('Collector Name and CNIC are required when letter is collected'));
    return;
  }

  next();
});

// Compound indexes for common queries
possessionSchema.index({ fileId: 1, isDeleted: 1 });
possessionSchema.index({ plotId: 1, isDeleted: 1 });
possessionSchema.index({ possessionStatus: 1, isDeleted: 1 });
possessionSchema.index({ possessionIsCollected: 1, isDeleted: 1 });
possessionSchema.index({ possessionHandoverCSR: 1, isDeleted: 1 });
possessionSchema.index({ createdBy: 1, isDeleted: 1 });
possessionSchema.index({ possessionInitDate: 1, isDeleted: 1 });

// Text index for search
possessionSchema.index(
  {
    possessionCode: 'text',
    possessionCollectorName: 'text',
    possessionCollectorNic: 'text',
    possessionRemarks: 'text',
    possessionSurveyRemarks: 'text',
    possessionHandoverRemarks: 'text',
  },
  {
    weights: {
      possessionCode: 10,
      possessionCollectorName: 8,
      possessionCollectorNic: 8,
      possessionRemarks: 5,
      possessionSurveyRemarks: 5,
      possessionHandoverRemarks: 5,
    },
    name: 'possession_text_search',
  }
);

// 2dsphere index for geospatial queries
possessionSchema.index({
  possessionLatitude: 1,
  possessionLongitude: 1,
});

// Virtual for possession duration (days from init to handover)
possessionSchema.virtual('possessionDurationDays').get(function () {
  if (!this.possessionInitDate || !this.possessionHandoverDate) {
    return null;
  }
  const diffTime = Math.abs(
    this.possessionHandoverDate.getTime() - this.possessionInitDate.getTime()
  );
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for current age (days since application)
possessionSchema.virtual('possessionAgeDays').get(function () {
  if (!this.possessionInitDate) {
    return 0;
  }
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.possessionInitDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for status color (for UI)
possessionSchema.virtual('statusColor').get(function () {
  const colors = {
    [PossessionStatus.REQUESTED]: 'blue',
    [PossessionStatus.SURVEYED]: 'orange',
    [PossessionStatus.READY]: 'green',
    [PossessionStatus.HANDED_OVER]: 'purple',
    [PossessionStatus.CANCELLED]: 'red',
    [PossessionStatus.ON_HOLD]: 'yellow',
  };
  return colors[this.possessionStatus] || 'gray';
});

// Virtual for status display name
possessionSchema.virtual('statusDisplayName').get(function () {
  const names = {
    [PossessionStatus.REQUESTED]: 'Requested',
    [PossessionStatus.SURVEYED]: 'Surveyed',
    [PossessionStatus.READY]: 'Ready for Handover',
    [PossessionStatus.HANDED_OVER]: 'Handed Over',
    [PossessionStatus.CANCELLED]: 'Cancelled',
    [PossessionStatus.ON_HOLD]: 'On Hold',
  };
  return names[this.possessionStatus] || this.possessionStatus;
});

// Virtual for next allowed statuses
possessionSchema.virtual('allowedNextStatuses').get(function () {
  const transitions = {
    [PossessionStatus.REQUESTED]: [
      PossessionStatus.SURVEYED,
      PossessionStatus.CANCELLED,
      PossessionStatus.ON_HOLD,
    ],
    [PossessionStatus.SURVEYED]: [
      PossessionStatus.READY,
      PossessionStatus.CANCELLED,
      PossessionStatus.ON_HOLD,
    ],
    [PossessionStatus.READY]: [
      PossessionStatus.HANDED_OVER,
      PossessionStatus.CANCELLED,
      PossessionStatus.ON_HOLD,
    ],
    [PossessionStatus.HANDED_OVER]: [], // Final state
    [PossessionStatus.CANCELLED]: [
      PossessionStatus.REQUESTED, // Re-open cancelled request
    ],
    [PossessionStatus.ON_HOLD]: [
      PossessionStatus.REQUESTED,
      PossessionStatus.SURVEYED,
      PossessionStatus.CANCELLED,
    ],
  };

  return transitions[this.possessionStatus] || [];
});

// Virtual for formatted dates
possessionSchema.virtual('formattedInitDate').get(function () {
  return this.possessionInitDate?.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

possessionSchema.virtual('formattedHandoverDate').get(function () {
  return this.possessionHandoverDate?.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

// Ensure virtuals are included in toJSON output
possessionSchema.set('toJSON', { virtuals: true });
possessionSchema.set('toObject', { virtuals: true });

// Static method to generate possession code
possessionSchema.statics.generatePossessionCode = async function (): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `POS-${dateStr}`;

  // Find the last possession code for today
  const lastPossession = await this.findOne({
    possessionCode: new RegExp(`^${prefix}`),
  }).sort({ possessionCode: -1 });

  let counter = 1;
  if (lastPossession) {
    const lastNumber = parseInt(lastPossession.possessionCode.split('-')[2]);
    counter = lastNumber + 1;
  }

  return `${prefix}-${counter.toString().padStart(3, '0')}`;
};

// Static method to get possession statistics
possessionSchema.statics.getPossessionStatistics = async function (
  startDate?: Date,
  endDate?: Date
): Promise<any> {
  const matchStage: any = { isDeleted: false };

  if (startDate || endDate) {
    matchStage.possessionInitDate = {};
    if (startDate) matchStage.possessionInitDate.$gte = startDate;
    if (endDate) matchStage.possessionInitDate.$lte = endDate;
  }

  const stats = await this.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: '$possessionStatus',
        count: { $sum: 1 },
        avgDurationDays: {
          $avg: {
            $cond: [
              { $and: ['$possessionHandoverDate', '$possessionInitDate'] },
              {
                $divide: [
                  { $subtract: ['$possessionHandoverDate', '$possessionInitDate'] },
                  1000 * 60 * 60 * 24,
                ],
              },
              null,
            ],
          },
        },
        collectedCount: {
          $sum: { $cond: [{ $eq: ['$possessionIsCollected', true] }, 1, 0] },
        },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return stats;
};

const Possession = model<PossessionBase, PossessionModel>('Possession', possessionSchema);

export default Possession;
