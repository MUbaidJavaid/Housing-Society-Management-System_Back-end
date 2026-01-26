import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { salesStatusController } from '../controllers/controller-salesstatus';
import {
  validateBulkUpdateStatuses,
  validateCreateSalesStatus,
  validateGetSalesStatuses,
  validateReorderStatuses,
  validateStatusTransition,
  validateUpdateSalesStatus,
} from '../validators/validator-salesstatus';

const router: Router = Router();

// Public routes
router.get('/', validateGetSalesStatuses, salesStatusController.getSalesStatuses);
router.get('/active', salesStatusController.getActiveSalesStatuses);
router.get('/default', salesStatusController.getDefaultSalesStatus);
router.get('/type/:type', salesStatusController.getStatusesByType);
router.get('/sales-allowed', salesStatusController.getSalesAllowedStatuses);
router.get('/stats/summary', salesStatusController.getSalesStatusStatistics);
router.get('/:id', salesStatusController.getSalesStatus);
router.get('/code/:code', salesStatusController.getSalesStatusByCode);
router.get('/:id/workflow', salesStatusController.getStatusWorkflow);
router.get('/:id/next-statuses', salesStatusController.getNextStatuses);
router.get('/:id/check-sales-allowed', salesStatusController.checkSalesAllowed);
router.get('/:id/check-requires-approval', salesStatusController.checkRequiresApproval);

// Validation endpoints (public)
router.post(
  '/validate-transition',
  validateStatusTransition,
  salesStatusController.validateStatusTransition
);

// Protected routes (admin/super admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateSalesStatus,
  salesStatusController.createSalesStatus
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateSalesStatus,
  salesStatusController.updateSalesStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  salesStatusController.deleteSalesStatus
);

// Status management routes
router.patch(
  '/:id/toggle-active',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  salesStatusController.toggleStatusActive
);

router.patch(
  '/:id/sequence',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  salesStatusController.updateStatusSequence
);

// Bulk operations
router.post(
  '/reorder',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateReorderStatuses,
  salesStatusController.reorderStatuses
);

router.post(
  '/bulk-update',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkUpdateStatuses,
  salesStatusController.bulkUpdateStatuses
);

export default router;
