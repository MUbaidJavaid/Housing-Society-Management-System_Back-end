import { Document, Model, Schema, Types, model } from 'mongoose';

export enum ComplaintPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency',
}

export enum ComplaintStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
  REOPENED = 'reopened',
  ON_HOLD = 'on_hold',
}

export interface IComplaint extends Document {
  memId: Types.ObjectId;
  fileId?: Types.ObjectId;
  compCatId: Types.ObjectId;
  compTitle: string;
  compDescription: string;
  compDate: Date;
  compPriority: ComplaintPriority;
  statusId: Types.ObjectId;
  status?: string;
  assignedTo?: Types.ObjectId;
  resolutionNotes?: string;
  resolutionDate?: Date;
  attachmentPaths: string[];
  dueDate?: Date;
  escalationLevel: number;
  lastEscalatedAt?: Date;
  isEscalated: boolean;
  slaHours: number;
  slaBreached: boolean;
  satisfactionRating?: number;
  feedback?: string;
  estimatedResolutionDate?: Date;
  tags: string[];
  followUpDate?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    memId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
    },
    compCatId: {
      type: Schema.Types.ObjectId,
      ref: 'SrComplaintCategory',
      required: true,
    },
    compTitle: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      minlength: [5, 'Complaint title must be at least 5 characters'],
      maxlength: [200, 'Complaint title cannot exceed 200 characters'],
    },
    compDescription: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      minlength: [10, 'Complaint description must be at least 10 characters'],
      maxlength: [5000, 'Complaint description cannot exceed 5000 characters'],
    },
    compDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    compPriority: {
      type: String,
      enum: Object.values(ComplaintPriority),
      default: ComplaintPriority.MEDIUM,
    },
    statusId: {
      type: Schema.Types.ObjectId,
      ref: 'Status',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.OPEN,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Resolution notes cannot exceed 2000 characters'],
    },
    resolutionDate: {
      type: Date,
    },
    attachmentPaths: [
      {
        type: String,
        trim: true,
      },
    ],
    dueDate: {
      type: Date,
    },
    escalationLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    lastEscalatedAt: {
      type: Date,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    slaHours: {
      type: Number,
      default: 72,
      min: 1,
    },
    slaBreached: {
      type: Boolean,
      default: false,
    },
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
    },
    estimatedResolutionDate: {
      type: Date,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    followUpDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// All indexes defined in ONE place (NO index: true in field definitions)
complaintSchema.index({ memId: 1 });
complaintSchema.index({ fileId: 1 });
complaintSchema.index({ compCatId: 1 });
complaintSchema.index({ compTitle: 1 });
complaintSchema.index({ compDate: 1 });
complaintSchema.index({ compPriority: 1 });
complaintSchema.index({ statusId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ resolutionDate: 1 });
complaintSchema.index({ dueDate: 1 });
complaintSchema.index({ isEscalated: 1 });
complaintSchema.index({ slaBreached: 1 });
complaintSchema.index({ estimatedResolutionDate: 1 });
complaintSchema.index({ followUpDate: 1 });
complaintSchema.index({ createdBy: 1 });
complaintSchema.index({ updatedBy: 1 });
complaintSchema.index({ isDeleted: 1 });

// Compound indexes
complaintSchema.index({ status: 1, compPriority: 1 });
complaintSchema.index({ memId: 1, compDate: -1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ compCatId: 1, compDate: -1 });
complaintSchema.index({ slaBreached: 1, isEscalated: 1 });
complaintSchema.index({ dueDate: 1, status: 1 });
complaintSchema.index({ isEscalated: 1, escalationLevel: 1 });

// Text index for search
complaintSchema.index(
  { compTitle: 'text', compDescription: 'text', resolutionNotes: 'text', tags: 'text' },
  {
    weights: { compTitle: 10, compDescription: 5, resolutionNotes: 3, tags: 2 },
    name: 'complaint_text_search',
  }
);

// Virtual fields
complaintSchema.virtual('slaStatus').get(function (this: IComplaint) {
  if (!this.dueDate) return 'No SLA';
  const now = new Date();
  const due = new Date(this.dueDate);
  const hoursRemaining = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursRemaining <= 0) return 'Breached';
  if (hoursRemaining <= 24) return 'Urgent';
  if (hoursRemaining <= 72) return 'Warning';
  return 'Normal';
});

