import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { CreateStatusDto, StatusQueryParams, statusService } from '../index-status';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const statusController = {
  createStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateStatusDto = req.body;

      if (!createData.statusName?.trim()) {
        throw new AppError(400, 'Status Name is required');
      }

      const exists = await statusService.checkStatusExists(
        createData.statusName,
        createData.statusType || 'general'
      );
      if (exists) {
        throw new AppError(409, 'Status with this name already exists');
      }

      const status = await statusService.createStatus(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: status,
        message: 'Status created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const status = await statusService.getStatusById(id);

      if (!status || (status as any).isDeleted) {
        throw new AppError(404, 'Status not found');
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getStatuses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: StatusQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        statusType: req.query.statusType as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await statusService.getStatuses(queryParams);

      res.json({
        success: true,
        data: {
          statuses: result.statuses,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getStatusesByType: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;

      const statuses = await statusService.getStatusesByType(type);

      res.json({
        success: true,
        data: statuses,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllStatusTypes: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const types = await statusService.getAllStatusTypes();

      res.json({
        success: true,
        data: types,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getStatusSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await statusService.getStatusSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;
      const updateData = req.body;

      const existingStatus = await statusService.getStatusById(id);
      if (!existingStatus || (existingStatus as any).isDeleted) {
        throw new AppError(404, 'Status not found');
      }

      if (updateData.statusName && updateData.statusName !== existingStatus.statusName) {
        const exists = await statusService.checkStatusExists(
          updateData.statusName,
          updateData.statusType || existingStatus.statusType,
          id
        );
        if (exists) {
          throw new AppError(409, 'Status with this name already exists');
        }
      }

      const updatedStatus = await statusService.updateStatus(id, updateData, req.user.userId);

      res.json({
        success: true,
        data: updatedStatus,
        message: 'Status updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;

      const existingStatus = await statusService.getStatusById(id);
      if (!existingStatus || (existingStatus as any).isDeleted) {
        throw new AppError(404, 'Status not found');
      }

      const deleted = await statusService.deleteStatus(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Status');
      }

      res.json({
        success: true,
        message: 'Status deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
