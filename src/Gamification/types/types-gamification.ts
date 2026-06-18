export interface AwardPointsDto {
  memberId: string;
  societyId: string;
  event: string;
  points: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface CreateRewardDto {
  societyId: string;
  rewardName: string;
  description?: string;
  pointsCost: number;
  quantity?: number;
  rewardType: 'discount' | 'free-booking' | 'merchandise' | 'recognition' | 'donation';
  rewardValue?: any;
  validUntil?: Date;
}

export interface UpdateRewardDto {
  rewardName?: string;
  description?: string;
  pointsCost?: number;
  quantity?: number;
  rewardType?: 'discount' | 'free-booking' | 'merchandise' | 'recognition' | 'donation';
  rewardValue?: any;
  validUntil?: Date;
  isActive?: boolean;
}

export interface RedeemRewardDto {
  memberId: string;
  societyId: string;
  rewardId: string;
}

export interface LeaderboardParams {
  page?: number;
  limit?: number;
  period?: 'monthly' | 'yearly' | 'all-time';
}

export interface HistoryParams {
  page?: number;
  limit?: number;
}

export interface RedemptionQueryParams {
  page?: number;
  limit?: number;
  memberId?: string;
  societyId?: string;
  status?: string;
  rewardId?: string;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
