import { Router } from 'express';
import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { parkingController } from '../controllers/controller-parking';
import {
  validateAssignSpot,
  validateCancelPass,
  validateCreateSpot,
  validateGetPasses,
  validateGetSpots,
  validateIssuePass,
  validateToggleRent,
  validateUnassignSpot,
  validateUpdateSpot,
  validateVerifyPass,
} from '../validator/validator-parking';

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

// ── Stats ──
router.get(
  '/stats',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  parkingController.getStats
);

// ── Passes ──
router.get(
  '/passes/verify/:code',
  authenticate,
  validateVerifyPass(),
  validateRequest,
  parkingController.verifyPass
);

router.get(
  '/passes',
  authenticate,
  validateGetPasses(),
  validateRequest,
  parkingController.getPasses
);

router.post(
  '/passes',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  validateIssuePass(),
  validateRequest,
  parkingController.issuePass
);

router.get(
  '/passes/:id',
  authenticate,
  parkingController.getPass
);

router.post(
  '/passes/:id/cancel',
  authenticate,
  validateCancelPass(),
  validateRequest,
  parkingController.cancelPass
);

router.post(
  '/passes/expire-old',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  parkingController.expireOldPasses
);

// ── Spots ──
router.get(
  '/spots',
  authenticate,
  validateGetSpots(),
  validateRequest,
  parkingController.getSpots
);

router.post(
  '/spots',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateSpot(),
  validateRequest,
  parkingController.createSpot
);

router.get(
  '/spots/:id',
  authenticate,
  parkingController.getSpot
);

router.put(
  '/spots/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateSpot(),
  validateRequest,
  parkingController.updateSpot
);

router.delete(
  '/spots/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  parkingController.deleteSpot
);

router.post(
  '/spots/:id/assign',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateAssignSpot(),
  validateRequest,
  parkingController.assignSpot
);

router.post(
  '/spots/:id/unassign',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUnassignSpot(),
  validateRequest,
  parkingController.unassignSpot
);

router.post(
  '/spots/:id/rent',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MEMBER),
  validateToggleRent(),
  validateRequest,
  parkingController.toggleRent
);

export default router;
