import { Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { TenantRequest } from './tenant.middleware';
import Society from '../Society/models/models-society';
import SubscriptionPackage from '../Subscription/models/models-subscription-package';
import { UserRole } from '../database/models/User';

/**
 * Checks if a specific module/feature is enabled for the society.
 * Super Admins always bypass.
 */
export const requireFeature = (featureName: string) => {
  return async (req: TenantRequest, _res: Response, next: NextFunction) => {
    try {
      // Super admin bypass
      if (req.user?.role === UserRole.SUPER_ADMIN) return next();

      const societyId = req.societyId;
      if (!societyId) return next();

      // Use pre-loaded society if available
      const society =
        req.society ||
        (await Society.findById(societyId).select(
          'enabledModules subscriptionStatus subscriptionPlanId subscriptionEndDate',
        ));
      if (!society) {
        return next(new AppError(404, 'Society not found'));
      }

      // Check subscription expiry
      if (
        society.subscriptionStatus === 'expired' ||
        society.subscriptionStatus === 'suspended'
      ) {
        return next(
          new AppError(
            403,
            `Your subscription is ${society.subscriptionStatus}. Please renew to access this feature.`,
          ),
        );
      }

      // Check if subscription has passed its end date
      if (society.subscriptionEndDate && new Date(society.subscriptionEndDate) < new Date()) {
        return next(
          new AppError(403, 'Your subscription has expired. Please renew to continue.'),
        );
      }

      // Check if module is enabled (from subscription plan features or society overrides)
      if (!society.enabledModules.includes(featureName)) {
        return next(
          new AppError(
            403,
            `The "${featureName}" module is not available on your plan. Please upgrade.`,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Checks resource count limits based on subscription plan.
 * Super Admins always bypass.
 */
export const checkLimit = (resource: 'members' | 'projects' | 'staff' | 'plots') => {
  return async (req: TenantRequest, _res: Response, next: NextFunction) => {
    try {
      if (req.user?.role === UserRole.SUPER_ADMIN) return next();

      const societyId = req.societyId;
      if (!societyId) return next();

      const society = await Society.findById(societyId).select(
        'maxMembers maxProjects maxStaff subscriptionPlanId',
      );
      if (!society) {
        return next(new AppError(404, 'Society not found'));
      }

      // If society has a subscription plan, use its limits; otherwise use society-level defaults
      let limits = {
        members: society.maxMembers,
        projects: society.maxProjects,
        staff: society.maxStaff,
        plots: 9999,
      };

      if (society.subscriptionPlanId) {
        const plan = await SubscriptionPackage.findById(society.subscriptionPlanId).select(
          'features',
        );
        if (plan?.features) {
          limits = {
            members: plan.features.maxMembers,
            projects: plan.features.maxProjects,
            staff: plan.features.maxStaff,
            plots: plan.features.maxPlots,
          };
        }
      }

      const modelMap: Record<string, string> = {
        members: 'Member',
        projects: 'Project',
        staff: 'UserStaff',
        plots: 'Plot',
      };

      const mongoose = require('mongoose');
      const Model = mongoose.model(modelMap[resource]);
      const count = await Model.countDocuments({ societyId, isDeleted: false });

      if (count >= limits[resource]) {
        return next(
          new AppError(
            403,
            `You have reached the maximum limit of ${limits[resource]} ${resource}. Please upgrade your plan.`,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
