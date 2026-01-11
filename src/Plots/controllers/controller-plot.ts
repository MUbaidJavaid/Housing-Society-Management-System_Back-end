import { AuthRequest } from '@/auth';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { CreatePlotDto, PlotQueryParams, plotService } from '../index-plot';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const plotController = {
  createPlot: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreatePlotDto = req.body;

      // Validate required fields
      if (!createData.plotNo?.trim()) {
        throw new AppError(400, 'Plot Number is required');
      }
      if (!createData.plotBlockId) {
        throw new AppError(400, 'Plot Block is required');
      }
      if (!createData.plotSizeId) {
        throw new AppError(400, 'Plot Size is required');
      }
      if (!createData.plotTypeId) {
        throw new AppError(400, 'Plot Type is required');
      }
      if (!createData.srDevStatId) {
        throw new AppError(400, 'SR Development Status is required');
      }
      if (createData.plotAmount === undefined || createData.plotAmount < 0) {
        throw new AppError(400, 'Valid Plot Amount is required');
      }
      if (!createData.developmentStatusId) {
        throw new AppError(400, 'Development Status is required');
      }
      if (!createData.applicationTypeId) {
        throw new AppError(400, 'Application Type is required');
      }

      // Check if plot number already exists
      const exists = await plotService.checkPlotNoExists(createData.plotNo, createData.projId);
      if (exists) {
        throw new AppError(409, 'Plot Number already exists in this project');
      }

      const plot = await plotService.createPlot(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: plot,
        message: 'Plot created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPlot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const plot = await plotService.getPlotById(id);

      if (!plot || (plot as any).isDeleted) {
        throw new AppError(404, 'Plot not found');
      }

      res.json({
        success: true,
        data: plot,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPlots: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: PlotQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        plotBlockId: req.query.plotBlockId as string,
        plotSizeId: req.query.plotSizeId as string,
        plotTypeId: req.query.plotTypeId as string,
        developmentStatusId: req.query.developmentStatusId as string,
        applicationTypeId: req.query.applicationTypeId as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await plotService.getPlots(queryParams);

      res.json({
        success: true,
        data: {
          plots: result.plots,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPlotSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await plotService.getPlotSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getFilterOptions: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const options = await plotService.getFilterOptions();

      res.json({
        success: true,
        data: options,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updatePlot: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      const existingPlot = await plotService.getPlotById(id);
      if (!existingPlot || (existingPlot as any).isDeleted) {
        throw new AppError(404, 'Plot not found');
      }

      // Check if plot number is being changed and if it already exists
      if (updateData.plotNo && updateData.plotNo !== existingPlot.plotNo) {
        const exists = await plotService.checkPlotNoExists(
          updateData.plotNo,
          updateData.projId || existingPlot.projId?._id?.toString(),
          id
        );
        if (exists) {
          throw new AppError(409, 'Plot Number already exists in this project');
        }
      }

      const updatedPlot = await plotService.updatePlot(id, updateData, req.user.userId);

      res.json({
        success: true,
        data: updatedPlot,
        message: 'Plot updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deletePlot: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const existingPlot = await plotService.getPlotById(id);
      if (!existingPlot || (existingPlot as any).isDeleted) {
        throw new AppError(404, 'Plot not found');
      }

      const deleted = await plotService.deletePlot(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Plot');
      }

      res.json({
        success: true,
        message: 'Plot deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
