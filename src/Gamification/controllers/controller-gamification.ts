import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { gamificationService } from '../services/service-gamification';
import { RedemptionQueryParams } from '../types/types-gamification';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const gamificationController = {
  // ==================== Points ====================

  /**
   * Get own points
   */
  getPoints: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const memberId = req.query.memberId as string;
      const societyId = req.query.societyId as string;

      const points = await gamificationService.getPoints(memberId, societyId);

      res.json({
        success: true,
        data: points,
        message: 'Points retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get point history
   */
  getHistory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const memberId = req.query.memberId as string;
      const societyId = req.query.societyId as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await gamificationService.getHistory(memberId, societyId, {
        page,
        limit,
      });

      res.json({
        success: true,
        data: result,
        message: 'Point history retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get leaderboard
   */
  getLeaderboard: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string;
      const period = (req.query.period as string) || 'all-time';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const leaderboard = await gamificationService.getLeaderboard(societyId, {
        period: period as 'monthly' | 'yearly' | 'all-time',
        limit,
      });

      res.json({
        success: true,
        data: leaderboard,
        message: 'Leaderboard retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Award points to a member (admin)
   */
  awardPoints: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const {
        memberId,
        societyId,
        event,
        points,
        description,
        referenceType,
        referenceId,
      } = req.body;

      const result = await gamificationService.awardPoints(
        memberId,
        societyId,
        event,
        points,
        description,
        referenceType,
        referenceId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: `${points} points awarded successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // ==================== Rewards ====================

  /**
   * Get rewards
   */
  getRewards: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const rewards = await gamificationService.getRewards(societyId);

      res.json({
        success: true,
        data: rewards,
        message: 'Rewards retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Create reward
   */
  createReward: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const reward = await gamificationService.createReward(
        req.body,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: reward,
        message: 'Reward created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update reward
   */
  updateReward: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const reward = await gamificationService.updateReward(
        req.params.id as string,
        req.body,
        req.user.userId
      );

      res.json({
        success: true,
        data: reward,
        message: 'Reward updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete reward
   */
  deleteReward: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      await gamificationService.deleteReward(req.params.id as string, req.user.userId);

      res.json({
        success: true,
        message: 'Reward deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // ==================== Redemptions ====================

  /**
   * Redeem a reward
   */
  redeemReward: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { memberId, societyId, rewardId } = req.body;

      const redemption = await gamificationService.redeemReward(
        memberId,
        societyId,
        rewardId,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: redemption,
        message: 'Reward redeemed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get redemptions
   */
  getRedemptions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const params: RedemptionQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        memberId: req.query.memberId as string,
        societyId: req.query.societyId as string,
        status: req.query.status as string,
        rewardId: req.query.rewardId as string,
      };

      const result = await gamificationService.getRedemptions(params);

      res.json({
        success: true,
        data: result,
        message: 'Redemptions retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Approve a redemption
   */
  approveRedemption: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const redemption = await gamificationService.approveRedemption(
        req.params.id as string,
        req.user.userId
      );

      res.json({
        success: true,
        data: redemption,
        message: 'Redemption approved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Reject a redemption
   */
  rejectRedemption: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const redemption = await gamificationService.rejectRedemption(
        req.params.id as string,
        req.body.reason,
        req.user.userId
      );

      res.json({
        success: true,
        data: redemption,
        message: 'Redemption rejected successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Fulfill a redemption
   */
  fulfillRedemption: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const redemption = await gamificationService.fulfillRedemption(
        req.params.id as string,
        req.user.userId
      );

      res.json({
        success: true,
        data: redemption,
        message: 'Redemption fulfilled successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
