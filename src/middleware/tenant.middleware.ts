import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/types';
import { AppError } from './error.middleware';
import { UserRole } from '../database/models/User';

/**
 * Extracts societyId from the authenticated user's JWT payload
 * and attaches it to the request. Super admins can override via query param.
 */
export const extractTenant = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      // Super admin can access any society via query param
      if (req.user.role === UserRole.SUPER_ADMIN && req.query.societyId) {
        (req as any).societyId = req.query.societyId as string;
      } else if ((req.user as any).societyId) {
        (req as any).societyId = (req.user as any).societyId;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Requires a societyId on the request. Use after extractTenant.
 */
export const requireTenant = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!(req as any).societyId) {
    return next(new AppError(403, 'Society context is required for this operation'));
  }
  next();
};

/**
 * Helper to add societyId filter to a query object (for use in services)
 */
export const scopeQuery = (query: Record<string, any>, societyId?: string): Record<string, any> => {
  if (societyId) {
    return { ...query, societyId };
  }
  return query;
};
