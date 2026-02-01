import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IAnnouncement extends Document {
  authorId: Types.ObjectId;
  categoryId: Types.ObjectId;
  title: string;
  announcementDesc: string;
  shortDescription?: string;
  targetType: 'All' | 'Block' | 'Project' | 'Individual';
  targetGroupId?: Types.ObjectId;
  priorityLevel: 1 | 2 | 3; // 1=Low, 2=Medium, 3=High/Emergency
  status: 'Draft' | 'Published' | 'Archived';
  attachmentURL?: string;
  isPushNotificationSent: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  views: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  author?: any;
  category?: any;
  targetGroup?: any;
  priorityLabel?: string;
  statusBadge?: string;
  isExpired?: boolean;
  daysRemaining?: number;
  formattedPublishedDate?: string;
  formattedExpiryDate?: string;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      required: true,
      index: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'AnnouncementCategory',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },

    announcementDesc: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },

    targetType: {
      type: String,
      required: true,
      enum: ['All', 'Block', 'Project', 'Individual'],
      default: 'All',
      index: true,
    },

    targetGroupId: {
      type: Schema.Types.ObjectId,
      refPath: 'targetType',
      index: true,
    },

    priorityLevel: {
      type: Number,
      required: true,
      enum: [1, 2, 3], // 1=Low, 2=Medium, 3=High/Emergency
      default: 2,
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Draft',
      index: true,
    },

    attachmentURL: {
      type: String,
      trim: true,
      maxlength: [500, 'Attachment URL cannot exceed 500 characters'],
    },

    isPushNotificationSent: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      index: true,
    },

    expiresAt: {
      type: Date,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    views: {
      type: Number,
      default: 0,
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
announcementSchema.index({ status: 1, isActive: 1, isDeleted: 1 });
announcementSchema.index({ categoryId: 1, status: 1, isActive: 1 });
announcementSchema.index({ targetType: 1, targetGroupId: 1, status: 1 });
announcementSchema.index({ priorityLevel: -1, publishedAt: -1 });
announcementSchema.index({ expiresAt: 1, status: 1 });
announcementSchema.index({ publishedAt: -1, status: 1 });

// Text index for search
announcementSchema.index(
  { title: 'text', announcementDesc: 'text', shortDescription: 'text' },
  {
    weights: { title: 10, shortDescription: 5, announcementDesc: 3 },
    name: 'announcement_text_search',
  }
);

// Virtual for author
announcementSchema.virtual('author', {
  ref: 'UserStaff',
  localField: 'authorId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for category
announcementSchema.virtual('category', {
  ref: 'AnnouncementCategory',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for target group (dynamic reference based on targetType)
announcementSchema.virtual('targetGroup', {
  ref: function (this: IAnnouncement) {
    return this.targetType === 'Block'
      ? 'Block'
      : this.targetType === 'Project'
        ? 'Project'
        : this.targetType === 'Individual'
          ? 'UserStaff'
          : null;
  },
  localField: 'targetGroupId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for priority label
announcementSchema.virtual('priorityLabel').get(function () {
  const labels: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
  };
  return labels[this.priorityLevel] || 'Medium';
});

// Virtual for status badge color
announcementSchema.virtual('statusBadge').get(function () {
  const colors: Record<string, string> = {
    Draft: 'warning',
    Published: 'success',
    Archived: 'secondary',
  };
  return colors[this.status] || 'default';
});

// Virtual for checking if announcement is expired
announcementSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for days remaining until expiry
announcementSchema.virtual('daysRemaining').get(function () {
  if (!this.expiresAt) return null;
  const now = new Date();
  const expiry = this.expiresAt;
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for formatted published date
announcementSchema.virtual('formattedPublishedDate').get(function () {
  if (!this.publishedAt) return null;
  return this.publishedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// Virtual for formatted expiry date
announcementSchema.virtual('formattedExpiryDate').get(function () {
  if (!this.expiresAt) return null;
  return this.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// Pre-save middleware
announcementSchema.pre('save', function (next) {
  // Generate short description from announcementDesc if not provided
  if (!this.shortDescription && this.announcementDesc) {
    this.shortDescription =
      this.announcementDesc.substring(0, 200) + (this.announcementDesc.length > 200 ? '...' : '');
  }

  // Set publishedAt when status changes to Published
  if (this.isModified('status') && this.status === 'Published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Set isActive based on status and expiry
  if (this.isModified('status') || this.isModified('expiresAt')) {
    const now = new Date();
    const isExpired = this.expiresAt && this.expiresAt < now;
    this.isActive = this.status === 'Published' && !isExpired;
  }

  next();
});

// Pre-update middleware
announcementSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update) {
    // Set publishedAt when status changes to Published
    if (update.status === 'Published' && !update.publishedAt) {
      update.publishedAt = new Date();
    }

    // Set short description if not provided but announcementDesc is updated
    if (update.announcementDesc && !update.shortDescription) {
      update.shortDescription =
        update.announcementDesc.substring(0, 200) +
        (update.announcementDesc.length > 200 ? '...' : '');
    }

    // Update isActive based on status and expiry
    if (update.status || update.expiresAt) {
      update.isActive =
        update.status === 'Published' &&
        (!update.expiresAt || new Date(update.expiresAt) > new Date());
    }
  }

  next();
});

// Method to increment views
announcementSchema.methods.incrementViews = async function (): Promise<void> {
  this.views += 1;
  await this.save();
};

// Method to check if announcement is viewable
announcementSchema.methods.isViewable = function (): boolean {
  return (
    this.status === 'Published' &&
    this.isActive &&
    !this.isDeleted &&
    (!this.expiresAt || new Date() <= this.expiresAt)
  );
};

// Static method to get active announcements
announcementSchema.statics.getActiveAnnouncements = function (
  page: number = 1,
  limit: number = 10,
  filter: any = {}
) {
  const skip = (page - 1) * limit;

  const query = {
    status: 'Published',
    isActive: true,
    isDeleted: false,
    ...filter,
  };

  // Add expiry filter
  query['$or'] = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];

  return Promise.all([
    this.find(query)
      .populate('author', 'userName fullName designation')
      .populate('category', 'categoryName icon color')
      .sort({ priorityLevel: -1, publishedAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);
};

// Static method to get urgent announcements
announcementSchema.statics.getUrgentAnnouncements = function (limit: number = 5) {
  const query = {
    status: 'Published',
    isActive: true,
    isDeleted: false,
    priorityLevel: 3, // High priority
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  return this.find(query)
    .populate('author', 'userName fullName')
    .populate('category', 'categoryName color')
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Define interface for static methods
interface IAnnouncementModel extends Model<IAnnouncement> {
  getActiveAnnouncements(
    page: number,
    limit: number,
    filter: any
  ): Promise<[IAnnouncement[], number]>;
  getUrgentAnnouncements(limit: number): Promise<IAnnouncement[]>;
}

// Create and export model
const Announcement = model<IAnnouncement, IAnnouncementModel>('Announcement', announcementSchema);

export default Announcement;
