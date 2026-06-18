import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { attendanceController } from '../controllers/controller-attendance';
import {
  validateCheckIn,
  validateCheckOut,
  validateCreateGeofence,
  validateGetAttendance,
  validateGetSocietySummary,
  validateGetSummary,
  validateIdParam,
  validateUpdateGeofence,
} from '../validator/validator-attendance';

const router: Router = Router();

// Attendance routes
router.post(
  '/check-in',
  authenticate,
  validateCheckIn(),
  validateRequest,
  attendanceController.checkIn
);

router.post(
  '/check-out',
  authenticate,
  validateCheckOut(),
  validateRequest,
  attendanceController.checkOut
);

router.get(
  '/',
  authenticate,
  validateGetAttendance(),
  validateRequest,
  attendanceController.getAttendance
);

router.get(
  '/summary',
  authenticate,
  validateGetSummary(),
  validateRequest,
  attendanceController.getSummary
);

router.get(
  '/society-summary',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetSocietySummary(),
  validateRequest,
  attendanceController.getSocietySummary
);

// Geofence routes (must be before /:id to avoid route conflicts)
router.get(
  '/geofences',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  attendanceController.getGeofences
);

router.post(
  '/geofences',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateGeofence(),
  validateRequest,
  attendanceController.createGeofence
);

router.put(
  '/geofences/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateGeofence(),
  validateRequest,
  attendanceController.updateGeofence
);

router.delete(
  '/geofences/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  attendanceController.deleteGeofence
);

// Get by ID (must be after all named routes)
router.get(
  '/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  attendanceController.getAttendanceById
);

export default router;
