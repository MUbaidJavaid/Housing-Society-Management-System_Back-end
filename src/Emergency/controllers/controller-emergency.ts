import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { emergencyService } from '../services/service-emergency';
import { AlertHistoryParams } from '../types/types-emergency';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const emergencyController = {
  /**
   * Trigger emergency alert
   */
  triggerAlert: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const alert = await emergencyService.triggerAlert(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: alert,
        message: 'Emergency alert triggered successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active alerts
   */
  getActiveAlerts: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string || (req.user as any).societyId;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const alerts = await emergencyService.getActiveAlerts(societyId);

      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get alert history
   */
  getAlertHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params: AlertHistoryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        societyId: req.query.societyId as string,
        alertType: req.query.alertType as string,
        severity: req.query.severity as string,
        status: req.query.status as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await emergencyService.getAlertHistory(params);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get alert by ID
   */
  getAlertById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = await emergencyService.getAlertById(req.params.id as string);

      res.json({
        success: true,
        data: alert,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Respond to alert
   */
  respondToAlert: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { action } = req.body;
      const alert = await emergencyService.respondToAlert(
        req.params.id as string,
        req.user.userId,
        action
      );

      res.json({
        success: true,
        data: alert,
        message: 'Response recorded successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Resolve alert
   */
  resolveAlert: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { notes } = req.body;
      const alert = await emergencyService.resolveAlert(
        req.params.id as string,
        req.user.userId,
        notes
      );

      res.json({
        success: true,
        data: alert,
        message: 'Alert resolved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Mark alert as false alarm
   */
  markFalseAlarm: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const alert = await emergencyService.markFalseAlarm(req.params.id as string, req.user.userId);

      res.json({
        success: true,
        data: alert,
        message: 'Alert marked as false alarm',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get own medical profile
   */
  getMedicalProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const profile = await emergencyService.getMedicalProfile(req.user.userId.toString());

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update own medical profile
   */
  upsertMedicalProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const profile = await emergencyService.upsertMedicalProfile(
        req.user.userId.toString(),
        req.body
      );

      res.json({
        success: true,
        data: profile,
        message: 'Medical profile updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all medical profiles for a society (admin use)
   */
  getAllMedicalProfiles: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string || (req.user as any).societyId;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const profiles = await emergencyService.getEmergencyContacts(societyId);

      res.json({
        success: true,
        data: profiles,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
