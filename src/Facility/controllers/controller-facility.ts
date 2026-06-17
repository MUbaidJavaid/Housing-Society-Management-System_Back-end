import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { facilityService } from '../services/service-facility';
import {
  CreateFacilityDto,
  FacilityQueryParams,
  UpdateFacilityDto,
} from '../types/types-facility';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const facilityController = {
  /**
   * Create new facility
   */
  createFacility: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateFacilityDto = req.body;

      const facility = await facilityService.createFacility(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: facility,
        message: 'Facility created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get facility by ID
   */
  getFacility: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const facility = await facilityService.getFacilityById(id);

      res.json({
        success: true,
        data: facility,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all facilities
   */
  getFacilities: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: FacilityQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        facilityType: req.query.facilityType as any,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        societyId: req.query.societyId as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await facilityService.getFacilities(queryParams);

      res.json({
        success: true,
        data: {
          facilities: result.facilities,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update facility
   */
  updateFacility: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateFacilityDto = req.body;

      const facility = await facilityService.updateFacility(id, updateData, req.user.userId);

      if (!facility) {
        throw new AppError(404, 'Facility not found');
      }

      res.json({
        success: true,
        data: facility,
        message: 'Facility updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete facility (soft delete)
   */
  deleteFacility: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await facilityService.deleteFacility(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Facility not found');
      }

      res.json({
        success: true,
        message: 'Facility deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Toggle facility active status
   */
  toggleFacilityStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const facility = await facilityService.toggleFacilityStatus(id, req.user.userId);

      if (!facility) {
        throw new AppError(404, 'Facility not found');
      }

      res.json({
        success: true,
        data: facility,
        message: `Facility ${facility.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
