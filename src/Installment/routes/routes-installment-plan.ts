import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { UserRole } from '../../database/models/User';
import { installmentPlanController } from '../controllers/controller-installment-plan';
import {
  validateCreateInstallmentPlan,
  validateGetInstallmentPlans,
  validateSearchInstallmentPlans,
  validateUpdateInstallmentPlan,
} from '../validator/validator-installment-plan';

const router: Router = Router();

// Public routes (dashboard summary - no auth)
router.get(
  '/dashboard-summary',
  installmentPlanController.getDashboardSummary
);

// Protected routes (Admin/Super Admin)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateInstallmentPlan(),
  validateRequest,
  installmentPlanController.createInstallmentPlan
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetInstallmentPlans(),
  validateRequest,
  installmentPlanController.getInstallmentPlans
);

router.get(
  '/search',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateSearchInstallmentPlans(),
  validateRequest,
  installmentPlanController.searchInstallmentPlans
);

router.get(
  '/by-project/:projId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('projId').isMongoId().withMessage('Invalid Project ID'),
  validateRequest,
  installmentPlanController.getInstallmentPlansByProject
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment Plan ID'),
  validateRequest,
  installmentPlanController.getInstallmentPlanById
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment Plan ID'),
  validateUpdateInstallmentPlan(),
  validateRequest,
  installmentPlanController.updateInstallmentPlan
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment Plan ID'),
  validateRequest,
  installmentPlanController.deleteInstallmentPlan
);

export default router;
