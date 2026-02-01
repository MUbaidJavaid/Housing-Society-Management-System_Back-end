import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { UserRole } from '../../database/models/User';
import { billTypeController } from '../controllers/controller-bill-type';
import {
  validateBulkUpdateStatus,
  validateCalculateAmount,
  validateCreateBillType,
  validateGetBillTypes,
  validateUpdateBillType,
} from '../validators/validator-bill-type';

const router: Router = Router();

// Public routes (read-only access to active bill types)
router.get('/active', billTypeController.getActiveBillTypes);
router.get('/recurring', billTypeController.getRecurringBillTypes);
router.get('/dropdown', billTypeController.getBillTypesDropdown);
router.get('/category/:category', billTypeController.getBillTypesByCategory);
router.get('/search', billTypeController.searchBillTypes);

// Protected routes (Admin/Finance Officer)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateBillType(),
  validateRequest,
  billTypeController.createBillType
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetBillTypes(),
  validateRequest,
  billTypeController.getBillTypes
);

router.get(
  '/statistics',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  billTypeController.getBillTypeStatistics
);

router.get(
  '/name/:name',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  billTypeController.getBillTypeByName
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Bill Type ID'),
  validateRequest,
  billTypeController.getBillType
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Bill Type ID'),
  validateUpdateBillType(),
  validateRequest,
  billTypeController.updateBillType
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Bill Type ID'),
  validateRequest,
  billTypeController.deleteBillType
);

// Calculation route
router.get(
  '/:billTypeId/calculate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('billTypeId').isMongoId().withMessage('Invalid Bill Type ID'),
  validateCalculateAmount(),
  validateRequest,
  billTypeController.calculateAmount
);

// Validation route
router.get(
  '/:id/validate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Bill Type ID'),
  validateRequest,
  billTypeController.validateConfiguration
);

// Bulk operations
router.post(
  '/bulk/update-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkUpdateStatus(),
  validateRequest,
  billTypeController.bulkUpdateStatus
);

export default router;
