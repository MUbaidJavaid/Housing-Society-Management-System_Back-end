import { Types } from 'mongoose';
import GamificationPoints from '../models/models-gamification-points';
import GamificationReward from '../models/models-gamification-reward';
import GamificationRedemption from '../models/models-gamification-redemption';
import {
  CreateRewardDto,
  HistoryParams,
  LeaderboardParams,
  RedemptionQueryParams,
  UpdateRewardDto,
} from '../types/types-gamification';

const calculateLevel = (totalPoints: number): string => {
  if (totalPoints >= 2500) return 'Diamond';
  if (totalPoints >= 1000) return 'Platinum';
  if (totalPoints >= 500) return 'Gold';
  if (totalPoints >= 200) return 'Silver';
  return 'Bronze';
};

export const gamificationService = {
  // ==================== Points ====================

  /**
   * Award points to a member
   */
  async awardPoints(
    memberId: string,
    societyId: string,
    event: string,
    points: number,
    description?: string,
    referenceType?: string,
    referenceId?: string
  ): Promise<any> {
    const memberObjId = new Types.ObjectId(memberId);
    const societyObjId = new Types.ObjectId(societyId);

    let pointsRecord = await GamificationPoints.findOne({
      memberId: memberObjId,
      societyId: societyObjId,
      isDeleted: false,
    });

    const historyEntry: any = {
      event,
      points,
      date: new Date(),
      description,
    };

    if (referenceType) historyEntry.referenceType = referenceType;
    if (referenceId) historyEntry.referenceId = new Types.ObjectId(referenceId);

    if (!pointsRecord) {
      const newLevel = calculateLevel(points);
      pointsRecord = await GamificationPoints.create({
        memberId: memberObjId,
        societyId: societyObjId,
        totalPoints: points,
        currentPoints: points,
        level: newLevel,
        history: [historyEntry],
      });
    } else {
      pointsRecord.totalPoints += points;
      pointsRecord.currentPoints += points;
      pointsRecord.level = calculateLevel(pointsRecord.totalPoints);
      pointsRecord.history.push(historyEntry);
      await pointsRecord.save();
    }

    return pointsRecord;
  },

  /**
   * Get points balance for a member
   */
  async getPoints(memberId: string, societyId: string): Promise<any> {
    const record = await GamificationPoints.findOne({
      memberId: new Types.ObjectId(memberId),
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
    })
      .populate('memberId', 'memName memNic email')
      .select('-history');

    if (!record) {
      return {
        memberId,
        societyId,
        totalPoints: 0,
        currentPoints: 0,
        level: 'Bronze',
      };
    }

    return record;
  },

  /**
   * Get paginated point history
   */
  async getHistory(
    memberId: string,
    societyId: string,
    params: HistoryParams
  ): Promise<{ history: any[]; pagination: any }> {
    const { page = 1, limit = 20 } = params;

    const record = await GamificationPoints.findOne({
      memberId: new Types.ObjectId(memberId),
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
    }).lean();

    if (!record) {
      return {
        history: [],
        pagination: { page, limit, total: 0, pages: 0 },
      };
    }

    const allHistory = record.history.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const total = allHistory.length;
    const skip = (page - 1) * limit;
    const paginatedHistory = allHistory.slice(skip, skip + limit);

    return {
      history: paginatedHistory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get leaderboard for a society
   */
  async getLeaderboard(
    societyId: string,
    params: LeaderboardParams
  ): Promise<any[]> {
    const { limit = 20, period = 'all-time' } = params;

    if (period === 'all-time') {
      const leaderboard = await GamificationPoints.find({
        societyId: new Types.ObjectId(societyId),
        isDeleted: false,
      })
        .populate('memberId', 'memName memNic email')
        .select('memberId totalPoints currentPoints level')
        .sort({ totalPoints: -1 })
        .limit(limit)
        .lean();

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));
    }

    // For monthly/yearly, aggregate from history
    const now = new Date();
    let startDate: Date;

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const leaderboard = await GamificationPoints.aggregate([
      {
        $match: {
          societyId: new Types.ObjectId(societyId),
          isDeleted: false,
        },
      },
      { $unwind: '$history' },
      {
        $match: {
          'history.date': { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$memberId',
          periodPoints: { $sum: '$history.points' },
          level: { $first: '$level' },
        },
      },
      { $sort: { periodPoints: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'members',
          localField: '_id',
          foreignField: '_id',
          as: 'member',
        },
      },
      { $unwind: { path: '$member', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          memberId: '$_id',
          memberName: '$member.memName',
          periodPoints: 1,
          level: 1,
        },
      },
    ]);

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  },

  /**
   * Calculate level based on total points
   */
  calculateLevel,

  // ==================== Rewards ====================

  /**
   * Create a reward
   */
  async createReward(data: CreateRewardDto, userId: Types.ObjectId): Promise<any> {
    const reward = await GamificationReward.create({
      societyId: new Types.ObjectId(data.societyId),
      rewardName: data.rewardName,
      description: data.description,
      pointsCost: data.pointsCost,
      quantity: data.quantity ?? -1,
      rewardType: data.rewardType,
      rewardValue: data.rewardValue,
      validUntil: data.validUntil,
      createdBy: userId,
    });

    return reward;
  },

  /**
   * Get rewards for a society
   */
  async getRewards(societyId: string): Promise<any[]> {
    const rewards = await GamificationReward.find({
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
      isActive: true,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ pointsCost: 1 });

    return rewards;
  },

  /**
   * Get reward by ID
   */
  async getRewardById(id: string): Promise<any> {
    const reward = await GamificationReward.findById(id)
      .populate('createdBy', 'firstName lastName email');

    if (!reward || reward.isDeleted) {
      throw new Error('Reward not found');
    }

    return reward;
  },

  /**
   * Update a reward
   */
  async updateReward(
    id: string,
    data: UpdateRewardDto,
    _userId: Types.ObjectId
  ): Promise<any> {
    const reward = await GamificationReward.findById(id);
    if (!reward || reward.isDeleted) {
      throw new Error('Reward not found');
    }

    const updated = await GamificationReward.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    return updated;
  },

  /**
   * Soft delete a reward
   */
  async deleteReward(id: string, _userId: Types.ObjectId): Promise<boolean> {
    const reward = await GamificationReward.findById(id);
    if (!reward || reward.isDeleted) {
      throw new Error('Reward not found');
    }

    await GamificationReward.findByIdAndUpdate(id, {
      $set: { isDeleted: true, deletedAt: new Date(), isActive: false },
    });

    return true;
  },

  // ==================== Redemptions ====================

  /**
   * Redeem a reward
   */
  async redeemReward(
    memberId: string,
    societyId: string,
    rewardId: string,
    userId: Types.ObjectId
  ): Promise<any> {
    const reward = await GamificationReward.findById(rewardId);
    if (!reward || reward.isDeleted || !reward.isActive) {
      throw new Error('Reward not found or inactive');
    }

    // Check validity
    if (reward.validUntil && new Date() > reward.validUntil) {
      throw new Error('Reward has expired');
    }

    // Check quantity
    if (reward.quantity !== -1 && reward.quantity <= 0) {
      throw new Error('Reward is out of stock');
    }

    // Check member points
    const pointsRecord = await GamificationPoints.findOne({
      memberId: new Types.ObjectId(memberId),
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
    });

    if (!pointsRecord || pointsRecord.currentPoints < reward.pointsCost) {
      throw new Error('Insufficient points for this reward');
    }

    // Deduct points
    pointsRecord.currentPoints -= reward.pointsCost;
    await pointsRecord.save();

    // Decrement quantity if not unlimited
    if (reward.quantity !== -1) {
      reward.quantity -= 1;
      await reward.save();
    }

    // Create redemption
    const redemption = await GamificationRedemption.create({
      memberId: new Types.ObjectId(memberId),
      societyId: new Types.ObjectId(societyId),
      rewardId: new Types.ObjectId(rewardId),
      pointsSpent: reward.pointsCost,
      status: 'pending',
      createdBy: userId,
    });

    const populated = await GamificationRedemption.findById(redemption._id)
      .populate('memberId', 'memName memNic email')
      .populate('rewardId', 'rewardName pointsCost rewardType');

    return populated;
  },

  /**
   * Get redemptions with filters and pagination
   */
  async getRedemptions(params: RedemptionQueryParams): Promise<{
    redemptions: any[];
    pagination: any;
  }> {
    const {
      page = 1,
      limit = 20,
      memberId,
      societyId,
      status,
      rewardId,
    } = params;

    const skip = (page - 1) * limit;
    const query: any = { isDeleted: false };

    if (memberId) query.memberId = new Types.ObjectId(memberId);
    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (status) query.status = status;
    if (rewardId) query.rewardId = new Types.ObjectId(rewardId);

    const [redemptions, total] = await Promise.all([
      GamificationRedemption.find(query)
        .populate('memberId', 'memName memNic email')
        .populate('rewardId', 'rewardName pointsCost rewardType')
        .populate('approvedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      GamificationRedemption.countDocuments(query),
    ]);

    return {
      redemptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Approve a redemption
   */
  async approveRedemption(id: string, userId: Types.ObjectId): Promise<any> {
    const redemption = await GamificationRedemption.findById(id);
    if (!redemption || redemption.isDeleted) {
      throw new Error('Redemption not found');
    }

    if (redemption.status !== 'pending') {
      throw new Error(`Cannot approve redemption with status: ${redemption.status}`);
    }

    const updated = await GamificationRedemption.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'approved',
          approvedBy: userId,
        },
      },
      { new: true }
    )
      .populate('memberId', 'memName memNic email')
      .populate('rewardId', 'rewardName pointsCost rewardType')
      .populate('approvedBy', 'firstName lastName email');

    return updated;
  },

  /**
   * Reject a redemption and refund points
   */
  async rejectRedemption(
    id: string,
    reason: string | undefined,
    userId: Types.ObjectId
  ): Promise<any> {
    const redemption = await GamificationRedemption.findById(id);
    if (!redemption || redemption.isDeleted) {
      throw new Error('Redemption not found');
    }

    if (redemption.status !== 'pending') {
      throw new Error(`Cannot reject redemption with status: ${redemption.status}`);
    }

    // Refund points
    await GamificationPoints.findOneAndUpdate(
      {
        memberId: redemption.memberId,
        societyId: redemption.societyId,
        isDeleted: false,
      },
      {
        $inc: { currentPoints: redemption.pointsSpent },
      }
    );

    // Restore quantity if not unlimited
    const reward = await GamificationReward.findById(redemption.rewardId);
    if (reward && reward.quantity !== -1) {
      reward.quantity += 1;
      await reward.save();
    }

    const updated = await GamificationRedemption.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'rejected',
          approvedBy: userId,
          remarks: reason || 'Rejected by admin',
        },
      },
      { new: true }
    )
      .populate('memberId', 'memName memNic email')
      .populate('rewardId', 'rewardName pointsCost rewardType');

    return updated;
  },

  /**
   * Fulfill a redemption
   */
  async fulfillRedemption(id: string, userId: Types.ObjectId): Promise<any> {
    const redemption = await GamificationRedemption.findById(id);
    if (!redemption || redemption.isDeleted) {
      throw new Error('Redemption not found');
    }

    if (redemption.status !== 'approved') {
      throw new Error(`Cannot fulfill redemption with status: ${redemption.status}. Must be approved first.`);
    }

    const updated = await GamificationRedemption.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'fulfilled',
          fulfilledAt: new Date(),
          approvedBy: userId,
        },
      },
      { new: true }
    )
      .populate('memberId', 'memName memNic email')
      .populate('rewardId', 'rewardName pointsCost rewardType')
      .populate('approvedBy', 'firstName lastName email');

    return updated;
  },
};
