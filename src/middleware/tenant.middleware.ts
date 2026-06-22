import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/types';
import { AppError } from './error.middleware';
import { UserRole } from '../database/models/User';
import Society, { ISociety } from '../Society/models/models-society';

/**
 * Extended request with tenant context
 */
export interface TenantRequest extends AuthRequest {
  societyId?: string;
  society?: ISociety;
  isImpersonating?: boolean;
  originalUser?: AuthRequest['user'];
}

/**
 * Extracts societyId from the authenticated user's JWT payload
 * and attaches it to the request. Super admins can override via query param or header.
 */
export const extractTenant = (req: TenantRequest, _res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      // Super admin can access any society via query param or header
      if (req.user.role === UserRole.SUPER_ADMIN) {
        const overrideSocietyId =
          (req.headers['x-society-id'] as string) ||
          (req.query.societyId as string);
        if (overrideSocietyId) {
          req.societyId = overrideSocietyId;
        }
      } else if (req.user.societyId) {
        req.societyId = req.user.societyId;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Requires a societyId on the request. Use after extractTenant.
 * Super admins are exempted unless forceForSuperAdmin is true.
 */
export const requireTenant = (options?: { forceForSuperAdmin?: boolean }) => {
  return (req: TenantRequest, _res: Response, next: NextFunction) => {
    // Super admin without society context is OK for global operations
    if (
      !options?.forceForSuperAdmin &&
      req.user?.role === UserRole.SUPER_ADMIN &&
      !req.societyId
    ) {
      return next();
    }

    if (!req.societyId) {
      return next(new AppError(403, 'Society context is required for this operation'));
    }
    next();
  };
};

/**
 * Loads full society document and validates it is active.
 * Attaches society object to req.society for downstream use.
 */
export const loadTenantContext = async (
  req: TenantRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.societyId) return next();

    const society = await Society.findOne({
      _id: req.societyId,
      isDeleted: false,
    }).lean();

    if (!society) {
      return next(new AppError(404, 'Society not found or has been deleted'));
    }

    if (!society.isActive) {
      return next(new AppError(403, 'This society has been deactivated. Contact support.'));
    }

    req.society = society as unknown as ISociety;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Requires the caller to be a Super Admin.
 */
export const requireSuperAdmin = (req: TenantRequest, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
    return next(new AppError(403, 'Super Admin access required'));
  }
  next();
};

/**
 * Helper to add societyId filter to a query object (for use in services).
 * If the user is a Super Admin without a societyId, returns the query unscoped
 * so they can see data across all tenants.
 */
export const scopeQuery = (
  query: Record<string, any>,
  req: TenantRequest,
): Record<string, any> => {
  // Super admin without society context = cross-tenant query
  if (req.user?.role === UserRole.SUPER_ADMIN && !req.societyId) {
    return { ...query, isDeleted: false };
  }
  if (req.societyId) {
    return { ...query, societyId: req.societyId, isDeleted: false };
  }
  return { ...query, isDeleted: false };
};

/**
 * Mongoose plugin: automatically adds societyId to every find/count/update/delete query
 * when a societyId is set on the query options. Use this on tenant-scoped schemas.
 *
 * Usage in model:
 *   schema.plugin(tenantPlugin);
 *
 * Then in controller/service:
 *   Model.find({}, null, { societyId: req.societyId })
 */
export function tenantPlugin(schema: any) {
  const tenantOps = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'countDocuments',
    'updateMany',
    'updateOne',
    'deleteMany',
    'deleteOne',
  ];

  for (const op of tenantOps) {
    schema.pre(op, function (this: any) {
      const opts = this.getOptions?.() || {};
      if (opts.societyId) {
        this.where({ societyId: opts.societyId });
      }
      // Always exclude soft-deleted unless explicitly overridden
      if (opts.includeDeleted !== true) {
        this.where({ isDeleted: { $ne: true } });
      }
    });
  }
}
