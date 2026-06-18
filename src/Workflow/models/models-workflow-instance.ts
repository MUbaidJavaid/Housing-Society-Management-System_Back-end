import { Document, Model, Schema, Types, model } from 'mongoose';

// Enums
export enum WorkflowInstanceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum StepLogStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  TIMED_OUT = 'timed-out',
}

// Step log subdocument interface
export interface IStepLog {
  stepNumber: number;
  stepType: string;
  status: StepLogStatus;
  executedAt?: Date;
  executedBy?: Types.ObjectId;
  result?: Record<string, any>;
  notes?: string;
}

// Main document interface
export interface IWorkflowInstance extends Document {
  workflowId: Types.ObjectId;
  entityType: string;
  entityId: Types.ObjectId;
  societyId: Types.ObjectId;
  currentStepNumber: number;
  status: WorkflowInstanceStatus;
  stepLogs: IStepLog[];
  startedAt?: Date;
  completedAt?: Date;
  initiatedBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkflowInstanceModel extends Model<IWorkflowInstance> {
  getActiveByEntity(entityType: string, entityId: Types.ObjectId | string): Promise<IWorkflowInstance[]>;
}

const stepLogSchema = new Schema<IStepLog>(
  {
    stepNumber: {
      type: Number,
      required: [true, 'Step number is required'],
    },

    stepType: {
      type: String,
      required: [true, 'Step type is required'],
    },

    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: Object.values(StepLogStatus),
        message: '{VALUE} is not a valid step log status',
      },
      default: StepLogStatus.PENDING,
    },

    executedAt: {
      type: Date,
    },

    executedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    result: {
      type: Schema.Types.Mixed,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
  },
  { _id: false }
);

const workflowInstanceSchema = new Schema<IWorkflowInstance>(
  {
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: [true, 'Workflow ID is required'],
      index: true,
    },

    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      trim: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    currentStepNumber: {
      type: Number,
      default: 1,
      min: [1, 'Current step number must be at least 1'],
    },

    status: {
      type: String,
      enum: {
        values: Object.values(WorkflowInstanceStatus),
        message: '{VALUE} is not a valid workflow instance status',
      },
      default: WorkflowInstanceStatus.PENDING,
    },

    stepLogs: {
      type: [stepLogSchema],
      default: [],
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Initiated by is required'],
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

// Compound indexes
workflowInstanceSchema.index(
  { workflowId: 1, status: 1, isDeleted: 1 },
  { name: 'instance_workflow_status' }
);

workflowInstanceSchema.index(
  { entityType: 1, entityId: 1, isDeleted: 1 },
  { name: 'instance_entity' }
);

workflowInstanceSchema.index(
  { societyId: 1, status: 1 },
  { name: 'instance_society_status' }
);

// Virtual for duration
workflowInstanceSchema.virtual('duration').get(function () {
  if (this.startedAt && this.completedAt) {
    return this.completedAt.getTime() - this.startedAt.getTime();
  }
  return null;
});

// Ensure virtuals are included in toJSON/toObject output
workflowInstanceSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

workflowInstanceSchema.set('toObject', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

// Static method: get active instances for an entity
workflowInstanceSchema.statics.getActiveByEntity = async function (
  entityType: string,
  entityId: Types.ObjectId | string
): Promise<IWorkflowInstance[]> {
  return this.find({
    entityType,
    entityId,
    status: { $in: [WorkflowInstanceStatus.PENDING, WorkflowInstanceStatus.IN_PROGRESS] },
    isDeleted: false,
  }).populate('workflowId');
};

const WorkflowInstance: IWorkflowInstanceModel = model<IWorkflowInstance, IWorkflowInstanceModel>(
  'WorkflowInstance',
  workflowInstanceSchema
);

export default WorkflowInstance;
