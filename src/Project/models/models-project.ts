import { Document, Model, Schema, Types, model } from 'mongoose';

export enum ProjectStatus {
  PLANNING = 'planning',
  UNDER_DEVELOPMENT = 'under_development',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum ProjectType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  MIXED_USE = 'mixed_use',
  AGRICULTURAL = 'agricultural',
}

export interface IProject extends Document {
  projName: string;
  projCode: string;
  projLocation: string;
  projPrefix: string;
  projDescription?: string;
  totalArea: number;
  areaUnit: string;
  launchDate: Date;
  completionDate?: Date;
  projStatus: ProjectStatus;
  projType?: ProjectType;
  isActive: boolean;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  cityId: Types.ObjectId; // Foreign key to City
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  amenities?: string[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProjectModel extends Model<IProject> {
  generateProjectCode(baseName: string): Promise<string>;
}

// Use `any` for Model type to avoid TS2590 (Mongoose Schema generics produce too-complex union)
const projectSchema = new Schema<IProject, any>(
  {
    projName: {
      type: String,
      required: [true, 'Project Name is required'],
      trim: true,
      minlength: [2, 'Project Name must be at least 2 characters'],
      maxlength: [200, 'Project Name cannot exceed 200 characters'],
      index: true,
    },

    projCode: {
      type: String,
      required: [true, 'Project Code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      minlength: [2, 'Project Code must be at least 2 characters'],
      maxlength: [20, 'Project Code cannot exceed 20 characters'],
      index: true,
    },

    projLocation: {
      type: String,
      required: [true, 'Project Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },

    projPrefix: {
      type: String,
      required: [true, 'Project Prefix is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Project Prefix must be at least 2 characters'],
      maxlength: [10, 'Project Prefix cannot exceed 10 characters'],
      index: true,
    },

    projDescription: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    totalArea: {
      type: Number,
      required: [true, 'Total Area is required'],
      min: [0.01, 'Total Area must be greater than 0'],
    },

    areaUnit: {
      type: String,
      required: [true, 'Area Unit is required'],
      enum: {
        values: ['acres', 'hectares', 'sqft', 'sqm', 'km²', 'marla', 'kanal'],
        message: '{VALUE} is not a valid area unit',
      },
      default: 'acres',
    },

    launchDate: {
      type: Date,
      required: [true, 'Launch Date is required'],
      validate: {
        validator: function (value: Date) {
          return value <= new Date();
        },
        message: 'Launch Date cannot be in the future',
      },
    },

    completionDate: {
      type: Date,
      // validate: {
      //   validator: function (this: IProject, value: Date) {
      //     return !value || value >= this.launchDate;
      //   },
      //   message: 'Completion Date must be after Launch Date',
      // },
    },

    projStatus: {
      type: String,
      required: [true, 'Project Status is required'],
      enum: {
        values: Object.values(ProjectStatus),
        message: '{VALUE} is not a valid project status',
      },
      default: ProjectStatus.PLANNING,
      index: true,
    },

    projType: {
      type: String,
      enum: {
        values: Object.values(ProjectType),
        message: '{VALUE} is not a valid project type',
      },
      default: ProjectType.RESIDENTIAL,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please enter a valid website URL'],
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    contactPhone: {
      type: String,
      trim: true,
      match: [/^[+]?[0-9\s\-\(\)]{10,}$/, 'Please enter a valid phone number'],
    },

    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },

    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: [true, 'City is required'],
      index: true,
    },

    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'Pakistan',
      index: true,
    },

    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },

    amenities: [
      {
        type: String,
        trim: true,
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

// Pre-save middleware
projectSchema.pre('save', function (next) {
  if (this.projStatus === ProjectStatus.COMPLETED && !this.completionDate) {
    this.completionDate = new Date();
  }
  next();
});

// Compound indexes for common queries
projectSchema.index({ isActive: 1, isDeleted: 1 });
projectSchema.index({ cityId: 1, isActive: 1, isDeleted: 1 });
projectSchema.index({ projStatus: 1, isActive: 1 });
projectSchema.index({ projType: 1, isActive: 1 });
projectSchema.index({ country: 1, cityId: 1, isActive: 1 });

// Text index for search
projectSchema.index(
  {
    projName: 'text',
    projCode: 'text',
    projLocation: 'text',
    projDescription: 'text',
  },
  {
    weights: { projName: 10, projCode: 9, projLocation: 8, projDescription: 5 },
    name: 'project_text_search',
  }
);

// 2dsphere index for geospatial queries
if (projectSchema.path('coordinates.latitude') && projectSchema.path('coordinates.longitude')) {
  projectSchema.index({ coordinates: '2dsphere' });
}

// Virtual for formatted area display
projectSchema.virtual('formattedArea').get(function () {
  if (typeof this.totalArea !== 'number') return null;
  return `${this.totalArea.toLocaleString()} ${this.areaUnit ?? ''}`;
});

// Virtual for project age (in months)
projectSchema.virtual('projectAgeMonths').get(function () {
  if (!this.launchDate) return 0;

  const launch = new Date(this.launchDate);
  if (isNaN(launch.getTime())) return 0;

  const now = new Date();
  const diffMonths =
    (now.getFullYear() - launch.getFullYear()) * 12 + (now.getMonth() - launch.getMonth());

  return Math.max(0, diffMonths);
});

// Virtual for project status color (for UI)
projectSchema.virtual('statusColor').get(function () {
  const colors = {
    [ProjectStatus.PLANNING]: 'blue',
    [ProjectStatus.UNDER_DEVELOPMENT]: 'orange',
    [ProjectStatus.COMPLETED]: 'green',
    [ProjectStatus.ON_HOLD]: 'yellow',
    [ProjectStatus.CANCELLED]: 'red',
  };
  return colors[this.projStatus] || 'gray';
});

// Virtual for city name (populated)
projectSchema.virtual('cityName', {
  ref: 'City',
  localField: 'cityId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'cityName' },
});

// Virtual for state name through city
projectSchema.virtual('stateName', {
  ref: 'City',
  localField: 'cityId',
  foreignField: '_id',
  justOne: true,
  options: {
    populate: {
      path: 'stateId',
      select: 'stateName',
    },
  },
});

// Ensure virtuals are included in toJSON output
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

// Static method to generate project code
projectSchema.statics.generateProjectCode = async function (baseName: string): Promise<string> {
  const prefix = baseName.substring(0, 3).toUpperCase();
  let counter = 1;
  let code = `${prefix}${counter.toString().padStart(3, '0')}`;

  while (await this.findOne({ projCode: code, isDeleted: false })) {
    counter++;
    code = `${prefix}${counter.toString().padStart(3, '0')}`;
  }

  return code;
};

// Create the model using the extended type
const Project: IProjectModel = model<IProject, IProjectModel>('Project', projectSchema);

export default Project;
