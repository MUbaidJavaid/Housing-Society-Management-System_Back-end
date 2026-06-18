import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { workflowService } from '../services/service-workflow';
import { WorkflowQueryParams, WorkflowInstanceQueryParams } from '../types/types-workflow';
import { WorkflowInstanceStatus } from '../models/models-workflow-instance';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const workflowController = {
  /**
   * Create a new workflow
   */
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const workflow = await workflowService.create(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: workflow,
        message: 'Workflow created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all workflows with pagination and filtering
   */
  getAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const queryParams: WorkflowQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        societyId: req.query.societyId as string | undefined,
        triggerEntity: req.query.triggerEntity as string | undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      };

      const result = await workflowService.getAll(queryParams);

      res.json({
        success: true,
        data: {
          workflows: result.workflows,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get a workflow by ID
   */
  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const workflow = await workflowService.getById(id);

      if (!workflow) {
        throw new AppError(404, 'Workflow not found');
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
   * Update a workflow
   */
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const workflow = await workflowService.update(id, req.body, req.user.userId);

      if (!workflow) {
        throw new AppError(404, 'Workflow not found');
      }

      res.json({
        success: true,
        data: workflow,
        message: 'Workflow updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete a workflow (soft delete)
   */
  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      await workflowService.delete(id, req.user.userId);

      res.json({
        success: true,
        message: 'Workflow deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get instances for a workflow
   */
  getInstances: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const workflowId = req.params.id as string;

      const queryParams: WorkflowInstanceQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        status: req.query.status as WorkflowInstanceStatus | undefined,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await workflowService.getInstances(workflowId, queryParams);

      res.json({
        success: true,
        data: {
          instances: result.instances,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Create a workflow instance
   */
  createInstance: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const workflowId = req.params.id as string;
      const { entityType, entityId, societyId } = req.body;

      const instance = await workflowService.createInstance(
        workflowId,
        entityType,
        entityId,
        societyId,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: instance,
        message: 'Workflow instance created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get a single workflow instance
   */
  getInstance: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const instanceId = req.params.instanceId as string;
      const instance = await workflowService.getInstance(instanceId);

      if (!instance) {
        throw new AppError(404, 'Workflow instance not found');
      }

      res.json({
        success: true,
        data: instance,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Approve the current approval step
   */
  approveStep: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const instanceId = req.params.instanceId as string;
      const { notes } = req.body;

      const instance = await workflowService.approveStep(instanceId, req.user.userId, notes);

      if (!instance) {
        throw new AppError(404, 'Workflow instance not found');
      }

      res.json({
        success: true,
        data: instance,
        message: 'Step approved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Reject the current approval step
   */
  rejectStep: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const instanceId = req.params.instanceId as string;
      const { notes } = req.body;

      const instance = await workflowService.rejectStep(instanceId, req.user.userId, notes);

      if (!instance) {
        throw new AppError(404, 'Workflow instance not found');
      }

      res.json({
        success: true,
        data: instance,
        message: 'Step rejected successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
