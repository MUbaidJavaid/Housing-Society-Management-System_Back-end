import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { AuditAction, EntityType } from '../models/models-auditLog';
import { auditLogService } from '../services/service';
import { AuditLogQueryParams } from '../types/types';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const auditLogController = {
  getAuditLogs: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      // Only admins can view all audit logs
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        throw new AppError(403, 'Insufficient permissions');
      }

      const queryParams: AuditLogQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        userId: req.query.userId as string,
        action: req.query.action as AuditAction,
        entityType: req.query.entityType as EntityType,
        entityId: req.query.entityId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await auditLogService.getAuditLogs(queryParams);

      res.json({
        success: true,
        data: {
          auditLogs: result.auditLogs,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMyActivity: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const activities = await auditLogService.getUserActivity(req.user.userId.toString());

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAuditSummary: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        throw new AppError(403, 'Insufficient permissions');
      }

      const { startDate, endDate } = req.query;
      const summary = await auditLogService.getAuditSummary(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getRecentActivity: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        throw new AppError(403, 'Insufficient permissions');
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await auditLogService.getRecentActivity(limit);

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getEntityActivity: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { entityType, entityId } = req.params;

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw new AppError(400, 'Invalid entity type');
      }

      // Check permissions - users can only view activity for their own entities unless admin
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        // Add entity-specific permission checks here
        // For example, for Member entity, check if userId matches
      }

      const activities = await auditLogService.getEntityActivity(
        entityType as EntityType,
        entityId
      );

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
