import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { plotCategoryService } from '../index-plotcategory';
import {
  BulkPriceCalculationDto,
  CreatePlotCategoryDto,
  PlotCategoryQueryParams,
  PriceCalculationDto,
} from '../types/types-plotcategory';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const plotCategoryController = {
  /**
   * Create new plot category
   */
  createPlotCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreatePlotCategoryDto = req.body;

      // Validate required fields
      if (!createData.categoryName?.trim()) {
        throw new AppError(400, 'Category Name is required');
      }

      // Validate surcharge exclusivity
      if (createData.surchargePercentage && createData.surchargeFixedAmount) {
        throw new AppError(400, 'Cannot have both percentage and fixed amount surcharge');
      }

      // Validate percentage range
      if (
        createData.surchargePercentage &&
        (createData.surchargePercentage < 0 || createData.surchargePercentage > 100)
      ) {
        throw new AppError(400, 'Surcharge percentage must be between 0 and 100');
      }

      // Validate fixed amount
      if (createData.surchargeFixedAmount && createData.surchargeFixedAmount < 0) {
        throw new AppError(400, 'Surcharge fixed amount cannot be negative');
      }

      // Check if category already exists
      const exists = await plotCategoryService.checkPlotCategoryExists(createData.categoryName);
      if (exists) {
        throw new AppError(409, 'Plot Category with this name already exists');
      }

      const plotCategory = await plotCategoryService.createPlotCategory(
        createData,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: plotCategory,
        message: 'Plot Category created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get plot category by ID
   */
  getPlotCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const plotCategory = await plotCategoryService.getPlotCategoryById(id);

      if (!plotCategory || (plotCategory as any).isDeleted) {
        throw new AppError(404, 'Plot Category not found');
      }

      res.json({
        success: true,
        data: plotCategory,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all plot categories
   */
  getPlotCategories: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: PlotCategoryQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        surchargeType: req.query.surchargeType as 'percentage' | 'fixed' | 'none',
      };

      const result = await plotCategoryService.getPlotCategories(queryParams);

      res.json({
        success: true,
        data: {
          plotCategories: result.plotCategories,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update plot category
   */
  updatePlotCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      // Check if plot category exists
      const existingCategory = await plotCategoryService.getPlotCategoryById(id);
      if (!existingCategory || (existingCategory as any).isDeleted) {
        throw new AppError(404, 'Plot Category not found');
      }

      // Validate surcharge exclusivity
      if (updateData.surchargePercentage && updateData.surchargeFixedAmount) {
        throw new AppError(400, 'Cannot have both percentage and fixed amount surcharge');
      }

      // Validate percentage range
      if (
        updateData.surchargePercentage !== undefined &&
        (updateData.surchargePercentage < 0 || updateData.surchargePercentage > 100)
      ) {
        throw new AppError(400, 'Surcharge percentage must be between 0 and 100');
      }

      // Validate fixed amount
      if (updateData.surchargeFixedAmount !== undefined && updateData.surchargeFixedAmount < 0) {
        throw new AppError(400, 'Surcharge fixed amount cannot be negative');
      }

      // Check if new name already exists
      if (updateData.categoryName && updateData.categoryName !== existingCategory.categoryName) {
        const exists = await plotCategoryService.checkPlotCategoryExists(
          updateData.categoryName,
          id
        );
        if (exists) {
          throw new AppError(409, 'Plot Category with this name already exists');
        }
      }

      const updatedPlotCategory = await plotCategoryService.updatePlotCategory(
        id,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedPlotCategory,
        message: 'Plot Category updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete plot category
   */
  deletePlotCategory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      // Check if plot category exists
      const existingCategory = await plotCategoryService.getPlotCategoryById(id);
      if (!existingCategory || (existingCategory as any).isDeleted) {
        throw new AppError(404, 'Plot Category not found');
      }

      const deleted = await plotCategoryService.deletePlotCategory(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Plot Category');
      }

      res.json({
        success: true,
        message: 'Plot Category deleted successfully',
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

      const updatedCategory = await plotCategoryService.toggleCategoryStatus(id, req.user.userId);

      if (!updatedCategory) {
        throw new AppError(404, 'Plot Category not found');
      }

      res.json({
        success: true,
        data: updatedCategory,
        message: `Plot Category ${updatedCategory.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active plot categories
   */
  getActivePlotCategories: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plotCategories = await plotCategoryService.getActivePlotCategories();

      res.json({
        success: true,
        data: plotCategories,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Calculate price with surcharge
   */
  calculatePriceWithSurcharge: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const calculationData: PriceCalculationDto = req.body;

      if (!calculationData.basePrice || calculationData.basePrice <= 0) {
        throw new AppError(400, 'Valid base price is required');
      }

      if (!calculationData.categoryId) {
        throw new AppError(400, 'Category ID is required');
      }

      const surchargeInfo = await plotCategoryService.calculatePriceWithSurcharge(calculationData);

      res.json({
        success: true,
        data: {
          basePrice: calculationData.basePrice,
          categoryId: calculationData.categoryId,
          surchargeInfo,
          calculation: `Base Price: ${calculationData.basePrice} + Surcharge: ${surchargeInfo.surchargeAmount} = Final Price: ${surchargeInfo.finalPrice}`,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Calculate prices for multiple categories
   */
  calculateBulkPrices: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const calculationData: BulkPriceCalculationDto = req.body;

      if (!calculationData.basePrice || calculationData.basePrice <= 0) {
        throw new AppError(400, 'Valid base price is required');
      }

      if (!calculationData.categoryIds || calculationData.categoryIds.length === 0) {
        throw new AppError(400, 'At least one category ID is required');
      }

      const results = await plotCategoryService.calculateBulkPrices(calculationData);

      res.json({
        success: true,
        data: {
          basePrice: calculationData.basePrice,
          calculations: results,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get categories by surcharge type
   */
  getCategoriesBySurchargeType: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.params.type as 'percentage' | 'fixed' | 'none';

      if (!['percentage', 'fixed', 'none'].includes(type)) {
        throw new AppError(400, 'Invalid surcharge type');
      }

      const plotCategories = await plotCategoryService.getCategoriesBySurchargeType(type);

      res.json({
        success: true,
        data: plotCategories,
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
      const statistics = await plotCategoryService.getCategoryStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update surcharge for multiple categories
   */
  bulkUpdateSurcharge: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { categoryIds, surchargePercentage, surchargeFixedAmount } = req.body;

      if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError(400, 'At least one category ID is required');
      }

      if (surchargePercentage && surchargeFixedAmount) {
        throw new AppError(400, 'Cannot set both percentage and fixed amount surcharge');
      }

      if (
        surchargePercentage !== undefined &&
        (surchargePercentage < 0 || surchargePercentage > 100)
      ) {
        throw new AppError(400, 'Surcharge percentage must be between 0 and 100');
      }

      if (surchargeFixedAmount !== undefined && surchargeFixedAmount < 0) {
        throw new AppError(400, 'Surcharge fixed amount cannot be negative');
      }

      const result = await plotCategoryService.bulkUpdateSurcharge(
        categoryIds,
        req.user.userId,
        surchargePercentage,
        surchargeFixedAmount
      );

      res.json({
        success: true,
        data: result,
        message: 'Surcharge updated for selected categories',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
