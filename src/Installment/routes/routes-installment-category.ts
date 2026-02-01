import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { UserRole } from '../../database/models/User';
import { installmentCategoryController } from '../controllers/controller-installment-category';
import {
  validateCreateCategory,
  validateGetCategories,
  validateReorderCategories,
  validateSequenceOrder,
  validateUpdateCategory,
} from '../validator/validator-installment-category';

const router: Router = Router();

// Public routes
router.get('/active', installmentCategoryController.getActiveCategories);
router.get('/mandatory', installmentCategoryController.getMandatoryCategories);
router.get('/options', installmentCategoryController.getCategoryOptions);
router.get(
  '/validate-sequence',
  validateSequenceOrder(),
  validateRequest,
  installmentCategoryController.validateSequenceOrder
);

// Protected routes (Admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateCategory(),
  validateRequest,
  installmentCategoryController.createCategory
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetCategories(),
  validateRequest,
  installmentCategoryController.getCategories
);

router.get(
  '/statistics',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  installmentCategoryController.getCategoryStatistics
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Category ID'),
  validateRequest,
  installmentCategoryController.getCategory
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Category ID'),
  validateUpdateCategory(),
  validateRequest,
  installmentCategoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Category ID'),
  validateRequest,
  installmentCategoryController.deleteCategory
);

// Seed default categories
router.post(
  '/seed-default',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  installmentCategoryController.seedDefaultCategories
);

// Reorder categories
router.post(
  '/reorder',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateReorderCategories(),
  validateRequest,
  installmentCategoryController.reorderCategories
);

export default router;
