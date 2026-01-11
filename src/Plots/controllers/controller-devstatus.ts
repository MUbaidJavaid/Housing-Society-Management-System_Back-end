import { AuthRequest } from '@/auth';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { srDevStatusService } from '../index-devstatus';
import { CreateSrDevStatusDto, SrDevStatusQueryParams } from '../types/types-devstatus';
const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const srDevStatusController = {
  createSrDevStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateSrDevStatusDto = req.body;

      if (!createData.srDevStatName?.trim()) {
        throw new AppError(400, 'Status Name is required');
      }

      const exists = await srDevStatusService.checkSrDevStatusExists(createData.srDevStatName);
      if (exists) {
        throw new AppError(409, 'Status with this name already exists');
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

  getSrDevStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };

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

  getSrDevStatuses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: SrDevStatusQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await srDevStatusService.getSrDevStatuses(queryParams);

      res.json({
        success: true,
        data: {
          srDevStatuses: result.srDevStatuses,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllSrDevStatuses: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const srDevStatuses = await srDevStatusService.getAllSrDevStatuses();

      res.json({
        success: true,
        data: srDevStatuses,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateSrDevStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params as { id: string };
      const updateData = req.body;

      const existingSrDevStatus = await srDevStatusService.getSrDevStatusById(id);
      if (!existingSrDevStatus || (existingSrDevStatus as any).isDeleted) {
        throw new AppError(404, 'Development Status not found');
      }

      if (
        updateData.srDevStatName &&
        updateData.srDevStatName !== existingSrDevStatus.srDevStatName
      ) {
        const exists = await srDevStatusService.checkSrDevStatusExists(
          updateData.srDevStatName,
          id
        );
        if (exists) {
          throw new AppError(409, 'Status with this name already exists');
        }
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

  deleteSrDevStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params as { id: string };

      const existingSrDevStatus = await srDevStatusService.getSrDevStatusById(id);
      if (!existingSrDevStatus || (existingSrDevStatus as any).isDeleted) {
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
};
