import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { UserRole } from '../../database/models/User';
import { defaulterController } from '../controllers/controller-defaulter';
import {
  validateCreateDefaulter,
  validateGetDefaulters,
  validateMemIdParam,
  validatePlotIdParam,
  validateResolveDefaulter,
  validateSendNotice,
  validateUpdateDefaulter,
  validateUpdateStatus,
} from '../validators/validator-defaulter';

const router: Router = Router();

// Public routes (some statistics can be public)
router.get('/statistics', defaulterController.getDefaulterStatistics);
router.get('/overdue-summary', defaulterController.getOverdueSummary);
router.get('/active-count', defaulterController.getActiveDefaultersCount);

// Protected routes (Admin/Finance Officer)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateDefaulter(),
  validateRequest,
  defaulterController.createDefaulter
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetDefaulters(),
  validateRequest,
  defaulterController.getDefaulters
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Defaulter ID'),
  validateRequest,
  defaulterController.getDefaulter
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Defaulter ID'),
  validateUpdateDefaulter(),
  validateRequest,
  defaulterController.updateDefaulter
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Defaulter ID'),
  validateRequest,
  defaulterController.deleteDefaulter
);

// Member-specific routes
router.get(
  '/member/:memId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateMemIdParam(),
  validateRequest,
  defaulterController.getDefaultersByMember
);

// Plot-specific routes
router.get(
  '/plot/:plotId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validatePlotIdParam(),
  validateRequest,
  defaulterController.getDefaultersByPlot
);

// Notice and resolution routes
router.post(
  '/:id/send-notice',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Defaulter ID'),
  validateSendNotice(),
  validateRequest,
  defaulterController.sendNotice
);

router.post(
  '/:id/resolve',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Defaulter ID'),
  validateResolveDefaulter(),
  validateRequest,
  defaulterController.resolveDefaulter
);

// Bulk operations
router.post(
  '/bulk/update-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateStatus(),
  validateRequest,
  defaulterController.bulkUpdateStatus
);

export default router;
