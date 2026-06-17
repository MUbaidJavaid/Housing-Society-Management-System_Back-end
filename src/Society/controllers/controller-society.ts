import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { societyService } from '../services/service-society';
import { SocietyQueryParams } from '../types/types-society';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const societyController = {
  /**
   * Create a new society
   */
  createSociety: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const society = await societyService.createSociety(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: society,
        message: 'Society created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get society by ID
   */
  getSociety: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const society = await societyService.getSocietyById(id);

      res.json({
        success: true,
        data: society,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all societies with pagination
   */
  getSocieties: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: SocietyQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        subscriptionStatus: req.query.subscriptionStatus as any,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await societyService.getSocieties(queryParams);

      res.json({
        success: true,
        data: {
          societies: result.societies,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update society
   */
  updateSociety: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updatedSociety = await societyService.updateSociety(id, req.body, req.user.userId);

      if (!updatedSociety) {
        throw new AppError(404, 'Society not found');
      }

      res.json({
        success: true,
        data: updatedSociety,
        message: 'Society updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Soft delete society
   */
  deleteSociety: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const deleted = await societyService.deleteSociety(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Society not found');
      }

      res.json({
        success: true,
        message: 'Society deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get society statistics
   */
  getSocietyStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const stats = await societyService.getSocietyStats(id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Toggle society active status
   */
  toggleSocietyStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const society = await societyService.toggleSocietyStatus(id, req.user.userId);

      if (!society) {
        throw new AppError(404, 'Society not found');
      }

      res.json({
        success: true,
        data: society,
        message: `Society ${society.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Check society limits
   */
  checkSocietyLimits: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const limits = await societyService.checkLimits(id);

      res.json({
        success: true,
        data: limits,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
