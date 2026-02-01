import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { UserRole } from '../../database/models/User';
import { srTransferTypeController } from '../controllers/controller-transfer-type';
import {
  validateBulkUpdateStatus,
  validateCalculateFee,
  validateCreateTransferType,
  validateGetTransferTypes,
  validateUpdateFeesPercentage,
  validateUpdateTransferType,
} from '../validators/validator-transfer-type';

const router: Router = Router();

// Public routes
router.get('/active', srTransferTypeController.getActiveTransferTypes);
router.get('/dropdown', srTransferTypeController.getTransferTypesDropdown);
router.get('/common-types', srTransferTypeController.getCommonTransferTypes);
router.get('/search', srTransferTypeController.searchTransferTypes);
router.get('/statistics', srTransferTypeController.getTransferTypeStatistics);
router.get('/summary', srTransferTypeController.getTransferTypeSummary);

// Protected routes (Admin/Legal Officer)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateTransferType(),
  validateRequest,
  srTransferTypeController.createTransferType
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetTransferTypes(),
  validateRequest,
  srTransferTypeController.getTransferTypes
);

router.get(
  '/name/:name',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srTransferTypeController.getTransferTypeByName
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer Type ID'),
  validateRequest,
  srTransferTypeController.getTransferType
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer Type ID'),
  validateUpdateTransferType(),
  validateRequest,
  srTransferTypeController.updateTransferType
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer Type ID'),
  validateRequest,
  srTransferTypeController.deleteTransferType
);

// Calculation route
router.get(
  '/:transferTypeId/calculate-fee',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('transferTypeId').isMongoId().withMessage('Invalid Transfer Type ID'),
  validateCalculateFee(),
  validateRequest,
  srTransferTypeController.calculateFee
);

// Validation route
router.get(
  '/:id/validate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Transfer Type ID'),
  validateRequest,
  srTransferTypeController.validateConfiguration
);

// Bulk operations
router.post(
  '/bulk/update-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkUpdateStatus(),
  validateRequest,
  srTransferTypeController.bulkUpdateStatus
);

// Fee adjustment route
router.post(
  '/update-fees-percentage',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateFeesPercentage(),
  validateRequest,
  srTransferTypeController.updateFeesByPercentage
);

export default router;
