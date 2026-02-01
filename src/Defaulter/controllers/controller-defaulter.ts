import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { defaulterService } from '../services/service-defaulter';
import {
  CreateDefaulterDto,
  DefaulterQueryParams,
  ResolveDefaulterDto,
  SendNoticeDto,
  UpdateDefaulterDto,
} from '../types/types-defaulter';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const defaulterController = {
  /**
   * Create new defaulter record
   */
  createDefaulter: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateDefaulterDto = req.body;

      // Validate required fields
      if (!createData.memId?.trim()) {
        throw new AppError(400, 'Member ID is required');
      }

      if (!createData.plotId?.trim()) {
        throw new AppError(400, 'Plot ID is required');
      }

      if (!createData.fileId?.trim()) {
        throw new AppError(400, 'File ID is required');
      }

      if (createData.totalOverdueAmount === undefined || createData.totalOverdueAmount < 0) {
        throw new AppError(400, 'Valid overdue amount is required');
      }

      const defaulter = await defaulterService.createDefaulter(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: defaulter,
        message: 'Defaulter record created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get defaulter by ID
   */
  getDefaulter: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const defaulter = await defaulterService.getDefaulterById(id);

      res.json({
        success: true,
        data: defaulter,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all defaulters
   */
  getDefaulters: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: DefaulterQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        memId: req.query.memId as string,
        plotId: req.query.plotId as string,
        fileId: req.query.fileId as string,
        status: req.query.status as any,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        minDays: req.query.minDays ? parseInt(req.query.minDays as string) : undefined,
        maxDays: req.query.maxDays ? parseInt(req.query.maxDays as string) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await defaulterService.getDefaulters(queryParams);

      res.json({
        success: true,
        data: {
          defaulters: result.defaulters,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update defaulter
   */
  updateDefaulter: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateDefaulterDto = req.body;

      const updatedDefaulter = await defaulterService.updateDefaulter(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedDefaulter) {
        throw new AppError(404, 'Defaulter not found');
      }

      res.json({
        success: true,
        data: updatedDefaulter,
        message: 'Defaulter updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete defaulter (soft delete)
   */
  deleteDefaulter: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await defaulterService.deleteDefaulter(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Defaulter not found');
      }

      res.json({
        success: true,
        message: 'Defaulter deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get defaulters by member
   */
  getDefaultersByMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;
      const activeOnly = req.query.activeOnly !== 'false';

      const defaulters = await defaulterService.getDefaultersByMember(memId, activeOnly);

      res.json({
        success: true,
        data: defaulters,
        total: defaulters.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get defaulters by plot
   */
  getDefaultersByPlot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plotId = req.params.plotId as string;
      const activeOnly = req.query.activeOnly !== 'false';

      const defaulters = await defaulterService.getDefaultersByPlot(plotId, activeOnly);

      res.json({
        success: true,
        data: defaulters,
        total: defaulters.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Send notice to defaulter
   */
  sendNotice: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const noticeData: SendNoticeDto = req.body;

      if (!noticeData.noticeType || !noticeData.noticeContent || !noticeData.sendMethod) {
        throw new AppError(400, 'Notice type, content, and send method are required');
      }

      const updatedDefaulter = await defaulterService.sendNotice(id, noticeData, req.user.userId);

      if (!updatedDefaulter) {
        throw new AppError(404, 'Defaulter not found');
      }

      res.json({
        success: true,
        data: updatedDefaulter,
        message: 'Notice sent successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Resolve defaulter (record payment)
   */
  resolveDefaulter: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const resolveData: ResolveDefaulterDto = req.body;

      if (!resolveData.paymentAmount || resolveData.paymentAmount <= 0) {
        throw new AppError(400, 'Valid payment amount is required');
      }

      if (!resolveData.paymentDate) {
        throw new AppError(400, 'Payment date is required');
      }

      if (!resolveData.paymentMethod) {
        throw new AppError(400, 'Payment method is required');
      }

      const resolvedDefaulter = await defaulterService.resolveDefaulter(
        id,
        resolveData,
        req.user.userId
      );

      if (!resolvedDefaulter) {
        throw new AppError(404, 'Defaulter not found');
      }

      res.json({
        success: true,
        data: resolvedDefaulter,
        message: 'Defaulter payment recorded successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get defaulter statistics
   */
  getDefaulterStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await defaulterService.getDefaulterStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update defaulter status
   */
  bulkUpdateStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { defaulterIds, status } = req.body;

      if (!defaulterIds || !Array.isArray(defaulterIds) || defaulterIds.length === 0) {
        throw new AppError(400, 'Defaulter IDs are required and must be a non-empty array');
      }

      if (!status) {
        throw new AppError(400, 'Status is required');
      }

      const result = await defaulterService.bulkUpdateStatus(defaulterIds, status, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} defaulters`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get overdue summary (for dashboard)
   */
  getOverdueSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await defaulterService.getOverdueSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active defaulters count
   */
  getActiveDefaultersCount: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await defaulterService.getDefaulterStatistics();

      res.json({
        success: true,
        data: {
          activeDefaulters: count.activeDefaulters,
          totalOverdueAmount: count.totalOverdueAmount,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
