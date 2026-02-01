import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { srTransferService } from '../services/service-transfer';
import {
  CreateSrTransferDto,
  ExecuteTransferDto,
  RecordFeePaymentDto,
  TransferQueryParams,
  UpdateSrTransferDto,
} from '../types/types-transfer';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const srTransferController = {
  /**
   * Create new transfer
   */
  createTransfer: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateSrTransferDto = req.body;

      // Validate required fields
      if (!createData.fileId) {
        throw new AppError(400, 'File ID is required');
      }

      if (!createData.transferTypeId) {
        throw new AppError(400, 'Transfer type is required');
      }

      if (!createData.sellerMemId) {
        throw new AppError(400, 'Seller is required');
      }

      if (!createData.buyerMemId) {
        throw new AppError(400, 'Buyer is required');
      }

      if (!createData.transferInitDate) {
        throw new AppError(400, 'Transfer initiation date is required');
      }

      const transfer = await srTransferService.createTransfer(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: transfer,
        message: 'Transfer created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfer by ID
   */
  getTransfer: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const transfer = await srTransferService.getTransferById(id);

      res.json({
        success: true,
        data: transfer,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all transfers
   */
  getTransfers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: TransferQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        fileId: req.query.fileId as string,
        sellerMemId: req.query.sellerMemId as string,
        buyerMemId: req.query.buyerMemId as string,
        transferTypeId: req.query.transferTypeId as string,
        status: req.query.status as any,
        transferFeePaid: req.query.transferFeePaid
          ? req.query.transferFeePaid === 'true'
          : undefined,
        transfIsAtt: req.query.transfIsAtt ? req.query.transfIsAtt === 'true' : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await srTransferService.getTransfers(queryParams);

      res.json({
        success: true,
        data: {
          transfers: result.transfers,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update transfer
   */
  updateTransfer: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateSrTransferDto = req.body;

      const updatedTransfer = await srTransferService.updateTransfer(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedTransfer) {
        throw new AppError(404, 'Transfer not found');
      }

      res.json({
        success: true,
        data: updatedTransfer,
        message: 'Transfer updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete transfer (soft delete)
   */
  deleteTransfer: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await srTransferService.deleteTransfer(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Transfer not found');
      }

      res.json({
        success: true,
        message: 'Transfer deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Record fee payment
   */
  recordFeePayment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const paymentData: RecordFeePaymentDto = req.body;

      const updatedTransfer = await srTransferService.recordFeePayment(
        id,
        paymentData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedTransfer,
        message: 'Fee payment recorded successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Execute transfer
   */
  executeTransfer: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const executionData: ExecuteTransferDto = req.body;

      // Validate required fields
      if (!executionData.executionDate) {
        throw new AppError(400, 'Execution date is required');
      }

      if (!executionData.witness1Name || !executionData.witness1CNIC) {
        throw new AppError(400, 'Primary witness name and CNIC are required');
      }

      if (!executionData.officerName || !executionData.officerDesignation) {
        throw new AppError(400, 'Officer name and designation are required');
      }

      const executedTransfer = await srTransferService.executeTransfer(
        id,
        executionData,
        req.user.userId
      );

      res.json({
        success: true,
        data: executedTransfer,
        message: 'Transfer executed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Upload NDC document
   */
  uploadNDCDocument: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      if (!req.file) {
        throw new AppError(400, 'No file uploaded');
      }

      const id = req.params.id as string;

      const updatedTransfer = await srTransferService.uploadNDCDocument(
        id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedTransfer,
        message: 'NDC document uploaded successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfers by file
   */
  getTransfersByFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.fileId as string;

      const transfers = await srTransferService.getTransfersByFile(fileId);

      res.json({
        success: true,
        data: transfers,
        total: transfers.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfers by member
   */
  getTransfersByMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;

      const transfers = await srTransferService.getTransfersByMember(memId);

      res.json({
        success: true,
        data: transfers,
        total: transfers.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get pending transfers
   */
  getPendingTransfers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await srTransferService.getPendingTransfers(page, limit);

      res.json({
        success: true,
        data: {
          transfers: result.transfers,
          pagination: {
            page,
            limit,
            total: result.total,
            pages: result.pages,
          },
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfer statistics
   */
  getTransferStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await srTransferService.getTransferStatistics();

      res.json({
        success: true,
        data: statistics,
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
      const summary = await srTransferService.getDashboardSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get overdue transfers
   */
  getOverdueTransfers: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const transfers = await srTransferService.getOverdueTransfers();

      res.json({
        success: true,
        data: transfers,
        total: transfers.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search transfers
   */
  searchTransfers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError(400, 'Search term must be at least 2 characters');
      }

      const transfers = await srTransferService.searchTransfers(searchTerm, limit);

      res.json({
        success: true,
        data: transfers,
        total: transfers.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update transfer status
   */
  bulkUpdateStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { transferIds, status } = req.body;

      if (!transferIds || !Array.isArray(transferIds) || transferIds.length === 0) {
        throw new AppError(400, 'Transfer IDs are required and must be a non-empty array');
      }

      if (!status) {
        throw new AppError(400, 'Status is required');
      }

      const result = await srTransferService.bulkUpdateStatus(transferIds, status, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} transfers`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfer timeline
   */
  getTransferTimeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transferId = req.params.id as string;

      const timeline = await srTransferService.getTransferTimeline(transferId);

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Validate transfer for completion
   */
  validateTransferForCompletion: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transferId = req.params.id as string;

      const validation = await srTransferService.validateTransferForCompletion(transferId);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get transfers requiring action
   */
  getTransfersRequiringAction: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await srTransferService.getTransfersRequiringAction();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
