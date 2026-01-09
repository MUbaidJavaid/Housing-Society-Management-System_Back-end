import { Router } from 'express';
import { plotController } from '../index-plot';
import { authenticate, requireRole, UserRole } from '@/auth';

const router: Router = Router();

// Public routes
router.get('/', plotController.getPlots);
router.get('/summary', plotController.getPlotSummary);
router.get('/filter-options', plotController.getFilterOptions);
router.get('/:id', plotController.getPlot);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotController.createPlot
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotController.updatePlot
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotController.deletePlot
);

export default router;
