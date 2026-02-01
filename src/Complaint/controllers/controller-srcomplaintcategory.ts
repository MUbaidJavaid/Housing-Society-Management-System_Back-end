import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { srComplaintCategoryService } from '../index-srcomplaintcategory';
import {
  BulkStatusUpdateDto,
  CreateSrComplaintCategoryDto,
  SrComplaintCategoryQueryParams,
} from '../types/types-srcomplaintcategory';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const srComplaintCategoryController = {
  /**
   * Create new complaint category
   */
  createSrComplaintCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateSrComplaintCategoryDto = req.body;

      // Validate required fields
      if (!createData.categoryName?.trim()) {
        throw new AppError(400, 'Category Name is required');
      }

      if (!createData.categoryCode?.trim()) {
        throw new AppError(400, 'Category Code is required');
      }

      // Validate priority level
      if (
        createData.priorityLevel &&
        (createData.priorityLevel < 1 || createData.priorityLevel > 10)
      ) {
        throw new AppError(400, 'Priority Level must be between 1 and 10');
      }

      // Validate SLA hours
      if (createData.slaHours && createData.slaHours < 1) {
        throw new AppError(400, 'SLA Hours must be at least 1');
      }

      // Validate escalation levels if provided
      if (createData.escalationLevels) {
        for (const [index, level] of createData.escalationLevels.entries()) {
          if (level.level < 1 || level.level > 5) {
            throw new AppError(400, `Escalation level ${index + 1}: Level must be between 1 and 5`);
          }
          if (!level.role?.trim()) {
            throw new AppError(400, `Escalation level ${index + 1}: Role is required`);
          }
          if (level.hoursAfterCreation < 1) {
            throw new AppError(400, `Escalation level ${index + 1}: Hours must be at least 1`);
          }
        }
      }

      const complaintCategory = await srComplaintCategoryService.createSrComplaintCategory(
        createData,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: complaintCategory,
        message: 'Complaint Category created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get complaint category by ID
   */
  getSrComplaintCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const complaintCategory = await srComplaintCategoryService.getSrComplaintCategoryById(id);

      if (!complaintCategory || (complaintCategory as any).isDeleted) {
        throw new AppError(404, 'Complaint Category not found');
      }

      res.json({
        success: true,
        data: complaintCategory,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get complaint category by code
   */
  getSrComplaintCategoryByCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;

      const complaintCategory = await srComplaintCategoryService.getSrComplaintCategoryByCode(code);

      if (!complaintCategory) {
        throw new AppError(404, 'Complaint Category not found');
      }

      res.json({
        success: true,
        data: complaintCategory,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all complaint categories
   */
  getSrComplaintCategories: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: SrComplaintCategoryQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        minPriority: req.query.minPriority ? parseInt(req.query.minPriority as string) : undefined,
        maxPriority: req.query.maxPriority ? parseInt(req.query.maxPriority as string) : undefined,
      };

      const result = await srComplaintCategoryService.getSrComplaintCategories(queryParams);

      res.json({
        success: true,
        data: {
          complaintCategories: result.complaintCategories,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update complaint category
   */
  updateSrComplaintCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      // Check if complaint category exists
      const existingCategory = await srComplaintCategoryService.getSrComplaintCategoryById(id);
      if (!existingCategory || (existingCategory as any).isDeleted) {
        throw new AppError(404, 'Complaint Category not found');
      }

      // Validate priority level if provided
      if (
        updateData.priorityLevel &&
        (updateData.priorityLevel < 1 || updateData.priorityLevel > 10)
      ) {
        throw new AppError(400, 'Priority Level must be between 1 and 10');
      }

      // Validate SLA hours if provided
      if (updateData.slaHours && updateData.slaHours < 1) {
        throw new AppError(400, 'SLA Hours must be at least 1');
      }

      const updatedCategory = await srComplaintCategoryService.updateSrComplaintCategory(
        id,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedCategory,
        message: 'Complaint Category updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete complaint category
   */
  deleteSrComplaintCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      // Check if complaint category exists
      const existingCategory = await srComplaintCategoryService.getSrComplaintCategoryById(id);
      if (!existingCategory || (existingCategory as any).isDeleted) {
        throw new AppError(404, 'Complaint Category not found');
      }

      const deleted = await srComplaintCategoryService.deleteSrComplaintCategory(
        id,
        req.user.userId
      );

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Complaint Category');
      }

      res.json({
        success: true,
        message: 'Complaint Category deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Toggle category active status
   */
  toggleCategoryStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const updatedCategory = await srComplaintCategoryService.toggleCategoryStatus(
        id,
        req.user.userId
      );

      if (!updatedCategory) {
        throw new AppError(404, 'Complaint Category not found');
      }

      res.json({
        success: true,
        data: updatedCategory,
        message: `Complaint Category ${updatedCategory.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active complaint categories
   */
  getActiveSrComplaintCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const complaintCategories = await srComplaintCategoryService.getActiveSrComplaintCategories();

      res.json({
        success: true,
        data: complaintCategories,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get high priority categories
   */
  getHighPriorityCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const complaintCategories = await srComplaintCategoryService.getHighPriorityCategories();

      res.json({
        success: true,
        data: complaintCategories,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get urgent SLA categories
   */
  getUrgentSlaCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const complaintCategories = await srComplaintCategoryService.getUrgentSlaCategories();

      res.json({
        success: true,
        data: complaintCategories,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update category statuses
   */
  bulkUpdateCategoryStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const bulkData: BulkStatusUpdateDto = req.body;

      if (
        !bulkData.categoryIds ||
        !Array.isArray(bulkData.categoryIds) ||
        bulkData.categoryIds.length === 0
      ) {
        throw new AppError(400, 'Category IDs are required and must be a non-empty array');
      }

      if (typeof bulkData.isActive !== 'boolean') {
        throw new AppError(400, 'isActive must be a boolean value');
      }

      const result = await srComplaintCategoryService.bulkUpdateCategoryStatus(
        bulkData,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} categories`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get complaint category statistics
   */
  getSrComplaintCategoryStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await srComplaintCategoryService.getSrComplaintCategoryStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get categories for dropdown
   */
  getCategoriesForDropdown: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await srComplaintCategoryService.getCategoriesForDropdown();

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search categories with advanced filters
   */
  searchCategories: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { searchTerm, isActive, minPriority, maxPriority, minSlaHours, maxSlaHours } =
        req.query;

      const categories = await srComplaintCategoryService.searchCategories(
        searchTerm as string,
        isActive ? isActive === 'true' : undefined,
        minPriority ? parseInt(minPriority as string) : undefined,
        maxPriority ? parseInt(maxPriority as string) : undefined,
        minSlaHours ? parseInt(minSlaHours as string) : undefined,
        maxSlaHours ? parseInt(maxSlaHours as string) : undefined
      );

      res.json({
        success: true,
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Import multiple categories
   */
  importCategories: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const categories: CreateSrComplaintCategoryDto[] = req.body;

      if (!Array.isArray(categories) || categories.length === 0) {
        throw new AppError(400, 'Categories must be a non-empty array');
      }

      const result = await srComplaintCategoryService.importCategories(categories, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully imported ${result.success} categories, ${result.failed} failed`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get categories by priority range
   */
  getCategoriesByPriority: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { min, max } = req.query;

      const minPriority = min ? parseInt(min as string) : 1;
      const maxPriority = max ? parseInt(max as string) : 10;

      if (minPriority < 1 || minPriority > 10 || maxPriority < 1 || maxPriority > 10) {
        throw new AppError(400, 'Priority must be between 1 and 10');
      }

      if (minPriority > maxPriority) {
        throw new AppError(400, 'Minimum priority cannot be greater than maximum priority');
      }

      const categories = await srComplaintCategoryService.getCategoriesByPriority(
        minPriority,
        maxPriority
      );

      res.json({
        success: true,
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
