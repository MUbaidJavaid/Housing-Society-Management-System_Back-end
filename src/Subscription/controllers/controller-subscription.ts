import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { subscriptionService } from '../services/service-subscription';
import { SubscriptionPackageQueryParams } from '../types/types-subscription';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const subscriptionController = {
  // ========================
  // PACKAGE CONTROLLERS
  // ========================

  /**
   * Create a new subscription package
   */
  createPackage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const pkg = await subscriptionService.createPackage(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: pkg,
        message: 'Subscription package created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get package by ID
   */
  getPackage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const pkg = await subscriptionService.getPackageById(id);

      res.json({
        success: true,
        data: pkg,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all packages with pagination
   */
  getPackages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: SubscriptionPackageQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await subscriptionService.getPackages(queryParams);

      res.json({
        success: true,
        data: {
          packages: result.packages,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active packages for public display
   */
  getActivePackages: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const packages = await subscriptionService.getActivePackages();

      res.json({
        success: true,
        data: packages,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update package
   */
  updatePackage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updatedPackage = await subscriptionService.updatePackage(id, req.body, req.user.userId);

      if (!updatedPackage) {
        throw new AppError(404, 'Subscription package not found');
      }

      res.json({
        success: true,
        data: updatedPackage,
        message: 'Subscription package updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Soft delete package
   */
  deletePackage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const deleted = await subscriptionService.deletePackage(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Subscription package not found');
      }

      res.json({
        success: true,
        message: 'Subscription package deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // ========================
  // SUBSCRIPTION MANAGEMENT
  // ========================

  /**
   * Subscribe a society to a package
   */
  subscribeSociety: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const result = await subscriptionService.subscribeSociety(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Society subscribed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Cancel society subscription
   */
  cancelSubscription: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.params.societyId as string;
      const { remarks } = req.body;

      const result = await subscriptionService.cancelSubscription(
        societyId,
        remarks,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Subscription cancelled successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get subscription history for a society
   */
  getSubscriptionHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const societyId = req.params.societyId as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await subscriptionService.getSubscriptionHistory(societyId, page, limit);

      res.json({
        success: true,
        data: {
          history: result.history,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
