import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';

import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { registryController } from '../index-registry';
import {
  validateCreateRegistry,
  validateGetRegistries,
  validateMemIdParam,
  validateMutationNoParam,
  validatePlotIdParam,
  validateRegistryNoParam,
  validateUpdateRegistry,
  validateVerification,
  validateYearParam,
} from '../validators/validator-registry';

const router: Router = Router();

// Public routes
router.get('/', validateGetRegistries(), validateRequest, registryController.getRegistries);

router.get('/statistics', registryController.getRegistryStatistics);

router.get('/timeline', registryController.getRegistryTimeline);

router.get('/search', registryController.searchRegistries);

router.get('/pending-verifications', registryController.getPendingVerifications);

router.get(
  '/registry-no/:registryNo',
  validateRegistryNoParam(),
  validateRequest,
  registryController.getRegistryByNumber
);

router.get(
  '/mutation-no/:mutationNo',
  validateMutationNoParam(),
  validateRequest,
  registryController.getRegistryByMutationNo
);

router.get(
  '/plot/:plotId',
  validatePlotIdParam(),
  validateRequest,
  registryController.getRegistriesByPlot
);

router.get(
  '/member/:memId',
  validateMemIdParam(),
  validateRequest,
  registryController.getRegistriesByMember
);

router.get(
  '/year/:year',
  validateYearParam(),
  validateRequest,
  registryController.getRegistriesByYear
);

router.get('/sub-registrar/:subRegistrarName', registryController.getRegistriesBySubRegistrar);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid Registry ID'),
  validateRequest,
  registryController.getRegistry
);

// Protected routes (Admin/Registry Officer)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateRegistry(),
  validateRequest,
  registryController.createRegistry
);

router.post(
  '/bulk-update',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest,
  registryController.bulkUpdateRegistries
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateRegistry(),
  validateRequest,
  registryController.updateRegistry
);

router.patch(
  '/:id/verify',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Registry ID'),
  validateVerification(),
  validateRequest,
  registryController.verifyRegistryDocument
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Registry ID'),
  validateRequest,
  registryController.deleteRegistry
);

export default router;
