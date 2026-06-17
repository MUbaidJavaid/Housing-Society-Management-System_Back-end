import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { LookupCategory } from '../models/models-lookup-value';
import { lookupValueService } from '../services/service-lookup-value';
import { SEED_DATA } from '../seed/seed-lookup-values';
import { LookupQueryParams } from '../types/types-lookup-value';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const lookupValueController = {
  /**
   * Create a new lookup value
   */
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const lookupValue = await lookupValueService.create(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: lookupValue,
        message: 'Lookup value created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all lookup values with optional category filter
   */
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: LookupQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string,
        sortBy: (req.query.sortBy as string) || 'sequence',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
        category: req.query.category as LookupCategory | undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      };

      const result = await lookupValueService.getAll(queryParams);

      res.json({
        success: true,
        data: {
          lookupValues: result.lookupValues,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all active values for a specific category
   */
  getByCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = req.params.category as LookupCategory;

      if (!Object.values(LookupCategory).includes(category)) {
        throw new AppError(400, `Invalid lookup category: ${category}`);
      }

      const lookupValues = await lookupValueService.getByCategory(category);

      res.json({
        success: true,
        data: lookupValues,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get a lookup value by ID
   */
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const lookupValue = await lookupValueService.getById(id);

      if (!lookupValue) {
        throw new AppError(404, 'Lookup value not found');
      }

      res.json({
        success: true,
        data: lookupValue,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update a lookup value
   */
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const lookupValue = await lookupValueService.update(id, req.body, req.user.userId);

      if (!lookupValue) {
        throw new AppError(404, 'Lookup value not found');
      }

      res.json({
        success: true,
        data: lookupValue,
        message: 'Lookup value updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete a lookup value (soft delete)
   */
  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      await lookupValueService.delete(id, req.user.userId);

      res.json({
        success: true,
        message: 'Lookup value deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Reorder lookup values within a category
   */
  reorder: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError(400, 'Items array is required');
      }

      await lookupValueService.reorder(items);

      res.json({
        success: true,
        message: 'Lookup values reordered successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Seed initial lookup values
   */
  seed: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const result = await lookupValueService.seed(SEED_DATA, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Seeding complete: ${result.created} created, ${result.skipped} skipped`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
