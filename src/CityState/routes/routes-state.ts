import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { stateController } from '../index-state';

const router: Router = Router();

// Public routes
router.get('/', stateController.getStates);
router.get('/summary', stateController.getStateSummary);
router.get('/all', stateController.getAllStates);
router.get('/:id/cities', stateController.getStateWithCities);
router.get('/:id', stateController.getState);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  stateController.createState
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  stateController.updateState
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  stateController.deleteState
);

export default router;
