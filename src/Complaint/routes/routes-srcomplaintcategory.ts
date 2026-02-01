import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';

import { srComplaintCategoryController } from '../index-srcomplaintcategory';
import { validateRequest } from '../middleware/validation.middleware';
import {
  validateBulkStatusUpdate,
  validateCategoryCodeParam,
  validateCreateSrComplaintCategory,
  validateGetByPriority,
  validateGetSrComplaintCategories,
  validateImportCategories,
  validateSearchCategories,
  validateUpdateSrComplaintCategory,
} from '../validators/validator-srcomplaintcategory';

const router: Router = Router();

// Public routes
router.get(
  '/',
  validateGetSrComplaintCategories(),
  validateRequest,
  srComplaintCategoryController.getSrComplaintCategories
);

router.get('/active', srComplaintCategoryController.getActiveSrComplaintCategories);

router.get('/high-priority', srComplaintCategoryController.getHighPriorityCategories);

router.get('/urgent-sla', srComplaintCategoryController.getUrgentSlaCategories);

router.get('/statistics', srComplaintCategoryController.getSrComplaintCategoryStatistics);

router.get('/dropdown', srComplaintCategoryController.getCategoriesForDropdown);

router.get(
  '/search',
  validateSearchCategories(),
  validateRequest,
  srComplaintCategoryController.searchCategories
);

router.get(
  '/by-priority',
  validateGetByPriority(),
  validateRequest,
  srComplaintCategoryController.getCategoriesByPriority
);

router.get(
  '/code/:code',
  validateCategoryCodeParam(),
  validateRequest,
  srComplaintCategoryController.getSrComplaintCategoryByCode
);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid ID'),
  validateRequest,
  srComplaintCategoryController.getSrComplaintCategory
);

// Protected routes (Admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateSrComplaintCategory(),
  validateRequest,
  srComplaintCategoryController.createSrComplaintCategory
);

router.post(
  '/import',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateImportCategories(),
  validateRequest,
  srComplaintCategoryController.importCategories
);

router.post(
  '/bulk-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkStatusUpdate(),
  validateRequest,
  srComplaintCategoryController.bulkUpdateCategoryStatus
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateSrComplaintCategory(),
  validateRequest,
  srComplaintCategoryController.updateSrComplaintCategory
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid ID'),
  validateRequest,
  srComplaintCategoryController.toggleCategoryStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid ID'),
  validateRequest,
  srComplaintCategoryController.deleteSrComplaintCategory
);

export default router;
