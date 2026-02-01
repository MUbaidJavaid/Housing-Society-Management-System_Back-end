import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ISrComplaintCategory extends Document {
  categoryName: string;
  categoryCode: string;
  description?: string;
  priorityLevel: number; // 1-10, 1 being highest priority
  slaHours?: number; // Service Level Agreement in hours
  isActive: boolean;
  escalationLevels?: {
    level: number;
    role: string; // Role to escalate to
    hoursAfterCreation: number;
  }[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

const srComplaintCategorySchema = new Schema<ISrComplaintCategory>(
  {
    categoryName: {
      type: String,
      required: [true, 'Category Name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Category Name must be at least 2 characters'],
      maxlength: [100, 'Category Name cannot exceed 100 characters'],
      index: true,
    },

    categoryCode: {
      type: String,
      required: [true, 'Category Code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      minlength: [2, 'Category Code must be at least 2 characters'],
      maxlength: [20, 'Category Code cannot exceed 20 characters'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    priorityLevel: {
      type: Number,
      required: [true, 'Priority Level is required'],
      min: [1, 'Priority Level must be at least 1'],
      max: [10, 'Priority Level cannot exceed 10'],
      default: 5,
    },

    slaHours: {
      type: Number,
      min: [1, 'SLA must be at least 1 hour'],
      default: 72, // Default 72 hours (3 days)
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    escalationLevels: [
      {
        level: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        role: {
          type: String,
          required: true,
          trim: true,
        },
        hoursAfterCreation: {
          type: Number,
          required: true,
          min: 1,
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

// Compound indexes
srComplaintCategorySchema.index({ isActive: 1, isDeleted: 1 });
srComplaintCategorySchema.index({ priorityLevel: 1, isActive: 1 });

// Text index for search
srComplaintCategorySchema.index(
  { categoryName: 'text', categoryCode: 'text', description: 'text' },
  {
    weights: { categoryName: 10, categoryCode: 8, description: 5 },
    name: 'srcomplaintcategory_text_search',
  }
);

// Virtual for priority label
srComplaintCategorySchema.virtual('priorityLabel').get(function () {
  const labels: Record<number, string> = {
    1: 'Critical',
    2: 'High',
    3: 'High',
    4: 'Medium',
    5: 'Medium',
    6: 'Medium',
    7: 'Low',
    8: 'Low',
    9: 'Very Low',
    10: 'Very Low',
  };
  return labels[this.priorityLevel] || 'Medium';
});

// Virtual for priority color (for UI)
srComplaintCategorySchema.virtual('priorityColor').get(function () {
  const colors: Record<number, string> = {
    1: '#FF0000', // Red
    2: '#FF4500', // Orange Red
    3: '#FF8C00', // Dark Orange
    4: '#FFA500', // Orange
    5: '#FFD700', // Gold
    6: '#FFFF00', // Yellow
    7: '#ADFF2F', // Green Yellow
    8: '#7FFF00', // Chartreuse
    9: '#32CD32', // Lime Green
    10: '#90EE90', // Light Green
  };
  return colors[this.priorityLevel] || '#808080';
});

// Virtual for SLA description
srComplaintCategorySchema.virtual('slaDescription').get(function () {
  if (!this.slaHours) return 'No SLA defined';

  if (this.slaHours < 24) {
    return `${this.slaHours} hour${this.slaHours > 1 ? 's' : ''}`;
  }

  const days = Math.ceil(this.slaHours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
});

// Static method to get active categories
srComplaintCategorySchema.statics.getActiveCategories = function (): Promise<
  ISrComplaintCategory[]
> {
  return this.find({
    isActive: true,
    isDeleted: false,
  }).sort({ priorityLevel: 1, categoryName: 1 });
};

// Static method to get categories by priority
srComplaintCategorySchema.statics.getCategoriesByPriority = function (
  minPriority: number,
  maxPriority: number
): Promise<ISrComplaintCategory[]> {
  return this.find({
    priorityLevel: { $gte: minPriority, $lte: maxPriority },
    isActive: true,
    isDeleted: false,
  }).sort({ priorityLevel: 1 });
};

const SrComplaintCategory: Model<ISrComplaintCategory> = model<ISrComplaintCategory>(
  'SrComplaintCategory',
  srComplaintCategorySchema
);

export default SrComplaintCategory;
