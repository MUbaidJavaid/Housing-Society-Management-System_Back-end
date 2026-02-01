import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { billTypeService } from '../services/service-bill-type';
import {
  BillTypeQueryParams,
  CalculateAmountParams,
  CreateBillTypeDto,
  UpdateBillTypeDto,
} from '../types/types-bill-type';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const billTypeController = {
  /**
   * Create new bill type
   */
  createBillType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateBillTypeDto = req.body;

      // Validate required fields
      if (!createData.billTypeName?.trim()) {
        throw new AppError(400, 'Bill type name is required');
      }

      if (!createData.billTypeCategory) {
        throw new AppError(400, 'Bill type category is required');
      }

      if (createData.isRecurring === undefined) {
        throw new AppError(400, 'Is recurring flag is required');
      }

      const billType = await billTypeService.createBillType(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: billType,
        message: 'Bill type created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bill type by ID
   */
  getBillType: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const billType = await billTypeService.getBillTypeById(id);

      res.json({
        success: true,
        data: billType,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bill type by name
   */
  getBillTypeByName: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const name = req.params.name as string;

      const billType = await billTypeService.getBillTypeByName(name);

      if (!billType) {
        throw new AppError(404, 'Bill type not found');
      }

      res.json({
        success: true,
        data: billType,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all bill types
   */
  getBillTypes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: BillTypeQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        category: req.query.category as any,
        isRecurring: req.query.isRecurring ? req.query.isRecurring === 'true' : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await billTypeService.getBillTypes(queryParams);

      res.json({
        success: true,
        data: {
          billTypes: result.billTypes,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update bill type
   */
  updateBillType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateBillTypeDto = req.body;

      const updatedBillType = await billTypeService.updateBillType(id, updateData, req.user.userId);

      if (!updatedBillType) {
        throw new AppError(404, 'Bill type not found');
      }

      res.json({
        success: true,
        data: updatedBillType,
        message: 'Bill type updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete bill type (soft delete)
   */
  deleteBillType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await billTypeService.deleteBillType(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Bill type not found');
      }

      res.json({
        success: true,
        message: 'Bill type deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active bill types
   */
  getActiveBillTypes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = req.query.category as string;

      const billTypes = await billTypeService.getActiveBillTypes(category);

      res.json({
        success: true,
        data: billTypes,
        total: billTypes.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get recurring bill types
   */
  getRecurringBillTypes: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const billTypes = await billTypeService.getRecurringBillTypes();

      res.json({
        success: true,
        data: billTypes,
        total: billTypes.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Calculate amount for bill type
   */
  calculateAmount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params: CalculateAmountParams = {
        billTypeId: req.params.billTypeId as string,
        units: req.query.units ? parseFloat(req.query.units as string) : undefined,
        baseAmount: req.query.baseAmount ? parseFloat(req.query.baseAmount as string) : undefined,
        applyTax: req.query.applyTax ? req.query.applyTax === 'true' : true,
      };

      const result = await billTypeService.calculateAmount(params);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bill type statistics
   */
  getBillTypeStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await billTypeService.getBillTypeStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search bill types
   */
  searchBillTypes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError(400, 'Search term must be at least 2 characters');
      }

      const billTypes = await billTypeService.searchBillTypes(searchTerm, limit);

      res.json({
        success: true,
        data: billTypes,
        total: billTypes.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update bill type status
   */
  bulkUpdateStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { billTypeIds, isActive } = req.body;

      if (!billTypeIds || !Array.isArray(billTypeIds) || billTypeIds.length === 0) {
        throw new AppError(400, 'Bill type IDs are required and must be a non-empty array');
      }

      if (isActive === undefined) {
        throw new AppError(400, 'Status is required');
      }

      const result = await billTypeService.bulkUpdateStatus(billTypeIds, isActive, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} bill types`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bill types by category
   */
  getBillTypesByCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = req.params.category as any;

      const billTypes = await billTypeService.getBillTypesByCategory(category);

      res.json({
        success: true,
        data: billTypes,
        total: billTypes.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Validate bill type configuration
   */
  validateConfiguration: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const validation = await billTypeService.validateBillTypeConfiguration(id);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bill types for dropdown (simplified)
   */
  getBillTypesDropdown: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = req.query.category as string;
      const isRecurring = req.query.isRecurring ? req.query.isRecurring === 'true' : undefined;

      const query: any = {
        isActive: true,
        isDeleted: false,
      };

      if (category) {
        query.billTypeCategory = category;
      }

      if (isRecurring !== undefined) {
        query.isRecurring = isRecurring;
      }

      const billTypes = await billTypeService.getActiveBillTypes(category);

      const dropdown = billTypes.map(billType => ({
        value: billType._id,
        label: billType.billTypeName,
        category: billType.billTypeCategory,
        isRecurring: billType.isRecurring,
        defaultAmount: billType.defaultAmount,
      }));

      res.json({
        success: true,
        data: dropdown,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
