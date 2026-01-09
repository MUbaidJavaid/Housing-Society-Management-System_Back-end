import { authenticate, requireRole, UserRole } from '@/auth';
import { Router } from 'express';
import { plotSizeController } from '../index-plotsize';

const router: Router = Router();

// Public routes
router.get('/', plotSizeController.getPlotSizes);
router.get('/all', plotSizeController.getAllPlotSizes); // Simple list for dropdowns
router.get('/:id', plotSizeController.getPlotSize);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotSizeController.createPlotSize
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotSizeController.updatePlotSize
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotSizeController.deletePlotSize
);

export default router;
