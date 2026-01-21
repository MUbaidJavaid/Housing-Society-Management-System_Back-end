import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { projectController } from '../index-project';

const router: Router = Router();

// Public routes
router.get('/', projectController.getProjects);
router.get('/summary', projectController.getProjectSummary);
router.get('/dropdown', projectController.getProjectsForDropdown);
router.get('/:id/stats', projectController.getProjectStats);
router.get('/:id', projectController.getProject);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  projectController.createProject
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  projectController.updateProject
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  projectController.deleteProject
);

export default router;
