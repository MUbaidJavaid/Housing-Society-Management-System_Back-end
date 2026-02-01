import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { srTransferTypeService } from '../services/service-transfer-type';
import {
  CreateSrTransferTypeDto,
  FeeCalculationParams,
  SrTransferTypeQueryParams,
  UpdateSrTransferTypeDto,
} from '../types/types-transfer-type';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const srTransferTypeController = {
  /**
   * Create new transfer type
   */
  createTransferType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateSrTransferTypeDto = req.body;

      // Validate required fields
      if (!createData.typeName?.trim()) {
        throw new AppError(400, 'Type name is required');
      }

      if (createData.transferFee === undefined || createData.transferFee < 0) {
        throw new AppError(400, 'Valid transfer fee is required');
      }

      const transferType = await srTransferTypeService.createTransferType(
        createData,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: transferType,
        message: 'Transfer type created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfer type by ID
   */
  getTransferType: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const transferType = await srTransferTypeService.getTransferTypeById(id);

      res.json({
        success: true,
        data: transferType,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfer type by name
   */
  getTransferTypeByName: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const name = req.params.name as string;

      const transferType = await srTransferTypeService.getTransferTypeByName(name);

      if (!transferType) {
        throw new AppError(404, 'Transfer type not found');
      }

      res.json({
        success: true,
        data: transferType,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all transfer types
   */
  getTransferTypes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: SrTransferTypeQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
        minFee: req.query.minFee ? parseFloat(req.query.minFee as string) : undefined,
        maxFee: req.query.maxFee ? parseFloat(req.query.maxFee as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await srTransferTypeService.getTransferTypes(queryParams);

      res.json({
        success: true,
        data: {
          transferTypes: result.transferTypes,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update transfer type
   */
  updateTransferType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateSrTransferTypeDto = req.body;

      const updatedTransferType = await srTransferTypeService.updateTransferType(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedTransferType) {
        throw new AppError(404, 'Transfer type not found');
      }

      res.json({
        success: true,
        data: updatedTransferType,
        message: 'Transfer type updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete transfer type (soft delete)
   */
  deleteTransferType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await srTransferTypeService.deleteTransferType(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Transfer type not found');
      }

      res.json({
        success: true,
        message: 'Transfer type deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active transfer types
   */
  getActiveTransferTypes: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const transferTypes = await srTransferTypeService.getActiveTransferTypes();

      res.json({
        success: true,
        data: transferTypes,
        total: transferTypes.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Calculate transfer fee
   */
  calculateFee: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params: FeeCalculationParams = {
        transferTypeId: req.params.transferTypeId as string,
        propertyValue: req.query.propertyValue
          ? parseFloat(req.query.propertyValue as string)
          : undefined,
        applyDiscount: req.query.applyDiscount ? req.query.applyDiscount === 'true' : false,
        discountPercentage: req.query.discountPercentage
          ? parseFloat(req.query.discountPercentage as string)
          : undefined,
      };

      const result = await srTransferTypeService.calculateFee(params);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfer type statistics
   */
  getTransferTypeStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await srTransferTypeService.getTransferTypeStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfer type summary for dashboard
   */
  getTransferTypeSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await srTransferTypeService.getTransferTypeSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search transfer types
   */
  searchTransferTypes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError(400, 'Search term must be at least 2 characters');
      }

      const transferTypes = await srTransferTypeService.searchTransferTypes(searchTerm, limit);

      res.json({
        success: true,
        data: transferTypes,
        total: transferTypes.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update transfer type status
   */
  bulkUpdateStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { transferTypeIds, isActive } = req.body;

      if (!transferTypeIds || !Array.isArray(transferTypeIds) || transferTypeIds.length === 0) {
        throw new AppError(400, 'Transfer type IDs are required and must be a non-empty array');
      }

      if (isActive === undefined) {
        throw new AppError(400, 'Status is required');
      }

      const result = await srTransferTypeService.bulkUpdateStatus(
        transferTypeIds,
        isActive,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} transfer types`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Validate transfer type configuration
   */
  validateConfiguration: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const validation = await srTransferTypeService.validateTransferTypeConfiguration(id);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfer types dropdown
   */
  getTransferTypesDropdown: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const dropdown = await srTransferTypeService.getTransferTypesDropdown();

      res.json({
        success: true,
        data: dropdown,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update transfer fees by percentage
   */
  updateFeesByPercentage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { percentage } = req.body;

      if (percentage === undefined || typeof percentage !== 'number') {
        throw new AppError(400, 'Percentage is required and must be a number');
      }

      if (percentage < -100 || percentage > 100) {
        throw new AppError(400, 'Percentage must be between -100 and 100');
      }

      const result = await srTransferTypeService.updateFeesByPercentage(
        percentage,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: `Updated fees for ${result.updated} transfer types. New average fee: Rs. ${result.averageFee.toFixed(2)}`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get common transfer types (predefined)
   */
  getCommonTransferTypes: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const commonTypes = [
        {
          name: 'Sale',
          description: 'Transfer of property through sale/purchase agreement',
          typicalFee: 50000,
          requiresDocuments: ['Sale Agreement', 'Property Documents', 'NOC'],
        },
        {
          name: 'Resale',
          description: 'Secondary sale of already transferred property',
          typicalFee: 35000,
          requiresDocuments: ['Previous Sale Deed', 'Property Documents', 'NOC'],
        },
        {
          name: 'Gift/Hiba',
          description: 'Transfer of property as a gift without consideration',
          typicalFee: 25000,
          requiresDocuments: ['Gift Deed', 'Property Documents', 'Affidavit'],
        },
        {
          name: 'Legal Heir/Inheritance',
          description: 'Transfer to legal heirs after death of owner',
          typicalFee: 15000,
          requiresDocuments: [
            'Death Certificate',
            'Succession Certificate',
            'Legal Heir Certificate',
          ],
        },
        {
          name: 'Partition',
          description: 'Division of property among co-owners',
          typicalFee: 30000,
          requiresDocuments: ['Partition Deed', 'Property Documents', 'Consent Letters'],
        },
        {
          name: 'Mortgage',
          description: 'Transfer as security for loan/credit',
          typicalFee: 20000,
          requiresDocuments: ['Mortgage Deed', 'Property Documents', 'Loan Agreement'],
        },
      ];

      res.json({
        success: true,
        data: commonTypes,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
