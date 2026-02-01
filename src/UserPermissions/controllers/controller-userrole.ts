import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { userRoleService } from '../index-userrole';
import { CreateUserRoleDto, UpdateUserRoleDto, UserRoleQueryParams } from '../types/types-userrole';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const userRoleController = {
  /**
   * Create new user role
   */
  createUserRole: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateUserRoleDto = req.body;

      // Validate required fields
      if (!createData.roleName?.trim()) {
        throw new AppError(400, 'Role name is required');
      }

      if (!createData.roleCode?.trim()) {
        throw new AppError(400, 'Role code is required');
      }

      // Check if role code already exists
      const existingRole = await userRoleService.findRoleByCode(createData.roleCode);
      if (existingRole) {
        throw new AppError(409, 'Role code already exists');
      }

      const role = await userRoleService.createUserRole(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get user role by ID
   */
  getUserRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const role = await userRoleService.getUserRoleById(id);

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all user roles
   */
  getUserRoles: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: UserRoleQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await userRoleService.getUserRoles(queryParams);

      res.json({
        success: true,
        data: {
          userRoles: result.userRoles,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update user role
   */
  updateUserRole: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateUserRoleDto = req.body;

      // Check if role code is being changed and if it already exists
      if (updateData.roleCode) {
        const existingRole = await userRoleService.findRoleByCode(updateData.roleCode);
        if (existingRole && existingRole._id.toString() !== id) {
          throw new AppError(409, 'Role code already exists');
        }
      }

      const updatedRole = await userRoleService.updateUserRole(id, updateData, req.user.userId);

      if (!updatedRole) {
        throw new AppError(404, 'Role not found');
      }

      res.json({
        success: true,
        data: updatedRole,
        message: 'Role updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete user role
   */
  deleteUserRole: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      // Check if role is being used by users
      const isRoleInUse = await userRoleService.isRoleUsedByUsers(id);
      if (isRoleInUse) {
        throw new AppError(400, 'Cannot delete role that is assigned to users');
      }

      const deleted = await userRoleService.deleteUserRole(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Role not found');
      }

      res.json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get roles with user count
   */
  getRolesWithUserCount: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await userRoleService.getRolesWithUserCount();

      res.json({
        success: true,
        data: roles,
        total: roles.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active roles
   */
  getActiveRoles: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await userRoleService.getActiveRoles();

      res.json({
        success: true,
        data: roles,
        total: roles.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get role by code
   */
  getRoleByCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleCode = req.params.roleCode as string;

      const role = await userRoleService.getRoleByCode(roleCode);

      if (!role) {
        throw new AppError(404, 'Role not found');
      }

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update roles
   */
  bulkUpdateRoles: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { roleIds, isActive } = req.body;

      if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
        throw new AppError(400, 'Role IDs are required and must be a non-empty array');
      }

      if (isActive === undefined) {
        throw new AppError(400, 'isActive field is required');
      }

      const result = await userRoleService.bulkUpdateRoles(roleIds, isActive, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} roles`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Toggle role status
   */
  toggleRoleStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const updatedRole = await userRoleService.toggleRoleStatus(id, req.user.userId);

      if (!updatedRole) {
        throw new AppError(404, 'Role not found');
      }

      res.json({
        success: true,
        data: updatedRole,
        message: `Role ${updatedRole.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get role statistics
   */
  getUserRoleStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await userRoleService.getUserRoleStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search roles
   */
  searchRoles: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.search as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm?.trim()) {
        throw new AppError(400, 'Search term is required');
      }

      const roles = await userRoleService.searchRoles(searchTerm, limit);

      res.json({
        success: true,
        data: roles,
        total: roles.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get role hierarchy
   */
  getRoleHierarchy: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const hierarchy = await userRoleService.getRoleHierarchy();

      res.json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Initialize default roles
   */
  initializeDefaultRoles: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const result = await userRoleService.initializeDefaultRoles(req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Default roles initialized: ${result.created} created, ${result.updated} updated`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
