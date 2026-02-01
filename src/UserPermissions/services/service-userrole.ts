import { Types } from 'mongoose';
import { User } from '../../users/models/User.model';
import UserRole from '../models/models-userrole';
import {
  CreateUserRoleDto,
  GetUserRolesResult,
  RoleHierarchy,
  UpdateUserRoleDto,
  UserRoleQueryParams,
  UserRoleStatistics,
  UserRoleType,
} from '../types/types-userrole';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): UserRoleType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as UserRoleType;
};

export const userRoleService = {
  /**
   * Create new user role
   */
  async createUserRole(data: CreateUserRoleDto, userId: Types.ObjectId): Promise<UserRoleType> {
    // Check if role code already exists
    const existingRole = await UserRole.findOne({
      roleCode: data.roleCode.toUpperCase(),
      isDeleted: false,
    });

    if (existingRole) {
      throw new Error('Role code already exists');
    }

    const roleData = {
      ...data,
      roleCode: data.roleCode.toUpperCase(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      isSystem: false,
      priority: data.priority || 0,
      createdBy: userId,
      updatedBy: userId,
    };

    const userRole = await UserRole.create(roleData);

    // Populate and return the created role
    const createdRole = await UserRole.findById(userRole._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!createdRole) {
      throw new Error('Failed to create role');
    }

    return toPlainObject(createdRole);
  },

  /**
   * Get user role by ID
   */
  async getUserRoleById(id: string): Promise<UserRoleType> {
    try {
      const role = await UserRole.findById(id)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      if (!role || role.isDeleted) {
        throw new Error('Role not found');
      }

      return toPlainObject(role);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid role ID');
    }
  },

  /**
   * Find role by ID (returns null if not found)
   */
  async findUserRoleById(id: string): Promise<UserRoleType | null> {
    try {
      const role = await UserRole.findById(id);

      if (!role || role.isDeleted) return null;
      return toPlainObject(role);
    } catch (error) {
      return null;
    }
  },

  /**
   * Find role by code
   */
  async findRoleByCode(roleCode: string): Promise<UserRoleType | null> {
    const role = await UserRole.findOne({
      roleCode: roleCode.toUpperCase(),
      isDeleted: false,
    });

    if (!role) return null;
    return toPlainObject(role);
  },

  /**
   * Get role by code
   */
  async getRoleByCode(roleCode: string): Promise<UserRoleType | null> {
    const role = await UserRole.findOne({
      roleCode: roleCode.toUpperCase(),
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!role) return null;
    return toPlainObject(role);
  },

  /**
   * Get all user roles with pagination
   */
  async getUserRoles(params: UserRoleQueryParams): Promise<GetUserRolesResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      isActive,
      sortBy = 'priority',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search
    if (search) {
      query.$or = [
        { roleName: { $regex: search, $options: 'i' } },
        { roleCode: { $regex: search, $options: 'i' } },
        { roleDescription: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Execute queries
    const [userRoles, total] = await Promise.all([
      UserRole.find(query)
        .populate('createdBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      UserRole.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = {
      totalRoles: userRoles.length,
      activeRoles: userRoles.filter(role => role.isActive).length,
      systemRoles: userRoles.filter(role => role.isSystem).length,
      byRoleLevel: {} as Record<string, number>,
    };

    // Initialize role level counters
    const roleLevels = ['System', 'Administrative', 'Managerial', 'Operational', 'Staff', 'Basic'];
    roleLevels.forEach(level => {
      summary.byRoleLevel[level] = 0;
    });

    // Count roles by level
    userRoles.forEach(role => {
      let roleLevel = 'Basic';
      if (role.priority >= 900) roleLevel = 'System';
      else if (role.priority >= 800) roleLevel = 'Administrative';
      else if (role.priority >= 600) roleLevel = 'Managerial';
      else if (role.priority >= 400) roleLevel = 'Operational';
      else if (role.priority >= 200) roleLevel = 'Staff';

      summary.byRoleLevel[roleLevel] = (summary.byRoleLevel[roleLevel] || 0) + 1;
    });

    return {
      userRoles,
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
   * Update user role
   */
  async updateUserRole(
    id: string,
    data: UpdateUserRoleDto,
    userId: Types.ObjectId
  ): Promise<UserRoleType | null> {
    // Check if role exists
    const existingRole = await UserRole.findById(id);
    if (!existingRole || existingRole.isDeleted) {
      throw new Error('Role not found');
    }

    // Prevent modification of system roles for non-system fields
    if (existingRole.isSystem) {
      const restrictedFields = ['roleCode', 'isSystem', 'priority'];
      const hasRestrictedUpdate = Object.keys(data).some(field => restrictedFields.includes(field));

      if (hasRestrictedUpdate) {
        throw new Error('Cannot modify system role properties');
      }
    }

    // If role code is being updated, check for duplicates
    if (data.roleCode && data.roleCode !== existingRole.roleCode) {
      const duplicateRole = await UserRole.findOne({
        roleCode: data.roleCode.toUpperCase(),
        isDeleted: false,
        _id: { $ne: id },
      });

      if (duplicateRole) {
        throw new Error('Role code already exists');
      }
    }

    const updateObj: any = {
      ...data,
      updatedBy: userId,
    };

    // Ensure role code is uppercase
    if (updateObj.roleCode) {
      updateObj.roleCode = updateObj.roleCode.toUpperCase();
    }

    const role = await UserRole.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return role ? toPlainObject(role) : null;
  },

  /**
   * Delete user role (soft delete)
   */
  async deleteUserRole(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingRole = await UserRole.findById(id);
    if (!existingRole || existingRole.isDeleted) {
      throw new Error('Role not found');
    }

    // Prevent deletion of system roles
    if (existingRole.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    const result = await UserRole.findByIdAndUpdate(
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
   * Get active roles
   */
  async getActiveRoles(): Promise<UserRoleType[]> {
    const roles = await UserRole.find({
      isActive: true,
      isDeleted: false,
    })
      .select('_id roleName roleCode roleDescription priority isSystem')
      .sort({ priority: -1, roleName: 1 });

    return roles.map(role => toPlainObject(role));
  },

  /**
   * Get roles with user count
   */
  async getRolesWithUserCount(): Promise<any[]> {
    const roles = await UserRole.aggregate([
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
  },

  /**
   * Bulk update roles
   */
  async bulkUpdateRoles(
    roleIds: string[],
    isActive: boolean,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      throw new Error('Role IDs must be a non-empty array');
    }

    const objectIds = roleIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid role ID: ${id}`);
      }
    });

    // Check if any of the roles are system roles
    const systemRoles = await UserRole.find({
      _id: { $in: objectIds },
      isSystem: true,
    });

    if (systemRoles.length > 0) {
      throw new Error('Cannot modify status of system roles');
    }

    const result = await UserRole.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
      },
      {
        $set: {
          isActive,
          updatedBy: userId,
        },
      }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },

  /**
   * Check if role is used by users
   */
  async isRoleUsedByUsers(roleId: string): Promise<boolean> {
    try {
      const userCount = await User.countDocuments({
        roleId: new Types.ObjectId(roleId),
        isDeleted: false,
        isActive: true,
      });

      return userCount > 0;
    } catch (error) {
      return false;
    }
  },

  /**
   * Toggle role status
   */
  async toggleRoleStatus(id: string, userId: Types.ObjectId): Promise<UserRoleType | null> {
    const role = await UserRole.findById(id);

    if (!role || role.isDeleted) {
      throw new Error('Role not found');
    }

    // Prevent toggling system roles
    if (role.isSystem) {
      throw new Error('Cannot modify status of system roles');
    }

    const updatedRole = await UserRole.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !role.isActive,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return updatedRole ? toPlainObject(updatedRole) : null;
  },

  /**
   * Search roles
   */
  async searchRoles(searchTerm: string, limit: number = 10): Promise<UserRoleType[]> {
    const roles = await UserRole.find({
      $or: [
        { roleName: { $regex: searchTerm, $options: 'i' } },
        { roleCode: { $regex: searchTerm, $options: 'i' } },
        { roleDescription: { $regex: searchTerm, $options: 'i' } },
      ],
      isDeleted: false,
      isActive: true,
    })
      .select('_id roleName roleCode roleDescription priority isSystem')
      .limit(limit)
      .sort({ priority: -1, roleName: 1 });

    return roles.map(role => toPlainObject(role));
  },

  /**
   * Get role hierarchy
   */
  async getRoleHierarchy(): Promise<RoleHierarchy[]> {
    const roles = await UserRole.find({
      isDeleted: false,
      isActive: true,
    })
      .select('_id roleName roleCode roleDescription priority isSystem')
      .sort({ priority: -1, roleName: 1 });

    // Group by priority ranges
    const hierarchy: RoleHierarchy[] = [
      {
        level: 'System',
        description: 'Highest level roles with full system access',
        roles: [],
        minPriority: 900,
        maxPriority: 1000,
      },
      {
        level: 'Administrative',
        description: 'Administrative roles with management capabilities',
        roles: [],
        minPriority: 800,
        maxPriority: 899,
      },
      {
        level: 'Managerial',
        description: 'Managerial roles with team and project oversight',
        roles: [],
        minPriority: 600,
        maxPriority: 799,
      },
      {
        level: 'Operational',
        description: 'Operational roles for daily business functions',
        roles: [],
        minPriority: 400,
        maxPriority: 599,
      },
      {
        level: 'Staff',
        description: 'Staff roles for regular employees',
        roles: [],
        minPriority: 200,
        maxPriority: 399,
      },
      {
        level: 'Basic',
        description: 'Basic roles with minimal permissions',
        roles: [],
        minPriority: 0,
        maxPriority: 199,
      },
    ];

    roles.forEach(role => {
      const plainRole = toPlainObject(role);

      for (const level of hierarchy) {
        if (role.priority >= level.minPriority && role.priority <= level.maxPriority) {
          level.roles.push(plainRole);
          break;
        }
      }
    });

    return hierarchy;
  },

  /**
   * Get user role statistics
   */
  async getUserRoleStatistics(): Promise<UserRoleStatistics> {
    const stats = await UserRole.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: null,
          totalRoles: { $sum: 1 },
          activeRoles: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          systemRoles: {
            $sum: { $cond: [{ $eq: ['$isSystem', true] }, 1, 0] },
          },
          averagePriority: { $avg: '$priority' },
          maxPriority: { $max: '$priority' },
          minPriority: { $min: '$priority' },
        },
      },
    ]);

    const roleDistribution = await UserRole.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $gte: ['$priority', 900] }, then: 'System' },
                { case: { $gte: ['$priority', 800] }, then: 'Administrative' },
                { case: { $gte: ['$priority', 600] }, then: 'Managerial' },
                { case: { $gte: ['$priority', 400] }, then: 'Operational' },
                { case: { $gte: ['$priority', 200] }, then: 'Staff' },
              ],
              default: 'Basic',
            },
          },
          count: { $sum: 1 },
          averagePriority: { $avg: '$priority' },
        },
      },
      {
        $sort: { averagePriority: -1 },
      },
    ]);

    const usageStats = await UserRole.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
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
        $addFields: {
          userCount: {
            $ifNull: [{ $arrayElemAt: ['$userCountInfo.count', 0] }, 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: '$userCount' },
          rolesWithUsers: {
            $sum: { $cond: [{ $gt: ['$userCount', 0] }, 1, 0] },
          },
          maxUsersPerRole: { $max: '$userCount' },
        },
      },
    ]);

    const baseStats = stats[0] || {
      totalRoles: 0,
      activeRoles: 0,
      systemRoles: 0,
      averagePriority: 0,
      maxPriority: 0,
      minPriority: 0,
    };

    const usage = usageStats[0] || {
      totalUsers: 0,
      rolesWithUsers: 0,
      maxUsersPerRole: 0,
    };

    const distribution: Record<string, number> = {};
    roleDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });

    return {
      ...baseStats,
      inactiveRoles: baseStats.totalRoles - baseStats.activeRoles,
      rolesWithUsers: usage.rolesWithUsers,
      rolesWithoutUsers: baseStats.activeRoles - usage.rolesWithUsers,
      totalUsers: usage.totalUsers,
      maxUsersPerRole: usage.maxUsersPerRole,
      distributionByLevel: distribution,
    };
  },

  /**
   * Initialize default roles
   */
  async initializeDefaultRoles(
    userId: Types.ObjectId
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    try {
      // Define default roles with proper hierarchy
      const defaultRoles = [
        {
          roleName: 'Super Administrator',
          roleCode: 'SUPER_ADMIN',
          roleDescription: 'Full system access with all privileges',
          isSystem: true,
          priority: 1000,
          isActive: true,
        },
        {
          roleName: 'Administrator',
          roleCode: 'ADMIN',
          roleDescription: 'System administrator with management capabilities',
          isSystem: true,
          priority: 900,
          isActive: true,
        },
        {
          roleName: 'System Manager',
          roleCode: 'SYSTEM_MANAGER',
          roleDescription: 'Manages system configurations and user access',
          isSystem: false,
          priority: 850,
          isActive: true,
        },
        {
          roleName: 'Department Head',
          roleCode: 'DEPT_HEAD',
          roleDescription: 'Head of department with oversight responsibilities',
          isSystem: false,
          priority: 800,
          isActive: true,
        },
        {
          roleName: 'Manager',
          roleCode: 'MANAGER',
          roleDescription: 'Team manager with project oversight',
          isSystem: false,
          priority: 700,
          isActive: true,
        },
        {
          roleName: 'Supervisor',
          roleCode: 'SUPERVISOR',
          roleDescription: 'Team supervisor with limited management access',
          isSystem: false,
          priority: 600,
          isActive: true,
        },
        {
          roleName: 'Senior Staff',
          roleCode: 'SENIOR_STAFF',
          roleDescription: 'Experienced staff member with additional responsibilities',
          isSystem: false,
          priority: 500,
          isActive: true,
        },
        {
          roleName: 'Staff',
          roleCode: 'STAFF',
          roleDescription: 'Regular employee with standard access',
          isSystem: false,
          priority: 400,
          isActive: true,
        },
        {
          roleName: 'Junior Staff',
          roleCode: 'JUNIOR_STAFF',
          roleDescription: 'New or junior employee with limited access',
          isSystem: false,
          priority: 300,
          isActive: true,
        },
        {
          roleName: 'Guest',
          roleCode: 'GUEST',
          roleDescription: 'Guest user with minimal read-only access',
          isSystem: false,
          priority: 100,
          isActive: true,
        },
        {
          roleName: 'Viewer',
          roleCode: 'VIEWER',
          roleDescription: 'Read-only access for viewing purposes',
          isSystem: false,
          priority: 50,
          isActive: true,
        },
      ];

      for (const defaultRole of defaultRoles) {
        try {
          // Check if role already exists
          const existingRole = await UserRole.findOne({
            roleCode: defaultRole.roleCode,
            isDeleted: false,
          });

          if (existingRole) {
            // Update existing role
            await UserRole.findByIdAndUpdate(
              existingRole._id,
              {
                $set: {
                  roleName: defaultRole.roleName,
                  roleDescription: defaultRole.roleDescription,
                  priority: defaultRole.priority,
                  isActive: defaultRole.isActive,
                  updatedBy: userId,
                },
              },
              { new: true, runValidators: true }
            );
            updated++;
          } else {
            // Create new role
            await UserRole.create({
              ...defaultRole,
              createdBy: userId,
              updatedBy: userId,
            });
            created++;
          }
        } catch (error: any) {
          errors.push(`Role ${defaultRole.roleCode}: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`Initialization failed: ${error.message}`);
    }

    return { created, updated, errors };
  },
};
