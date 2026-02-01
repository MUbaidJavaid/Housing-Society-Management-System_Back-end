import { Document, Model, Schema, Types, model } from 'mongoose';

export enum DefaulterStatus {
  WARNING = 'Warning',
  SUSPENDED = 'Suspended',
  LEGAL_ACTION = 'Legal Action',
  RESOLVED = 'Resolved',
}

export interface IDefaulter extends Document {
  memId: Types.ObjectId;
  plotId: Types.ObjectId;
  fileId: Types.ObjectId;
  totalOverdueAmount: number;
  lastPaymentDate?: Date;
  daysOverdue: number;
  noticeSentCount: number;
  status: DefaulterStatus;
  remarks?: string;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isActive: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  member?: any;
  plot?: any;
  file?: any;
  createdByUser?: any;
  modifiedByUser?: any;
}

const defaulterSchema = new Schema<IDefaulter>(
  {
    memId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    plotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      required: true,
      index: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },
    totalOverdueAmount: {
      type: Number,
      required: true,
      min: [0, 'Overdue amount cannot be negative'],
      default: 0,
    },
    lastPaymentDate: {
      type: Date,
      index: true,
    },
    daysOverdue: {
      type: Number,
      required: true,
      min: [0, 'Days overdue cannot be negative'],
      default: 0,
    },
    noticeSentCount: {
      type: Number,
      required: true,
      min: [0, 'Notice count cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(DefaulterStatus),
      default: DefaulterStatus.WARNING,
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      required: true,
      index: true,
    },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    resolvedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
  }
);

// Compound indexes for efficient querying
defaulterSchema.index({ memId: 1, plotId: 1, fileId: 1 }, { unique: true });
defaulterSchema.index({ status: 1, isActive: 1 });
defaulterSchema.index({ daysOverdue: -1, status: 1 });
defaulterSchema.index({ totalOverdueAmount: -1 });

// Virtual for member
defaulterSchema.virtual('member', {
  ref: 'Member',
  localField: 'memId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for plot
defaulterSchema.virtual('plot', {
  ref: 'Plot',
  localField: 'plotId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for file
defaulterSchema.virtual('file', {
  ref: 'File',
  localField: 'fileId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for created by user
defaulterSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for modified by user
defaulterSchema.virtual('modifiedByUser', {
  ref: 'UserStaff',
  localField: 'modifiedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for status badge color
defaulterSchema.virtual('statusBadgeColor').get(function () {
  const colors: Record<string, string> = {
    [DefaulterStatus.WARNING]: 'warning',
    [DefaulterStatus.SUSPENDED]: 'danger',
    [DefaulterStatus.LEGAL_ACTION]: 'dark',
    [DefaulterStatus.RESOLVED]: 'success',
  };
  return colors[this.status] || 'secondary';
});

// Pre-save middleware
defaulterSchema.pre('save', function (next) {
  // Auto-calculate days overdue based on last payment date
  if (this.isModified('lastPaymentDate') || this.isModified('daysOverdue')) {
    if (this.lastPaymentDate) {
      const now = new Date();
      const lastPayDate = new Date(this.lastPaymentDate);
      const diffTime = Math.abs(now.getTime() - lastPayDate.getTime());
      this.daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  // Auto-update status based on days overdue and notice count
  if (this.isModified('daysOverdue') || this.isModified('noticeSentCount')) {
    if (this.daysOverdue >= 180 || this.noticeSentCount >= 3) {
      this.status = DefaulterStatus.LEGAL_ACTION;
    } else if (this.daysOverdue >= 90) {
      this.status = DefaulterStatus.SUSPENDED;
    } else if (this.daysOverdue >= 30) {
      this.status = DefaulterStatus.WARNING;
    }
  }

  next();
});

// Static method to find defaulters by member
defaulterSchema.statics.findByMemberId = function (memId: string, activeOnly: boolean = true) {
  const query: any = {
    memId: new Types.ObjectId(memId),
  };

  if (activeOnly) {
    query.isActive = true;
  }

  return this.find(query)
    .populate('plot', 'plotNo sector block')
    .populate('file', 'fileNo fileType');
};

// Static method to find defaulters by plot
defaulterSchema.statics.findByPlotId = function (plotId: string, activeOnly: boolean = true) {
  const query: any = {
    plotId: new Types.ObjectId(plotId),
  };

  if (activeOnly) {
    query.isActive = true;
  }

  return this.find(query).populate('member', 'fullName cnic mobileNo').populate('file', 'fileNo');
};

// Static method to get defaulters summary
defaulterSchema.statics.getSummary = function () {
  return this.aggregate([
    {
      $match: { isActive: true },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalOverdueAmount' },
        avgDaysOverdue: { $avg: '$daysOverdue' },
      },
    },
  ]);
};

// Define interface for static methods
interface IDefaulterModel extends Model<IDefaulter> {
  findByMemberId(memId: string, activeOnly?: boolean): Promise<IDefaulter[]>;
  findByPlotId(plotId: string, activeOnly?: boolean): Promise<IDefaulter[]>;
  getSummary(): Promise<any[]>;
}

// Create and export model
const Defaulter = model<IDefaulter, IDefaulterModel>('Defaulter', defaulterSchema);

export default Defaulter;
