import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';

import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { userStaffController } from '../index-userstaff';
import {
  validateChangePassword,
  validateChangeUserStatus,
  validateCityIdParam,
  validateCreateUserStaff,
  validateGetUserStaffs,
  validateResetPassword,
  validateRoleIdParam,
  validateUpdateUserStaff,
} from '../validators/validator-userstaff';

const router: Router = Router();

// Public routes (authentication/login routes should be separate)
router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetUserStaffs(),
  validateRequest,
  userStaffController.getUserStaffs
);

router.get(
  '/statistics',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  userStaffController.getUserStaffStatistics
);

router.get(
  '/search',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  userStaffController.searchUserStaff
);

router.get(
  '/role/:roleId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRoleIdParam(),
  validateRequest,
  userStaffController.getUsersByRole
);

router.get(
  '/city/:cityId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCityIdParam(),
  validateRequest,
  userStaffController.getUsersByCity
);

router.get(
  '/username/:username',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('username').trim().notEmpty().withMessage('Username is required'),
  validateRequest,
  userStaffController.getUserByUsername
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid User ID'),
  validateRequest,
  userStaffController.getUserStaff
);

// Current user routes
router.get('/me/profile', authenticate, userStaffController.getMyProfile);

router.put('/me/profile', authenticate, userStaffController.updateMyProfile);

router.post(
  '/me/change-password',
  authenticate,
  validateChangePassword(),
  validateRequest,
  userStaffController.changePassword
);

router.get('/me/dashboard', authenticate, userStaffController.getUserDashboardStats);

// Protected routes (Admin only for creation/deletion)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateUserStaff(),
  validateRequest,
  userStaffController.createUserStaff
);

router.post(
  '/bulk-update-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateChangeUserStatus(),
  validateRequest,
  userStaffController.bulkUpdateUserStatus
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateUserStaff(),
  validateRequest,
  userStaffController.updateUserStaff
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid User ID'),
  validateChangeUserStatus(),
  validateRequest,
  userStaffController.changeUserStatus
);

router.patch(
  '/:id/reset-password',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid User ID'),
  validateResetPassword(),
  validateRequest,
  userStaffController.resetPassword
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid User ID'),
  validateRequest,
  userStaffController.deleteUserStaff
);

export default router;
