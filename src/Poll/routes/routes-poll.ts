import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { pollController } from '../controllers/controller-poll';
import {
  validateCreatePoll,
  validateUpdatePoll,
  validateGetPolls,
  validateCastVote,
  validateIdParam,
} from '../validators/validator-poll';

const router: Router = Router();

// Get all polls
router.get(
  '/',
  authenticate,
  validateGetPolls(),
  validateRequest,
  pollController.getAll
);

// Get poll by ID
router.get(
  '/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  pollController.getById
);

// Create poll
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreatePoll(),
  validateRequest,
  pollController.create
);

// Update poll
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdatePoll(),
  validateRequest,
  pollController.update
);

// Delete poll (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  pollController.delete
);

// Cast vote
router.post(
  '/:id/vote',
  authenticate,
  validateCastVote(),
  validateRequest,
  pollController.castVote
);

// Get poll results
router.get(
  '/:id/results',
  authenticate,
  validateIdParam(),
  validateRequest,
  pollController.getResults
);

// Close poll
router.post(
  '/:id/close',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  pollController.closePoll
);

export default router;
