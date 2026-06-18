import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { parkingService } from '../services/service-parking';
import {
  AssignSpotDto,
  CreateSpotDto,
  IssuePassDto,
  PassQueryParams,
  SpotQueryParams,
  UpdateSpotDto,
} from '../types/types-parking';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const parkingController = {
  // ── Spot Controllers ──

  createSpot: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data: CreateSpotDto = req.body;
      const spot = await parkingService.createSpot(data, req.user.userId);

      res.status(201).json({
        success: true,
        data: spot,
        message: 'Parking spot created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getSpots: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: SpotQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        societyId: req.query.societyId as string,
        spotType: req.query.spotType as string,
        status: req.query.status as string,
        isOccupied: req.query.isOccupied ? req.query.isOccupied === 'true' : undefined,
        isAvailableForRent: req.query.isAvailableForRent ? req.query.isAvailableForRent === 'true' : undefined,
        blockId: req.query.blockId as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await parkingService.getSpots(queryParams);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        message: 'Parking spots retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getSpot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const spot = await parkingService.getSpotById(id);

      if (!spot) {
        throw new AppError(404, 'Parking spot not found');
      }

      res.status(200).json({
        success: true,
        data: spot,
        message: 'Parking spot retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateSpot: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const data: UpdateSpotDto = req.body;
      const spot = await parkingService.updateSpot(id, data, req.user.userId);

      if (!spot) {
        throw new AppError(404, 'Parking spot not found');
      }

      res.status(200).json({
        success: true,
        data: spot,
        message: 'Parking spot updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteSpot: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const spot = await parkingService.deleteSpot(id, req.user.userId);

      if (!spot) {
        throw new AppError(404, 'Parking spot not found');
      }

      res.status(200).json({
        success: true,
        data: spot,
        message: 'Parking spot deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  assignSpot: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const spotId = req.params.id as string;
      const data: AssignSpotDto = req.body;
      const spot = await parkingService.assignSpot(spotId, data, req.user.userId);

      if (!spot) {
        throw new AppError(404, 'Parking spot not found');
      }

      res.status(200).json({
        success: true,
        data: spot,
        message: 'Parking spot assigned successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  unassignSpot: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const spotId = req.params.id as string;
      const spot = await parkingService.unassignSpot(spotId, req.user.userId);

      if (!spot) {
        throw new AppError(404, 'Parking spot not found');
      }

      res.status(200).json({
        success: true,
        data: spot,
        message: 'Parking spot unassigned successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  toggleRent: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const spotId = req.params.id as string;
      const { price } = req.body;
      const spot = await parkingService.toggleRentAvailability(spotId, price);

      if (!spot) {
        throw new AppError(404, 'Parking spot not found');
      }

      res.status(200).json({
        success: true,
        data: spot,
        message: 'Parking spot rent availability toggled successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // ── Pass Controllers ──

  issuePass: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data: IssuePassDto = req.body;
      const pass = await parkingService.issuePass(data, req.user.userId);

      res.status(201).json({
        success: true,
        data: pass,
        message: 'Parking pass issued successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPasses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: PassQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        societyId: req.query.societyId as string,
        purpose: req.query.purpose as string,
        status: req.query.status as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await parkingService.getPasses(queryParams);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        message: 'Parking passes retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPass: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const pass = await parkingService.getPassById(id);

      if (!pass) {
        throw new AppError(404, 'Parking pass not found');
      }

      res.status(200).json({
        success: true,
        data: pass,
        message: 'Parking pass retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  verifyPass: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;
      const pass = await parkingService.verifyPass(code);

      if (!pass) {
        throw new AppError(404, 'Invalid or expired parking pass');
      }

      res.status(200).json({
        success: true,
        data: pass,
        message: 'Parking pass verified successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  cancelPass: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const pass = await parkingService.cancelPass(id, req.user.userId);

      if (!pass) {
        throw new AppError(404, 'Parking pass not found');
      }

      res.status(200).json({
        success: true,
        data: pass,
        message: 'Parking pass cancelled successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  expireOldPasses: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await parkingService.expireOldPasses();

      res.status(200).json({
        success: true,
        data: { expiredCount: count },
        message: `${count} old parking passes expired`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // ── Stats ──

  getStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const societyId = req.query.societyId as string;

      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const stats = await parkingService.getParkingStats(societyId);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Parking statistics retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
