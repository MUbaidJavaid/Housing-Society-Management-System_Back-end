import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { facilityController } from '../controllers/controller-facility';
import {
  validateCreateFacility,
  validateGetFacilities,
  validateUpdateFacility,
} from '../validators/validator-facility';

const router: Router = Router();

// GET / - Get all facilities (authenticated)
router.get(
  '/',
  authenticate,
  validateGetFacilities(),
  validateRequest,
  facilityController.getFacilities
);

// GET /:id - Get facility by ID (authenticated)
router.get(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid Facility ID'),
  validateRequest,
  facilityController.getFacility
);

// POST / - Create facility (ADMIN, SUPER_ADMIN)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateFacility(),
  validateRequest,
  facilityController.createFacility
);

// PUT /:id - Update facility (ADMIN, SUPER_ADMIN)
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateFacility(),
  validateRequest,
  facilityController.updateFacility
);

// DELETE /:id - Delete facility (ADMIN, SUPER_ADMIN)
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Facility ID'),
  validateRequest,
  facilityController.deleteFacility
);

// PATCH /:id/toggle-status - Toggle facility status (ADMIN, SUPER_ADMIN)
router.patch(
  '/:id/toggle-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Facility ID'),
  validateRequest,
  facilityController.toggleFacilityStatus
);

export default router;
