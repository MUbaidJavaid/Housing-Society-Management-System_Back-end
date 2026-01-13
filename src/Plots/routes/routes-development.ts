import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { developmentController } from '../index-development';

const router: Router = Router();

// Public routes
router.get('/', developmentController.getDevelopments);
router.get('/summary', developmentController.getDevelopmentSummary);
router.get('/plot/:plotId', developmentController.getDevelopmentByPlot);
router.get('/:id', developmentController.getDevelopment);

// Protected routes (admin/moderator)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  developmentController.createDevelopment
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  developmentController.updateDevelopment
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  developmentController.deleteDevelopment
);

export default router;
