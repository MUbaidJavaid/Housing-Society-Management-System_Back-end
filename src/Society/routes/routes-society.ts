import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { societyController } from '../controllers/controller-society';
import {
  validateCreateSociety,
  validateGetSocieties,
  validateSocietyIdParam,
  validateUpdateSociety,
} from '../validators/validator-society';

const router: Router = Router();

// List societies (SUPER_ADMIN sees all, ADMIN sees own)
router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetSocieties(),
  validateRequest,
  societyController.getSocieties
);

// Get society by ID
router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateSocietyIdParam(),
  validateRequest,
  societyController.getSociety
);

// Get society statistics
router.get(
  '/:id/stats',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateSocietyIdParam(),
  validateRequest,
  societyController.getSocietyStats
);

// Check society limits
router.get(
  '/:id/limits',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateSocietyIdParam(),
  validateRequest,
  societyController.checkSocietyLimits
);

// Create society (SUPER_ADMIN only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validateCreateSociety(),
  validateRequest,
  societyController.createSociety
);

// Update society (SUPER_ADMIN, ADMIN for own)
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateSociety(),
  validateRequest,
  societyController.updateSociety
);

// Toggle society active status (SUPER_ADMIN only)
router.patch(
  '/:id/toggle-status',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validateSocietyIdParam(),
  validateRequest,
  societyController.toggleSocietyStatus
);

// Soft delete society (SUPER_ADMIN only)
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validateSocietyIdParam(),
  validateRequest,
  societyController.deleteSociety
);

export default router;
