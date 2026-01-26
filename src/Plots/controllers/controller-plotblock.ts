import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { plotBlockService } from '../index-plotblock';
import { CreatePlotBlockDto, PlotBlockQueryParams } from '../types/types-plotblock';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const plotBlockController = {
  /**
   * Create new plot block
   */
  createPlotBlock: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreatePlotBlockDto = req.body;

      // Validate required fields
      if (!createData.plotBlockName?.trim()) {
        throw new AppError(400, 'Plot Block Name is required');
      }

      if (!createData.projectId) {
        throw new AppError(400, 'Project ID is required');
      }

      // Check if plot block already exists in the same project
      const exists = await plotBlockService.checkPlotBlockExists(
        createData.plotBlockName,
        createData.projectId
      );

      if (exists) {
        throw new AppError(409, 'Plot Block with this name already exists in this project');
      }

      const plotBlock = await plotBlockService.createPlotBlock(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: plotBlock,
        message: 'Plot Block created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get plot block by ID
   */
  getPlotBlock: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const plotBlock = await plotBlockService.getPlotBlockById(id);

      if (!plotBlock || (plotBlock as any).isDeleted) {
        throw new AppError(404, 'Plot Block not found');
      }

      res.json({
        success: true,
        data: plotBlock,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all plot blocks
   */
  getPlotBlocks: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: PlotBlockQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await plotBlockService.getPlotBlocks(queryParams);

      res.json({
        success: true,
        data: {
          plotBlocks: result.plotBlocks,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update plot block
   */
  updatePlotBlock: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      // Check if plot block exists
      const existingPlotBlock = await plotBlockService.getPlotBlockById(id);
      if (!existingPlotBlock || (existingPlotBlock as any).isDeleted) {
        throw new AppError(404, 'Plot Block not found');
      }

      // Check if new name already exists
      if (
        updateData.plotBlockName &&
        updateData.plotBlockName !== existingPlotBlock.plotBlockName
      ) {
        const exists = await plotBlockService.checkPlotBlockExists(updateData.plotBlockName, id);
        if (exists) {
          throw new AppError(409, 'Plot Block with this name already exists');
        }
      }

      const updatedPlotBlock = await plotBlockService.updatePlotBlock(
        id,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedPlotBlock,
        message: 'Plot Block updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete plot block
   */
  deletePlotBlock: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      // Check if plot block exists
      const existingPlotBlock = await plotBlockService.getPlotBlockById(id);
      if (!existingPlotBlock || (existingPlotBlock as any).isDeleted) {
        throw new AppError(404, 'Plot Block not found');
      }

      const deleted = await plotBlockService.deletePlotBlock(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Plot Block');
      }

      res.json({
        success: true,
        message: 'Plot Block deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
