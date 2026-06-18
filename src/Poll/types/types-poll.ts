import { Types } from 'mongoose';

export interface PollOptionType {
  text: string;
  description?: string;
  voteCount: number;
}

export interface PollVoteType {
  memberId: Types.ObjectId;
  optionIndex: number;
  votedAt: Date;
  ipAddress?: string;
}

export interface TargetAudienceType {
  type: 'all' | 'block' | 'role';
  value?: string;
}

export interface PollType {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  societyId: Types.ObjectId;
  pollType: 'survey' | 'vote' | 'election' | 'feedback';
  options: PollOptionType[];
  votes: PollVoteType[];
  isAnonymous: boolean;
  allowMultipleChoices: boolean;
  maxChoices: number;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'closed' | 'cancelled';
  targetAudience?: TargetAudienceType;
  totalVoters: number;
  results: any;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePollDto {
  title: string;
  description?: string;
  societyId: string;
  pollType: 'survey' | 'vote' | 'election' | 'feedback';
  options: { text: string; description?: string }[];
  isAnonymous?: boolean;
  allowMultipleChoices?: boolean;
  maxChoices?: number;
  startDate: Date;
  endDate: Date;
  targetAudience?: TargetAudienceType;
}

export interface UpdatePollDto {
  title?: string;
  description?: string;
  pollType?: 'survey' | 'vote' | 'election' | 'feedback';
  options?: { text: string; description?: string }[];
  isAnonymous?: boolean;
  allowMultipleChoices?: boolean;
  maxChoices?: number;
  startDate?: Date;
  endDate?: Date;
  status?: 'draft' | 'active' | 'closed' | 'cancelled';
  targetAudience?: TargetAudienceType;
}

export interface CastVoteDto {
  optionIndexes: number[];
  ipAddress?: string;
}

export interface PollQueryParams {
  page?: number;
  limit?: number;
  societyId?: string;
  pollType?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PollPaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetPollsResult {
  polls: PollType[];
  pagination: PollPaginationResult;
}

export interface PollResultOption {
  text: string;
  description?: string;
  voteCount: number;
  percentage: number;
}

export interface PollResults {
  pollId: string;
  title: string;
  totalVotes: number;
  totalVoters: number;
  options: PollResultOption[];
  isAnonymous: boolean;
  status: string;
}
