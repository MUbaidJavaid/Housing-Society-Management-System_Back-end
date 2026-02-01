import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { userStaffService } from '../index-userstaff';
import {
  ChangePasswordDto,
  CreateUserStaffDto,
  ResetPasswordDto,
  UpdateUserStaffDto,
  UserStaffQueryParams,
  UserStatusChangeDto,
} from '../types/types-userstaff';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const userStaffController = {
  /**
   * Create new user staff
   */
  createUserStaff: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateUserStaffDto = req.body;

      // Validate required fields
      if (!createData.userName?.trim()) {
        throw new AppError(400, 'Username is required');
      }

      if (!createData.password?.trim()) {
        throw new AppError(400, 'Password is required');
      }

      if (!createData.fullName?.trim()) {
        throw new AppError(400, 'Full name is required');
      }

      if (!createData.cnic?.trim()) {
        throw new AppError(400, 'CNIC is required');
      }

      if (!createData.roleId?.trim()) {
        throw new AppError(400, 'Role is required');
      }

      if (!createData.cityId?.trim()) {
        throw new AppError(400, 'City is required');
      }

      // Check if username already exists
      const existingUser = await userStaffService.findUserByUsername(createData.userName);
      if (existingUser) {
        throw new AppError(409, 'Username already exists');
      }

      // Check if CNIC already exists
      const existingCNIC = await userStaffService.findUserByCNIC(createData.cnic);
      if (existingCNIC) {
        throw new AppError(409, 'CNIC already registered');
      }

      // Check if email already exists
      if (createData.email) {
        const existingEmail = await userStaffService.findUserByEmail(createData.email);
        if (existingEmail) {
          throw new AppError(409, 'Email already registered');
        }
      }

      const user = await userStaffService.createUserStaff(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: user,
        message: 'User staff created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get user staff by ID
   */
  getUserStaff: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const user = await userStaffService.getUserStaffById(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all user staff
   */
  getUserStaffs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: UserStaffQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        roleId: req.query.roleId as string,
        cityId: req.query.cityId as string,
        designation: req.query.designation as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await userStaffService.getUserStaffs(queryParams);

      res.json({
        success: true,
        data: {
          userStaffs: result.userStaffs,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update user staff
   */
  updateUserStaff: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateUserStaffDto = req.body;

      // Check if username is being changed and if it already exists
      if (updateData.userName) {
        const existingUser = await userStaffService.findUserByUsername(updateData.userName);
        if (existingUser && existingUser._id.toString() !== id) {
          throw new AppError(409, 'Username already exists');
        }
      }

      // Check if CNIC is being changed and if it already exists
      if (updateData.cnic) {
        const existingCNIC = await userStaffService.findUserByCNIC(updateData.cnic);
        if (existingCNIC && existingCNIC._id.toString() !== id) {
          throw new AppError(409, 'CNIC already registered');
        }
      }

      // Check if email is being changed and if it already exists
      if (updateData.email) {
        const existingEmail = await userStaffService.findUserByEmail(updateData.email);
        if (existingEmail && existingEmail._id.toString() !== id) {
          throw new AppError(409, 'Email already registered');
        }
      }

      const updatedUser = await userStaffService.updateUserStaff(id, updateData, req.user.userId);

      if (!updatedUser) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete user staff (soft delete)
   */
  deleteUserStaff: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await userStaffService.deleteUserStaff(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Change user status (activate/deactivate)
   */
  changeUserStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const statusData: UserStatusChangeDto = req.body;

      if (statusData.isActive === undefined) {
        throw new AppError(400, 'isActive field is required');
      }

      const updatedUser = await userStaffService.changeUserStatus(
        id,
        statusData.isActive,
        req.user.userId
      );

      if (!updatedUser) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: updatedUser,
        message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get user staff by username
   */
  getUserByUsername: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = req.params.username as string;

      const user = await userStaffService.getUserByUsername(username);

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get users by role
   */
  getUsersByRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;

      const users = await userStaffService.getUsersByRole(roleId);

      res.json({
        success: true,
        data: users,
        total: users.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get users by city
   */
  getUsersByCity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cityId = req.params.cityId as string;

      const users = await userStaffService.getUsersByCity(cityId);

      res.json({
        success: true,
        data: users,
        total: users.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get user staff statistics
   */
  getUserStaffStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await userStaffService.getUserStaffStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search user staff
   */
  searchUserStaff: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.search as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm?.trim()) {
        throw new AppError(400, 'Search term is required');
      }

      const users = await userStaffService.searchUserStaff(searchTerm, limit);

      res.json({
        success: true,
        data: users,
        total: users.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Change password
   */
  changePassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const passwordData: ChangePasswordDto = req.body;

      if (!passwordData.currentPassword?.trim()) {
        throw new AppError(400, 'Current password is required');
      }

      if (!passwordData.newPassword?.trim()) {
        throw new AppError(400, 'New password is required');
      }

      if (passwordData.newPassword.length < 6) {
        throw new AppError(400, 'New password must be at least 6 characters');
      }

      const updatedUser = await userStaffService.changePassword(
        id,
        passwordData.currentPassword,
        passwordData.newPassword,
        req.user.userId
      );

      if (!updatedUser) {
        throw new AppError(404, 'User not found or current password is incorrect');
      }

      res.json({
        success: true,
        data: updatedUser,
        message: 'Password changed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Reset password (admin function)
   */
  resetPassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const passwordData: ResetPasswordDto = req.body;

      if (!passwordData.newPassword?.trim()) {
        throw new AppError(400, 'New password is required');
      }

      if (passwordData.newPassword.length < 6) {
        throw new AppError(400, 'New password must be at least 6 characters');
      }

      const updatedUser = await userStaffService.resetPassword(
        id,
        passwordData.newPassword,
        req.user.userId
      );

      if (!updatedUser) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: updatedUser,
        message: 'Password reset successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update user status
   */
  bulkUpdateUserStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { userIds, isActive } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError(400, 'User IDs are required and must be a non-empty array');
      }

      if (isActive === undefined) {
        throw new AppError(400, 'isActive field is required');
      }

      const result = await userStaffService.bulkUpdateUserStatus(
        userIds,
        isActive,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} users`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get user dashboard statistics
   */
  getUserDashboardStats: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const userId = req.user.userId;
      const stats = await userStaffService.getUserDashboardStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get my profile (current user)
   */
  getMyProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const user = await userStaffService.getUserStaffById(req.user.userId.toString());

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update my profile (current user)
   */
  updateMyProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const userId = req.user.userId.toString();
      const updateData: UpdateUserStaffDto = req.body;

      // Prevent changing sensitive fields through profile update
      delete updateData.roleId;
      delete updateData.isActive;
      delete updateData.password;

      const updatedUser = await userStaffService.updateUserStaff(
        userId,
        updateData,
        req.user.userId
      );

      if (!updatedUser) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
