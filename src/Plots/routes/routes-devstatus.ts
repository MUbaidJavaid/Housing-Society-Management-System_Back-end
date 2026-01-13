import { authenticate, requireRole } from '@/auth/middleware/auth';
import { Router } from 'express';
import { UserRole } from '../../database/models/User';
import { srDevStatusController } from '../index-devstatus';

const router: Router = Router();

// Public routes
router.get('/', srDevStatusController.getSrDevStatuses);
router.get('/all', srDevStatusController.getAllSrDevStatuses);
router.get('/:id', srDevStatusController.getSrDevStatus);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srDevStatusController.createSrDevStatus
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srDevStatusController.updateSrDevStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srDevStatusController.deleteSrDevStatus
);

export default router;
