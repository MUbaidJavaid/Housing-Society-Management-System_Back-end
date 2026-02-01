import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { UserRole } from '../../database/models/User';
import { installmentController } from '../controllers/controller-installment';
import {
  validateBulkInstallments,
  validateBulkUpdateStatus,
  validateCreateInstallment,
  validateGetInstallments,
  validatePaymentValidation,
  validateRecordPayment,
  validateReportParams,
  validateUpdateInstallment,
} from '../validator/validator-installment';

const router: Router = Router();

// Public routes (some dashboard and summary routes)
router.get('/dashboard-summary', installmentController.getDashboardSummary);
router.get('/overdue', installmentController.getOverdueInstallments);
router.get('/due-today', installmentController.getDueTodayInstallments);
router.get(
  '/report',
  validateReportParams(),
  validateRequest,
  installmentController.generateReport
);

// Protected routes (Admin/Finance Officer)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateInstallment(),
  validateRequest,
  installmentController.createInstallment
);

router.post(
  '/bulk',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkInstallments(),
  validateRequest,
  installmentController.createBulkInstallments
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetInstallments(),
  validateRequest,
  installmentController.getInstallments
);

router.get(
  '/file/:fileId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('fileId').isMongoId().withMessage('Invalid File ID'),
  validateRequest,
  installmentController.getInstallmentsByFile
);

router.get(
  '/member/:memId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('memId').isMongoId().withMessage('Invalid Member ID'),
  validateRequest,
  installmentController.getInstallmentsByMember
);

router.get(
  '/plot/:plotId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('plotId').isMongoId().withMessage('Invalid Plot ID'),
  validateRequest,
  installmentController.getInstallmentsByPlot
);

router.get(
  '/member/:memId/summary',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('memId').isMongoId().withMessage('Invalid Member ID'),
  validateRequest,
  installmentController.getInstallmentSummary
);

router.get(
  '/member/:memId/next-due',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('memId').isMongoId().withMessage('Invalid Member ID'),
  validateRequest,
  installmentController.getNextDueInstallment
);

router.get(
  '/search',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  installmentController.searchInstallments
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment ID'),
  validateRequest,
  installmentController.getInstallment
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment ID'),
  validateUpdateInstallment(),
  validateRequest,
  installmentController.updateInstallment
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment ID'),
  validateRequest,
  installmentController.deleteInstallment
);

// Payment routes
router.post(
  '/:id/payment',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment ID'),
  validateRecordPayment(),
  validateRequest,
  installmentController.recordPayment
);

router.get(
  '/:id/validate-payment',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Installment ID'),
  validatePaymentValidation(),
  validateRequest,
  installmentController.validatePayment
);

// Bulk operations
router.post(
  '/bulk/update-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkUpdateStatus(),
  validateRequest,
  installmentController.bulkUpdateStatus
);

export default router;
