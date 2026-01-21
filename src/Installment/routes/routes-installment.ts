import { Router } from 'express';

import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import {
  installmentController,
  validateCreateInstallment,
  validateGenerateInstallments,
  validateGetInstallments,
  validateMakePayment,
  validateUpdateInstallment,
} from '../index-installment';

const router: Router = Router();

// Public routes
router.get('/', validateGetInstallments(), installmentController.getInstallments);
router.get('/summary', installmentController.getInstallmentSummary);
router.get('/upcoming', installmentController.getUpcomingInstallments);
router.get('/overdue', installmentController.getOverdueInstallments);
router.get('/member/:memberId/summary', installmentController.getMemberInstallmentSummary);
router.get('/member/:memberId', installmentController.getInstallmentsByMember);
router.get('/plot/:plotId', installmentController.getInstallmentsByPlot);
router.get('/:id', installmentController.getInstallment);

// Protected routes (authenticated users)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT),
  validateCreateInstallment(),
  installmentController.createInstallment
);

router.post(
  '/generate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT),
  validateGenerateInstallments(),
  installmentController.generateInstallments
);

router.post(
  '/:id/payment',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT),
  validateMakePayment(),
  installmentController.makePayment
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT),
  validateUpdateInstallment(),
  installmentController.updateInstallment
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  installmentController.deleteInstallment
);

export default router;
