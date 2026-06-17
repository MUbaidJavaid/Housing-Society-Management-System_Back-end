import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/types';
import { AppError } from './error.middleware';
import Society from '../Society/models/models-society';

/**
 * Checks if a specific module/feature is enabled for the society
 */
export const requireFeature = (featureName: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const societyId = (req as any).societyId;
      if (!societyId) {
        return next(); // No tenant context, skip check (backward compat)
      }

      const society = await Society.findById(societyId).select('enabledModules subscriptionStatus');
      if (!society) {
        return next(new AppError(404, 'Society not found'));
      }

      if (society.subscriptionStatus === 'expired' || society.subscriptionStatus === 'suspended') {
        return next(new AppError(403, 'Your subscription is ' + society.subscriptionStatus + '. Please renew to access this feature.'));
      }

      if (!society.enabledModules.includes(featureName)) {
        return next(new AppError(403, `The "${featureName}" module is not enabled for your society. Please upgrade your subscription.`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Checks resource count limits based on subscription
 */
export const checkLimit = (resource: 'members' | 'projects' | 'staff' | 'plots') => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const societyId = (req as any).societyId;
      if (!societyId) {
        return next(); // No tenant context, skip
      }

      const society = await Society.findById(societyId).select('maxMembers maxProjects maxStaff');
      if (!society) {
        return next(new AppError(404, 'Society not found'));
      }

      const limitMap: Record<string, { max: number; model: string; countField: string }> = {
        members: { max: society.maxMembers, model: 'Member', countField: 'societyId' },
        projects: { max: society.maxProjects, model: 'Project', countField: 'societyId' },
        staff: { max: society.maxStaff, model: 'UserStaff', countField: 'societyId' },
        plots: { max: 9999, model: 'Plot', countField: 'societyId' },
      };

      const config = limitMap[resource];
      if (!config) return next();

      const mongoose = require('mongoose');
      const Model = mongoose.model(config.model);
      const count = await Model.countDocuments({ [config.countField]: societyId, isDeleted: false });

      if (count >= config.max) {
        return next(new AppError(403, `You have reached the maximum limit of ${config.max} ${resource} for your subscription plan. Please upgrade to add more.`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
