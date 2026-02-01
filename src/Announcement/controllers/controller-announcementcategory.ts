import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { announcementCategoryService } from '../index-announcementcategory';
import {
  AnnouncementCategoryQueryParams,
  CreateAnnouncementCategoryDto,
  UpdateAnnouncementCategoryDto,
} from '../types/types-announcementcategory';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const announcementCategoryController = {
  /**
   * Create new announcement category
   */
  createAnnouncementCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateAnnouncementCategoryDto = req.body;

      // Validate required fields
      if (!createData.categoryName?.trim()) {
        throw new AppError(400, 'Category name is required');
      }

      // Check if category name already exists
      const existingCategory = await announcementCategoryService.findCategoryByName(
        createData.categoryName
      );
      if (existingCategory) {
        throw new AppError(409, 'Category name already exists');
      }

      const category = await announcementCategoryService.createAnnouncementCategory(
        createData,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get announcement category by ID
   */
  getAnnouncementCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const category = await announcementCategoryService.getAnnouncementCategoryById(id);

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all announcement categories
   */
  getAnnouncementCategories: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: AnnouncementCategoryQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await announcementCategoryService.getAnnouncementCategories(queryParams);

      res.json({
        success: true,
        data: {
          announcementCategories: result.announcementCategories,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update announcement category
   */
  updateAnnouncementCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateAnnouncementCategoryDto = req.body;

      // Check if category name is being changed and if it already exists
      if (updateData.categoryName) {
        const existingCategory = await announcementCategoryService.findCategoryByName(
          updateData.categoryName
        );
        if (existingCategory && existingCategory._id.toString() !== id) {
          throw new AppError(409, 'Category name already exists');
        }
      }

      const updatedCategory = await announcementCategoryService.updateAnnouncementCategory(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedCategory) {
        throw new AppError(404, 'Category not found');
      }

      res.json({
        success: true,
        data: updatedCategory,
        message: 'Category updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete announcement category
   */
  deleteAnnouncementCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      // Check if category is being used by announcements
      const isCategoryInUse = await announcementCategoryService.isCategoryUsedByAnnouncements(id);
      if (isCategoryInUse) {
        throw new AppError(400, 'Cannot delete category that is assigned to announcements');
      }

      const deleted = await announcementCategoryService.deleteAnnouncementCategory(
        id,
        req.user.userId
      );

      if (!deleted) {
        throw new AppError(404, 'Category not found');
      }

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active categories
   */
  getActiveCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await announcementCategoryService.getActiveCategories();

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
   * Get category by name
   */
  getCategoryByName: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryName = req.params.categoryName as string;

      const category = await announcementCategoryService.getCategoryByName(categoryName);

      if (!category) {
        throw new AppError(404, 'Category not found');
      }

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update categories
   */
  bulkUpdateCategories: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { categoryIds, isActive } = req.body;

      if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError(400, 'Category IDs are required and must be a non-empty array');
      }

      if (isActive === undefined) {
        throw new AppError(400, 'isActive field is required');
      }

      const result = await announcementCategoryService.bulkUpdateCategories(
        categoryIds,
        isActive,
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
   * Toggle category status
   */
  toggleCategoryStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const updatedCategory = await announcementCategoryService.toggleCategoryStatus(
        id,
        req.user.userId
      );

      if (!updatedCategory) {
        throw new AppError(404, 'Category not found');
      }

      res.json({
        success: true,
        data: updatedCategory,
        message: `Category ${updatedCategory.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get category statistics
   */
  getAnnouncementCategoryStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await announcementCategoryService.getAnnouncementCategoryStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search categories
   */
  searchCategories: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.search as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm?.trim()) {
        throw new AppError(400, 'Search term is required');
      }

      const categories = await announcementCategoryService.searchCategories(searchTerm, limit);

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
   * Get categories with announcement count
   */
  getCategoriesWithAnnouncementCount: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await announcementCategoryService.getCategoriesWithAnnouncementCount();

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
   * Initialize default categories
   */
  initializeDefaultCategories: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const result = await announcementCategoryService.initializeDefaultCategories(req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Default categories initialized: ${result.created} created, ${result.updated} updated`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
