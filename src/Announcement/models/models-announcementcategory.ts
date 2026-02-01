import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IAnnouncementCategory extends Document {
  categoryName: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  isSystem: boolean;
  priority: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  announcementCount?: number;
  categoryBadgeColor?: string;
  usagePercentage?: number;
}

const announcementCategorySchema = new Schema<IAnnouncementCategory>(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [100, 'Category name cannot exceed 100 characters'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'Icon cannot exceed 50 characters'],
    },

    color: {
      type: String,
      trim: true,
      default: '#3B82F6', // Default blue color
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color'],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },

    priority: {
      type: Number,
      default: 0,
      min: [0, 'Priority must be at least 0'],
      max: [1000, 'Priority cannot exceed 1000'],
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      required: true,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
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
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        // Safely remove sensitive fields using destructuring
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
announcementCategorySchema.index({ categoryName: 1, isDeleted: 1 }, { unique: true });
announcementCategorySchema.index({ isActive: 1, isDeleted: 1 });
announcementCategorySchema.index({ priority: -1, categoryName: 1 });

// Text index for search
announcementCategorySchema.index(
  { categoryName: 'text', description: 'text' },
  {
    weights: { categoryName: 10, description: 5 },
    name: 'announcementcategory_text_search',
  }
);

// Virtual for announcement count
announcementCategorySchema.virtual('announcementCount', {
  ref: 'Announcement',
  localField: '_id',
  foreignField: 'categoryId',
  count: true,
  match: { isDeleted: false, isActive: true },
});

// Virtual for category badge color
announcementCategorySchema.virtual('categoryBadgeColor').get(function () {
  const colors: Record<string, string> = {
    Maintenance: 'warning',
    Event: 'success',
    Emergency: 'danger',
    Billing: 'info',
    Update: 'primary',
    News: 'secondary',
    Holiday: 'purple',
  };

  return colors[this.categoryName] || 'default';
});

// Virtual for usage percentage (based on announcement count)
announcementCategorySchema.virtual('usagePercentage').get(function () {
  // This will be calculated in service based on total announcements
  return 0;
});

// Pre-save middleware to validate system categories
announcementCategorySchema.pre('save', function (next) {
  if (this.isModified('categoryName')) {
    // Capitalize first letter of each word
    this.categoryName = this.categoryName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Check for reserved category names
    const reservedNames = ['System', 'Default', 'All', 'General'];
    if (reservedNames.includes(this.categoryName) && !this.isSystem) {
      return next(new Error(`Category name '${this.categoryName}' is reserved`));
    }
  }

  // Set color based on category name if not provided
  if (!this.color) {
    const colorMap: Record<string, string> = {
      Maintenance: '#F59E0B', // Orange
      Event: '#10B981', // Green
      Emergency: '#EF4444', // Red
      Billing: '#3B82F6', // Blue
      Update: '#8B5CF6', // Purple
      News: '#6B7280', // Gray
      Holiday: '#EC4899', // Pink
    };

    this.color = colorMap[this.categoryName] || '#3B82F6';
  }

  next();
});

// Pre-delete middleware to prevent deletion of system categories
announcementCategorySchema.pre('findOneAndDelete', async function (next) {
  const filter = this.getFilter();
  const category = await this.model.findOne(filter);

  if (category && category.isSystem) {
    return next(new Error('System categories cannot be deleted'));
  }

  next();
});

// Define static methods
announcementCategorySchema.statics.getActiveCategories = function () {
  return this.find({
    isActive: true,
    isDeleted: false,
  })
    .select('_id categoryName description icon color priority')
    .sort({ priority: -1, categoryName: 1 });
};

announcementCategorySchema.statics.findByName = function (categoryName: string) {
  return this.findOne({
    categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') },
    isDeleted: false,
  });
};

announcementCategorySchema.statics.searchCategories = function (
  searchTerm: string,
  limit: number = 10
) {
  return this.find({
    $or: [
      { categoryName: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
    ],
    isDeleted: false,
    isActive: true,
  })
    .select('_id categoryName description icon color')
    .limit(limit)
    .sort({ priority: -1, categoryName: 1 });
};

// Define interface for static methods
interface IAnnouncementCategoryModel extends Model<IAnnouncementCategory> {
  getActiveCategories(): Promise<IAnnouncementCategory[]>;
  findByName(categoryName: string): Promise<IAnnouncementCategory | null>;
  searchCategories(searchTerm: string, limit: number): Promise<IAnnouncementCategory[]>;
}

// Create and export model
const AnnouncementCategory = model<IAnnouncementCategory, IAnnouncementCategoryModel>(
  'AnnouncementCategory',
  announcementCategorySchema
);

export default AnnouncementCategory;
