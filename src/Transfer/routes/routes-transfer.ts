import { Router } from 'express';
import { param } from 'express-validator';
import multer from 'multer';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { UserRole } from '../../database/models/User';
import { srTransferController } from '../controllers/controller-transfer';
import {
  validateCreateTransfer,
  validateExecuteTransfer,
  validateGetTransfers,
  validateRecordFeePayment,
  validateUpdateTransfer,
} from '../validators/validator-transfer';

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/statistics', srTransferController.getTransferStatistics);
router.get('/dashboard-summary', srTransferController.getDashboardSummary);
router.get('/overdue', srTransferController.getOverdueTransfers);
router.get('/requiring-action', srTransferController.getTransfersRequiringAction);

// Protected routes (Admin/Legal Officer)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateTransfer(),
  validateRequest,
  srTransferController.createTransfer
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetTransfers(),
  validateRequest,
  srTransferController.getTransfers
);

router.get(
  '/file/:fileId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('fileId').isMongoId().withMessage('Invalid File ID'),
  validateRequest,
  srTransferController.getTransfersByFile
);

router.get(
  '/member/:memId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('memId').isMongoId().withMessage('Invalid Member ID'),
  validateRequest,
  srTransferController.getTransfersByMember
);

router.get(
  '/pending',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srTransferController.getPendingTransfers
);

router.get(
  '/search',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srTransferController.searchTransfers
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer ID'),
  validateRequest,
  srTransferController.getTransfer
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer ID'),
  validateUpdateTransfer(),
  validateRequest,
  srTransferController.updateTransfer
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer ID'),
  validateRequest,
  srTransferController.deleteTransfer
);

// Fee payment route
router.post(
  '/:id/pay-fee',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer ID'),
  validateRecordFeePayment(),
  validateRequest,
  srTransferController.recordFeePayment
);

// NDC document upload route
router.post(
  '/:id/upload-ndc',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  upload.single('ndcDocument'),
  param('id').isMongoId().withMessage('Invalid Transfer ID'),
  validateRequest,
  srTransferController.uploadNDCDocument
);

// Execution route (with witnesses and officer)
router.post(
  '/:id/execute',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer ID'),
  validateExecuteTransfer(),
  validateRequest,
  srTransferController.executeTransfer
);

// Timeline route
router.get(
  '/:id/timeline',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer ID'),
  validateRequest,
  srTransferController.getTransferTimeline
);

// Validation route
router.get(
  '/:id/validate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer ID'),
  validateRequest,
  srTransferController.validateTransferForCompletion
);

// Bulk operations
router.post(
  '/bulk/update-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srTransferController.bulkUpdateStatus
);

export default router;
