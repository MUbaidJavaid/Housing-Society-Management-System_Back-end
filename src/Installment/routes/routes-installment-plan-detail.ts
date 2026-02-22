import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { UserRole } from '../../database/models/User';
import { installmentPlanDetailController } from '../controllers/controller-installment-plan-detail';
import {
  validateBulkInstallmentPlanDetails,
  validateCreateInstallmentPlanDetail,
  validateGetInstallmentPlanDetails,
  validateSearchInstallmentPlanDetails,
  validateUpdateInstallmentPlanDetail,
} from '../validator/validator-installment-plan-detail';

const router: Router = Router();

router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateInstallmentPlanDetail(),
  validateRequest,
  installmentPlanDetailController.createInstallmentPlanDetail
);

router.post(
  '/bulk',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkInstallmentPlanDetails(),
  validateRequest,
  installmentPlanDetailController.createBulkInstallmentPlanDetails
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetInstallmentPlanDetails(),
  validateRequest,
  installmentPlanDetailController.getInstallmentPlanDetails
);

router.get(
  '/summary',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  installmentPlanDetailController.getInstallmentPlanDetailSummary
);

router.get(
  '/search',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateSearchInstallmentPlanDetails(),
  validateRequest,
  installmentPlanDetailController.searchInstallmentPlanDetails
);

router.get(
  '/plan/:planId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('planId').isMongoId().withMessage('Invalid Plan ID'),
  validateRequest,
  installmentPlanDetailController.getInstallmentPlanDetailsByPlan
);

router.get(
  '/category/:instCatId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('instCatId').isMongoId().withMessage('Invalid Installment Category ID'),
  validateRequest,
  installmentPlanDetailController.getInstallmentPlanDetailsByCategory
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment Plan Detail ID'),
  validateRequest,
  installmentPlanDetailController.getInstallmentPlanDetailById
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment Plan Detail ID'),
  validateUpdateInstallmentPlanDetail(),
  validateRequest,
  installmentPlanDetailController.updateInstallmentPlanDetail
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment Plan Detail ID'),
  validateRequest,
  installmentPlanDetailController.deleteInstallmentPlanDetail
);

export default router;
