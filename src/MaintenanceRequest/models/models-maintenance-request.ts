import { Document, Schema, Types, model } from 'mongoose';

export interface IWorkLog {
  date: Date;
  description: string;
  loggedBy: Types.ObjectId;
  hoursWorked?: number;
  photos: string[];
}

export interface IResidentFeedback {
  rating: number;
  comment?: string;
  feedbackDate: Date;
}

export interface IMaintenanceImage {
  url: string;
  description?: string;
}

export interface IMaintenanceRequest extends Document {
  requestNumber: string;
  societyId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  plotId?: Types.ObjectId;
  category: string;
  title: string;
  description: string;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  images: IMaintenanceImage[];
  status: 'submitted' | 'acknowledged' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'verified' | 'closed' | 'rejected';
  assignedTo?: Types.ObjectId;
  assignedVendor?: Types.ObjectId;
  estimatedCost?: number;
  actualCost?: number;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  workLog: IWorkLog[];
  residentFeedback?: IResidentFeedback;
  rejectionReason?: string;
  slaDeadline?: Date;
  isOverdue: boolean;
  metadata: any;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workLogSchema = new Schema<IWorkLog>(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
    },
    loggedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hoursWorked: {
      type: Number,
    },
    photos: [{ type: String }],
  },
  { _id: true }
);

const maintenanceImageSchema = new Schema<IMaintenanceImage>(
  {
    url: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { _id: true }
);

const residentFeedbackSchema = new Schema<IResidentFeedback>(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
    feedbackDate: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const maintenanceRequestSchema = new Schema<IMaintenanceRequest>(
  {
    requestNumber: {
      type: String,
      required: [true, 'Request number is required'],
      unique: true,
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
    },

    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Requested by is required'],
    },

    plotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'plumbing', 'electrical', 'carpentry', 'painting', 'pest_control',
        'hvac', 'elevator', 'generator', 'water_supply', 'sewerage',
        'road_repair', 'landscaping', 'security_equipment', 'other',
      ],
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
    },

    location: {
      type: String,
      required: [true, 'Location is required'],
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    images: [maintenanceImageSchema],

    status: {
      type: String,
      enum: [
        'submitted', 'acknowledged', 'assigned', 'in_progress',
        'on_hold', 'completed', 'verified', 'closed', 'rejected',
      ],
      default: 'submitted',
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    assignedVendor: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
    },

    estimatedCost: {
      type: Number,
    },

    actualCost: {
      type: Number,
    },

    estimatedCompletionDate: {
      type: Date,
    },

    actualCompletionDate: {
      type: Date,
    },

    workLog: [workLogSchema],

    residentFeedback: residentFeedbackSchema,

    rejectionReason: {
      type: String,
    },

    slaDeadline: {
      type: Date,
    },

    isOverdue: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },

    modifiedBy: {
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

// Indexes
maintenanceRequestSchema.index({ requestNumber: 1 }, { unique: true });
maintenanceRequestSchema.index({ societyId: 1, status: 1, isDeleted: 1 });
maintenanceRequestSchema.index({ requestedBy: 1 });
maintenanceRequestSchema.index({ assignedTo: 1, status: 1 });
maintenanceRequestSchema.index({ priority: 1, isOverdue: 1 });
maintenanceRequestSchema.index({ category: 1 });

// Pre-save hook: Auto-generate requestNumber and SLA deadline
maintenanceRequestSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Auto-generate request number: MR-YYYY-XXXXX
    if (!this.requestNumber) {
      const year = new Date().getFullYear();
      const count = await MaintenanceRequest.countDocuments();
      const sequence = String(count + 1).padStart(5, '0');
      this.requestNumber = `MR-${year}-${sequence}`;
    }

    // Auto-set SLA deadline based on priority
    if (!this.slaDeadline) {
      const now = new Date();
      switch (this.priority) {
        case 'low':
          this.slaDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
          break;
        case 'medium':
          this.slaDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
          break;
        case 'high':
          this.slaDeadline = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day
          break;
        case 'urgent':
          this.slaDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
          break;
        default:
          this.slaDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days default
      }
    }
  }

  // Check if overdue
  if (this.slaDeadline && !['completed', 'verified', 'closed', 'rejected'].includes(this.status)) {
    this.isOverdue = new Date() > this.slaDeadline;
  }

  next();
});

const MaintenanceRequest = model<IMaintenanceRequest>('MaintenanceRequest', maintenanceRequestSchema);

export default MaintenanceRequest;
