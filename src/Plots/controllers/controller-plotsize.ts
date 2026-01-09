import { AuthRequest } from '@/auth';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { CreatePlotSizeDto, PlotSizeQueryParams, plotSizeService } from '../index-plotsize';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const plotSizeController = {
  createPlotSize: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreatePlotSizeDto = req.body;

      if (!createData.plotSizeName?.trim()) {
        throw new AppError(400, 'Plot Size Name is required');
      }

      const exists = await plotSizeService.checkPlotSizeExists(createData.plotSizeName);
      if (exists) {
        throw new AppError(409, 'Plot Size with this name already exists');
      }

      const plotSize = await plotSizeService.createPlotSize(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: plotSize,
        message: 'Plot Size created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPlotSize: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const plotSize = await plotSizeService.getPlotSizeById(id);

      if (!plotSize || (plotSize as any).isDeleted) {
        throw new AppError(404, 'Plot Size not found');
      }

      res.json({
        success: true,
        data: plotSize,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPlotSizes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: PlotSizeQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await plotSizeService.getPlotSizes(queryParams);

      res.json({
        success: true,
        data: {
          plotSizes: result.plotSizes,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllPlotSizes: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plotSizes = await plotSizeService.getAllPlotSizes();

      res.json({
        success: true,
        data: plotSizes,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updatePlotSize: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;
      const updateData = req.body;

      const existingPlotSize = await plotSizeService.getPlotSizeById(id);
      if (!existingPlotSize || (existingPlotSize as any).isDeleted) {
        throw new AppError(404, 'Plot Size not found');
      }

      if (updateData.plotSizeName && updateData.plotSizeName !== existingPlotSize.plotSizeName) {
        const exists = await plotSizeService.checkPlotSizeExists(updateData.plotSizeName, id);
        if (exists) {
          throw new AppError(409, 'Plot Size with this name already exists');
        }
      }

      const updatedPlotSize = await plotSizeService.updatePlotSize(id, updateData, req.user.userId);

      res.json({
        success: true,
        data: updatedPlotSize,
        message: 'Plot Size updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deletePlotSize: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;

      const existingPlotSize = await plotSizeService.getPlotSizeById(id);
      if (!existingPlotSize || (existingPlotSize as any).isDeleted) {
        throw new AppError(404, 'Plot Size not found');
      }

      const deleted = await plotSizeService.deletePlotSize(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Plot Size');
      }

      res.json({
        success: true,
        message: 'Plot Size deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
