// controller-status.ts
import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { statusService } from '../index-status';
import { CreateStatusDto, StatusQueryParams } from '../types/types-status'; // Added import

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

      const exists = await statusService.checkStatusExists(createData.statusName);
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

  getStatusById: async (req: Request, res: Response, next: NextFunction) => {
    // Renamed for clarity
    try {
      const id = req.params.id as string;

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

  getStatusList: async (req: Request, res: Response, next: NextFunction) => {
    // Uncommented and renamed
    try {
      const queryParams: StatusQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await statusService.getStatus(queryParams);

      res.json({
        success: true,
        data: {
          status: result.status,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllStatus: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await statusService.getAllStatus();

      res.json({
        success: true,
        data: status,
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

      const id = req.params.id as string;
      const updateData = req.body;

      const existingStatus = await statusService.getStatusById(id);
      if (!existingStatus || (existingStatus as any).isDeleted) {
        throw new AppError(404, 'Status not found');
      }

      if (updateData.statusName && updateData.statusName !== existingStatus.statusName) {
        const exists = await statusService.checkStatusExists(updateData.statusName, id);
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

      const id = req.params.id as string;

      const existingStatus = await statusService.getStatusById(id);
      if (!existingStatus || (existingStatus as any).isDeleted) {
        throw new AppError(404, 'Status not found');
      }

      try {
        const deleted = await statusService.deleteStatus(id, req.user.userId);

        if (!deleted) {
          throw new AppError(500, 'Failed to delete Status');
        }

        res.json({
          success: true,
          message: 'Status deleted successfully',
        });
      } catch (error: any) {
        if (error.message === 'Cannot delete status with associated cities') {
          throw new AppError(400, error.message);
        }
        throw error;
      }
    } catch (error) {
      handleError(error, next);
    }
  },
};
