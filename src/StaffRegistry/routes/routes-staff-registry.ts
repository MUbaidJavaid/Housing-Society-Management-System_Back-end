import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { staffRegistryController } from '../controllers/controller-staff-registry';
import {
  validateCreateStaff,
  validateUpdateStaff,
  validateVerifyStaff,
  validateAddEmployment,
  validateEndEmployment,
  validateRateStaff,
  validateBlacklistStaff,
  validateCnicParam,
  validateSocietyIdParam,
  validateIdParam,
  validateListQuery,
} from '../validator/validator-staff-registry';

const router: Router = Router();

// GET /search/cnic/:cnic - CNIC lookup (must be before /:id routes)
router.get(
  '/search/cnic/:cnic',
  authenticate,
  validateCnicParam(),
  validateRequest,
  staffRegistryController.searchByCNIC
);

// GET /society/:societyId - Staff in a society (must be before /:id routes)
router.get(
  '/society/:societyId',
  authenticate,
  validateSocietyIdParam(),
  validateRequest,
  staffRegistryController.getStaffBySociety
);

// POST / - Register staff
router.post(
  '/',
  authenticate,
  validateCreateStaff(),
  validateRequest,
  staffRegistryController.registerStaff
);

// GET / - List staff (cross-society search)
router.get(
  '/',
  authenticate,
  validateListQuery(),
  validateRequest,
  staffRegistryController.getStaffMembers
);

// GET /:id - Get staff by ID
router.get(
  '/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  staffRegistryController.getStaffById
);

// PUT /:id - Update staff
router.put(
  '/:id',
  authenticate,
  validateUpdateStaff(),
  validateRequest,
  staffRegistryController.updateStaff
);

// DELETE /:id - Delete staff (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  staffRegistryController.deleteStaff
);

// POST /:id/verify - Verify staff
router.post(
  '/:id/verify',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateVerifyStaff(),
  validateRequest,
  staffRegistryController.verifyStaff
);

// POST /:id/employ - Add employment
router.post(
  '/:id/employ',
  authenticate,
  validateAddEmployment(),
  validateRequest,
  staffRegistryController.addEmployment
);

// POST /:id/end-employment - End employment with rating
router.post(
  '/:id/end-employment',
  authenticate,
  validateEndEmployment(),
  validateRequest,
  staffRegistryController.endEmployment
);

// POST /:id/rate - Rate staff
router.post(
  '/:id/rate',
  authenticate,
  validateRateStaff(),
  validateRequest,
  staffRegistryController.rateStaff
);

// POST /:id/blacklist - Blacklist staff
router.post(
  '/:id/blacklist',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBlacklistStaff(),
  validateRequest,
  staffRegistryController.blacklistStaff
);

export default router;
