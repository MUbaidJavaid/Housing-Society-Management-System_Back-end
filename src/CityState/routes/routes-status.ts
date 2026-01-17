// routes-status.ts
import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { statusController } from '../index-status';

const router: Router = Router();

// Public routes
router.get('/', statusController.getStatusList); // Updated method name
router.get('/all', statusController.getAllStatus);
router.get('/:id', statusController.getStatusById); // Updated method name

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
