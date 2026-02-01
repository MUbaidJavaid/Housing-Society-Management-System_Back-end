import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { billInfoService } from '../services/service-bill-info';
import {
  BillQueryParams,
  CreateBillInfoDto,
  GenerateBillsDto,
  RecordPaymentDto,
  UpdateBillInfoDto,
} from '../types/types-bill-info';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const billInfoController = {
  /**
   * Create new bill
   */
  createBill: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateBillInfoDto = req.body;

      // Validate required fields
      if (!createData.billType) {
        throw new AppError(400, 'Bill type is required');
      }

      if (!createData.fileId?.trim()) {
        throw new AppError(400, 'File ID is required');
      }

      if (!createData.memId?.trim()) {
        throw new AppError(400, 'Member ID is required');
      }

      if (!createData.billMonth?.trim()) {
        throw new AppError(400, 'Bill month is required');
      }

      if (createData.billAmount === undefined || createData.billAmount < 0) {
        throw new AppError(400, 'Valid bill amount is required');
      }

      if (!createData.dueDate) {
        throw new AppError(400, 'Due date is required');
      }

      const bill = await billInfoService.createBill(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: bill,
        message: 'Bill created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bill by ID
   */
  getBill: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const bill = await billInfoService.getBillById(id);

      res.json({
        success: true,
        data: bill,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bill by bill number
   */
  getBillByNumber: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const billNo = req.params.billNo as string;

      const bill = await billInfoService.getBillByNumber(billNo);

      if (!bill) {
        throw new AppError(404, 'Bill not found');
      }

      res.json({
        success: true,
        data: bill,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all bills
   */
  getBills: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: BillQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        memId: req.query.memId as string,
        fileId: req.query.fileId as string,
        billType: req.query.billType as any,
        status: req.query.status as any,
        billMonth: req.query.billMonth as string,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        isOverdue: req.query.isOverdue ? req.query.isOverdue === 'true' : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await billInfoService.getBills(queryParams);

      res.json({
        success: true,
        data: {
          bills: result.bills,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update bill
   */
  updateBill: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateBillInfoDto = req.body;

      const updatedBill = await billInfoService.updateBill(id, updateData, req.user.userId);

      if (!updatedBill) {
        throw new AppError(404, 'Bill not found');
      }

      res.json({
        success: true,
        data: updatedBill,
        message: 'Bill updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete bill (soft delete)
   */
  deleteBill: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await billInfoService.deleteBill(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Bill not found');
      }

      res.json({
        success: true,
        message: 'Bill deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Record payment for bill
   */
  recordPayment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const paymentData: RecordPaymentDto = req.body;

      if (!paymentData.paymentAmount || paymentData.paymentAmount <= 0) {
        throw new AppError(400, 'Valid payment amount is required');
      }

      if (!paymentData.paymentDate) {
        throw new AppError(400, 'Payment date is required');
      }

      if (!paymentData.paymentMethod) {
        throw new AppError(400, 'Payment method is required');
      }

      const updatedBill = await billInfoService.recordPayment(id, paymentData, req.user.userId);

      if (!updatedBill) {
        throw new AppError(404, 'Bill not found');
      }

      res.json({
        success: true,
        data: updatedBill,
        message: 'Payment recorded successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bills by member
   */
  getBillsByMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;
      const activeOnly = req.query.activeOnly !== 'false';

      const bills = await billInfoService.getBillsByMember(memId, activeOnly);

      res.json({
        success: true,
        data: bills,
        total: bills.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bills by file
   */
  getBillsByFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.fileId as string;
      const activeOnly = req.query.activeOnly !== 'false';

      const bills = await billInfoService.getBillsByFile(fileId, activeOnly);

      res.json({
        success: true,
        data: bills,
        total: bills.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get overdue bills
   */
  getOverdueBills: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await billInfoService.getOverdueBills(page, limit);

      res.json({
        success: true,
        data: {
          bills: result.bills,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get member bills summary
   */
  getMemberBillsSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;

      const summary = await billInfoService.getMemberBillsSummary(memId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bill statistics
   */
  getBillStatistics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      const statistics = await billInfoService.getBillStatistics(year);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Generate bills for multiple members
   */
  generateBills: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const generateData: GenerateBillsDto = req.body;

      if (
        !generateData.memberIds ||
        !Array.isArray(generateData.memberIds) ||
        generateData.memberIds.length === 0
      ) {
        throw new AppError(400, 'Member IDs are required');
      }

      if (!generateData.billType) {
        throw new AppError(400, 'Bill type is required');
      }

      if (!generateData.billMonth) {
        throw new AppError(400, 'Bill month is required');
      }

      if (!generateData.dueDate) {
        throw new AppError(400, 'Due date is required');
      }

      const result = await billInfoService.generateBills(generateData, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Generated ${result.success} bills, ${result.failed} failed`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Apply fine for overdue bills (admin only)
   */
  applyFineForOverdue: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await billInfoService.applyFineForOverdue();

      res.json({
        success: true,
        data: result,
        message: `Applied fine to ${result.updated} overdue bills`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get bills summary for dashboard
   */
  getDashboardSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const currentYear = new Date().getFullYear();
      const [statistics, overdueBills] = await Promise.all([
        billInfoService.getBillStatistics(currentYear),
        billInfoService.getOverdueBills(1, 5),
      ]);

      res.json({
        success: true,
        data: {
          statistics,
          recentOverdue: overdueBills.bills,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
