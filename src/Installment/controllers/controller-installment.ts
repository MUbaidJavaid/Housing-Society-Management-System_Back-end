import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { installmentService } from '../services/service-installment';
import {
  BulkInstallmentCreationDto,
  CreateInstallmentDto,
  InstallmentQueryParams,
  InstallmentReportParams,
  RecordPaymentDto,
  UpdateInstallmentDto,
} from '../types/types-installment';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const installmentController = {
  /**
   * Create new installment
   */
  createInstallment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateInstallmentDto = req.body;

      // Validate required fields
      if (!createData.fileId) {
        throw new AppError(400, 'File ID is required');
      }

      if (!createData.memId) {
        throw new AppError(400, 'Member ID is required');
      }

      if (!createData.plotId) {
        throw new AppError(400, 'Plot ID is required');
      }

      if (!createData.installmentCategoryId) {
        throw new AppError(400, 'Installment category is required');
      }

      if (!createData.installmentNo) {
        throw new AppError(400, 'Installment number is required');
      }

      if (!createData.installmentTitle) {
        throw new AppError(400, 'Installment title is required');
      }

      if (!createData.installmentType) {
        throw new AppError(400, 'Installment type is required');
      }

      if (!createData.dueDate) {
        throw new AppError(400, 'Due date is required');
      }

      if (!createData.amountDue) {
        throw new AppError(400, 'Amount due is required');
      }

      const installment = await installmentService.createInstallment(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: installment,
        message: 'Installment created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Create bulk installments
   */
  createBulkInstallments: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const bulkData: BulkInstallmentCreationDto = req.body;

      // Validate required fields
      if (!bulkData.fileId) {
        throw new AppError(400, 'File ID is required');
      }

      if (!bulkData.memId) {
        throw new AppError(400, 'Member ID is required');
      }

      if (!bulkData.plotId) {
        throw new AppError(400, 'Plot ID is required');
      }

      if (!bulkData.installmentCategoryId) {
        throw new AppError(400, 'Installment category is required');
      }

      if (!bulkData.installmentType) {
        throw new AppError(400, 'Installment type is required');
      }

      if (!bulkData.totalInstallments || bulkData.totalInstallments < 1) {
        throw new AppError(400, 'Valid total installments is required');
      }

      if (!bulkData.amountPerInstallment || bulkData.amountPerInstallment <= 0) {
        throw new AppError(400, 'Valid amount per installment is required');
      }

      if (!bulkData.startDate) {
        throw new AppError(400, 'Start date is required');
      }

      if (!bulkData.frequency) {
        throw new AppError(400, 'Payment frequency is required');
      }

      const installments = await installmentService.createBulkInstallments(
        bulkData,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: installments,
        message: `Successfully created ${installments.length} installments`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get installment by ID
   */
  getInstallment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const installment = await installmentService.getInstallmentById(id);

      res.json({
        success: true,
        data: installment,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all installments
   */
  getInstallments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: InstallmentQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        fileId: req.query.fileId as string,
        memId: req.query.memId as string,
        plotId: req.query.plotId as string,
        installmentCategoryId: req.query.installmentCategoryId as string,
        status: req.query.status as any,
        installmentType: req.query.installmentType as any,
        paymentMode: req.query.paymentMode as any,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
        overdue: req.query.overdue ? req.query.overdue === 'true' : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await installmentService.getInstallments(queryParams);

      res.json({
        success: true,
        data: {
          installments: result.installments,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update installment
   */
  updateInstallment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateInstallmentDto = req.body;

      const updatedInstallment = await installmentService.updateInstallment(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedInstallment) {
        throw new AppError(404, 'Installment not found');
      }

      res.json({
        success: true,
        data: updatedInstallment,
        message: 'Installment updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete installment (soft delete)
   */
  deleteInstallment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await installmentService.deleteInstallment(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Installment not found');
      }

      res.json({
        success: true,
        message: 'Installment deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Record payment for installment
   */
  recordPayment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const paymentData: RecordPaymentDto = req.body;

      // Validate required fields
      if (!paymentData.amountPaid || paymentData.amountPaid <= 0) {
        throw new AppError(400, 'Valid payment amount is required');
      }

      if (!paymentData.paidDate) {
        throw new AppError(400, 'Payment date is required');
      }

      if (!paymentData.paymentMode) {
        throw new AppError(400, 'Payment mode is required');
      }

      const updatedInstallment = await installmentService.recordPayment(
        id,
        paymentData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedInstallment,
        message: 'Payment recorded successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get installments by file
   */
  getInstallmentsByFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.fileId as string;

      const installments = await installmentService.getInstallmentsByFile(fileId);

      res.json({
        success: true,
        data: installments,
        total: installments.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get installments by member
   */
  getInstallmentsByMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;

      const installments = await installmentService.getInstallmentsByMember(memId);

      res.json({
        success: true,
        data: installments,
        total: installments.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get installments by plot
   */
  getInstallmentsByPlot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plotId = req.params.plotId as string;

      const installments = await installmentService.getInstallmentsByPlot(plotId);

      res.json({
        success: true,
        data: installments,
        total: installments.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get overdue installments
   */
  getOverdueInstallments: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const installments = await installmentService.getOverdueInstallments();

      res.json({
        success: true,
        data: installments,
        total: installments.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get installments due today
   */
  getDueTodayInstallments: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const installments = await installmentService.getDueTodayInstallments();

      res.json({
        success: true,
        data: installments,
        total: installments.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get installment summary for member
   */
  getInstallmentSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;

      const summary = await installmentService.getInstallmentSummary(memId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get dashboard summary
   */
  getDashboardSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await installmentService.getDashboardSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Generate installment report
   */
  generateReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params: InstallmentReportParams = {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string),
        fileId: req.query.fileId as string,
        memId: req.query.memId as string,
        plotId: req.query.plotId as string,
        installmentCategoryId: req.query.installmentCategoryId as string,
        status: req.query.status as any,
        installmentType: req.query.installmentType as any,
      };

      if (!params.startDate || !params.endDate) {
        throw new AppError(400, 'Start date and end date are required');
      }

      if (params.startDate > params.endDate) {
        throw new AppError(400, 'Start date cannot be after end date');
      }

      const report = await installmentService.generateReport(params);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get next due installment for member
   */
  getNextDueInstallment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;

      const installment = await installmentService.getNextDueInstallment(memId);

      res.json({
        success: true,
        data: installment,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search installments
   */
  searchInstallments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError(400, 'Search term must be at least 2 characters');
      }

      const installments = await installmentService.searchInstallments(searchTerm, limit);

      res.json({
        success: true,
        data: installments,
        total: installments.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update installment status
   */
  bulkUpdateStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { installmentIds, status } = req.body;

      if (!installmentIds || !Array.isArray(installmentIds) || installmentIds.length === 0) {
        throw new AppError(400, 'Installment IDs are required and must be a non-empty array');
      }

      if (!status) {
        throw new AppError(400, 'Status is required');
      }

      const result = await installmentService.bulkUpdateStatus(
        installmentIds,
        status,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} installments`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Validate installment payment
   */
  validatePayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { amount } = req.query;

      if (!amount || isNaN(Number(amount))) {
        throw new AppError(400, 'Valid payment amount is required');
      }

      const validation = await installmentService.validatePayment(id, Number(amount));

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
