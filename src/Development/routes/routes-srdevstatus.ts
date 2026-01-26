import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { srDevStatusController } from '../controllers/controller-srdevstatus';
import {
  validateBulkUpdateStatuses,
  validateCreateSrDevStatus,
  validateGetSrDevStatuses,
  validateProjectProgress,
  validateReorderStatuses,
  validateStatusTransition,
  validateUpdateSrDevStatus,
} from '../validators/validator-srdevstatus';

const router: Router = Router();

// Public routes
router.get('/', validateGetSrDevStatuses, srDevStatusController.getSrDevStatuses);
router.get('/active', srDevStatusController.getActiveSrDevStatuses);
router.get('/default', srDevStatusController.getDefaultSrDevStatus);
router.get('/category/:category', srDevStatusController.getStatusesByCategory);
router.get('/phase/:phase', srDevStatusController.getStatusesByPhase);
router.get('/workflow', srDevStatusController.getDevelopmentWorkflow);
router.get('/phases-progress', srDevStatusController.getDevelopmentPhasesProgress);
router.get('/stats/summary', srDevStatusController.getSrDevStatusStatistics);
router.get('/:id', srDevStatusController.getSrDevStatus);
router.get('/code/:code', srDevStatusController.getSrDevStatusByCode);
router.get('/:id/next-statuses', srDevStatusController.getNextLogicalStatuses);
router.get('/:id/check-documentation', srDevStatusController.checkRequiresDocumentation);
router.get('/:id/estimated-completion', srDevStatusController.getEstimatedCompletion);
router.get('/project/:projectId/timeline', srDevStatusController.getDevelopmentTimeline);

// Validation endpoints (public)
router.post(
  '/validate-transition',
  validateStatusTransition,
  srDevStatusController.validateStatusTransition
);
router.post(
  '/calculate-progress',
  validateProjectProgress,
  srDevStatusController.calculateProjectProgress
);

// Protected routes (admin/super admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateSrDevStatus,
  srDevStatusController.createSrDevStatus
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateSrDevStatus,
  srDevStatusController.updateSrDevStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srDevStatusController.deleteSrDevStatus
);

// Status management routes
router.patch(
  '/:id/toggle-active',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srDevStatusController.toggleStatusActive
);

router.patch(
  '/:id/sequence',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srDevStatusController.updateStatusSequence
);

// Bulk operations
router.post(
  '/reorder',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateReorderStatuses,
  srDevStatusController.reorderStatuses
);

router.post(
  '/bulk-update',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkUpdateStatuses,
  srDevStatusController.bulkUpdateStatuses
);

export default router;
