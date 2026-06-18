import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { gatePassController } from '../controllers/controller-gate-pass';
import {
  validateCreateGatePass,
  validateUpdateGatePass,
  validateRejectPass,
  validateCheckIn,
  validateCheckOut,
  validatePassCode,
  validateIdParam,
  validateListQuery,
} from '../validator/validator-gate-pass';

const router: Router = Router();

// GET /my-passes - Get my passes (must be before /:id)
router.get(
  '/my-passes',
  authenticate,
  gatePassController.getMyPasses
);

// GET /today - Get today's passes (must be before /:id)
router.get(
  '/today',
  authenticate,
  gatePassController.getTodaysPasses
);

// GET /stats - Get pass stats (must be before /:id)
router.get(
  '/stats',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  gatePassController.getPassStats
);

// GET /verify/:code - Verify pass code (must be before /:id)
router.get(
  '/verify/:code',
  authenticate,
  validatePassCode(),
  validateRequest,
  gatePassController.verifyPassCode
);

// POST / - Create gate pass
router.post(
  '/',
  authenticate,
  validateCreateGatePass(),
  validateRequest,
  gatePassController.create
);

// GET / - List gate passes
router.get(
  '/',
  authenticate,
  validateListQuery(),
  validateRequest,
  gatePassController.getAll
);

// GET /:id - Get gate pass by ID
router.get(
  '/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  gatePassController.getById
);

// PUT /:id - Update gate pass
router.put(
  '/:id',
  authenticate,
  validateUpdateGatePass(),
  validateRequest,
  gatePassController.update
);

// DELETE /:id - Delete gate pass (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  gatePassController.delete
);

// POST /:id/approve - Approve gate pass
router.post(
  '/:id/approve',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  gatePassController.approvePass
);

// POST /:id/reject - Reject gate pass
router.post(
  '/:id/reject',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRejectPass(),
  validateRequest,
  gatePassController.rejectPass
);

// POST /:id/check-in - Check in (guard)
router.post(
  '/:id/check-in',
  authenticate,
  validateCheckIn(),
  validateRequest,
  gatePassController.checkIn
);

// POST /:id/check-out - Check out (guard)
router.post(
  '/:id/check-out',
  authenticate,
  validateCheckOut(),
  validateRequest,
  gatePassController.checkOut
);

// POST /:id/cancel - Cancel gate pass
router.post(
  '/:id/cancel',
  authenticate,
  validateIdParam(),
  validateRequest,
  gatePassController.cancelPass
);

export default router;
