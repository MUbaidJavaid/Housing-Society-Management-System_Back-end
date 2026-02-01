import mongoose, { Document, Schema } from 'mongoose';
import { IRole } from '../types/user.types';

export interface IRoleDocument extends IRole, Document {}

const RoleSchema = new Schema<IRole>(
  {
    // New fields for userPermissionService compatibility
    roleName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Role name must be at least 2 characters'],
      maxlength: [100, 'Role name cannot exceed 100 characters'],
    },
    roleCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, 'Role code must be at least 2 characters'],
      maxlength: [50, 'Role code cannot exceed 50 characters'],
    },
    roleDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Role description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
      min: [0, 'Priority must be at least 0'],
      max: [1000, 'Priority cannot exceed 1000'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
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

    // Your existing fields (keep for backward compatibility)
    roleId: {
      type: Number,
      unique: true,
      sparse: true, // Make it sparse to allow null for new documents
    },
    role: {
      type: String,
      unique: true,
      sparse: true, // Make it sparse to allow null for new documents
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    createdOn: {
      type: Date,
      default: Date.now,
    },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedOn: {
      type: Date,
    },
  },
  {
    timestamps: true, // Enable createdAt and updatedAt
    collection: 'roles',
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        if ('__v' in ret) delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save middleware to sync fields
RoleSchema.pre('save', function (next) {
  const systemRoles = ['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATOR', 'SUPERADMIN'];

  // Sync role and roleCode if not set
  if (!this.roleCode && this.role) {
    this.roleCode = this.role.toUpperCase();
  }

  if (!this.role && this.roleCode) {
    this.role = this.roleCode;
  }

  // Sync roleName and role
  if (!this.roleName && this.role) {
    this.roleName = this.role;
  }

  if (!this.role && this.roleName) {
    this.role = this.roleName.toUpperCase();
  }

  // Sync roleDescription and description
  if (!this.roleDescription && this.description) {
    this.roleDescription = this.description;
  }

  if (!this.description && this.roleDescription) {
    this.description = this.roleDescription;
  }

  // Set isSystem based on roleCode
  if (this.roleCode && systemRoles.includes(this.roleCode.toUpperCase())) {
    this.isSystem = true;
    this.isSystemRole = true;
  } else if (this.role && systemRoles.includes(this.role.toUpperCase())) {
    this.isSystem = true;
    this.isSystemRole = true;
  }

  next();
});

// Pre-update middleware
RoleSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  const systemRoles = ['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATOR', 'SUPERADMIN'];

  if (update) {
    // Sync fields on update
    if (update.roleCode && !update.role) {
      update.role = update.roleCode;
    }

    if (update.role && !update.roleCode) {
      update.roleCode = update.role.toUpperCase();
    }

    if (update.roleName && !update.role) {
      update.role = update.roleName.toUpperCase();
    }

    if (update.role && !update.roleName) {
      update.roleName = update.role;
    }

    if (update.roleDescription && !update.description) {
      update.description = update.roleDescription;
    }

    if (update.description && !update.roleDescription) {
      update.roleDescription = update.description;
    }

    // Set isSystem based on roleCode or role
    if (update.roleCode && systemRoles.includes(update.roleCode.toUpperCase())) {
      update.isSystem = true;
      update.isSystemRole = true;
    } else if (update.role && systemRoles.includes(update.role.toUpperCase())) {
      update.isSystem = true;
      update.isSystemRole = true;
    }

    this.set({
      modifiedOn: new Date(),
      updatedAt: new Date(),
    });
  }

  next();
});

// Indexes
RoleSchema.index({ roleCode: 1 });
RoleSchema.index({ role: 1 });
RoleSchema.index({ isActive: 1 });
RoleSchema.index({ isSystem: 1 });
RoleSchema.index({ priority: -1 });
RoleSchema.index({ createdAt: -1 });

// Virtual for role permissions count
RoleSchema.virtual('permissionCount', {
  ref: 'UserPermission',
  localField: '_id',
  foreignField: 'roleId',
  count: true,
  match: { isDeleted: false, isActive: true },
});

export const Role = mongoose.model<IRole>('Role', RoleSchema);
