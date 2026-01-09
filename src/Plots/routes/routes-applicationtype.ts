import { Router } from 'express';
import { srApplicationTypeController } from '../index-applicationtype';
import { authenticate, requireRole, UserRole } from '@/auth';

const router: Router = Router();

// Public routes
router.get('/', srApplicationTypeController.getSrApplicationTypes);
router.get('/all', srApplicationTypeController.getAllSrApplicationTypes);
router.get('/:id', srApplicationTypeController.getSrApplicationType);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srApplicationTypeController.createSrApplicationType
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srApplicationTypeController.updateSrApplicationType
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srApplicationTypeController.deleteSrApplicationType
);

export default router;
