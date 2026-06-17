import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { facilityBookingController } from '../controllers/controller-facility-booking';
import {
  validateBookingIdParam,
  validateCancelBooking,
  validateCheckAvailability,
  validateCreateBooking,
  validateGetBookings,
  validateGetBookingStats,
} from '../validators/validator-facility-booking';

const router: Router = Router();

// GET /stats/summary - Get booking stats (ADMIN) - must be before /:id
router.get(
  '/stats/summary',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetBookingStats(),
  validateRequest,
  facilityBookingController.getBookingStats
);

// GET /my-bookings - Get own bookings (authenticated)
router.get(
  '/my-bookings',
  authenticate,
  validateGetBookings(),
  validateRequest,
  facilityBookingController.getMyBookings
);

// GET /availability - Check availability (authenticated)
router.get(
  '/availability',
  authenticate,
  validateCheckAvailability(),
  validateRequest,
  facilityBookingController.checkAvailability
);

// POST / - Create booking (authenticated)
router.post(
  '/',
  authenticate,
  validateCreateBooking(),
  validateRequest,
  facilityBookingController.createBooking
);

// GET / - Get all bookings (ADMIN)
router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetBookings(),
  validateRequest,
  facilityBookingController.getBookings
);

// GET /:id - Get booking by ID (authenticated)
router.get(
  '/:id',
  authenticate,
  validateBookingIdParam(),
  validateRequest,
  facilityBookingController.getBooking
);

// POST /:id/approve - Approve booking (ADMIN)
router.post(
  '/:id/approve',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBookingIdParam(),
  validateRequest,
  facilityBookingController.approveBooking
);

// POST /:id/cancel - Cancel booking (authenticated)
router.post(
  '/:id/cancel',
  authenticate,
  validateCancelBooking(),
  validateRequest,
  facilityBookingController.cancelBooking
);

// POST /:id/complete - Complete booking (ADMIN)
router.post(
  '/:id/complete',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBookingIdParam(),
  validateRequest,
  facilityBookingController.completeBooking
);

export default router;
