import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { srDevStatusService } from '../index-srdevstatus';
import {
  BulkStatusUpdateDto,
  CreateSrDevStatusDto,
  DevCategory,
  DevPhase,
  SrDevStatusQueryParams,
  StatusTransitionDto,
} from '../types/types-srdevstatus';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const srDevStatusController = {
  /**
   * Create new development status
   */
  createSrDevStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateSrDevStatusDto = req.body;

      // Validate required fields
      if (!createData.srDevStatName?.trim()) {
        throw new AppError(400, 'Development Status Name is required');
      }

      if (!createData.srDevStatCode?.trim()) {
        throw new AppError(400, 'Development Status Code is required');
      }

      if (!createData.devCategory) {
        throw new AppError(400, 'Development Category is required');
      }

      if (!createData.devPhase) {
        throw new AppError(400, 'Development Phase is required');
      }

      // Validate enums
      if (!Object.values(DevCategory).includes(createData.devCategory)) {
        throw new AppError(400, 'Invalid development category');
      }

      if (!Object.values(DevPhase).includes(createData.devPhase)) {
        throw new AppError(400, 'Invalid development phase');
      }

      // Validate percentage
      if (createData.percentageComplete !== undefined) {
        if (createData.percentageComplete < 0 || createData.percentageComplete > 100) {
          throw new AppError(400, 'Percentage must be between 0 and 100');
        }
      }

      // Validate color code if provided
      if (
        createData.colorCode &&
        !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(createData.colorCode)
      ) {
        throw new AppError(400, 'Invalid color code format');
      }

      const srDevStatus = await srDevStatusService.createSrDevStatus(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: srDevStatus,
        message: 'Development Status created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get development status by ID
   */
  getSrDevStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const srDevStatus = await srDevStatusService.getSrDevStatusById(id);

      if (!srDevStatus || (srDevStatus as any).isDeleted) {
        throw new AppError(404, 'Development Status not found');
      }

      res.json({
        success: true,
        data: srDevStatus,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get development status by code
   */
  getSrDevStatusByCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;

      const srDevStatus = await srDevStatusService.getSrDevStatusByCode(code);

      if (!srDevStatus) {
        throw new AppError(404, 'Development Status not found');
      }

      res.json({
        success: true,
        data: srDevStatus,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all development statuses
   */
  getSrDevStatuses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: SrDevStatusQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        devCategory: req.query.devCategory
          ? ((req.query.devCategory as string).split(',') as DevCategory[])
          : undefined,
        devPhase: req.query.devPhase
          ? ((req.query.devPhase as string).split(',') as DevPhase[])
          : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        requiresDocumentation: req.query.requiresDocumentation
          ? req.query.requiresDocumentation === 'true'
          : undefined,
        minPercentage: req.query.minPercentage
          ? parseFloat(req.query.minPercentage as string)
          : undefined,
        maxPercentage: req.query.maxPercentage
          ? parseFloat(req.query.maxPercentage as string)
          : undefined,
      };

      const result = await srDevStatusService.getSrDevStatuses(queryParams);

      res.json({
        success: true,
        data: {
          srDevStatuses: result.srDevStatuses,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update development status
   */
  updateSrDevStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      // Check if development status exists
      const existingStatus = await srDevStatusService.getSrDevStatusById(id);
      if (!existingStatus || (existingStatus as any).isDeleted) {
        throw new AppError(404, 'Development Status not found');
      }

      // Validate enums if provided
      if (updateData.devCategory && !Object.values(DevCategory).includes(updateData.devCategory)) {
        throw new AppError(400, 'Invalid development category');
      }

      if (updateData.devPhase && !Object.values(DevPhase).includes(updateData.devPhase)) {
        throw new AppError(400, 'Invalid development phase');
      }

      // Validate percentage if provided
      if (updateData.percentageComplete !== undefined) {
        if (updateData.percentageComplete < 0 || updateData.percentageComplete > 100) {
          throw new AppError(400, 'Percentage must be between 0 and 100');
        }
      }

      // Validate color code if provided
      if (
        updateData.colorCode &&
        !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(updateData.colorCode)
      ) {
        throw new AppError(400, 'Invalid color code format');
      }

      const updatedSrDevStatus = await srDevStatusService.updateSrDevStatus(
        id,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedSrDevStatus,
        message: 'Development Status updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete development status
   */
  deleteSrDevStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      // Check if development status exists
      const existingStatus = await srDevStatusService.getSrDevStatusById(id);
      if (!existingStatus || (existingStatus as any).isDeleted) {
        throw new AppError(404, 'Development Status not found');
      }

      const deleted = await srDevStatusService.deleteSrDevStatus(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Development Status');
      }

      res.json({
        success: true,
        message: 'Development Status deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  toggleStatusActive: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const updatedStatus = await srDevStatusService.toggleStatusActive(id, req.user.userId);

      if (!updatedStatus) {
        throw new AppError(404, 'Development Status not found');
      }

      return res.json({
        success: true,
        data: updatedStatus,
        message: `Development Status ${updatedStatus.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      // Map business logic errors to 400 instead of 500
      if (error.message === 'Cannot deactivate default development status') {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      return handleError(error, next); // 👈 important
    }
  },

  /**
   * Get active development statuses
   */
  getActiveSrDevStatuses: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const srDevStatuses = await srDevStatusService.getActiveSrDevStatuses();

      res.json({
        success: true,
        data: srDevStatuses,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get default development status
   */
  getDefaultSrDevStatus: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const defaultStatus = await srDevStatusService.getDefaultSrDevStatus();

      if (!defaultStatus) {
        throw new AppError(404, 'Default development status not found');
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
   * Get statuses by category
   */
  getStatusesByCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = req.params.category as DevCategory;

      if (!Object.values(DevCategory).includes(category)) {
        throw new AppError(400, 'Invalid development category');
      }

      const srDevStatuses = await srDevStatusService.getStatusesByCategory(category);

      res.json({
        success: true,
        data: srDevStatuses,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get statuses by phase
   */
  getStatusesByPhase: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const phase = req.params.phase as DevPhase;

      if (!Object.values(DevPhase).includes(phase)) {
        throw new AppError(400, 'Invalid development phase');
      }

      const srDevStatuses = await srDevStatusService.getStatusesByPhase(phase);

      res.json({
        success: true,
        data: srDevStatuses,
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
      const validationData: StatusTransitionDto = req.body;

      if (!validationData.currentStatusId || !validationData.targetStatusId) {
        throw new AppError(400, 'Both current and target status IDs are required');
      }

      const validation = await srDevStatusService.validateStatusTransition(validationData);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get development workflow
   */
  getDevelopmentWorkflow: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const workflow = await srDevStatusService.getDevelopmentWorkflow();

      res.json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get next logical statuses
   */
  getNextLogicalStatuses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentStatusId = req.params.id as string;

      const nextStatuses = await srDevStatusService.getNextLogicalStatuses(currentStatusId);

      res.json({
        success: true,
        data: nextStatuses,
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

      const updatedStatus = await srDevStatusService.updateStatusSequence(
        id,
        sequence,
        req.user.userId
      );

      if (!updatedStatus) {
        throw new AppError(404, 'Development Status not found');
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

      const result = await srDevStatusService.reorderStatuses(statusOrders, req.user.userId);

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

      if (!bulkData.field || !['isActive', 'requiresDocumentation'].includes(bulkData.field)) {
        throw new AppError(400, 'Valid field name is required');
      }

      if (typeof bulkData.value !== 'boolean') {
        throw new AppError(400, 'Value must be a boolean');
      }

      const result = await srDevStatusService.bulkUpdateStatuses(bulkData, req.user.userId);

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
   * Get development status statistics
   */
  getSrDevStatusStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await srDevStatusService.getSrDevStatusStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Calculate project development progress
   */
  calculateProjectProgress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { statusIds } = req.body;

      if (!statusIds || !Array.isArray(statusIds) || statusIds.length === 0) {
        throw new AppError(400, 'At least one status ID is required');
      }

      const progressReport = await srDevStatusService.calculateProjectProgress(statusIds);

      res.json({
        success: true,
        data: progressReport,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get development phases with progress
   */
  getDevelopmentPhasesProgress: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const phasesProgress = await srDevStatusService.getDevelopmentPhasesProgress();

      res.json({
        success: true,
        data: phasesProgress,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Check if status requires documentation
   */
  checkRequiresDocumentation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statusId = req.params.id as string;

      const requiresDocumentation = await srDevStatusService.requiresDocumentation(statusId);

      res.json({
        success: true,
        data: { requiresDocumentation },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get estimated completion time
   */
  getEstimatedCompletion: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statusId = req.params.id as string;

      const estimatedCompletion = await srDevStatusService.getEstimatedCompletion(statusId);

      res.json({
        success: true,
        data: estimatedCompletion,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get development timeline
   */
  getDevelopmentTimeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;

      // This would typically fetch from a ProjectTimeline collection
      // For now, return a sample structure
      res.json({
        success: true,
        data: {
          projectId,
          timeline: [],
          message: 'Timeline functionality to be implemented with Project integration',
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
