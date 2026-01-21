import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { srApplicationTypeController } from '../index-applicationtype';

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
