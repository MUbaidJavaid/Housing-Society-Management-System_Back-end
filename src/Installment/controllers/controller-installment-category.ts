import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { installmentCategoryService } from '../services/service-installment-category';
import {
  CreateInstallmentCategoryDto,
  InstallmentCategoryQueryParams,
  UpdateInstallmentCategoryDto,
} from '../types/types-installment-category';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const installmentCategoryController = {
  /**
   * Create new installment category
   */
  createCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateInstallmentCategoryDto = req.body;

      // Validate required fields
      if (!createData.instCatName) {
        throw new AppError(400, 'Category name is required');
      }

      if (!createData.sequenceOrder) {
        throw new AppError(400, 'Sequence order is required');
      }

      const category = await installmentCategoryService.createCategory(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Installment category created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get category by ID
   */
  getCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const category = await installmentCategoryService.getCategoryById(id);

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all categories
   */
  getCategories: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: InstallmentCategoryQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        isRefundable: req.query.isRefundable ? req.query.isRefundable === 'true' : undefined,
        isMandatory: req.query.isMandatory ? req.query.isMandatory === 'true' : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await installmentCategoryService.getCategories(queryParams);

      res.json({
        success: true,
        data: {
          categories: result.categories,
          pagination: result.pagination,
        },
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
      const categories = await installmentCategoryService.getActiveCategories();

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
   * Get mandatory categories
   */
  getMandatoryCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await installmentCategoryService.getMandatoryCategories();

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
   * Update category
   */
  updateCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateInstallmentCategoryDto = req.body;

      const updatedCategory = await installmentCategoryService.updateCategory(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedCategory) {
        throw new AppError(404, 'Installment category not found');
      }

      res.json({
        success: true,
        data: updatedCategory,
        message: 'Installment category updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete category (soft delete)
   */
  deleteCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await installmentCategoryService.deleteCategory(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Installment category not found');
      }

      res.json({
        success: true,
        message: 'Installment category deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get category statistics
   */
  getCategoryStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await installmentCategoryService.getCategoryStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Seed default categories
   */
  seedDefaultCategories: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const result = await installmentCategoryService.seedDefaultCategories(req.user.userId);

      res.json({
        success: true,
        data: result,
        message: 'Default categories seeded successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get category options for dropdown
   */
  getCategoryOptions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';

      const options = await installmentCategoryService.getCategoryOptions(includeInactive);

      res.json({
        success: true,
        data: options,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Validate sequence order
   */
  validateSequenceOrder: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sequenceOrder, excludeId } = req.query;

      if (!sequenceOrder || isNaN(Number(sequenceOrder))) {
        throw new AppError(400, 'Valid sequence order is required');
      }

      const validation = await installmentCategoryService.validateSequenceOrder(
        Number(sequenceOrder),
        excludeId as string
      );

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Reorder categories
   */
  reorderCategories: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { categoryOrders } = req.body;

      if (!categoryOrders || !Array.isArray(categoryOrders)) {
        throw new AppError(400, 'Category orders array is required');
      }

      const result = await installmentCategoryService.reorderCategories(
        categoryOrders,
        req.user.userId
      );

      res.json({
        success: true,
        data: { success: result },
        message: 'Categories reordered successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
