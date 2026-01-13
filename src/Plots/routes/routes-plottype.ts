import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { plotTypeController } from '../index-plottype';

const router: Router = Router();

// Public routes
router.get('/', plotTypeController.getPlotTypes);
router.get('/all', plotTypeController.getAllPlotTypes); // Simple list for dropdowns
router.get('/:id', plotTypeController.getPlotType);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotTypeController.createPlotType
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotTypeController.updatePlotType
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotTypeController.deletePlotType
);

export default router;
