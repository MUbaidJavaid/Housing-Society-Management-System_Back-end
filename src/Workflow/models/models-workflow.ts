import { Document, Model, Schema, Types, model } from 'mongoose';

// Enums
export enum TriggerType {
  ENTITY_CREATE = 'entity-create',
  STATUS_CHANGE = 'status-change',
  FIELD_UPDATE = 'field-update',
  TIME_BASED = 'time-based',
  MANUAL = 'manual',
}

export enum StepType {
  APPROVAL = 'approval',
  NOTIFICATION = 'notification',
  FIELD_UPDATE = 'field-update',
  STATUS_CHANGE = 'status-change',
  DELAY = 'delay',
  CONDITION = 'condition',
  ESCALATION = 'escalation',
  WEBHOOK = 'webhook',
  AI_ACTION = 'ai-action',
}

// Step subdocument interface
export interface IWorkflowStep {
  stepNumber: number;
  stepType: StepType;
  config: Record<string, any>;
  nextStepOnSuccess?: number;
  nextStepOnFailure?: number;
  nextStepOnTimeout?: number;
}

// Main document interface
export interface IWorkflow extends Document {
  name: string;
  description?: string;
  societyId: Types.ObjectId;
  triggerType: TriggerType;
  triggerEntity: string;
  triggerConditions?: Record<string, any>;
  steps: IWorkflowStep[];
  isActive: boolean;
  version: number;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkflowModel extends Model<IWorkflow> {
  getActiveBySociety(societyId: Types.ObjectId | string): Promise<IWorkflow[]>;
}

const workflowStepSchema = new Schema<IWorkflowStep>(
  {
    stepNumber: {
      type: Number,
      required: [true, 'Step number is required'],
      min: [1, 'Step number must be at least 1'],
    },

    stepType: {
      type: String,
      required: [true, 'Step type is required'],
      enum: {
        values: Object.values(StepType),
        message: '{VALUE} is not a valid step type',
      },
    },

    config: {
      type: Schema.Types.Mixed,
      default: {},
    },

    nextStepOnSuccess: {
      type: Number,
    },

    nextStepOnFailure: {
      type: Number,
    },

    nextStepOnTimeout: {
      type: Number,
    },
  },
  { _id: false }
);

const workflowSchema = new Schema<IWorkflow>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    triggerType: {
      type: String,
      required: [true, 'Trigger type is required'],
      enum: {
        values: Object.values(TriggerType),
        message: '{VALUE} is not a valid trigger type',
      },
    },

    triggerEntity: {
      type: String,
      required: [true, 'Trigger entity is required'],
      trim: true,
    },

    triggerConditions: {
      type: Schema.Types.Mixed,
      default: {},
    },

    steps: {
      type: [workflowStepSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    version: {
      type: Number,
      default: 1,
      min: [1, 'Version must be at least 1'],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Compound index for querying active workflows by society and entity
workflowSchema.index(
  { societyId: 1, triggerEntity: 1, isActive: 1, isDeleted: 1 },
  { name: 'workflow_society_entity_active' }
);

// Text index for search
workflowSchema.index(
  { name: 'text', description: 'text' },
  {
    weights: { name: 10, description: 5 },
    name: 'workflow_text_search',
  }
);

// Pre-save hook: increment version on updates
workflowSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  if (update?.$set && !update.$set.isDeleted) {
    update.$inc = update.$inc || {};
    update.$inc.version = 1;
  }
  next();
});

// Virtual for step count
workflowSchema.virtual('stepCount').get(function () {
  return this.steps ? this.steps.length : 0;
});

// Ensure virtuals are included in toJSON/toObject output
workflowSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

workflowSchema.set('toObject', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

// Static method: get active workflows for a society
workflowSchema.statics.getActiveBySociety = async function (
  societyId: Types.ObjectId | string
): Promise<IWorkflow[]> {
  return this.find({
    societyId,
    isActive: true,
    isDeleted: false,
  }).sort({ name: 1 });
};

const Workflow: IWorkflowModel = model<IWorkflow, IWorkflowModel>(
  'Workflow',
  workflowSchema
);

export default Workflow;
