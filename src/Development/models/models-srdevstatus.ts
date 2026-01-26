import { CallbackWithoutResult, Document, model, Model, Schema, Types } from 'mongoose';

export enum DevCategory {
  INFRASTRUCTURE = 'infrastructure',
  CONSTRUCTION = 'construction',
  LEGAL = 'legal',
  PLANNING = 'planning',
  SERVICES = 'services',
  COMPLETION = 'completion',
}

export enum DevPhase {
  PRE_CONSTRUCTION = 'pre_construction',
  CONSTRUCTION = 'construction',
  POST_CONSTRUCTION = 'post_construction',
  COMPLETION = 'completion',
}

export interface ISrDevStatus extends Document {
  srDevStatName: string;
  srDevStatCode: string;
  devCategory: DevCategory;
  devPhase: DevPhase;
  description?: string;
  sequence: number;
  isActive: boolean;
  isDefault: boolean;
  colorCode: string;
  icon?: string;
  percentageComplete: number; // 0-100, indicates progress percentage
  requiresDocumentation: boolean;
  allowedTransitions: Types.ObjectId[]; // Next possible statuses
  estimatedDurationDays?: number; // Estimated days to complete this phase
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}
interface ISrDevStatusDocWithMethods extends ISrDevStatus {
  validatePhasePercentage(): void;
}

const srDevStatusSchema = new Schema<ISrDevStatus>(
  {
    srDevStatName: {
      type: String,
      required: [true, 'Development Status Name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Development Status Name must be at least 2 characters'],
      maxlength: [100, 'Development Status Name cannot exceed 100 characters'],
      index: true,
    },

    srDevStatCode: {
      type: String,
      required: [true, 'Development Status Code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      minlength: [2, 'Development Status Code must be at least 2 characters'],
      maxlength: [20, 'Development Status Code cannot exceed 20 characters'],
      index: true,
    },

    devCategory: {
      type: String,
      required: [true, 'Development Category is required'],
      enum: {
        values: Object.values(DevCategory),
        message: '{VALUE} is not a valid development category',
      },
      default: DevCategory.INFRASTRUCTURE,
      index: true,
    },

    devPhase: {
      type: String,
      required: [true, 'Development Phase is required'],
      enum: {
        values: Object.values(DevPhase),
        message: '{VALUE} is not a valid development phase',
      },
      default: DevPhase.PRE_CONSTRUCTION,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    sequence: {
      type: Number,
      required: [true, 'Sequence is required'],
      min: [1, 'Sequence must be at least 1'],
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    colorCode: {
      type: String,
      required: [true, 'Color Code is required'],
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color code'],
      default: '#808080',
    },

    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'Icon cannot exceed 50 characters'],
    },

    percentageComplete: {
      type: Number,
      required: [true, 'Percentage Complete is required'],
      min: [0, 'Percentage cannot be less than 0'],
      max: [100, 'Percentage cannot exceed 100'],
      default: 0,
    },

    requiresDocumentation: {
      type: Boolean,
      default: false,
      index: true,
    },

    allowedTransitions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'SrDevStatus',
      },
    ],

    estimatedDurationDays: {
      type: Number,
      min: [0, 'Estimated duration cannot be negative'],
      default: 0,
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
// Pre-save middleware
srDevStatusSchema.pre(
  'save',
  async function (this: ISrDevStatusDocWithMethods, _next: CallbackWithoutResult) {
    if (this.isDefault) {
      await this.model('SrDevStatus').updateMany(
        {
          _id: { $ne: this._id },
          isDeleted: false,
        },
        { $set: { isDefault: false } }
      );
    }

    // Now TS knows validatePhasePercentage exists
    this.validatePhasePercentage();
  }
);

// Pre-update middleware
srDevStatusSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;

  if (update.isDefault === true) {
    await this.model.updateMany(
      {
        _id: { $ne: this.getQuery()._id },
        isDeleted: false,
      },
      { $set: { isDefault: false } }
    );
  }
  next();
});

srDevStatusSchema.methods.validatePhasePercentage = function () {
  const phasePercentages: Record<DevPhase, { min: number; max: number }> = {
    [DevPhase.PRE_CONSTRUCTION]: { min: 0, max: 30 },
    [DevPhase.CONSTRUCTION]: { min: 31, max: 80 },
    [DevPhase.POST_CONSTRUCTION]: { min: 81, max: 99 },
    [DevPhase.COMPLETION]: { min: 100, max: 100 },
  };

  // TS knows this.devPhase is a key of phasePercentages
  const limits = phasePercentages[this.devPhase as DevPhase];
  if (!limits) return;

  if (this.percentageComplete < limits.min || this.percentageComplete > limits.max) {
    throw new Error(
      `Percentage for ${this.devPhase} phase must be between ${limits.min} and ${limits.max}`
    );
  }
};

// Compound indexes for common queries
srDevStatusSchema.index({ isActive: 1, isDeleted: 1 });
srDevStatusSchema.index({ devCategory: 1, isActive: 1 });
srDevStatusSchema.index({ devPhase: 1, isActive: 1 });
srDevStatusSchema.index({ sequence: 1, isActive: 1 });

