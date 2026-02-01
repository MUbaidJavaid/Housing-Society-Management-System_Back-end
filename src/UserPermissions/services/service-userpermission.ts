import { Types } from 'mongoose';
import SrModule from '../../Module/models/models-srmodule';
import { Role } from '../../users/models/Role.model';
import UserPermission from '../models/models-userpermission';
import {
  AccessType,
  BulkPermissionUpdateDto,
  CopyPermissionsDto,
  CreateUserPermissionDto,
  GetUserPermissionsResult,
  ModulePermissionsSummary,
  PermissionCheckDto,
  PermissionType,
  RolePermissionsSummary,
  SetPermissionsDto,
  UpdateUserPermissionDto,
  UserPermissionQueryParams,
  UserPermissionStatistics,
  UserPermissionType,
} from '../types/types-userpermission';
type PermissionField =
  | 'canRead'
  | 'canCreate'
  | 'canUpdate'
  | 'canDelete'
  | 'canExport'
  | 'canImport'
  | 'canApprove'
  | 'canVerify';
// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): UserPermissionType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as UserPermissionType;
};

export const userPermissionService = {
  /**
   * Create new user permission
   */
  async createUserPermission(
    data: CreateUserPermissionDto,
    userId: Types.ObjectId
  ): Promise<UserPermissionType> {
    // Check if permission already exists for this role and module
    const existingPermission = await UserPermission.findOne({
      srModuleId: new Types.ObjectId(data.srModuleId),
      roleId: new Types.ObjectId(data.roleId),
      isDeleted: false,
    });

    if (existingPermission) {
      throw new Error('Permission already exists for this role and module');
    }

    // Get module name from SrModule if not provided
    let moduleName = data.moduleName;
    if (!moduleName) {
      const srModule = await SrModule.findById(data.srModuleId);
      if (!srModule) {
        throw new Error('Module not found');
      }
      moduleName = srModule.moduleName;
    }

    // Validate that at least one permission is granted
    const hasAnyPermission =
      data.canRead ||
      data.canCreate ||
      data.canUpdate ||
      data.canDelete ||
      data.canExport ||
      data.canImport ||
      data.canApprove ||
      data.canVerify;
    if (!hasAnyPermission) {
      throw new Error('At least one permission must be granted');
    }

    const permissionData = {
      ...data,
      srModuleId: new Types.ObjectId(data.srModuleId),
      roleId: new Types.ObjectId(data.roleId),
      moduleName,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: userId,
      updatedBy: userId,
    };

    const userPermission = await UserPermission.create(permissionData);

    // Populate and return the created permission
    const createdPermission = await UserPermission.findById(userPermission._id)
      .populate('srModuleId', 'moduleName moduleCode iconName routePath')
      .populate('roleId', 'roleName roleCode description')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!createdPermission) {
      throw new Error('Failed to create permission');
    }

    return toPlainObject(createdPermission);
  },

  /**
   * Get user permission by ID
   */
  async getUserPermissionById(id: string): Promise<UserPermissionType> {
    try {
      const permission = await UserPermission.findById(id)
        .populate('srModuleId', 'moduleName moduleCode iconName routePath')
        .populate('roleId', 'roleName roleCode description')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      if (!permission || permission.isDeleted) {
        throw new Error('Permission not found');
      }
      return toPlainObject(permission);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid permission ID');
    }
  },

  /**
   * Find user permission by ID (returns null if not found)
   */
  async findUserPermissionById(id: string): Promise<UserPermissionType | null> {
    try {
      const permission = await UserPermission.findById(id)
        .populate('srModuleId', 'moduleName moduleCode iconName routePath')
        .populate('roleId', 'roleName roleCode description');

      if (!permission || permission.isDeleted) return null;
      return toPlainObject(permission);
    } catch (error) {
      return null;
    }
  },

  /**
   * Get permission by role and module
   */
  async getPermissionByRoleAndModule(
    roleId: string,
    srModuleId: string
  ): Promise<UserPermissionType | null> {
    const permission = await UserPermission.findOne({
      roleId: new Types.ObjectId(roleId),
      srModuleId: new Types.ObjectId(srModuleId),
      isDeleted: false,
    })
      .populate('srModuleId', 'moduleName moduleCode iconName routePath')
      .populate('roleId', 'roleName roleCode description');

    if (!permission) return null;
    return toPlainObject(permission);
  },

  /**
   * Get all user permissions with pagination
   */
  async getUserPermissions(params: UserPermissionQueryParams): Promise<GetUserPermissionsResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      srModuleId,
      roleId,
      isActive,
      hasAccess,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search by module name
    if (search) {
      query.moduleName = { $regex: search, $options: 'i' };
    }

    // Filter by module
    if (srModuleId) {
      query.srModuleId = new Types.ObjectId(srModuleId);
    }

    // Filter by role
    if (roleId) {
      query.roleId = new Types.ObjectId(roleId);
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Filter by access level
    if (hasAccess !== undefined) {
      if (hasAccess) {
        query.$or = [
          { canRead: true },
          { canCreate: true },
          { canUpdate: true },
          { canDelete: true },
        ];
      } else {
        query.canRead = false;
        query.canCreate = false;
        query.canUpdate = false;
        query.canDelete = false;
      }
    }

    // Execute queries
    const [userPermissions, total] = await Promise.all([
      UserPermission.find(query)
        .populate('srModuleId', 'moduleName moduleCode iconName')
        .populate('roleId', 'roleName roleCode')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      UserPermission.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = {
      totalPermissions: userPermissions.length,
      activePermissions: userPermissions.filter(perm => perm.isActive).length,
      byAccessType: {} as Record<string, number>,
      byModule: {} as Record<string, number>,
      byRole: {} as Record<string, number>,
    };

    // Initialize access type counters
    const accessTypes = [
      AccessType.NO_ACCESS,
      AccessType.VIEW_ONLY,
      AccessType.LIMITED_ACCESS,
      AccessType.FULL_ACCESS,
    ];
    accessTypes.forEach(type => {
      summary.byAccessType[type] = 0;
    });

    // Count permissions by various categories
    userPermissions.forEach(permission => {
      // Determine access type
      let accessType = AccessType.NO_ACCESS;
      if (permission.canRead) {
        if (permission.canCreate && permission.canUpdate && permission.canDelete) {
          accessType = AccessType.FULL_ACCESS;
        } else if (permission.canCreate || permission.canUpdate || permission.canDelete) {
          accessType = AccessType.LIMITED_ACCESS;
        } else {
          accessType = AccessType.VIEW_ONLY;
        }
      }
      summary.byAccessType[accessType] = (summary.byAccessType[accessType] || 0) + 1;

      // Count by module
      const moduleName = (permission as any).srModuleId?.moduleName || permission.moduleName;
      summary.byModule[moduleName] = (summary.byModule[moduleName] || 0) + 1;

      // Count by role
      const roleName = (permission as any).roleId?.roleName || 'Unknown';
      summary.byRole[roleName] = (summary.byRole[roleName] || 0) + 1;
    });

    return {
      userPermissions,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update user permission
   */
  async updateUserPermission(
    id: string,
    data: UpdateUserPermissionDto,
    userId: Types.ObjectId
  ): Promise<UserPermissionType | null> {
    // Check if permission exists
    const existingPermission = await UserPermission.findById(id);
    if (!existingPermission || existingPermission.isDeleted) {
      throw new Error('Permission not found');
    }

    // Validate that at least one permission remains if updating permissions
    const permissionFields: PermissionField[] = [
      'canRead',
      'canCreate',
      'canUpdate',
      'canDelete',
      'canExport',
      'canImport',
      'canApprove',
      'canVerify',
    ];

    // Check if we're updating any permission fields
    const isUpdatingPermissions = permissionFields.some(
      field => data[field as keyof UpdateUserPermissionDto] !== undefined
    );

    if (isUpdatingPermissions) {
      const existingObject = existingPermission.toObject();
      const updatedPermissions = { ...existingObject, ...data };

      // Type-safe check for any permission
      const hasAnyPermission = permissionFields.some(
        field => updatedPermissions[field as keyof typeof updatedPermissions] === true
      );

      if (!hasAnyPermission) {
        throw new Error('At least one permission must be granted');
      }
    }

    const updateObj: any = {
      ...data,
      updatedBy: userId,
    };

    const permission = await UserPermission.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('srModuleId', 'moduleName moduleCode iconName routePath')
      .populate('roleId', 'roleName roleCode description')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return permission ? toPlainObject(permission) : null;
  },

  /**
   * Delete user permission (soft delete)
   */
  async deleteUserPermission(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingPermission = await UserPermission.findById(id);
    if (!existingPermission || existingPermission.isDeleted) {
      throw new Error('Permission not found');
    }

    const result = await UserPermission.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          updatedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Set permissions for a role and module (create or update)
   */
  async setPermissions(
    data: SetPermissionsDto,
    userId: Types.ObjectId
  ): Promise<UserPermissionType> {
    // Check if permission already exists
    const existingPermission = await UserPermission.findOne({
      srModuleId: new Types.ObjectId(data.srModuleId),
      roleId: new Types.ObjectId(data.roleId),
      isDeleted: false,
    });

    const srModule = await SrModule.findById(data.srModuleId);
    if (!srModule) {
      throw new Error('Module not found');
    }

    const permissionData = {
      srModuleId: new Types.ObjectId(data.srModuleId),
      roleId: new Types.ObjectId(data.roleId),
      moduleName: srModule.moduleName,
      ...data.permissions,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    };

    let savedPermission;
    if (existingPermission) {
      // Update existing permission
      savedPermission = await UserPermission.findByIdAndUpdate(
        existingPermission._id,
        {
          $set: permissionData,
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new permission
      savedPermission = await UserPermission.create(permissionData);
    }

    // Type guard to ensure permission is not null
    if (!savedPermission) {
      throw new Error('Failed to set permissions');
    }

    // Populate and return - now savedPermission is guaranteed to be non-null
    const populatedPermission = await UserPermission.findById(savedPermission._id)
      .populate('srModuleId', 'moduleName moduleCode iconName routePath')
      .populate('roleId', 'roleName roleCode description');

    if (!populatedPermission) {
      throw new Error('Failed to set permissions');
    }

    return toPlainObject(populatedPermission);
  },

  /**
   * Get permissions by role
   */
  async getPermissionsByRole(roleId: string): Promise<UserPermissionType[]> {
    const permissions = await UserPermission.find({
      roleId: new Types.ObjectId(roleId),
      isActive: true,
      isDeleted: false,
    })
      .populate('srModuleId', 'moduleName moduleCode iconName routePath')
      .populate('roleId', 'roleName roleCode description')
      .sort({ moduleName: 1 });

    return permissions.map(perm => toPlainObject(perm));
  },

  /**
   * Get permissions by module
   */
  async getPermissionsByModule(srModuleId: string): Promise<UserPermissionType[]> {
    const permissions = await UserPermission.find({
      srModuleId: new Types.ObjectId(srModuleId),
      isActive: true,
      isDeleted: false,
    })
      .populate('roleId', 'roleName roleCode description')
      .populate('srModuleId', 'moduleName moduleCode')
      .sort({ 'roleId.roleName': 1 });

    return permissions.map(perm => toPlainObject(perm));
  },

  /**
   * Check if role has specific permission
   */
  async checkPermission(data: PermissionCheckDto): Promise<boolean> {
    const permission = await UserPermission.findOne({
      roleId: new Types.ObjectId(data.roleId),
      srModuleId: new Types.ObjectId(data.srModuleId),
      isActive: true,
      isDeleted: false,
    });

    if (!permission) return false;

    const permissionMap: Record<string, boolean> = {
      [PermissionType.READ]: permission.canRead,
      [PermissionType.CREATE]: permission.canCreate,
      [PermissionType.UPDATE]: permission.canUpdate,
      [PermissionType.DELETE]: permission.canDelete,
      [PermissionType.EXPORT]: permission.canExport || false,
      [PermissionType.IMPORT]: permission.canImport || false,
      [PermissionType.APPROVE]: permission.canApprove || false,
      [PermissionType.VERIFY]: permission.canVerify || false,
    };

    return permissionMap[data.permissionType.toLowerCase()] || false;
  },

  /**
   * Bulk update permissions
   */
  async bulkUpdatePermissions(
    data: BulkPermissionUpdateDto,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    if (
      !data.permissionIds ||
      !Array.isArray(data.permissionIds) ||
      data.permissionIds.length === 0
    ) {
      throw new Error('Permission IDs must be a non-empty array');
    }

    const objectIds = data.permissionIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid permission ID: ${id}`);
      }
    });

    // Build update object with only provided fields
    const updateObj: any = { updatedBy: userId };
    const updateFields = [
      'canRead',
      'canCreate',
      'canUpdate',
      'canDelete',
      'canExport',
      'canImport',
      'canApprove',
      'canVerify',
      'isActive',
    ];

    updateFields.forEach(field => {
      if (data[field as keyof BulkPermissionUpdateDto] !== undefined) {
        updateObj[field] = data[field as keyof BulkPermissionUpdateDto];
      }
    });

    const result = await UserPermission.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
      },
      {
        $set: updateObj,
      }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },

  /**
   * Copy permissions from one role to another
   */
  async copyPermissions(
    data: CopyPermissionsDto,
    userId: Types.ObjectId
  ): Promise<{ copied: number; skipped: number; errors: string[] }> {
    const errors: string[] = [];
    let copied = 0;
    let skipped = 0;

    // Get source permissions
    const sourcePermissions = await UserPermission.find({
      roleId: new Types.ObjectId(data.sourceRoleId),
      isActive: true,
      isDeleted: false,
    });

    for (const sourcePermission of sourcePermissions) {
      try {
        // Check if permission already exists for target role
        const existingPermission = await UserPermission.findOne({
          roleId: new Types.ObjectId(data.targetRoleId),
          srModuleId: sourcePermission.srModuleId,
          isDeleted: false,
        });

        if (existingPermission && !data.overrideExisting) {
          skipped++;
          continue;
        }

        // Prepare permission data
        const permissionData = {
          srModuleId: sourcePermission.srModuleId,
          roleId: new Types.ObjectId(data.targetRoleId),
          moduleName: sourcePermission.moduleName,
          canRead: sourcePermission.canRead,
          canCreate: sourcePermission.canCreate,
          canUpdate: sourcePermission.canUpdate,
          canDelete: sourcePermission.canDelete,
          canExport: sourcePermission.canExport || false,
          canImport: sourcePermission.canImport || false,
          canApprove: sourcePermission.canApprove || false,
          canVerify: sourcePermission.canVerify || false,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        };

        if (existingPermission && data.overrideExisting) {
          // Update existing permission
          await UserPermission.findByIdAndUpdate(
            existingPermission._id,
            {
              $set: permissionData,
            },
            { new: true, runValidators: true }
          );
        } else {
          // Create new permission
          await UserPermission.create(permissionData);
        }

        copied++;
      } catch (error: any) {
        errors.push(`Module ${sourcePermission.moduleName}: ${error.message}`);
      }
    }

    return { copied, skipped, errors };
  },

  /**
   * Get role permissions summary
   */
  async getRolePermissionsSummary(roleId: string): Promise<RolePermissionsSummary> {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    const permissions = await this.getPermissionsByRole(roleId);

    const allModules = await SrModule.find({ isActive: true, isDeleted: false });

    const accessibleModules = permissions.filter(p => p.canRead);
    const fullAccessModules = permissions.filter(
      p => p.canRead && p.canCreate && p.canUpdate && p.canDelete
    );
    const readOnlyModules = permissions.filter(
      p => p.canRead && !p.canCreate && !p.canUpdate && !p.canDelete
    );
    const noAccessModules = allModules.length - accessibleModules.length;

    const permissionsByModule = permissions.map(permission => {
      const permissionsList: string[] = [];
      if (permission.canRead) permissionsList.push('Read');
      if (permission.canCreate) permissionsList.push('Create');
      if (permission.canUpdate) permissionsList.push('Update');
      if (permission.canDelete) permissionsList.push('Delete');
      if (permission.canExport) permissionsList.push('Export');
      if (permission.canImport) permissionsList.push('Import');
      if (permission.canApprove) permissionsList.push('Approve');
      if (permission.canVerify) permissionsList.push('Verify');

      let accessType = AccessType.NO_ACCESS;
      if (permission.canRead) {
        if (permission.canCreate && permission.canUpdate && permission.canDelete) {
          accessType = AccessType.FULL_ACCESS;
        } else if (permission.canCreate || permission.canUpdate || permission.canDelete) {
          accessType = AccessType.LIMITED_ACCESS;
        } else {
          accessType = AccessType.VIEW_ONLY;
        }
      }

      return {
        moduleId: permission.srModuleId.toString(),
        moduleName: (permission as any).srModuleId?.moduleName || permission.moduleName,
        moduleCode: (permission as any).srModuleId?.moduleCode || '',
        accessType,
        permissions: permissionsList,
      };
    });

    return {
      roleId,
      roleName: role.roleName,
      totalModules: allModules.length,
      accessibleModules: accessibleModules.length,
      fullAccessModules: fullAccessModules.length,
      readOnlyModules: readOnlyModules.length,
      noAccessModules,
      permissionsByModule,
    };
  },

  /**
   * Get module permissions summary
   */
  async getModulePermissionsSummary(srModuleId: string): Promise<ModulePermissionsSummary> {
    const srModule = await SrModule.findById(srModuleId);
    if (!srModule) {
      throw new Error('Module not found');
    }

    const permissions = await this.getPermissionsByModule(srModuleId);

    // Get all roles to calculate roles without access

    const allRoles = await Role.find({ isActive: true, isDeleted: false });

    const accessibleRoles = permissions.filter(p => p.canRead);
    const rolesWithAccess = permissions.map(permission => {
      let accessType = AccessType.NO_ACCESS;
      if (permission.canRead) {
        if (permission.canCreate && permission.canUpdate && permission.canDelete) {
          accessType = AccessType.FULL_ACCESS;
        } else if (permission.canCreate || permission.canUpdate || permission.canDelete) {
          accessType = AccessType.LIMITED_ACCESS;
        } else {
          accessType = AccessType.VIEW_ONLY;
        }
      }

      return {
        roleId: permission.roleId.toString(),
        roleName: (permission as any).roleId?.roleName || '',
        accessType,
        canRead: permission.canRead,
        canCreate: permission.canCreate,
        canUpdate: permission.canUpdate,
        canDelete: permission.canDelete,
      };
    });

    return {
      moduleId: srModuleId,
      moduleName: srModule.moduleName,
      moduleCode: srModule.moduleCode,
      totalRoles: allRoles.length,
      accessibleRoles: accessibleRoles.length,
      rolesWithAccess,
    };
  },

  /**
   * Get user permission statistics
   */
  async getUserPermissionStatistics(): Promise<UserPermissionStatistics> {
    const stats = await UserPermission.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: null,
          totalPermissions: { $sum: 1 },
          activePermissions: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          readPermissions: {
            $sum: { $cond: [{ $eq: ['$canRead', true] }, 1, 0] },
          },
          createPermissions: {
            $sum: { $cond: [{ $eq: ['$canCreate', true] }, 1, 0] },
          },
          updatePermissions: {
            $sum: { $cond: [{ $eq: ['$canUpdate', true] }, 1, 0] },
          },
          deletePermissions: {
            $sum: { $cond: [{ $eq: ['$canDelete', true] }, 1, 0] },
          },
          exportPermissions: {
            $sum: { $cond: [{ $eq: ['$canExport', true] }, 1, 0] },
          },
          importPermissions: {
            $sum: { $cond: [{ $eq: ['$canImport', true] }, 1, 0] },
          },
          approvePermissions: {
            $sum: { $cond: [{ $eq: ['$canApprove', true] }, 1, 0] },
          },
          verifyPermissions: {
            $sum: { $cond: [{ $eq: ['$canVerify', true] }, 1, 0] },
          },
        },
      },
    ]);

    const moduleStats = await UserPermission.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $lookup: {
          from: 'srmodules',
          localField: 'srModuleId',
          foreignField: '_id',
          as: 'module',
        },
      },
      { $unwind: '$module' },
      {
        $group: {
          _id: '$module.moduleName',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const roleStats = await UserPermission.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'roleId',
          foreignField: '_id',
          as: 'role',
        },
      },
      { $unwind: '$role' },
      {
        $group: {
          _id: '$role.roleName',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const accessTypeStats = await UserPermission.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $addFields: {
          accessType: {
            $switch: {
              branches: [
                {
                  case: { $and: ['$canRead', '$canCreate', '$canUpdate', '$canDelete'] },
                  then: 'Full Access',
                },
                {
                  case: { $and: ['$canRead', { $or: ['$canCreate', '$canUpdate', '$canDelete'] }] },
                  then: 'Limited Access',
                },
                {
                  case: { $eq: ['$canRead', true] },
                  then: 'View Only',
                },
              ],
              default: 'No Access',
            },
          },
        },
      },
      {
        $group: {
          _id: '$accessType',
          count: { $sum: 1 },
        },
      },
    ]);

    const baseStats = stats[0] || {
      totalPermissions: 0,
      activePermissions: 0,
      readPermissions: 0,
      createPermissions: 0,
      updatePermissions: 0,
      deletePermissions: 0,
      exportPermissions: 0,
      importPermissions: 0,
      approvePermissions: 0,
      verifyPermissions: 0,
    };

    const byModule: Record<string, number> = {};
    moduleStats.forEach(stat => {
      byModule[stat._id] = stat.count;
    });

    const byRole: Record<string, number> = {};
    roleStats.forEach(stat => {
      byRole[stat._id] = stat.count;
    });

    const byAccessType: Record<string, number> = {};
    accessTypeStats.forEach(stat => {
      byAccessType[stat._id] = stat.count;
    });

    // Get unique modules and roles with permissions
    const uniqueModules = await UserPermission.distinct('srModuleId', { isDeleted: false });
    const uniqueRoles = await UserPermission.distinct('roleId', { isDeleted: false });

    return {
      ...baseStats,
      inactivePermissions: baseStats.totalPermissions - baseStats.activePermissions,
      modulesWithPermissions: uniqueModules.length,
      rolesWithPermissions: uniqueRoles.length,
      byAccessType,
      byModule,
      byRole,
      permissionDistribution: {
        read: baseStats.readPermissions,
        create: baseStats.createPermissions,
        update: baseStats.updatePermissions,
        delete: baseStats.deletePermissions,
        export: baseStats.exportPermissions,
        import: baseStats.importPermissions,
        approve: baseStats.approvePermissions,
        verify: baseStats.verifyPermissions,
      },
    };
  },

  /**
   * Initialize default permissions for roles
   */
  async initializeDefaultPermissions(
    userId: Types.ObjectId
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    try {
      // Import models

      // Get all active roles
      const roles = await Role.find({ isActive: true, isDeleted: false });
      // Get all active modules
      const modules = await SrModule.find({ isActive: true, isDeleted: false });

      if (roles.length === 0 || modules.length === 0) {
        errors.push('No roles or modules found to initialize permissions');
        return { created, updated, errors };
      }

      // Define default permissions by role type
      const defaultPermissions: Record<string, any> = {
        // Super Admin - Full access to everything
        SUPER_ADMIN: {
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          canExport: true,
          canImport: true,
          canApprove: true,
          canVerify: true,
        },
        // Admin - Full access but no super admin features
        ADMIN: {
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          canExport: true,
          canImport: true,
          canApprove: true,
          canVerify: false,
        },
        // Manager - Manage operations but limited deletion
        MANAGER: {
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: false,
          canExport: true,
          canImport: false,
          canApprove: true,
          canVerify: false,
        },
        // Staff - Limited access for daily operations
        STAFF: {
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: false,
          canExport: false,
          canImport: false,
          canApprove: false,
          canVerify: false,
        },
        // Member - View only for most modules
        MEMBER: {
          canRead: true,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canExport: false,
          canImport: false,
          canApprove: false,
          canVerify: false,
        },
        // Guest - Very limited access
        GUEST: {
          canRead: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canExport: false,
          canImport: false,
          canApprove: false,
          canVerify: false,
        },
      };

      for (const role of roles) {
        const roleCode = role.roleCode || '';
        const permissions = defaultPermissions[roleCode] || defaultPermissions['MEMBER'];

        for (const module of modules) {
          try {
            // Check if permission already exists
            const existingPermission = await UserPermission.findOne({
              roleId: role._id,
              srModuleId: module._id,
              isDeleted: false,
            });

            if (existingPermission) {
              // Update existing permission with defaults
              await UserPermission.findByIdAndUpdate(
                existingPermission._id,
                {
                  $set: {
                    ...permissions,
                    updatedBy: userId,
                  },
                },
                { new: true, runValidators: true }
              );
              updated++;
            } else {
              // Create new permission
              await UserPermission.create({
                srModuleId: module._id,
                roleId: role._id,
                moduleName: module.moduleName,
                ...permissions,
                isActive: true,
                createdBy: userId,
                updatedBy: userId,
              });
              created++;
            }
          } catch (error: any) {
            errors.push(`Role ${role.roleName}, Module ${module.moduleName}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      errors.push(`Initialization failed: ${error.message}`);
    }

    return { created, updated, errors };
  },

  /**
   * Get permissions map for a role (optimized for authorization)
   */
  async getRolePermissionsMap(roleId: string): Promise<Record<string, any>> {
    const permissions = await UserPermission.find({
      roleId: new Types.ObjectId(roleId),
      isActive: true,
      isDeleted: false,
    })
      .populate('srModuleId', 'moduleName moduleCode routePath')
      .select(
        'srModuleId canRead canCreate canUpdate canDelete canExport canImport canApprove canVerify'
      );

    const permissionMap: Record<string, any> = {};

    permissions.forEach(permission => {
      const module = permission.srModuleId as any;
      if (module && module.moduleCode) {
        permissionMap[module.moduleCode] = {
          moduleId: permission.srModuleId,
          moduleName: module.moduleName,
          moduleCode: module.moduleCode,
          routePath: module.routePath,
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
  },

  /**
   * Toggle permission active status
   */
  async togglePermissionStatus(
    id: string,
    userId: Types.ObjectId
  ): Promise<UserPermissionType | null> {
    const permission = await UserPermission.findById(id);

    if (!permission || permission.isDeleted) {
      throw new Error('Permission not found');
    }

    const updatedPermission = await UserPermission.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !permission.isActive,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('srModuleId', 'moduleName moduleCode iconName routePath')
      .populate('roleId', 'roleName roleCode description')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return updatedPermission ? toPlainObject(updatedPermission) : null;
  },
};
