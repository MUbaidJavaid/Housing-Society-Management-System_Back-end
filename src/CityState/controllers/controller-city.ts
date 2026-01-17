import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { CityQueryParams, CreateCityDto, cityService } from '../index-city';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const cityController = {
  createCity: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateCityDto = req.body;

      if (!createData.cityName?.trim()) {
        throw new AppError(400, 'City Name is required');
      }
      if (!createData.stateId) {
        throw new AppError(400, 'State is required');
      }

      const exists = await cityService.checkCityExists(createData.cityName, createData.stateId);
      if (exists) {
        throw new AppError(409, 'City with this name already exists in the selected state');
      }

      const city = await cityService.createCity(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: city,
        message: 'City created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getCity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const city = await cityService.getCityById(id);

      if (!city || (city as any).isDeleted) {
        throw new AppError(404, 'City not found');
      }

      res.json({
        success: true,
        data: city,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getCities: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: CityQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        stateId: req.query.stateId as string,
        statusId: req.query.statusId as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await cityService.getCities(queryParams);

      res.json({
        success: true,
        data: {
          cities: result.cities,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getCitiesByState: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stateId } = req.params;

      const cities = await cityService.getCitiesByState(stateId);

      res.json({
        success: true,
        data: cities,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllCities: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const cities = await cityService.getAllCities();

      res.json({
        success: true,
        data: cities,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateCity: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;
      const updateData = req.body;

      const existingCity = await cityService.getCityById(id);
      if (!existingCity || (existingCity as any).isDeleted) {
        throw new AppError(404, 'City not found');
      }

      if (updateData.cityName && updateData.cityName !== existingCity.cityName) {
        const exists = await cityService.checkCityExists(
          updateData.cityName,
          updateData.stateId || existingCity.stateId._id.toString(),
          id
        );
        if (exists) {
          throw new AppError(409, 'City with this name already exists in the selected state');
        }
      }

      const updatedCity = await cityService.updateCity(id, updateData, req.user.userId);

      res.json({
        success: true,
        data: updatedCity,
        message: 'City updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteCity: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;

      const existingCity = await cityService.getCityById(id);
      if (!existingCity || (existingCity as any).isDeleted) {
        throw new AppError(404, 'City not found');
      }

      const deleted = await cityService.deleteCity(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete City');
      }

      res.json({
        success: true,
        message: 'City deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