complaintSchema.virtual('ageInDays').get(function (this: IComplaint) {
  const created = new Date(this.compDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

complaintSchema.virtual('resolutionTimeInDays').get(function (this: IComplaint) {
  if (!this.resolutionDate) return null;
  const created = new Date(this.compDate);
  const resolved = new Date(this.resolutionDate);
  const diffTime = Math.abs(resolved.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

complaintSchema.virtual('priorityColor').get(function (this: IComplaint) {
  const colors: Record<ComplaintPriority, string> = {
    [ComplaintPriority.EMERGENCY]: '#FF0000',
    [ComplaintPriority.HIGH]: '#FF4500',
    [ComplaintPriority.MEDIUM]: '#FFA500',
    [ComplaintPriority.LOW]: '#32CD32',
  };
  return colors[this.compPriority] || '#808080';
});

complaintSchema.virtual('statusLabel').get(function (this: IComplaint) {
  const labels: Record<ComplaintStatus, string> = {
    [ComplaintStatus.OPEN]: 'Open',
    [ComplaintStatus.IN_PROGRESS]: 'In Progress',
    [ComplaintStatus.RESOLVED]: 'Resolved',
    [ComplaintStatus.CLOSED]: 'Closed',
    [ComplaintStatus.REJECTED]: 'Rejected',
    [ComplaintStatus.REOPENED]: 'Reopened',
    [ComplaintStatus.ON_HOLD]: 'On Hold',
  };
  return labels[this.status as ComplaintStatus] || 'Unknown';
});

// Pre-save middleware
complaintSchema.pre('save', function (next) {
  if (this.isNew && !this.dueDate) {
    const compDate = new Date(this.compDate);
    const dueDate = new Date(compDate.getTime() + this.slaHours * 60 * 60 * 1000);
    this.dueDate = dueDate;
  }

  if (this.dueDate && !this.slaBreached) {
    const now = new Date();
    const due = new Date(this.dueDate);
    if (now > due) {
      this.slaBreached = true;
    }
  }
  next();
});

// Static methods
complaintSchema.statics.getByMember = function (
  memberId: Types.ObjectId,
  limit = 50
): Promise<IComplaint[]> {
  return this.find({
    memId: memberId,
    isDeleted: false,
  })
    .sort({ compDate: -1 })
    .limit(limit)
    .populate('compCatId', 'categoryName categoryCode')
    .populate('assignedTo', 'firstName lastName email');
};

complaintSchema.statics.getOverdueComplaints = function (): Promise<IComplaint[]> {
  const now = new Date();
  return this.find({
    dueDate: { $lt: now },
    status: { $nin: [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED] },
    isDeleted: false,
  })
    .populate('memId', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email');
};

complaintSchema.statics.getComplaintsNeedingEscalation = function (): Promise<IComplaint[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.find({
    lastEscalatedAt: { $lt: twentyFourHoursAgo },
    isEscalated: false,
    status: { $nin: [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED] },
    isDeleted: false,
  })
    .populate('compCatId', 'categoryName escalationLevels')
    .populate('assignedTo', 'firstName lastName email');
};

interface IComplaintModel extends Model<IComplaint> {
  getByMember(memberId: Types.ObjectId, limit?: number): Promise<IComplaint[]>;
  getOverdueComplaints(): Promise<IComplaint[]>;
  getComplaintsNeedingEscalation(): Promise<IComplaint[]>;
}

const Complaint = model<IComplaint, IComplaintModel>('Complaint', complaintSchema);

export default Complaint;
