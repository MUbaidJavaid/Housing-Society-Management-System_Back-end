import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';

import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { srModuleController } from '../index-srmodule';
import {
  validateBulkStatusUpdate,
  validateCreateSrModule,
  validateGetSrModules,
  validateImportModules,
  validateModuleCodeParam,
  validateReorderModules,
  validateSearchModules,
  validateSetDefaultStatus,
  validateUpdatePermissions,
  validateUpdateSrModule,
} from '../validators/validator-srmodule';

const router: Router = Router();

// Public routes
router.get('/', validateGetSrModules(), validateRequest, srModuleController.getSrModules);

router.get('/active', srModuleController.getActiveSrModules);

router.get('/sidebar', srModuleController.getSidebarModules);

router.get('/dropdown', srModuleController.getModulesForDropdown);

router.get('/default', srModuleController.getDefaultModules);

router.get('/statistics', srModuleController.getSrModuleStatistics);

router.get('/hierarchy', srModuleController.getModuleHierarchy);

router.get('/search', validateSearchModules(), validateRequest, srModuleController.searchModules);

router.get(
  '/parent/:parentModuleId',
  param('parentModuleId').isMongoId().withMessage('Invalid Parent Module ID'),
  validateRequest,
  srModuleController.getSubmodulesByParent
);

router.get('/permission/:permission', srModuleController.getModulesByPermission);

router.get(
  '/code/:code',
  validateModuleCodeParam(),
  validateRequest,
  srModuleController.getSrModuleByCode
);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid ID'),
  validateRequest,
  srModuleController.getSrModule
);

// Protected routes (Admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateSrModule(),
  validateRequest,
  srModuleController.createSrModule
);

router.post(
  '/import',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateImportModules(),
  validateRequest,
  srModuleController.importModules
);

router.post(
  '/bulk-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkStatusUpdate(),
  validateRequest,
  srModuleController.bulkUpdateModuleStatus
);

router.post(
  '/reorder',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateReorderModules(),
  validateRequest,
  srModuleController.reorderModules
);

router.post(
  '/initialize-defaults',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  srModuleController.initializeDefaultModules
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateSrModule(),
  validateRequest,
  srModuleController.updateSrModule
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid ID'),
  validateRequest,
  srModuleController.toggleModuleStatus
);

router.patch(
  '/:id/permissions',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdatePermissions(),
  validateRequest,
  srModuleController.updateModulePermissions
);

router.patch(
  '/:id/default-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateSetDefaultStatus(),
  validateRequest,
  srModuleController.setModuleDefaultStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid ID'),
  validateRequest,
  srModuleController.deleteSrModule
);

export default router;
