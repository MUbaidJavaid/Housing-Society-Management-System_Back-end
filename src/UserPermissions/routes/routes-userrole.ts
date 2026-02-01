import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';

import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { userRoleController } from '../index-userrole';
import {
  validateCreateUserRole,
  validateGetUserRoles,
  validateRoleCodeParam,
  validateUpdateUserRole,
} from '../validators/validator-userrole';

const router: Router = Router();

// Public routes
router.get('/', validateGetUserRoles(), validateRequest, userRoleController.getUserRoles);

router.get('/statistics', userRoleController.getUserRoleStatistics);

router.get('/hierarchy', userRoleController.getRoleHierarchy);

router.get('/search', userRoleController.searchRoles);

router.get('/active', userRoleController.getActiveRoles);

router.get('/with-user-count', userRoleController.getRolesWithUserCount);

router.get(
  '/code/:roleCode',
  validateRoleCodeParam(),
  validateRequest,
  userRoleController.getRoleByCode
);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid Role ID'),
  validateRequest,
  userRoleController.getUserRole
);

// Protected routes (Admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateUserRole(),
  validateRequest,
  userRoleController.createUserRole
);

router.post(
  '/bulk-update',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest,
  userRoleController.bulkUpdateRoles
);

router.post(
  '/initialize-defaults',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  userRoleController.initializeDefaultRoles
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateUserRole(),
  validateRequest,
  userRoleController.updateUserRole
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Role ID'),
  validateRequest,
  userRoleController.toggleRoleStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Role ID'),
  validateRequest,
  userRoleController.deleteUserRole
);

export default router;
