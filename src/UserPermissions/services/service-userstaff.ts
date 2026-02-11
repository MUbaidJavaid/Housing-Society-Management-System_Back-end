import { Types } from 'mongoose';

import City from '../../CityState/models/models-city';
import UserRole from '../models/models-userrole';
import UserStaff from '../models/models-userstaff';
import {
  CreateUserStaffDto,
  GetUserStaffsResult,
  UpdateUserStaffDto,
  UserStaffQueryParams,
  UserStaffStatistics,
  UserStaffType,
} from '../types/types-userstaff';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): UserStaffType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as UserStaffType;
};

export const userStaffService = {
  /**
   * Create new user staff
   */
  async createUserStaff(data: CreateUserStaffDto, userId: Types.ObjectId): Promise<UserStaffType> {
    // Check if username already exists
    const normalizedUsername = data.userName.toLowerCase();
    console.log('🔍 Checking username:', normalizedUsername);

    const existingUsername = await UserStaff.findOne({
      userName: normalizedUsername,
      isDeleted: false,
    });

    console.log('🔍 Found existing username:', existingUsername ? 'YES' : 'NO');
    if (existingUsername) {
      console.log('🔍 Existing user:', {
        id: existingUsername._id,
        userName: existingUsername.userName,
        isDeleted: existingUsername.isDeleted,
      });
    }

    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check if CNIC already exists
    console.log('🔍 Checking CNIC:', data.cnic);
    const existingCNIC = await UserStaff.findOne({
      cnic: data.cnic,
      isDeleted: false,
    });

    console.log('🔍 Found existing CNIC:', existingCNIC ? 'YES' : 'NO');
    if (existingCNIC) {
      console.log('🔍 Existing CNIC user:', {
        id: existingCNIC._id,
        userName: existingCNIC.userName,
        cnic: existingCNIC.cnic,
        isDeleted: existingCNIC.isDeleted,
      });
    }

    if (existingCNIC) {
      throw new Error('CNIC already registered');
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await UserStaff.findOne({
        email: data.email.toLowerCase(),
        isDeleted: false,
      });

      if (existingEmail) {
        throw new Error('Email already registered');
      }
    }

    // Check if role exists
    const role = await UserRole.findById(data.roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if city exists
    const city = await City.findById(data.cityId);
    if (!city) {
      throw new Error('City not found');
    }

    const userData = {
      ...data,
      userName: data.userName.toLowerCase(),
      email: data.email ? data.email.toLowerCase() : undefined,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: userId,
      updatedBy: userId,
    };

    const userStaff = await UserStaff.create(userData);

    // Populate and return the created user
    const createdUser = await UserStaff.findById(userStaff._id)
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName ')
      .populate('createdBy', 'userName fullName')
      .populate('updatedBy', 'userName fullName');

    if (!createdUser) {
      throw new Error('Failed to create user');
    }

    return toPlainObject(createdUser);
  },

  /**
   * Get user staff by ID
   */
  async getUserStaffById(id: string): Promise<UserStaffType> {
    try {
      const user = await UserStaff.findById(id)
        .populate('roleId', 'roleName roleCode roleDescription')
        .populate('cityId', 'cityName')
        .populate('createdBy', 'userName fullName email')
        .populate('updatedBy', 'userName fullName email');

      if (!user || user.isDeleted) {
        throw new Error('User not found');
      }

      return toPlainObject(user);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid user ID');
    }
  },

  /**
   * Find user by ID (returns null if not found)
   */
  async findUserStaffById(id: string): Promise<UserStaffType | null> {
    try {
      const user = await UserStaff.findById(id);

      if (!user || user.isDeleted) return null;
      return toPlainObject(user);
    } catch (error) {
      return null;
    }
  },

  /**
   * Find user by username
   */
  async findUserByUsername(username: string): Promise<UserStaffType | null> {
    const user = await UserStaff.findOne({
      userName: username.toLowerCase(),
      isDeleted: false,
    });

    if (!user) return null;
    return toPlainObject(user);
  },

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<UserStaffType | null> {
    const user = await UserStaff.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });

    if (!user) return null;
    return toPlainObject(user);
  },

  /**
   * Find user by CNIC
   */
  async findUserByCNIC(cnic: string): Promise<UserStaffType | null> {
    const user = await UserStaff.findOne({
      cnic,
      isDeleted: false,
    });

    if (!user) return null;
    return toPlainObject(user);
  },

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<UserStaffType | null> {
    const user = await UserStaff.findOne({
      userName: username.toLowerCase(),
      isDeleted: false,
    })
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName');

    if (!user) return null;
    return toPlainObject(user);
  },

  /**
   * Get all user staff with pagination
   */
  async getUserStaffs(params: UserStaffQueryParams): Promise<GetUserStaffsResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      roleId,
      cityId,
      designation,
      isActive,
      sortBy = 'createdAt',
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
        { userName: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
        { mobileNo: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by role
    if (roleId) {
      query.roleId = new Types.ObjectId(roleId);
    }

    // Filter by city
    if (cityId) {
      query.cityId = new Types.ObjectId(cityId);
    }

    // Filter by designation
    if (designation) {
      query.designation = { $regex: designation, $options: 'i' };
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Execute queries
    const [userStaffs, total] = await Promise.all([
      UserStaff.find(query)
        .populate('roleId', 'roleName roleCode')
        .populate('cityId', 'cityName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      UserStaff.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = {
      totalUsers: userStaffs.length,
      activeUsers: userStaffs.filter(user => user.isActive).length,
      byRole: {} as Record<string, number>,
      byCity: {} as Record<string, number>,
      byDesignation: {} as Record<string, number>,
    };

    // Count users by various categories
    userStaffs.forEach(user => {
      // Count by role
      const roleName = (user as any).roleId?.roleName || 'Unknown';
      summary.byRole[roleName] = (summary.byRole[roleName] || 0) + 1;

      // Count by city
      const cityName = (user as any).cityId?.cityName || 'Unknown';
      summary.byCity[cityName] = (summary.byCity[cityName] || 0) + 1;

      // Count by designation
      const userDesignation = user.designation || 'Not Specified';
      summary.byDesignation[userDesignation] = (summary.byDesignation[userDesignation] || 0) + 1;
    });

    return {
      userStaffs,
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
   * Update user staff
   */
  async updateUserStaff(
    id: string,
    data: UpdateUserStaffDto,
    userId: Types.ObjectId
  ): Promise<UserStaffType | null> {
    // Check if user exists
    const existingUser = await UserStaff.findById(id);
    if (!existingUser || existingUser.isDeleted) {
      throw new Error('User not found');
    }

    // If username is being updated, check for duplicates
    if (data.userName && data.userName !== existingUser.userName) {
      const duplicateUser = await UserStaff.findOne({
        userName: data.userName.toLowerCase(),
        isDeleted: false,
        _id: { $ne: id },
      });

      if (duplicateUser) {
        throw new Error('Username already exists');
      }
    }

    // If CNIC is being updated, check for duplicates
    if (data.cnic && data.cnic !== existingUser.cnic) {
      const duplicateCNIC = await UserStaff.findOne({
        cnic: data.cnic,
        isDeleted: false,
        _id: { $ne: id },
      });

      if (duplicateCNIC) {
        throw new Error('CNIC already registered');
      }
    }

    // If email is being updated, check for duplicates
    if (data.email && data.email !== existingUser.email) {
      const duplicateEmail = await UserStaff.findOne({
        email: data.email.toLowerCase(),
        isDeleted: false,
        _id: { $ne: id },
      });

      if (duplicateEmail) {
        throw new Error('Email already registered');
      }
    }

    // Check if role exists (if being updated)
    if (data.roleId) {
      const role = await UserRole.findById(data.roleId);
      if (!role) {
        throw new Error('Role not found');
      }
    }

    // Check if city exists (if being updated)
    if (data.cityId) {
      const city = await City.findById(data.cityId);
      if (!city) {
        throw new Error('City not found');
      }
    }

    const updateObj: any = {
      ...data,
      updatedBy: userId,
    };

    // Ensure lowercase for username and email
    if (updateObj.userName) {
      updateObj.userName = updateObj.userName.toLowerCase();
    }
    if (updateObj.email) {
      updateObj.email = updateObj.email.toLowerCase();
    }

    const user = await UserStaff.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName ')
      .populate('createdBy', 'userName fullName')
      .populate('updatedBy', 'userName fullName');

    return user ? toPlainObject(user) : null;
  },

  /**
   * Delete user staff (soft delete)
   */
  async deleteUserStaff(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingUser = await UserStaff.findById(id);
    if (!existingUser || existingUser.isDeleted) {
      throw new Error('User not found');
    }

    const result = await UserStaff.findByIdAndUpdate(
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
   * Change user status
   */
  async changeUserStatus(
    id: string,
    isActive: boolean,
    userId: Types.ObjectId
  ): Promise<UserStaffType | null> {
    const user = await UserStaff.findById(id);

    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }

    const updatedUser = await UserStaff.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName');

    return updatedUser ? toPlainObject(updatedUser) : null;
  },

  /**
   * Get users by role
   */
  async getUsersByRole(roleId: string): Promise<UserStaffType[]> {
    const users = await UserStaff.find({
      roleId: new Types.ObjectId(roleId),
      isActive: true,
      isDeleted: false,
    })
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName')
      .sort({ fullName: 1 });

    return users.map(user => toPlainObject(user));
  },

  /**
   * Get users by city
   */
  async getUsersByCity(cityId: string): Promise<UserStaffType[]> {
    const users = await UserStaff.find({
      cityId: new Types.ObjectId(cityId),
      isActive: true,
      isDeleted: false,
    })
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName ')
      .sort({ fullName: 1 });

    return users.map(user => toPlainObject(user));
  },

  /**
   * Search user staff
   */
  async searchUserStaff(searchTerm: string, limit: number = 10): Promise<UserStaffType[]> {
    const users = await UserStaff.find({
      $or: [
        { userName: { $regex: searchTerm, $options: 'i' } },
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { designation: { $regex: searchTerm, $options: 'i' } },
      ],
      isDeleted: false,
      isActive: true,
    })
      .select('userName fullName email designation roleId cityId')
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName')
      .limit(limit)
      .sort({ fullName: 1 });

    return users.map(user => toPlainObject(user));
  },

  /**
   * Change password
   */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
    userId: Types.ObjectId
  ): Promise<UserStaffType | null> {
    const user = await UserStaff.findById(id).select('+password');

    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await (user as any).comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const updatedUser = await UserStaff.findByIdAndUpdate(
      id,
      {
        $set: {
          password: newPassword,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName');

    return updatedUser ? toPlainObject(updatedUser) : null;
  },

  /**
   * Reset password (admin function)
   */
  async resetPassword(
    id: string,
    newPassword: string,
    userId: Types.ObjectId
  ): Promise<UserStaffType | null> {
    const user = await UserStaff.findById(id);

    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }

    const updatedUser = await UserStaff.findByIdAndUpdate(
      id,
      {
        $set: {
          password: newPassword,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName ');

    return updatedUser ? toPlainObject(updatedUser) : null;
  },

  /**
   * Bulk update user status
   */
  async bulkUpdateUserStatus(
    userIds: string[],
    isActive: boolean,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs must be a non-empty array');
    }

    const objectIds = userIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid user ID: ${id}`);
      }
    });

    const result = await UserStaff.updateMany(
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
   * Get user staff statistics
   */
  async getUserStaffStatistics(): Promise<UserStaffStatistics> {
    const stats = await UserStaff.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          lockedUsers: {
            $sum: {
              $cond: [
                {
                  $and: [{ $ifNull: ['$lockUntil', false] }, { $gt: ['$lockUntil', new Date()] }],
                },
                1,
                0,
              ],
            },
          },
          usersWithEmail: {
            $sum: { $cond: [{ $ifNull: ['$email', false] }, 1, 0] },
          },
        },
      },
    ]);

    const roleStats = await UserStaff.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $lookup: {
          from: 'userroles',
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

    const cityStats = await UserStaff.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'cityId',
          foreignField: '_id',
          as: 'city',
        },
      },
      { $unwind: '$city' },
      {
        $group: {
          _id: '$city.cityName',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const designationStats = await UserStaff.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $group: {
          _id: '$designation',
          count: { $sum: 1 },
        },
      },
      {
        $match: { _id: { $ne: null } },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const monthlyStats = await UserStaff.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $limit: 12,
      },
    ]);

    const baseStats = stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      lockedUsers: 0,
      usersWithEmail: 0,
    };

    const byRole: Record<string, number> = {};
    roleStats.forEach(stat => {
      byRole[stat._id] = stat.count;
    });

    const byCity: Record<string, number> = {};
    cityStats.forEach(stat => {
      byCity[stat._id] = stat.count;
    });

    const byDesignation: Record<string, number> = {};
    designationStats.forEach(stat => {
      byDesignation[stat._id] = stat.count;
    });

    const monthlyGrowth = monthlyStats.map(stat => ({
      month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
      count: stat.count,
    }));

    return {
      ...baseStats,
      inactiveUsers: baseStats.totalUsers - baseStats.activeUsers,
      usersWithoutEmail: baseStats.totalUsers - baseStats.usersWithEmail,
      byRole,
      byCity,
      byDesignation,
      monthlyGrowth,
    };
  },

  /**
   * Get user dashboard statistics
   */
  /**
   * Get user dashboard statistics
   */
  async getUserDashboardStats(userId: Types.ObjectId): Promise<any> {
    // Get user details
    const user = await UserStaff.findById(userId)
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName province');

    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }

    // Get user's last login activities
    const lastLogin = user.lastLogin || user.createdAt;

    // Get total users count (for admin users)
    let totalUsers = 0;
    let activeUsers = 0;

    const userDoc = user as any;
    const userRole = userDoc.roleId?.roleCode || '';

    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      const stats = await UserStaff.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
          },
        },
      ]);

      if (stats[0]) {
        totalUsers = stats[0].total;
        activeUsers = stats[0].active;
      }
    }

    // Get recent activities with explicit type annotation
    const recentActivities: Array<{
      id: string;
      action: string;
      description: string;
      timestamp: Date;
      icon?: string;
    }> = [];

    // If you implement an activity log later, you can fetch real data here:
    // Example:
    // const ActivityLog = require('../models/models-activitylog');
    // const activities = await ActivityLog.find({ userId: user._id })
    //   .sort({ createdAt: -1 })
    //   .limit(5);
    // recentActivities = activities.map(activity => ({
    //   id: activity._id.toString(),
    //   action: activity.action,
    //   description: activity.description,
    //   timestamp: activity.createdAt,
    //   icon: activity.icon,
    // }));

    return {
      user: {
        id: user._id,
        userName: user.userName,
        fullName: user.fullName,
        role: userDoc.roleId,
        city: userDoc.cityId,
        designation: user.designation,
        lastLogin,
      },
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
      recentActivities,
      quickActions: [
        { label: 'Update Profile', action: 'profile' },
        { label: 'Change Password', action: 'password' },
        { label: 'View Team', action: 'team' },
      ],
    };
  },

  /**
   * Authenticate user (for login)
   */
  async authenticateUser(username: string, password: string): Promise<UserStaffType | null> {
    const user = await UserStaff.findOne({
      userName: username.toLowerCase(),
      isDeleted: false,
    }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return null;
    }

    // Check if account is locked
    if ((user as any).isLocked()) {
      throw new Error('Account is locked. Try again later.');
    }

    // Verify password
    const isPasswordValid = await (user as any).comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await (user as any).incLoginAttempts();
      throw new Error('Invalid credentials');
    }

    // Reset login attempts on successful login
    await (user as any).resetLoginAttempts();

    const populatedUser = await UserStaff.findById(user._id)
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName ');

    return populatedUser ? toPlainObject(populatedUser) : null;
  },

  /**
   * Unlock user account (admin function)
   */
  async unlockUserAccount(id: string, userId: Types.ObjectId): Promise<UserStaffType | null> {
    const user = await UserStaff.findById(id);

    if (!user || user.isDeleted) {
      throw new Error('User not found');
    }

    const updatedUser = await UserStaff.findByIdAndUpdate(
      id,
      {
        $set: {
          loginAttempts: 0,
          lockUntil: null,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('roleId', 'roleName roleCode')
      .populate('cityId', 'cityName ');

    return updatedUser ? toPlainObject(updatedUser) : null;
  },
};
