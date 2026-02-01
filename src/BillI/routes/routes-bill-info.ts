import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { UserRole } from '../../database/models/User';
import { billInfoController } from '../controllers/controller-bill-info';
import {
  validateBillNoParam,
  validateCreateBillInfo,
  validateFileIdParam,
  validateGenerateBills,
  validateGetBills,
  validateMemIdParam,
  validateRecordPayment,
  validateUpdateBillInfo,
} from '../validators/validator-bill-info';

const router: Router = Router();

// Public routes
router.get('/statistics', billInfoController.getBillStatistics);
router.get('/dashboard-summary', billInfoController.getDashboardSummary);
router.get('/overdue', billInfoController.getOverdueBills);

// Protected routes (Admin/Finance Officer)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateBillInfo(),
  validateRequest,
  billInfoController.createBill
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetBills(),
  validateRequest,
  billInfoController.getBills
);

router.get(
  '/bill-no/:billNo',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBillNoParam(),
  validateRequest,
  billInfoController.getBillByNumber
);

router.get(
  '/member/:memId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateMemIdParam(),
  validateRequest,
  billInfoController.getBillsByMember
);

router.get(
  '/member/:memId/summary',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateMemIdParam(),
  validateRequest,
  billInfoController.getMemberBillsSummary
);

router.get(
  '/file/:fileId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateFileIdParam(),
  validateRequest,
  billInfoController.getBillsByFile
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Bill ID'),
  validateRequest,
  billInfoController.getBill
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Bill ID'),
  validateUpdateBillInfo(),
  validateRequest,
  billInfoController.updateBill
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Bill ID'),
  validateRequest,
  billInfoController.deleteBill
);

// Payment and generation routes
router.post(
  '/:id/record-payment',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Bill ID'),
  validateRecordPayment(),
  validateRequest,
  billInfoController.recordPayment
);

router.post(
  '/generate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGenerateBills(),
  validateRequest,
  billInfoController.generateBills
);

// Admin only routes
router.post(
  '/apply-fine-overdue',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest,
  billInfoController.applyFineForOverdue
);

export default router;
