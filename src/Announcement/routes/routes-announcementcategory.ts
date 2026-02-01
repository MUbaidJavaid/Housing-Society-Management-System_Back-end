import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';

import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { announcementCategoryController } from '../index-announcementcategory';
import {
  validateCategoryNameParam,
  validateCreateAnnouncementCategory,
  validateGetAnnouncementCategories,
  validateUpdateAnnouncementCategory,
} from '../validators/validator-announcementcategory';

const router: Router = Router();

// Public routes
router.get(
  '/',
  validateGetAnnouncementCategories(),
  validateRequest,
  announcementCategoryController.getAnnouncementCategories
);

router.get('/statistics', announcementCategoryController.getAnnouncementCategoryStatistics);

router.get('/active', announcementCategoryController.getActiveCategories);

router.get(
  '/with-announcement-count',
  announcementCategoryController.getCategoriesWithAnnouncementCount
);

router.get('/search', announcementCategoryController.searchCategories);

router.get(
  '/name/:categoryName',
  validateCategoryNameParam(),
  validateRequest,
  announcementCategoryController.getCategoryByName
);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid Category ID'),
  validateRequest,
  announcementCategoryController.getAnnouncementCategory
);

// Protected routes (Admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateAnnouncementCategory(),
  validateRequest,
  announcementCategoryController.createAnnouncementCategory
);

router.post(
  '/bulk-update',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest,
  announcementCategoryController.bulkUpdateCategories
);

router.post(
  '/initialize-defaults',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  announcementCategoryController.initializeDefaultCategories
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateAnnouncementCategory(),
  validateRequest,
  announcementCategoryController.updateAnnouncementCategory
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Category ID'),
  validateRequest,
  announcementCategoryController.toggleCategoryStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Category ID'),
  validateRequest,
  announcementCategoryController.deleteAnnouncementCategory
);

export default router;
