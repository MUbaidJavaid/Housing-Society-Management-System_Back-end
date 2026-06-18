import { Types } from 'mongoose';

export enum ThreadCategory {
  GENERAL = 'general',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  EVENTS = 'events',
  SUGGESTIONS = 'suggestions',
  LOST_FOUND = 'lost_found',
  HELP = 'help',
  DISCUSSION = 'discussion',
}

export enum ThreadStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  HIDDEN = 'hidden',
  FLAGGED = 'flagged',
}

export enum ReplyStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  FLAGGED = 'flagged',
}

export interface AttachmentType {
  name: string;
  fileUrl: string;
}

export interface ForumThreadType {
  _id: Types.ObjectId;
  title: string;
  content: string;
  societyId: Types.ObjectId;
  authorId: Types.ObjectId;
  category: string;
  isPinned: boolean;
  isLocked: boolean;
  isAnonymous: boolean;
  viewCount: number;
  replyCount: number;
  lastReplyAt?: Date;
  lastReplyBy?: Types.ObjectId;
  likes: Types.ObjectId[];
  likeCount: number;
  tags: string[];
  attachments: AttachmentType[];
  status: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumReplyType {
  _id: Types.ObjectId;
  threadId: Types.ObjectId;
  content: string;
  authorId: Types.ObjectId;
  isAnonymous: boolean;
  parentReplyId?: Types.ObjectId;
  likes: Types.ObjectId[];
  likeCount: number;
  attachments: AttachmentType[];
  status: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateThreadDto {
  title: string;
  content: string;
  societyId: string;
  category: string;
  isAnonymous?: boolean;
  tags?: string[];
  attachments?: AttachmentType[];
}

export interface UpdateThreadDto {
  title?: string;
  content?: string;
  category?: string;
  isAnonymous?: boolean;
  tags?: string[];
  attachments?: AttachmentType[];
  status?: string;
}

export interface CreateReplyDto {
  content: string;
  isAnonymous?: boolean;
  parentReplyId?: string;
  attachments?: AttachmentType[];
}

export interface UpdateReplyDto {
  content?: string;
  isAnonymous?: boolean;
  attachments?: AttachmentType[];
}

export interface ThreadQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  societyId?: string;
  category?: string;
  isPinned?: boolean;
  status?: string;
  authorId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReplyQueryParams {
  page?: number;
  limit?: number;
  parentReplyId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetThreadsResult {
  items: ForumThreadType[];
  pagination: PaginationResult;
}

export interface GetRepliesResult {
  items: ForumReplyType[];
  pagination: PaginationResult;
}

export interface ForumStats {
  totalThreads: number;
  totalReplies: number;
  activeUsers: number;
  popularCategories: { category: string; count: number }[];
}
