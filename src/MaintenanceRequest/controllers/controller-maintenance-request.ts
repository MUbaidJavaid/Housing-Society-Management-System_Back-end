import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { maintenanceRequestService } from '../services/service-maintenance-request';
import { MaintenanceQueryParams } from '../types/types-maintenance-request';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const maintenanceRequestController = {
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const request = await maintenanceRequestService.create(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: request,
        message: 'Maintenance request created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const queryParams: MaintenanceQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        societyId: req.query.societyId as string,
        status: req.query.status as string,
        category: req.query.category as string,
        priority: req.query.priority as string,
        assignedTo: req.query.assignedTo as string,
        isOverdue: req.query.isOverdue as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await maintenanceRequestService.getAll(queryParams);

      res.json({
        success: true,
        data: {
          requests: result.requests,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const request = await maintenanceRequestService.getById(id);

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const request = await maintenanceRequestService.update(id, req.body, req.user.userId);

      res.json({
        success: true,
        data: request,
        message: 'Maintenance request updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      await maintenanceRequestService.delete(id, req.user.userId);

      res.json({
        success: true,
        message: 'Maintenance request deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  acknowledgeRequest: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const request = await maintenanceRequestService.acknowledgeRequest(id, req.user.userId);

      res.json({
        success: true,
        data: request,
        message: 'Maintenance request acknowledged',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  assignToStaff: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { staffId } = req.body;
      const request = await maintenanceRequestService.assignToStaff(id, staffId, req.user.userId);

      res.json({
        success: true,
        data: request,
        message: 'Staff assigned to maintenance request',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  assignToVendor: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { vendorId, estimatedCost, estimatedDate } = req.body;
      const request = await maintenanceRequestService.assignToVendor(
        id, vendorId, estimatedCost, estimatedDate, req.user.userId
      );

      res.json({
        success: true,
        data: request,
        message: 'Vendor assigned to maintenance request',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  startWork: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const request = await maintenanceRequestService.startWork(id, req.user.userId);

      res.json({
        success: true,
        data: request,
        message: 'Work started on maintenance request',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  addWorkLog: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const request = await maintenanceRequestService.addWorkLog(id, req.body, req.user.userId);

      res.json({
        success: true,
        data: request,
        message: 'Work log added successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  completeWork: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const request = await maintenanceRequestService.completeWork(id, req.user.userId);

      res.json({
        success: true,
        data: request,
        message: 'Maintenance work completed',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  verifyCompletion: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const request = await maintenanceRequestService.verifyCompletion(id, req.user.userId);

      res.json({
        success: true,
        data: request,
        message: 'Maintenance completion verified',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  submitFeedback: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { rating, comment } = req.body;
      const request = await maintenanceRequestService.submitFeedback(id, rating, comment);

      res.json({
        success: true,
        data: request,
        message: 'Feedback submitted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  rejectRequest: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { reason } = req.body;
      const request = await maintenanceRequestService.rejectRequest(id, reason, req.user.userId);

      res.json({
        success: true,
        data: request,
        message: 'Maintenance request rejected',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMyRequests: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await maintenanceRequestService.getMyRequests(
        req.user.userId.toString(), page, limit
      );

      res.json({
        success: true,
        data: {
          requests: result.requests,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAssignedRequests: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await maintenanceRequestService.getAssignedRequests(
        req.user.userId.toString(), page, limit
      );

      res.json({
        success: true,
        data: {
          requests: result.requests,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getOverdueRequests: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const societyId = req.query.societyId as string;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await maintenanceRequestService.getOverdueRequests(societyId, page, limit);

      res.json({
        success: true,
        data: {
          requests: result.requests,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMaintenanceStats: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const societyId = req.query.societyId as string;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const stats = await maintenanceRequestService.getMaintenanceStats(societyId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
