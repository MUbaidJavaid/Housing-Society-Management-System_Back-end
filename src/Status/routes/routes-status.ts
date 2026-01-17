import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { statusController } from '../index-status';

const router: Router = Router();

// Public routes
router.get('/', statusController.getStatuses);
router.get('/types', statusController.getAllStatusTypes);
router.get('/summary', statusController.getStatusSummary);
router.get('/type/:type', statusController.getStatusesByType);
router.get('/:id', statusController.getStatus);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  statusController.createStatus
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  statusController.updateStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  statusController.deleteStatus
);

export default router;
