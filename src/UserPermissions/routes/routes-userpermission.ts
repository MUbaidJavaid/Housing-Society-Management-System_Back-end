import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';

import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { userPermissionController } from '../index-userpermission';
import {
  validateBulkPermissionUpdate,
  validateCheckPermission,
  validateCopyPermissions,
  validateCreateUserPermission,
  validateGetByRoleAndModule,
  validateGetUserPermissions,
  validateModuleIdParam,
  validateRoleIdParam,
  validateSetPermissions,
  validateUpdateUserPermission,
} from '../validators/validator-userpermission';

const router: Router = Router();

// Public routes
router.get(
  '/',
  validateGetUserPermissions(),
  validateRequest,
  userPermissionController.getUserPermissions
);

router.get('/statistics', userPermissionController.getUserPermissionStatistics);

router.get(
  '/check',
  validateCheckPermission(),
  validateRequest,
  userPermissionController.checkPermission
);

router.get(
  '/by-role-module',
  validateGetByRoleAndModule(),
  validateRequest,
  userPermissionController.getPermissionByRoleAndModule
);

// Role-based routes
router.get(
  '/role/:roleId',
  validateRoleIdParam(),
  validateRequest,
  userPermissionController.getPermissionsByRole
);

router.get(
  '/role/:roleId/summary',
  validateRoleIdParam(),
  validateRequest,
  userPermissionController.getRolePermissionsSummary
);

router.get(
  '/role/:roleId/map',
  validateRoleIdParam(),
  validateRequest,
  userPermissionController.getRolePermissionsMap
);

// Module-based routes
router.get(
  '/module/:srModuleId',
  validateModuleIdParam(),
  validateRequest,
  userPermissionController.getPermissionsByModule
);

router.get(
  '/module/:srModuleId/summary',
  validateModuleIdParam(),
  validateRequest,
  userPermissionController.getModulePermissionsSummary
);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid Permission ID'),
  validateRequest,
  userPermissionController.getUserPermission
);

// Protected routes (Admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateUserPermission(),
  validateRequest,
  userPermissionController.createUserPermission
);

router.post(
  '/set',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateSetPermissions(),
  validateRequest,
  userPermissionController.setPermissions
);

router.post(
  '/copy',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCopyPermissions(),
  validateRequest,
  userPermissionController.copyPermissions
);

router.post(
  '/bulk-update',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkPermissionUpdate(),
  validateRequest,
  userPermissionController.bulkUpdatePermissions
);

router.post(
  '/initialize-defaults',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  userPermissionController.initializeDefaultPermissions
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateUserPermission(),
  validateRequest,
  userPermissionController.updateUserPermission
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Permission ID'),
  validateRequest,
  userPermissionController.togglePermissionStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Permission ID'),
  validateRequest,
  userPermissionController.deleteUserPermission
);

export default router;
