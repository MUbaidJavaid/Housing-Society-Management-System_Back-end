import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IProject extends Document {
  projName: string;
  projSiteName?: string;
  projLocation: string;
  projStartDate?: Date;
  projEndDate?: Date;
  projCovArea?: number;
  projRemarks?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const projectSchema = new Schema<IProject>(
  {
    projName: {
      type: String,
      required: [true, 'Project Name is required'],
      trim: true,
      minlength: [2, 'Project Name must be at least 2 characters'],
      maxlength: [200, 'Project Name cannot exceed 200 characters'],
      index: true,
    },

    projSiteName: {
      type: String,
      trim: true,
      maxlength: [200, 'Site Name cannot exceed 200 characters'],
    },

    projLocation: {
      type: String,
      required: [true, 'Project Location is required'],
      trim: true,
      maxlength: [500, 'Location cannot exceed 500 characters'],
      index: true,
    },

    projStartDate: {
      type: Date,
    },

    projEndDate: {
      type: Date,
      validate: {
        validator: function (this: IProject, value: Date) {
          return !this.projStartDate || !value || value > this.projStartDate;
        },
        message: 'End date must be after start date',
      },
    },

    projCovArea: {
      type: Number,
      min: [0, 'Coverage Area cannot be negative'],
    },

    projRemarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
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

// Compound index for unique project name
projectSchema.index(
  { projName: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Text index for search
projectSchema.index(
  { projName: 'text', projSiteName: 'text', projLocation: 'text', projRemarks: 'text' },
  {
    weights: {
      projName: 10,
      projSiteName: 5,
      projLocation: 5,
      projRemarks: 3,
    },
    name: 'project_text_search',
  }
);

// Index for date-based queries
projectSchema.index({ projStartDate: 1, isDeleted: 1 });
projectSchema.index({ projEndDate: 1, isDeleted: 1 });
projectSchema.index({ createdBy: 1, isDeleted: 1 });

// Virtual for project status
projectSchema.virtual('status').get(function (this: IProject) {
  const now = new Date();

  if (!this.projStartDate) return 'upcoming';
  if (this.projEndDate && this.projEndDate < now) return 'completed';
  if (this.projStartDate <= now) return 'active';
  return 'upcoming';
});

// Ensure virtuals are included in toObject() and toJSON()
projectSchema.set('toObject', { virtuals: true });
projectSchema.set('toJSON', { virtuals: true });

const Project: Model<IProject> = model<IProject>('Project', projectSchema);

export default Project;
