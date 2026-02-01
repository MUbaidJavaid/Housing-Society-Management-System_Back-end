import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { userPermissionService } from '../index-userpermission';
import {
  BulkPermissionUpdateDto,
  CopyPermissionsDto,
  CreateUserPermissionDto,
  PermissionCheckDto,
  SetPermissionsDto,
  UpdateUserPermissionDto,
  UserPermissionQueryParams,
} from '../types/types-userpermission';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const userPermissionController = {
  /**
   * Create new user permission
   */
  createUserPermission: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateUserPermissionDto = req.body;

      // Validate required fields
      if (!createData.srModuleId?.trim()) {
        throw new AppError(400, 'Module ID is required');
      }

      if (!createData.roleId?.trim()) {
        throw new AppError(400, 'Role ID is required');
      }

      // Validate that at least one permission is granted
      const hasAnyPermission =
        createData.canRead ||
        createData.canCreate ||
        createData.canUpdate ||
        createData.canDelete ||
        createData.canExport ||
        createData.canImport ||
        createData.canApprove ||
        createData.canVerify;
      if (!hasAnyPermission) {
        throw new AppError(400, 'At least one permission must be granted');
      }

      const permission = await userPermissionService.createUserPermission(
        createData,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: permission,
        message: 'Permission created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get user permission by ID
   */
  getUserPermission: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const permission = await userPermissionService.getUserPermissionById(id);

      res.json({
        success: true,
        data: permission,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all user permissions
   */
  getUserPermissions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: UserPermissionQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        srModuleId: req.query.srModuleId as string,
        roleId: req.query.roleId as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        hasAccess: req.query.hasAccess ? req.query.hasAccess === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await userPermissionService.getUserPermissions(queryParams);

      res.json({
        success: true,
        data: {
          userPermissions: result.userPermissions,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update user permission
   */
  updateUserPermission: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateUserPermissionDto = req.body;

      const updatedPermission = await userPermissionService.updateUserPermission(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedPermission) {
        throw new AppError(404, 'Permission not found');
      }

      res.json({
        success: true,
        data: updatedPermission,
        message: 'Permission updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete user permission
   */
  deleteUserPermission: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await userPermissionService.deleteUserPermission(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Permission not found');
      }

      res.json({
        success: true,
        message: 'Permission deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Set permissions for a role and module
   */
  setPermissions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const setData: SetPermissionsDto = req.body;

      if (!setData.srModuleId?.trim()) {
        throw new AppError(400, 'Module ID is required');
      }

      if (!setData.roleId?.trim()) {
        throw new AppError(400, 'Role ID is required');
      }

      // Validate that at least one permission is granted
      const hasAnyPermission =
        setData.permissions.canRead ||
        setData.permissions.canCreate ||
        setData.permissions.canUpdate ||
        setData.permissions.canDelete;
      if (!hasAnyPermission) {
        throw new AppError(400, 'At least one permission must be granted');
      }

      const permission = await userPermissionService.setPermissions(setData, req.user.userId);

      res.json({
        success: true,
        data: permission,
        message: 'Permissions set successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get permissions by role
   */
  getPermissionsByRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;

      const permissions = await userPermissionService.getPermissionsByRole(roleId);

      res.json({
        success: true,
        data: permissions,
        total: permissions.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get permissions by module
   */
  getPermissionsByModule: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const srModuleId = req.params.srModuleId as string;

      const permissions = await userPermissionService.getPermissionsByModule(srModuleId);

      res.json({
        success: true,
        data: permissions,
        total: permissions.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Check if role has specific permission
   */
  checkPermission: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const checkData: PermissionCheckDto = req.body;

      if (!checkData.roleId?.trim()) {
        throw new AppError(400, 'Role ID is required');
      }

      if (!checkData.srModuleId?.trim()) {
        throw new AppError(400, 'Module ID is required');
      }

      if (!checkData.permissionType?.trim()) {
        throw new AppError(400, 'Permission type is required');
      }

      const hasPermission = await userPermissionService.checkPermission(checkData);

      res.json({
        success: true,
        data: { hasPermission },
        message: hasPermission ? 'Permission granted' : 'Permission denied',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update permissions
   */
  bulkUpdatePermissions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const bulkData: BulkPermissionUpdateDto = req.body;

      if (
        !bulkData.permissionIds ||
        !Array.isArray(bulkData.permissionIds) ||
        bulkData.permissionIds.length === 0
      ) {
        throw new AppError(400, 'Permission IDs are required and must be a non-empty array');
      }

      // Validate that at least one update field is provided
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
      const hasUpdateField = updateFields.some(
        field => bulkData[field as keyof BulkPermissionUpdateDto] !== undefined
      );

      if (!hasUpdateField) {
        throw new AppError(400, 'At least one permission field must be provided for update');
      }

      const result = await userPermissionService.bulkUpdatePermissions(bulkData, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} permissions`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Copy permissions from one role to another
   */
  copyPermissions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const copyData: CopyPermissionsDto = req.body;

      if (!copyData.sourceRoleId?.trim()) {
        throw new AppError(400, 'Source Role ID is required');
      }

      if (!copyData.targetRoleId?.trim()) {
        throw new AppError(400, 'Target Role ID is required');
      }

      const result = await userPermissionService.copyPermissions(copyData, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Permissions copied: ${result.copied} copied, ${result.skipped} skipped`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get role permissions summary
   */
  getRolePermissionsSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;

      const summary = await userPermissionService.getRolePermissionsSummary(roleId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get module permissions summary
   */
  getModulePermissionsSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const srModuleId = req.params.srModuleId as string;

      const summary = await userPermissionService.getModulePermissionsSummary(srModuleId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get user permission statistics
   */
  getUserPermissionStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await userPermissionService.getUserPermissionStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get permission by role and module
   */
  getPermissionByRoleAndModule: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.query.roleId as string;
      const srModuleId = req.query.srModuleId as string;

      if (!roleId?.trim()) {
        throw new AppError(400, 'Role ID is required');
      }

      if (!srModuleId?.trim()) {
        throw new AppError(400, 'Module ID is required');
      }

      const permission = await userPermissionService.getPermissionByRoleAndModule(
        roleId,
        srModuleId
      );

      if (!permission) {
        throw new AppError(404, 'Permission not found');
      }

      res.json({
        success: true,
        data: permission,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Toggle permission active status
   */
  togglePermissionStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const updatedPermission = await userPermissionService.togglePermissionStatus(
        id,
        req.user.userId
      );

      if (!updatedPermission) {
        throw new AppError(404, 'Permission not found');
      }

      res.json({
        success: true,
        data: updatedPermission,
        message: `Permission ${updatedPermission.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Initialize default permissions
   */
  initializeDefaultPermissions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const result = await userPermissionService.initializeDefaultPermissions(req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Default permissions initialized: ${result.created} created, ${result.updated} updated`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get permissions map for a role
   */
  getRolePermissionsMap: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = req.params.roleId as string;

      const permissionsMap = await userPermissionService.getRolePermissionsMap(roleId);

      res.json({
        success: true,
        data: permissionsMap,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
