import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateDevelopmentDto,
  DevelopmentQueryParams,
  developmentService,
} from '../index-development';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const developmentController = {
  createDevelopment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateDevelopmentDto = req.body;

      // Validate required fields
      if (!createData.plotId) {
        throw new AppError(400, 'Plot ID is required');
      }
      if (!createData.memId) {
        throw new AppError(400, 'Member ID is required');
      }
      if (!createData.developmentStatusName?.trim()) {
        throw new AppError(400, 'Development Status Name is required');
      }
      if (!createData.applicationId) {
        throw new AppError(400, 'Application ID is required');
      }

      const development = await developmentService.createDevelopment(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: development,
        message: 'Development record created successfully',
      });
    } catch (error: any) {
      if (error.message === 'Plot already has a development record') {
        throw new AppError(409, error.message);
      }
      handleError(error, next);
    }
  },

  getDevelopment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const development = await developmentService.getDevelopmentById(id);

      if (!development || (development as any).isDeleted) {
        throw new AppError(404, 'Development record not found');
      }

      res.json({
        success: true,
        data: development,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getDevelopmentByPlot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plotId = req.params.plotId as string;

      const development = await developmentService.getDevelopmentByPlotId(plotId);

      if (!development || (development as any).isDeleted) {
        throw new AppError(404, 'Development record not found for this plot');
      }

      res.json({
        success: true,
        data: development,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getDevelopments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: DevelopmentQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        plotId: req.query.plotId as string,
        memId: req.query.memId as string,
        applicationId: req.query.applicationId as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await developmentService.getDevelopments(queryParams);

      res.json({
        success: true,
        data: {
          developments: result.developments,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getDevelopmentSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await developmentService.getDevelopmentSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateDevelopment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      const existingDevelopment = await developmentService.getDevelopmentById(id);
      if (!existingDevelopment || (existingDevelopment as any).isDeleted) {
        throw new AppError(404, 'Development record not found');
      }

      const updatedDevelopment = await developmentService.updateDevelopment(
        id,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedDevelopment,
        message: 'Development record updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteDevelopment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const existingDevelopment = await developmentService.getDevelopmentById(id);
      if (!existingDevelopment || (existingDevelopment as any).isDeleted) {
        throw new AppError(404, 'Development record not found');
      }

      const deleted = await developmentService.deleteDevelopment(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Development record');
      }

      res.json({
        success: true,
        message: 'Development record deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