// Text index for search
srDevStatusSchema.index(
  { srDevStatName: 'text', srDevStatCode: 'text', description: 'text' },
  {
    weights: { srDevStatName: 10, srDevStatCode: 8, description: 5 },
    name: 'srdevstatus_text_search',
  }
);

// Virtual for formatted color display
srDevStatusSchema.virtual('colorName').get(function () {
  const colors: Record<string, string> = {
    '#FF0000': 'Red',
    '#00FF00': 'Green',
    '#0000FF': 'Blue',
    '#FFFF00': 'Yellow',
    '#FFA500': 'Orange',
    '#800080': 'Purple',
    '#008080': 'Teal',
    '#808080': 'Gray',
    '#A52A2A': 'Brown',
    '#000000': 'Black',
    '#4CAF50': 'Light Green',
    '#2196F3': 'Light Blue',
    '#FF9800': 'Amber',
    '#9C27B0': 'Deep Purple',
  };

  return colors[this.colorCode] || this.colorCode;
});

srDevStatusSchema.virtual('cssClass').get(function () {
  if (!this.srDevStatCode) return 'dev-status-unknown';
  return `dev-status-${this.srDevStatCode.toLowerCase().replace(/_/g, '-')}`;
});

srDevStatusSchema.virtual('badgeVariant').get(function () {
  if (!this.devPhase) return 'default';
  const variants: Record<DevPhase, string> = {
    [DevPhase.PRE_CONSTRUCTION]: 'info',
    [DevPhase.CONSTRUCTION]: 'warning',
    [DevPhase.POST_CONSTRUCTION]: 'primary',
    [DevPhase.COMPLETION]: 'success',
  };
  return variants[this.devPhase] || 'default';
});

srDevStatusSchema.virtual('phaseDescription').get(function () {
  if (!this.devPhase) return '';
  const descriptions: Record<DevPhase, string> = {
    [DevPhase.PRE_CONSTRUCTION]: 'Planning and preparation phase',
    [DevPhase.CONSTRUCTION]: 'Active construction phase',
    [DevPhase.POST_CONSTRUCTION]: 'Finishing and handover phase',
    [DevPhase.COMPLETION]: 'Project completion phase',
  };
  return descriptions[this.devPhase] || '';
});

// Virtual for progress bar color based on percentage
srDevStatusSchema.virtual('progressColor').get(function () {
  if (this.percentageComplete < 30) return '#FF5722'; // Red-Orange
  if (this.percentageComplete < 60) return '#FF9800'; // Orange
  if (this.percentageComplete < 90) return '#4CAF50'; // Green
  return '#2196F3'; // Blue for completion
});

// Virtual for estimated completion time
srDevStatusSchema.virtual('estimatedCompletionText').get(function () {
  if (!this.estimatedDurationDays || this.estimatedDurationDays === 0) {
    return 'No estimate';
  }

  if (this.estimatedDurationDays === 1) return '1 day';
  if (this.estimatedDurationDays < 30) return `${this.estimatedDurationDays} days`;

  const months = Math.round(this.estimatedDurationDays / 30);
  return months === 1 ? '1 month' : `${months} months`;
});

// Ensure virtuals are included in toJSON output
srDevStatusSchema.set('toJSON', { virtuals: true });
srDevStatusSchema.set('toObject', { virtuals: true });

// Static method to get default status
srDevStatusSchema.statics.getDefaultStatus = async function (): Promise<ISrDevStatus | null> {
  return this.findOne({ isDefault: true, isActive: true, isDeleted: false });
};

// Static method to get statuses by category
srDevStatusSchema.statics.getStatusesByCategory = function (
  category: DevCategory
): Promise<ISrDevStatus[]> {
  return this.find({
    devCategory: category,
    isActive: true,
    isDeleted: false,
  }).sort({ sequence: 1 });
};

// Static method to get statuses by phase
srDevStatusSchema.statics.getStatusesByPhase = function (phase: DevPhase): Promise<ISrDevStatus[]> {
  return this.find({
    devPhase: phase,
    isActive: true,
    isDeleted: false,
  }).sort({ sequence: 1 });
};

// Static method to get next logical statuses
srDevStatusSchema.statics.getNextLogicalStatuses = async function (
  currentStatusId: string
): Promise<ISrDevStatus[]> {
  const currentStatus = await this.findById(currentStatusId);
  if (
    !currentStatus ||
    !currentStatus.allowedTransitions ||
    currentStatus.allowedTransitions.length === 0
  ) {
    return this.find({
      sequence: { $gt: currentStatus?.sequence || 0 },
      isActive: true,
      isDeleted: false,
    })
      .sort({ sequence: 1 })
      .limit(3);
  }

  return this.find({
    _id: { $in: currentStatus.allowedTransitions },
    isActive: true,
    isDeleted: false,
  }).sort({ sequence: 1 });
};

const SrDevStatusModel: Model<ISrDevStatus> = model<ISrDevStatus>('SrDevStatus', srDevStatusSchema);

export default SrDevStatusModel;
