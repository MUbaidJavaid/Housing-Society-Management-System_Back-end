import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { salesStatusService } from '../index-salesstatus';
import {
  BulkStatusUpdateDto,
  CreateSalesStatusDto,
  SalesStatusQueryParams,
  SalesStatusType,
  WorkflowValidationDto,
} from '../types/types-salesstatus';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const salesStatusController = {
  /**
   * Create new sales status
   */
  createSalesStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateSalesStatusDto = req.body;

      // Validate required fields
      if (!createData.statusName?.trim()) {
        throw new AppError(400, 'Status Name is required');
      }

      if (!createData.statusCode?.trim()) {
        throw new AppError(400, 'Status Code is required');
      }

      if (!createData.statusType) {
        throw new AppError(400, 'Status Type is required');
      }

      // Validate status type
      if (!Object.values(SalesStatusType).includes(createData.statusType)) {
        throw new AppError(400, 'Invalid status type');
      }

      // Validate color code if provided
      if (
        createData.colorCode &&
        !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(createData.colorCode)
      ) {
        throw new AppError(400, 'Invalid color code format');
      }

      const salesStatus = await salesStatusService.createSalesStatus(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: salesStatus,
        message: 'Sales Status created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get sales status by ID
   */
  getSalesStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const salesStatus = await salesStatusService.getSalesStatusById(id);

      if (!salesStatus || (salesStatus as any).isDeleted) {
        throw new AppError(404, 'Sales Status not found');
      }

      res.json({
        success: true,
        data: salesStatus,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get sales status by code
   */
  getSalesStatusByCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;

      const salesStatus = await salesStatusService.getSalesStatusByCode(code);

      if (!salesStatus) {
        throw new AppError(404, 'Sales Status not found');
      }

      res.json({
        success: true,
        data: salesStatus,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all sales statuses
   */
  getSalesStatuses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: SalesStatusQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        statusType: req.query.statusType
          ? ((req.query.statusType as string).split(',') as SalesStatusType[])
          : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        allowsSale: req.query.allowsSale ? req.query.allowsSale === 'true' : undefined,
        requiresApproval: req.query.requiresApproval
          ? req.query.requiresApproval === 'true'
          : undefined,
      };

      const result = await salesStatusService.getSalesStatuses(queryParams);

      res.json({
        success: true,
        data: {
          salesStatuses: result.salesStatuses,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update sales status
   */
  updateSalesStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      // Check if sales status exists
      const existingStatus = await salesStatusService.getSalesStatusById(id);
      if (!existingStatus || (existingStatus as any).isDeleted) {
        throw new AppError(404, 'Sales Status not found');
      }

      // Validate status type if provided
      if (
        updateData.statusType &&
        !Object.values(SalesStatusType).includes(updateData.statusType)
      ) {
        throw new AppError(400, 'Invalid status type');
      }

      // Validate color code if provided
      if (
        updateData.colorCode &&
        !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(updateData.colorCode)
      ) {
        throw new AppError(400, 'Invalid color code format');
      }

      const updatedSalesStatus = await salesStatusService.updateSalesStatus(
        id,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedSalesStatus,
        message: 'Sales Status updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete sales status
   */
  deleteSalesStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      // Check if sales status exists
      const existingStatus = await salesStatusService.getSalesStatusById(id);
      if (!existingStatus || (existingStatus as any).isDeleted) {
        throw new AppError(404, 'Sales Status not found');
      }

      const deleted = await salesStatusService.deleteSalesStatus(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Sales Status');
      }

      res.json({
        success: true,
        message: 'Sales Status deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Toggle sales status active status
   */
  toggleStatusActive: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const updatedStatus = await salesStatusService.toggleStatusActive(id, req.user.userId);

      if (!updatedStatus) {
        throw new AppError(404, 'Sales Status not found');
      }

      res.json({
        success: true,
        data: updatedStatus,
        message: `Sales Status ${updatedStatus.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active sales statuses
   */
  getActiveSalesStatuses: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const salesStatuses = await salesStatusService.getActiveSalesStatuses();

      res.json({
        success: true,
        data: salesStatuses,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get default sales status
   */
  getDefaultSalesStatus: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const defaultStatus = await salesStatusService.getDefaultSalesStatus();

      if (!defaultStatus) {
        throw new AppError(404, 'Default sales status not found');
      }

      res.json({
        success: true,
        data: defaultStatus,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get statuses by type
   */
  getStatusesByType: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.params.type as SalesStatusType;

      if (!Object.values(SalesStatusType).includes(type)) {
        throw new AppError(400, 'Invalid status type');
      }

      const salesStatuses = await salesStatusService.getStatusesByType(type);

      res.json({
        success: true,
        data: salesStatuses,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get statuses that allow sales
   */
  getSalesAllowedStatuses: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const salesStatuses = await salesStatusService.getSalesAllowedStatuses();

      res.json({
        success: true,
        data: salesStatuses,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Validate status transition
   */
  validateStatusTransition: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationData: WorkflowValidationDto = req.body;

      if (!validationData.currentStatusId || !validationData.targetStatusId) {
        throw new AppError(400, 'Both current and target status IDs are required');
      }

      const validation = await salesStatusService.validateStatusTransition(validationData);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get status workflow
   */
  getStatusWorkflow: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentStatusId = req.params.id as string;

      const workflow = await salesStatusService.getStatusWorkflow(currentStatusId);

      if (!workflow) {
        throw new AppError(404, 'Sales Status not found');
      }

      res.json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update status sequence
   */
  updateStatusSequence: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { sequence } = req.body;

      if (!sequence || sequence < 1) {
        throw new AppError(400, 'Valid sequence number (≥1) is required');
      }

      const updatedStatus = await salesStatusService.updateStatusSequence(
        id,
        sequence,
        req.user.userId
      );

      if (!updatedStatus) {
        throw new AppError(404, 'Sales Status not found');
      }

      res.json({
        success: true,
        data: updatedStatus,
        message: 'Status sequence updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Reorder statuses
   */
  reorderStatuses: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { statusOrders } = req.body;

      if (!statusOrders || !Array.isArray(statusOrders) || statusOrders.length === 0) {
        throw new AppError(400, 'Status orders array is required');
      }

      // Validate all sequences are positive
      const invalid = statusOrders.find(
        order => !order.id || !order.sequence || order.sequence < 1
      );
      if (invalid) {
        throw new AppError(400, 'All status orders must have valid ID and sequence (≥1)');
      }

      const result = await salesStatusService.reorderStatuses(statusOrders, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: 'Statuses reordered successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update status fields
   */
  bulkUpdateStatuses: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const bulkData: BulkStatusUpdateDto = req.body;

      if (
        !bulkData.statusIds ||
        !Array.isArray(bulkData.statusIds) ||
        bulkData.statusIds.length === 0
      ) {
        throw new AppError(400, 'At least one status ID is required');
      }

      if (
        !bulkData.field ||
        !['isActive', 'allowsSale', 'requiresApproval'].includes(bulkData.field)
      ) {
        throw new AppError(400, 'Valid field name is required');
      }

      if (typeof bulkData.value !== 'boolean') {
        throw new AppError(400, 'Value must be a boolean');
      }

      const result = await salesStatusService.bulkUpdateStatuses(bulkData, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `${result.modified} statuses updated successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get sales status statistics
   */
  getSalesStatusStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await salesStatusService.getSalesStatusStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get next statuses in workflow
   */
  getNextStatuses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentStatusId = req.params.id as string;

      const nextStatuses = await salesStatusService.getNextStatuses(currentStatusId);

      res.json({
        success: true,
        data: nextStatuses,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Check if status allows sales
   */
  checkSalesAllowed: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statusId = req.params.id as string;

      const allowsSale = await salesStatusService.isSalesAllowed(statusId);

      res.json({
        success: true,
        data: { allowsSale },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Check if status requires approval
   */
  checkRequiresApproval: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statusId = req.params.id as string;

      const requiresApproval = await salesStatusService.requiresApproval(statusId);

      res.json({
        success: true,
        data: { requiresApproval },
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
