import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../../middleware/error.middleware';
import UserPermission from '../../UserPermissions/models/models-userpermission';
import { getCachedPermissions, setCachedPermissions, CachedPermissionEntry } from './permission-cache';

type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'export' | 'import' | 'approve' | 'verify';

const actionToField: Record<PermissionAction, keyof CachedPermissionEntry> = {
  read: 'canRead',
  create: 'canCreate',
  update: 'canUpdate',
  delete: 'canDelete',
  export: 'canExport',
  import: 'canImport',
  approve: 'canApprove',
  verify: 'canVerify',
};

async function loadPermissions(roleId: string): Promise<Map<string, CachedPermissionEntry>> {
  // Check cache first
  const cached = getCachedPermissions(roleId);
  if (cached) return cached;

  // Query database
  const permissions = await UserPermission.find({
    roleId,
    isActive: true,
    isDeleted: false,
  }).populate('srModuleId', 'moduleCode moduleName');

  const permMap = new Map<string, CachedPermissionEntry>();

  for (const perm of permissions) {
    const moduleCode = (perm.srModuleId as any)?.moduleCode;
    if (!moduleCode) continue;

    permMap.set(moduleCode, {
      canRead: perm.canRead || false,
      canCreate: perm.canCreate || false,
      canUpdate: perm.canUpdate || false,
      canDelete: perm.canDelete || false,
      canExport: perm.canExport || false,
      canImport: perm.canImport || false,
      canApprove: perm.canApprove || false,
      canVerify: perm.canVerify || false,
    });
  }

  // Cache the result
  setCachedPermissions(roleId, permMap);
  return permMap;
}

/**
 * Middleware: Check if user has a specific module permission from the database.
 * Falls back to role-based check if user has no roleId (backward compat).
 * SUPER_ADMIN always bypasses.
 */
export function requireModulePermission(moduleCode: string, action: PermissionAction) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      // SUPER_ADMIN bypass
      if (req.user.role === 'super_admin') {
        return next();
      }

      const roleId = req.user.roleId;

      if (!roleId) {
        // Backward compatibility: if no roleId, use role-based check
        // ADMIN gets full access, MODERATOR gets read+create+update, USER gets read only
        const roleDefaults: Record<string, PermissionAction[]> = {
          admin: ['read', 'create', 'update', 'delete', 'export', 'import', 'approve', 'verify'],
          moderator: ['read', 'create', 'update'],
          accountant: ['read', 'create', 'update'],
          user: ['read'],
          member: ['read'],
        };
        const allowed = roleDefaults[req.user.role] || [];
        if (!allowed.includes(action)) {
          throw new AppError(403, `You do not have ${action} permission for ${moduleCode}`);
        }
        return next();
      }

      // Load permissions from DB (with caching)
      const permissions = await loadPermissions(roleId);
      const modulePerm = permissions.get(moduleCode);

      if (!modulePerm) {
        throw new AppError(403, `No permissions configured for module: ${moduleCode}`);
      }

      const field = actionToField[action];
      if (!modulePerm[field]) {
        throw new AppError(403, `You do not have ${action} permission for ${moduleCode}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: Check if user has ANY of the listed permissions
 */
export function requireAnyPermission(checks: Array<{ module: string; action: PermissionAction }>) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');
      if (req.user.role === 'super_admin') return next();

      const roleId = req.user.roleId;
      if (!roleId) return next(); // backward compat: allow if no dynamic role

      const permissions = await loadPermissions(roleId);

      const hasAny = checks.some(({ module: mod, action }) => {
        const modulePerm = permissions.get(mod);
        if (!modulePerm) return false;
        return modulePerm[actionToField[action]];
      });

      if (!hasAny) {
        throw new AppError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware: Check if user has ALL listed permissions
 */
export function requireAllPermissions(checks: Array<{ module: string; action: PermissionAction }>) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');
      if (req.user.role === 'super_admin') return next();

      const roleId = req.user.roleId;
      if (!roleId) return next();

      const permissions = await loadPermissions(roleId);

      const hasAll = checks.every(({ module: mod, action }) => {
        const modulePerm = permissions.get(mod);
        if (!modulePerm) return false;
        return modulePerm[actionToField[action]];
      });

      if (!hasAll) {
        throw new AppError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
