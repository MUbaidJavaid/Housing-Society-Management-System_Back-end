import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { gamificationController } from '../controllers/controller-gamification';
import {
  validateAwardPoints,
  validateCreateReward,
  validateGetHistory,
  validateGetLeaderboard,
  validateGetPoints,
  validateGetRedemptions,
  validateIdParam,
  validateRedeemReward,
  validateRedemptionAction,
  validateRejectRedemption,
  validateUpdateReward,
} from '../validator/validator-gamification';

const router: Router = Router();

// Points routes
router.get(
  '/points',
  authenticate,
  validateGetPoints(),
  validateRequest,
  gamificationController.getPoints
);

router.get(
  '/history',
  authenticate,
  validateGetHistory(),
  validateRequest,
  gamificationController.getHistory
);

router.get(
  '/leaderboard',
  authenticate,
  validateGetLeaderboard(),
  validateRequest,
  gamificationController.getLeaderboard
);

router.post(
  '/award',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateAwardPoints(),
  validateRequest,
  gamificationController.awardPoints
);

// Reward routes
router.get(
  '/rewards',
  authenticate,
  gamificationController.getRewards
);

router.post(
  '/rewards',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateReward(),
  validateRequest,
  gamificationController.createReward
);

router.put(
  '/rewards/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateReward(),
  validateRequest,
  gamificationController.updateReward
);

router.delete(
  '/rewards/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  gamificationController.deleteReward
);

// Redemption routes
router.post(
  '/redeem',
  authenticate,
  validateRedeemReward(),
  validateRequest,
  gamificationController.redeemReward
);

router.get(
  '/redemptions',
  authenticate,
  validateGetRedemptions(),
  validateRequest,
  gamificationController.getRedemptions
);

router.post(
  '/redemptions/:id/approve',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRedemptionAction(),
  validateRequest,
  gamificationController.approveRedemption
);

router.post(
  '/redemptions/:id/reject',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRejectRedemption(),
  validateRequest,
  gamificationController.rejectRedemption
);

router.post(
  '/redemptions/:id/fulfill',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRedemptionAction(),
  validateRequest,
  gamificationController.fulfillRedemption
);

export default router;
