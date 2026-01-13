import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { plotBlockController } from '../controllers/controller-plotblock';

const router: Router = Router();

// Public routes
router.get('/', plotBlockController.getPlotBlocks);
router.get('/:id', plotBlockController.getPlotBlock);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotBlockController.createPlotBlock
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotBlockController.updatePlotBlock
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  plotBlockController.deletePlotBlock
);

export default router;
