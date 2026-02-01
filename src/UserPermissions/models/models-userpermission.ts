import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IUserPermission extends Document {
  srModuleId: Types.ObjectId;
  roleId: Types.ObjectId;
  moduleName: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport?: boolean;
  canImport?: boolean;
  canApprove?: boolean;
  canVerify?: boolean;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  permissionLevel?: string;
  accessType?: string;
  accessBadgeColor?: string;
  permissionScore?: number;
}

const userPermissionSchema = new Schema<IUserPermission>(
  {
    srModuleId: {
      type: Schema.Types.ObjectId,
      ref: 'SrModule',
      required: true,
      index: true,
    },

    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },

    moduleName: {
      type: String,
      required: [true, 'Module Name is required'],
      trim: true,
      minlength: [2, 'Module Name must be at least 2 characters'],
      maxlength: [100, 'Module Name cannot exceed 100 characters'],
      index: true,
    },

    canRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    canCreate: {
      type: Boolean,
      default: false,
      index: true,
    },

    canUpdate: {
      type: Boolean,
      default: false,
      index: true,
    },

    canDelete: {
      type: Boolean,
      default: false,
      index: true,
    },

    canExport: {
      type: Boolean,
      default: false,
      index: true,
    },

    canImport: {
      type: Boolean,
      default: false,
      index: true,
    },

    canApprove: {
      type: Boolean,
      default: false,
      index: true,
    },

    canVerify: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
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
userPermissionSchema.index({ srModuleId: 1, roleId: 1, isDeleted: 1 }, { unique: true });
userPermissionSchema.index({ roleId: 1, isActive: 1 });
userPermissionSchema.index({ moduleName: 1, roleId: 1 });
userPermissionSchema.index({ canRead: 1, canCreate: 1, canUpdate: 1, canDelete: 1 });

// Text index for search
userPermissionSchema.index(
  { moduleName: 'text' },
  {
    weights: { moduleName: 10 },
    name: 'userpermission_text_search',
  }
);

// Virtual for permission level
userPermissionSchema.virtual('permissionLevel').get(function () {
  const permissions: string[] = [];
  if (this.canRead) permissions.push('Read');
  if (this.canCreate) permissions.push('Create');
  if (this.canUpdate) permissions.push('Update');
  if (this.canDelete) permissions.push('Delete');
  if (this.canExport) permissions.push('Export');
  if (this.canImport) permissions.push('Import');
  if (this.canApprove) permissions.push('Approve');
  if (this.canVerify) permissions.push('Verify');

  if (permissions.length === 0) return 'No Access';
  if (permissions.length === 8) return 'Full Access';
  return permissions.join(', ');
});

// Virtual for access type
userPermissionSchema.virtual('accessType').get(function () {
  if (!this.canRead) return 'No Access';
  if (this.canCreate && this.canUpdate && this.canDelete) return 'Full Access';
  if (this.canCreate || this.canUpdate || this.canDelete) return 'Limited Access';
  return 'View Only';
});

// Virtual for badge color (for UI)
userPermissionSchema.virtual('accessBadgeColor').get(function () {
  const accessType = (this as any).accessType;
  const colors: Record<string, string> = {
    'No Access': 'danger',
    'View Only': 'warning',
    'Limited Access': 'info',
    'Full Access': 'success',
  };
  return colors[accessType] || 'secondary';
});

// Virtual for permission score (for sorting)
userPermissionSchema.virtual('permissionScore').get(function () {
  let score = 0;
  if (this.canRead) score += 1;
  if (this.canCreate) score += 2;
  if (this.canUpdate) score += 2;
  if (this.canDelete) score += 3;
  if (this.canExport) score += 1;
  if (this.canImport) score += 2;
  if (this.canApprove) score += 3;
  if (this.canVerify) score += 3;
  return score;
});

// Pre-save middleware to ensure module name matches SrModule
userPermissionSchema.pre('save', async function (next) {
  if ((this as any).isModified('srModuleId')) {
    try {
      const SrModule = model('SrModule');
      const srModule = await SrModule.findById((this as any).srModuleId);
      if (srModule) {
        (this as any).moduleName = (srModule as any).moduleName;
      }
    } catch (error) {
      console.error('Error fetching module:', error);
    }
  }
  next();
});

// Define static methods directly on schema
userPermissionSchema.statics.getPermissionsByRole = function (roleId: Types.ObjectId) {
  return this.find({
    roleId,
    isActive: true,
    isDeleted: false,
  })
    .populate('srModuleId', 'moduleName moduleCode iconName routePath')
    .populate('roleId', 'roleName roleCode')
    .sort({ moduleName: 1 });
};

userPermissionSchema.statics.getPermissionsByModule = function (moduleId: Types.ObjectId) {
  return this.find({
    srModuleId: moduleId,
    isActive: true,
    isDeleted: false,
  })
    .populate('roleId', 'roleName roleCode description')
    .sort({ 'roleId.roleName': 1 });
};

userPermissionSchema.statics.hasPermission = async function (
  roleId: Types.ObjectId,
  moduleId: Types.ObjectId,
  permissionType: string
) {
  const permission = await this.findOne({
    roleId,
    srModuleId: moduleId,
    isActive: true,
    isDeleted: false,
  });

  if (!permission) return false;

  const permissionMap: Record<string, boolean> = {
    read: permission.canRead,
    create: permission.canCreate,
    update: permission.canUpdate,
    delete: permission.canDelete,
    export: permission.canExport || false,
    import: permission.canImport || false,
    approve: permission.canApprove || false,
    verify: permission.canVerify || false,
  };

  return permissionMap[permissionType.toLowerCase()] || false;
};

userPermissionSchema.statics.getRolePermissionsMap = async function (roleId: Types.ObjectId) {
  const permissions = await this.find({
    roleId,
    isActive: true,
    isDeleted: false,
  })
    .populate('srModuleId', 'moduleName moduleCode routePath')
    .select(
      'srModuleId canRead canCreate canUpdate canDelete canExport canImport canApprove canVerify'
    );

  const permissionMap: Record<string, any> = {};

  permissions.forEach((permission: any) => {
    const module = permission.srModuleId;
    if (module && (module as any).moduleCode) {
      permissionMap[(module as any).moduleCode] = {
        moduleId: permission.srModuleId,
        moduleName: (module as any).moduleName,
        moduleCode: (module as any).moduleCode,
        routePath: (module as any).routePath,
        canRead: permission.canRead,
        canCreate: permission.canCreate,
        canUpdate: permission.canUpdate,
        canDelete: permission.canDelete,
        canExport: permission.canExport || false,
        canImport: permission.canImport || false,
        canApprove: permission.canApprove || false,
        canVerify: permission.canVerify || false,
      };
    }
  });

  return permissionMap;
};

// Define interface for static methods
interface IUserPermissionModel extends Model<IUserPermission> {
  getPermissionsByRole(roleId: Types.ObjectId): Promise<IUserPermission[]>;
  getPermissionsByModule(moduleId: Types.ObjectId): Promise<IUserPermission[]>;
  hasPermission(
    roleId: Types.ObjectId,
    moduleId: Types.ObjectId,
    permissionType: string
  ): Promise<boolean>;
  getRolePermissionsMap(roleId: Types.ObjectId): Promise<Record<string, any>>;
}

// Create and export model
const UserPermission = model<IUserPermission, IUserPermissionModel>(
  'UserPermission',
  userPermissionSchema
);

export default UserPermission;
