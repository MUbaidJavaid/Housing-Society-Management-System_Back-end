import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { applicationController } from '../controllers/controller-application';
import {
  validateCreateApplication,
  validateGetApplications,
  validateUpdateApplication,
} from '../validators/validator-application';

const router: Router = Router();

// Public routes
router.get('/', validateGetApplications(), applicationController.getApplications);
router.get('/summary', applicationController.getApplicationSummary);
router.get('/recent', applicationController.getRecentApplications);
router.get('/type/:typeId', applicationController.getApplicationsByType);
router.get('/:id', applicationController.getApplication);

// Protected routes
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  validateCreateApplication(),
  applicationController.createApplication
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  validateUpdateApplication(),
  applicationController.updateApplication
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  applicationController.deleteApplication
);

export default router;
