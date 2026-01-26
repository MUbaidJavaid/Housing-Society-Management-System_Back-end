import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { projectController } from '../controllers/controller-project';
import {
  validateBulkUpdateStatus,
  validateCreateProject,
  validateGetProjects,
  validateLocationSearch,
  validatePlotCountUpdate,
  validateUpdateProject,
  validateUpdateProjectStatus,
} from '../validator/validator-project';

const router: Router = Router();

// Public routes
router.get('/', validateGetProjects, projectController.getProjects);
router.get('/active', projectController.getActiveProjects);
router.get('/statistics', projectController.getProjectStatistics);
router.get('/code/:code', projectController.getProjectByCode);
router.get('/city/id/:cityId', projectController.getProjectsByCityId);
router.get('/city/name/:cityName', projectController.getProjectsByCityName);
router.get('/status/:status', projectController.getProjectsByStatus);
router.get('/location/near', validateLocationSearch, projectController.searchProjectsNearLocation);
router.get('/low-availability', projectController.getProjectsWithLowAvailability);

// Protected routes (require authentication)
// router.use(authenticate);

// Project CRUD operations
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validateCreateProject,
  projectController.createProject
);

router.get('/:id', projectController.getProject);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validateUpdateProject,
  projectController.updateProject
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  projectController.deleteProject
);

// Project status management
router.patch(
  '/:id/toggle-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  projectController.toggleProjectStatus
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validateUpdateProjectStatus,
  projectController.updateProjectStatus
);

router.post(
  '/bulk/status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validateBulkUpdateStatus,
  projectController.bulkUpdateProjectStatus
);

// Plot management
router.get('/:id/next-plot-number', projectController.generateNextPlotNumber);
router.get('/:id/timeline', projectController.getProjectTimeline);

router.post(
  '/:id/plots/increment',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validatePlotCountUpdate,
  projectController.incrementPlotCount
);

router.post(
  '/:id/plots/decrement',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validatePlotCountUpdate,
  projectController.decrementPlotCount
);

export default router;
