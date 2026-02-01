import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { fileService } from '../services/service-file';
import {
  AdjustFileDto,
  CreateFileDto,
  FileQueryParams,
  TransferFileDto,
  UpdateFileDto,
} from '../types/types-file';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const fileController = {
  /**
   * Create new file
   */
  createFile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateFileDto = req.body;

      // Validate required fields
      if (!createData.projId?.trim()) {
        throw new AppError(400, 'Project ID is required');
      }

      if (!createData.memId?.trim()) {
        throw new AppError(400, 'Member ID is required');
      }

      if (createData.totalAmount === undefined || createData.totalAmount < 0) {
        throw new AppError(400, 'Valid total amount is required');
      }

      if (createData.downPayment === undefined || createData.downPayment < 0) {
        throw new AppError(400, 'Valid down payment is required');
      }

      if (!createData.paymentMode) {
        throw new AppError(400, 'Payment mode is required');
      }

      if (!createData.bookingDate) {
        throw new AppError(400, 'Booking date is required');
      }

      const file = await fileService.createFile(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: file,
        message: 'File created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get file by ID
   */
  getFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const file = await fileService.getFileById(id);

      res.json({
        success: true,
        data: file,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get file by registration number
   */
  getFileByRegNo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileRegNo = req.params.fileRegNo as string;

      const file = await fileService.getFileByRegNo(fileRegNo);

      if (!file) {
        throw new AppError(404, 'File not found');
      }

      res.json({
        success: true,
        data: file,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get file by barcode
   */
  getFileByBarcode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileBarCode = req.params.fileBarCode as string;

      const file = await fileService.getFileByBarcode(fileBarCode);

      if (!file) {
        throw new AppError(404, 'File not found');
      }

      res.json({
        success: true,
        data: file,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all files
   */
  getFiles: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: FileQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        projId: req.query.projId as string,
        memId: req.query.memId as string,
        nomineeId: req.query.nomineeId as string,
        plotId: req.query.plotId as string,
        plotTypeId: req.query.plotTypeId as string,
        plotSizeId: req.query.plotSizeId as string,
        plotBlockId: req.query.plotBlockId as string,
        status: req.query.status as any,
        isAdjusted: req.query.isAdjusted ? req.query.isAdjusted === 'true' : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await fileService.getFiles(queryParams);

      res.json({
        success: true,
        data: {
          files: result.files,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update file
   */
  updateFile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateFileDto = req.body;

      const updatedFile = await fileService.updateFile(id, updateData, req.user.userId);

      if (!updatedFile) {
        throw new AppError(404, 'File not found');
      }

      res.json({
        success: true,
        data: updatedFile,
        message: 'File updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete file (soft delete)
   */
  deleteFile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await fileService.deleteFile(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'File not found');
      }

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get files by member
   */
  getFilesByMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;
      const activeOnly = req.query.activeOnly !== 'false';

      const files = await fileService.getFilesByMember(memId, activeOnly);

      res.json({
        success: true,
        data: files,
        total: files.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get files by project
   */
  getFilesByProject: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projId = req.params.projId as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await fileService.getFilesByProject(projId, page, limit);

      res.json({
        success: true,
        data: {
          files: result.files,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Transfer file to another member
   */
  transferFile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const transferData: TransferFileDto = req.body;

      if (!transferData.newMemberId) {
        throw new AppError(400, 'New member ID is required');
      }

      if (!transferData.transferDate) {
        throw new AppError(400, 'Transfer date is required');
      }

      if (!transferData.transferReason) {
        throw new AppError(400, 'Transfer reason is required');
      }

      const transferredFile = await fileService.transferFile(id, transferData, req.user.userId);

      if (!transferredFile) {
        throw new AppError(404, 'File not found');
      }

      res.json({
        success: true,
        data: transferredFile,
        message: 'File transferred successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Adjust file (refund, credit, transfer)
   */
  adjustFile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const adjustData: AdjustFileDto = req.body;

      if (!adjustData.adjustmentType) {
        throw new AppError(400, 'Adjustment type is required');
      }

      if (!adjustData.adjustmentAmount || adjustData.adjustmentAmount <= 0) {
        throw new AppError(400, 'Valid adjustment amount is required');
      }

      if (!adjustData.adjustmentDate) {
        throw new AppError(400, 'Adjustment date is required');
      }

      if (!adjustData.adjustmentReason) {
        throw new AppError(400, 'Adjustment reason is required');
      }

      const adjustedFile = await fileService.adjustFile(id, adjustData, req.user.userId);

      if (!adjustedFile) {
        throw new AppError(404, 'File not found');
      }

      res.json({
        success: true,
        data: adjustedFile,
        message: 'File adjusted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get file statistics
   */
  getFileStatistics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      const statistics = await fileService.getFileStatistics(year);

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
      const summary = await fileService.getDashboardSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search files
   */
  searchFiles: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError(400, 'Search term must be at least 2 characters');
      }

      const files = await fileService.searchFiles(searchTerm, limit);

      res.json({
        success: true,
        data: files,
        total: files.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get unballoted files (files without plots)
   */
  getUnballotedFiles: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await fileService.getUnballotedFiles(page, limit);

      res.json({
        success: true,
        data: {
          files: result.files,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Assign plot to file
   */
  assignPlot: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const fileId = req.params.fileId as string;
      const { plotId } = req.body;

      if (!plotId) {
        throw new AppError(400, 'Plot ID is required');
      }

      const updatedFile = await fileService.assignPlot(fileId, plotId, req.user.userId);

      if (!updatedFile) {
        throw new AppError(404, 'File not found');
      }

      res.json({
        success: true,
        data: updatedFile,
        message: 'Plot assigned successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update file status
   */
  bulkUpdateStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { fileIds, status } = req.body;

      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        throw new AppError(400, 'File IDs are required and must be a non-empty array');
      }

      if (!status) {
        throw new AppError(400, 'Status is required');
      }

      const result = await fileService.bulkUpdateStatus(fileIds, status, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} files`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get files summary by status
   */
  getFilesByStatusSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await fileService.getFilesByStatusSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get file financial summary
   */
  getFileFinancialSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.fileId as string;

      const file = await fileService.getFileById(fileId);

      const financialSummary = {
        totalAmount: file.totalAmount,
        downPayment: file.downPayment,
        balanceAmount: file.balanceAmount || file.totalAmount - file.downPayment,
        paymentPercentage:
          file.paymentPercentage || Math.round((file.downPayment / file.totalAmount) * 100),
        paymentMode: file.paymentMode,
        isAdjusted: file.isAdjusted,
        adjustmentRef: file.adjustmentRef,
      };

      res.json({
        success: true,
        data: financialSummary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
