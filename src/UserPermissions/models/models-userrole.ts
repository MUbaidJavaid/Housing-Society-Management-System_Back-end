import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IUserRole extends Document {
  roleName: string;
  roleCode: string;
  roleDescription?: string;
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
  userCount?: number;
  permissionCount?: number;
  roleBadgeColor?: string;
  roleLevel?: string;
}

const userRoleSchema = new Schema<IUserRole>(
  {
    roleName: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      minlength: [2, 'Role name must be at least 2 characters'],
      maxlength: [100, 'Role name cannot exceed 100 characters'],
      index: true,
    },

    roleCode: {
      type: String,
      required: [true, 'Role code is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Role code must be at least 2 characters'],
      maxlength: [50, 'Role code cannot exceed 50 characters'],
      unique: true,
      index: true,
    },

    roleDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Role description cannot exceed 500 characters'],
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient querying
userRoleSchema.index({ roleCode: 1, isDeleted: 1 }, { unique: true });
userRoleSchema.index({ isActive: 1, isDeleted: 1 });
userRoleSchema.index({ priority: -1, roleName: 1 });

// Text index for search
userRoleSchema.index(
  { roleName: 'text', roleCode: 'text', roleDescription: 'text' },
  {
    weights: { roleName: 10, roleCode: 8, roleDescription: 5 },
    name: 'userrole_text_search',
  }
);

// Virtual for user count
userRoleSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'roleId',
  count: true,
  match: { isDeleted: false },
});

// Virtual for permission count
userRoleSchema.virtual('permissionCount', {
  ref: 'UserPermission',
  localField: '_id',
  foreignField: 'roleId',
  count: true,
  match: { isDeleted: false, isActive: true },
});

// Virtual for role badge color (for UI)
userRoleSchema.virtual('roleBadgeColor').get(function () {
  if (this.isSystem) return 'purple';
  if (!this.isActive) return 'gray';

  const colors = ['blue', 'green', 'orange', 'red', 'cyan', 'teal', 'pink'];
  const hash = this.roleCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
});

// Virtual for role level
userRoleSchema.virtual('roleLevel').get(function () {
  if (this.priority >= 900) return 'System';
  if (this.priority >= 800) return 'Administrative';
  if (this.priority >= 600) return 'Managerial';
  if (this.priority >= 400) return 'Operational';
  if (this.priority >= 200) return 'Staff';
  return 'Basic';
});

// Pre-save middleware to validate role code format
userRoleSchema.pre('save', function (next) {
  if (this.isModified('roleCode')) {
    // Ensure role code is uppercase and alphanumeric
    this.roleCode = this.roleCode.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    // Check for reserved role codes
    const reservedCodes = ['SYSTEM', 'ADMIN', 'ROOT', 'SUPER', 'ANONYMOUS', 'GUEST'];
    if (reservedCodes.includes(this.roleCode) && !this.isSystem) {
      return next(new Error(`Role code '${this.roleCode}' is reserved`));
    }
  }
  next();
});

// Pre-delete middleware to prevent deletion of system roles
userRoleSchema.pre('findOneAndUpdate', async function (next) {
  const filter = this.getFilter();
  const role = await this.model.findOne(filter);

  if (role && role.isSystem) {
    // Check if trying to delete a system role
    const update = this.getUpdate() as any;
    if (update?.$set?.isDeleted === true) {
      return next(new Error('System roles cannot be deleted'));
    }
  }

  next();
});

// Define static methods directly on schema
userRoleSchema.statics.getActiveRoles = function () {
  return this.find({
    isActive: true,
    isDeleted: false,
  })
    .select('_id roleName roleCode roleDescription priority')
    .sort({ priority: -1, roleName: 1 });
};

userRoleSchema.statics.getRolesWithUserCount = async function () {
  const roles = await this.aggregate([
    {
      $match: {
        isDeleted: false,
        isActive: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        let: { roleId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$roleId', '$$roleId'] },
                  { $eq: ['$isDeleted', false] },
                  { $eq: ['$isActive', true] },
                ],
              },
            },
          },
          {
            $count: 'count',
          },
        ],
        as: 'userCountInfo',
      },
    },
    {
      $lookup: {
        from: 'userpermissions',
        let: { roleId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$roleId', '$$roleId'] },
                  { $eq: ['$isDeleted', false] },
                  { $eq: ['$isActive', true] },
                ],
              },
            },
          },
          {
            $count: 'count',
          },
        ],
        as: 'permissionCountInfo',
      },
    },
    {
      $addFields: {
        userCount: {
          $ifNull: [{ $arrayElemAt: ['$userCountInfo.count', 0] }, 0],
        },
        permissionCount: {
          $ifNull: [{ $arrayElemAt: ['$permissionCountInfo.count', 0] }, 0],
        },
      },
    },
    {
      $project: {
        _id: 1,
        roleName: 1,
        roleCode: 1,
        roleDescription: 1,
        isActive: 1,
        isSystem: 1,
        priority: 1,
        userCount: 1,
        permissionCount: 1,
        createdAt: 1,
      },
    },
    {
      $sort: { priority: -1, roleName: 1 },
    },
  ]);

  return roles;
};

userRoleSchema.statics.searchRoles = function (searchTerm: string, limit: number = 10) {
  return this.find({
    $or: [
      { roleName: { $regex: searchTerm, $options: 'i' } },
      { roleCode: { $regex: searchTerm, $options: 'i' } },
      { roleDescription: { $regex: searchTerm, $options: 'i' } },
    ],
    isDeleted: false,
    isActive: true,
  })
    .select('_id roleName roleCode roleDescription priority')
    .limit(limit)
    .sort({ priority: -1, roleName: 1 });
};

// Define interface for static methods
interface IUserRoleModel extends Model<IUserRole> {
  getActiveRoles(): Promise<IUserRole[]>;
  getRolesWithUserCount(): Promise<any[]>;
  searchRoles(searchTerm: string, limit: number): Promise<IUserRole[]>;
}

// Create and export model
const UserRole = model<IUserRole, IUserRoleModel>('UserRole', userRoleSchema);

export default UserRole;
