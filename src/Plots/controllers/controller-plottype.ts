import { AuthRequest } from '@/auth';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { CreatePlotTypeDto, PlotTypeQueryParams, plotTypeService } from '../index-plottype';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const plotTypeController = {
  createPlotType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreatePlotTypeDto = req.body;

      if (!createData.plotTypeName?.trim()) {
        throw new AppError(400, 'Plot Type Name is required');
      }

      const exists = await plotTypeService.checkPlotTypeExists(createData.plotTypeName);
      if (exists) {
        throw new AppError(409, 'Plot Type with this name already exists');
      }

      const plotType = await plotTypeService.createPlotType(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: plotType,
        message: 'Plot Type created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPlotType: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };

      const plotType = await plotTypeService.getPlotTypeById(id);

      if (!plotType || (plotType as any).isDeleted) {
        throw new AppError(404, 'Plot Type not found');
      }

      res.json({
        success: true,
        data: plotType,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPlotTypes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: PlotTypeQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await plotTypeService.getPlotTypes(queryParams);

      res.json({
        success: true,
        data: {
          plotTypes: result.plotTypes,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllPlotTypes: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plotTypes = await plotTypeService.getAllPlotTypes();

      res.json({
        success: true,
        data: plotTypes,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updatePlotType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params as { id: string };
      const updateData = req.body;

      const existingPlotType = await plotTypeService.getPlotTypeById(id);
      if (!existingPlotType || (existingPlotType as any).isDeleted) {
        throw new AppError(404, 'Plot Type not found');
      }

      if (updateData.plotTypeName && updateData.plotTypeName !== existingPlotType.plotTypeName) {
        const exists = await plotTypeService.checkPlotTypeExists(updateData.plotTypeName, id);
        if (exists) {
          throw new AppError(409, 'Plot Type with this name already exists');
        }
      }

      const updatedPlotType = await plotTypeService.updatePlotType(id, updateData, req.user.userId);

      res.json({
        success: true,
        data: updatedPlotType,
        message: 'Plot Type updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deletePlotType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params as { id: string };

      const existingPlotType = await plotTypeService.getPlotTypeById(id);
      if (!existingPlotType || (existingPlotType as any).isDeleted) {
        throw new AppError(404, 'Plot Type not found');
      }

      const deleted = await plotTypeService.deletePlotType(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Plot Type');
      }

      res.json({
        success: true,
        message: 'Plot Type deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
