import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';

import { srModuleService } from '../index-srmodule';
import {
  BulkStatusUpdateDto,
  CreateSrModuleDto,
  SrModuleQueryParams,
} from '../types/types-srmodule';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const srModuleController = {
  /**
   * Create new module
   */
  createSrModule: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateSrModuleDto = req.body;

      // Validate required fields
      if (!createData.moduleName?.trim()) {
        throw new AppError(400, 'Module Name is required');
      }

      if (!createData.moduleCode?.trim()) {
        throw new AppError(400, 'Module Code is required');
      }

      // Validate module code format
      if (!/^[A-Z0-9_]+$/.test(createData.moduleCode.toUpperCase())) {
        throw new AppError(
          400,
          'Module Code must contain only uppercase letters, numbers, and underscores'
        );
      }

      const module = await srModuleService.createSrModule(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: module,
        message: 'Module created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get module by ID
   */
  getSrModule: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const module = await srModuleService.getModuleById(id);

      if (!module || module.isDeleted) {
        throw new AppError(404, 'Module not found');
      }

      res.json({
        success: true,
        data: module,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get module by code
   */
  getSrModuleByCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;

      const module = await srModuleService.getModuleByCode(code);

      if (!module) {
        throw new AppError(404, 'Module not found');
      }

      res.json({
        success: true,
        data: module,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all modules
   */
  getSrModules: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: SrModuleQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        parentModuleId: req.query.parentModuleId as string,
        isDefault: req.query.isDefault ? req.query.isDefault === 'true' : undefined,
      };

      const result = await srModuleService.getSrModules(queryParams);

      res.json({
        success: true,
        data: {
          modules: result.modules,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update module
   */
  updateSrModule: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      // Check if module exists
      const existingModule = await srModuleService.getModuleById(id);
      if (!existingModule || existingModule.isDeleted) {
        throw new AppError(404, 'Module not found');
      }

      // Validate module code if provided
      if (updateData.moduleCode && !/^[A-Z0-9_]+$/.test(updateData.moduleCode.toUpperCase())) {
        throw new AppError(
          400,
          'Module Code must contain only uppercase letters, numbers, and underscores'
        );
      }

      const updatedModule = await srModuleService.updateSrModule(id, updateData, req.user.userId);

      res.json({
        success: true,
        data: updatedModule,
        message: 'Module updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete module
   */
  deleteSrModule: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await srModuleService.deleteSrModule(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Module not found');
      }

      res.json({
        success: true,
        message: 'Module deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Toggle module active status
   */
  toggleModuleStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const updatedModule = await srModuleService.toggleModuleStatus(id, req.user.userId);

      if (!updatedModule) {
        throw new AppError(404, 'Module not found');
      }

      res.json({
        success: true,
        data: updatedModule,
        message: `Module ${updatedModule.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active modules
   */
  getActiveSrModules: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const modules = await srModuleService.getActiveSrModules();

      res.json({
        success: true,
        data: modules,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get sidebar modules
   */
  getSidebarModules: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const modules = await srModuleService.getSidebarModules();

      res.json({
        success: true,
        data: modules,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get modules for dropdown
   */
  getModulesForDropdown: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeSubmodules = req.query.includeSubmodules === 'true';
      const modules = await srModuleService.getModulesForDropdown(includeSubmodules);

      res.json({
        success: true,
        data: modules,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get default modules
   */
  getDefaultModules: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const modules = await srModuleService.getDefaultModules();

      res.json({
        success: true,
        data: modules,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get submodules by parent
   */
  getSubmodulesByParent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parentModuleId = req.params.parentModuleId as string;

      const modules = await srModuleService.getSubmodulesByParent(parentModuleId);

      res.json({
        success: true,
        data: modules,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update module statuses
   */
  bulkUpdateModuleStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const bulkData: BulkStatusUpdateDto = req.body;

      if (
        !bulkData.moduleIds ||
        !Array.isArray(bulkData.moduleIds) ||
        bulkData.moduleIds.length === 0
      ) {
        throw new AppError(400, 'Module IDs are required and must be a non-empty array');
      }

      if (typeof bulkData.isActive !== 'boolean') {
        throw new AppError(400, 'isActive must be a boolean value');
      }

      const result = await srModuleService.bulkUpdateModuleStatus(bulkData, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} modules`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get module statistics
   */
  getSrModuleStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await srModuleService.getSrModuleStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search modules
   */
  searchModules: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { searchTerm, isActive, isDefault, hasParent } = req.query;

      const modules = await srModuleService.searchModules(
        searchTerm as string,
        isActive ? isActive === 'true' : undefined,
        isDefault ? isDefault === 'true' : undefined,
        hasParent ? hasParent === 'true' : undefined
      );

      res.json({
        success: true,
        data: modules,
        total: modules.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Import multiple modules
   */
  importModules: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const modules: CreateSrModuleDto[] = req.body;

      if (!Array.isArray(modules) || modules.length === 0) {
        throw new AppError(400, 'Modules must be a non-empty array');
      }

      const result = await srModuleService.importModules(modules, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully imported ${result.success} modules, ${result.failed} failed`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get modules by permission
   */
  getModulesByPermission: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { permission } = req.params;

      if (!permission?.trim()) {
        throw new AppError(400, 'Permission is required');
      }

      const modules = await srModuleService.getModulesByPermission(permission);

      res.json({
        success: true,
        data: modules,
        total: modules.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update module permissions
   */
  updateModulePermissions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        throw new AppError(400, 'Permissions must be an array');
      }

      const module = await srModuleService.updateModulePermissions(
        id,
        permissions,
        req.user.userId
      );

      if (!module) {
        throw new AppError(404, 'Module not found');
      }

      res.json({
        success: true,
        data: module,
        message: 'Module permissions updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get module hierarchy
   */
  getModuleHierarchy: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const hierarchy = await srModuleService.getModuleHierarchy();

      res.json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Reorder modules
   */
  reorderModules: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { moduleOrders } = req.body;

      if (!Array.isArray(moduleOrders) || moduleOrders.length === 0) {
        throw new AppError(400, 'Module orders must be a non-empty array');
      }

      const result = await srModuleService.reorderModules(moduleOrders, req.user.userId);

      if (!result) {
        throw new AppError(500, 'Failed to reorder modules');
      }

      res.json({
        success: true,
        message: 'Modules reordered successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Set module default status
   */
  setModuleDefaultStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { isDefault } = req.body;

      if (typeof isDefault !== 'boolean') {
        throw new AppError(400, 'isDefault must be a boolean value');
      }

      const module = await srModuleService.setModuleDefaultStatus(id, isDefault, req.user.userId);

      if (!module) {
        throw new AppError(404, 'Module not found');
      }

      res.json({
        success: true,
        data: module,
        message: `Module marked as ${isDefault ? 'default' : 'non-default'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Initialize default modules
   */
  initializeDefaultModules: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const result = await srModuleService.initializeDefaultModules(req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Default modules initialized: ${result.created} created, ${result.updated} updated`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
