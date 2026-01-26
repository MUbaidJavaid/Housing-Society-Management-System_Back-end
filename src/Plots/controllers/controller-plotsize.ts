import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { plotSizeService } from '../index-plotsize';
import { CreatePlotSizeDto, PlotSizeQueryParams } from '../types/types-plotsize';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const plotSizeController = {
  /**
   * Create new plot size
   */
  createPlotSize: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreatePlotSizeDto = req.body;

      // Validate required fields
      if (!createData.plotSizeName?.trim()) {
        throw new AppError(400, 'Plot Size Name is required');
      }

      if (!createData.totalArea || createData.totalArea <= 0) {
        throw new AppError(400, 'Valid Total Area is required');
      }

      if (!createData.ratePerUnit || createData.ratePerUnit < 0) {
        throw new AppError(400, 'Valid Rate per Unit is required');
      }

      if (!createData.areaUnit) {
        throw new AppError(400, 'Area Unit is required');
      }

      // Check if plot size already exists
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

  /**
   * Get plot size by ID
   */
  getPlotSize: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

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

  /**
   * Get all plot sizes
   */
  getPlotSizes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: PlotSizeQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        areaUnit: req.query.areaUnit as string,
        minArea: req.query.minArea ? parseFloat(req.query.minArea as string) : undefined,
        maxArea: req.query.maxArea ? parseFloat(req.query.maxArea as string) : undefined,
      };

      const result = await plotSizeService.getPlotSizes(queryParams);

      res.json({
        success: true,
        data: {
          plotSizes: result.plotSizes,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update plot size
   */
  updatePlotSize: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      // Check if plot size exists
      const existingPlotSize = await plotSizeService.getPlotSizeById(id);
      if (!existingPlotSize || (existingPlotSize as any).isDeleted) {
        throw new AppError(404, 'Plot Size not found');
      }

      // Check if new name already exists
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

  /**
   * Delete plot size
   */
  deletePlotSize: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      // Check if plot size exists
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

  /**
   * Calculate price for given parameters
   */
  calculatePrice: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { totalArea, areaUnit, ratePerUnit } = req.body;

      if (!totalArea || totalArea <= 0) {
        throw new AppError(400, 'Valid Total Area is required');
      }

      if (!ratePerUnit || ratePerUnit < 0) {
        throw new AppError(400, 'Valid Rate per Unit is required');
      }

      if (!areaUnit) {
        throw new AppError(400, 'Area Unit is required');
      }

      const price = plotSizeService.calculatePrice({
        totalArea,
        areaUnit,
        ratePerUnit,
      });

      res.json({
        success: true,
        data: {
          totalArea,
          areaUnit,
          ratePerUnit,
          calculatedPrice: price,
          calculation: `${totalArea} ${areaUnit} × ${ratePerUnit} = ${price}`,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Convert area between units
   */
  convertArea: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { value, fromUnit, toUnit } = req.body;

      if (!value || value <= 0) {
        throw new AppError(400, 'Valid value is required');
      }

      if (!fromUnit || !toUnit) {
        throw new AppError(400, 'Both fromUnit and toUnit are required');
      }

      const convertedValue = plotSizeService.convertArea(value, fromUnit, toUnit);

      res.json({
        success: true,
        data: {
          original: { value, unit: fromUnit },
          converted: { value: convertedValue, unit: toUnit },
          conversion: `${value} ${fromUnit} = ${convertedValue} ${toUnit}`,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get price breakdown
   */
  getPriceBreakdown: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const breakdown = await plotSizeService.getPriceBreakdown(id);

      if (!breakdown) {
        throw new AppError(404, 'Plot Size not found');
      }

      res.json({
        success: true,
        data: breakdown,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get available area units
   */
  getAreaUnits: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const units = plotSizeService.getAvailableAreaUnits();

      res.json({
        success: true,
        data: units,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get plot size statistics
   */
  getStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await plotSizeService.getPlotSizeStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
