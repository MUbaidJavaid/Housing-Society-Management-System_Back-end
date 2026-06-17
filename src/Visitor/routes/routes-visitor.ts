import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { visitorController } from '../index-visitor';
import {
  validateCheckIn,
  validateCheckOut,
  validateCreateVisitor,
  validateGetVisitors,
  validatePreApprove,
  validateUpdateVisitor,
  validateVerifyPassCode,
} from '../validators/validator-visitor';

// Create a local validateRequest function to avoid circular dependencies
import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    const formattedErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');
    const error = new Error(`Validation failed: ${formattedErrors}`);
    (error as any).statusCode = 400;
    throw error;
  }
  next();
};

const router: Router = Router();

// Pre-approve a visitor pass (any authenticated user / member)
router.post(
  '/pre-approve',
  authenticate,
  validatePreApprove(),
  validateRequest,
  visitorController.preApprove
);

// Get currently checked-in (active) visitors
router.get(
  '/active',
  authenticate,
  visitorController.getActiveVisitors
);

// Get visitor statistics (admin only)
router.get(
  '/stats',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  visitorController.getVisitorStats
);

// Expire stale visitors (admin only)
router.post(
  '/expire-stale',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  visitorController.expireStaleVisitors
);

// Verify a pass code
router.get(
  '/verify/:passCode',
  authenticate,
  validateVerifyPassCode(),
  validateRequest,
  visitorController.verifyPassCode
);

// Get all visitors with pagination and filters
router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  validateGetVisitors(),
  validateRequest,
  visitorController.getVisitors
);

// Create a new visitor
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  validateCreateVisitor(),
  validateRequest,
  visitorController.createVisitor
);

// Get visitor by ID
router.get(
  '/:id',
  authenticate,
  visitorController.getVisitor
);

// Update a visitor
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  validateUpdateVisitor(),
  validateRequest,
  visitorController.updateVisitor
);

// Soft delete a visitor
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  visitorController.deleteVisitor
);

// Check in a visitor
router.post(
  '/:id/check-in',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  validateCheckIn(),
  validateRequest,
  visitorController.checkIn
);

// Check out a visitor
router.post(
  '/:id/check-out',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  validateCheckOut(),
  validateRequest,
  visitorController.checkOut
);

// Cancel a visit
router.post(
  '/:id/cancel',
  authenticate,
  visitorController.cancelVisit
);

export default router;
