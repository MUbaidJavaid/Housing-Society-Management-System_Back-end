import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { emergencyController } from '../controllers/controller-emergency';
import {
  validateTriggerAlert,
  validateRespondToAlert,
  validateResolveAlert,
  validateAlertHistory,
  validateUpsertMedicalProfile,
  validateIdParam,
  validateFalseAlarm,
} from '../validators/validator-emergency';

const router: Router = Router();

// Trigger emergency alert (any authenticated user)
router.post(
  '/trigger',
  authenticate,
  validateTriggerAlert(),
  validateRequest,
  emergencyController.triggerAlert
);

// Get active alerts for user's society
router.get(
  '/active',
  authenticate,
  emergencyController.getActiveAlerts
);

// Get alert history with pagination
router.get(
  '/history',
  authenticate,
  validateAlertHistory(),
  validateRequest,
  emergencyController.getAlertHistory
);

// Get own medical profile
router.get(
  '/medical-profile',
  authenticate,
  emergencyController.getMedicalProfile
);

// Update own medical profile
router.put(
  '/medical-profile',
  authenticate,
  validateUpsertMedicalProfile(),
  validateRequest,
  emergencyController.upsertMedicalProfile
);

// Get all medical profiles (admin/super_admin for emergency use)
router.get(
  '/medical-profiles',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  emergencyController.getAllMedicalProfiles
);

// Get alert by ID
router.get(
  '/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  emergencyController.getAlertById
);

// Respond to alert
router.post(
  '/:id/respond',
  authenticate,
  validateRespondToAlert(),
  validateRequest,
  emergencyController.respondToAlert
);

// Resolve alert (admin/super_admin)
router.post(
  '/:id/resolve',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateResolveAlert(),
  validateRequest,
  emergencyController.resolveAlert
);

// Mark as false alarm (admin/super_admin)
router.post(
  '/:id/false-alarm',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateFalseAlarm(),
  validateRequest,
  emergencyController.markFalseAlarm
);

export default router;
