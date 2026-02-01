import { Types } from 'mongoose';

export interface AnnouncementType {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  categoryId: Types.ObjectId;
  title: string;
  announcementDesc: string;
  shortDescription?: string;
  targetType: 'All' | 'Block' | 'Project' | 'Individual';
  targetGroupId?: Types.ObjectId;
  priorityLevel: 1 | 2 | 3;
  status: 'Draft' | 'Published' | 'Archived';
  attachmentURL?: string;
  isPushNotificationSent: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  views: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  author?: any;
  category?: any;
  targetGroup?: any;
  priorityLabel?: string;
  statusBadge?: string;
  isExpired?: boolean;
  daysRemaining?: number;
  formattedPublishedDate?: string;
  formattedExpiryDate?: string;

  // Populated fields
  authorDetails?: any;
  categoryDetails?: any;
  createdByUser?: any;
  updatedByUser?: any;
}

export interface CreateAnnouncementDto {
  authorId: string;
  categoryId: string;
  title: string;
  announcementDesc: string;
  shortDescription?: string;
  targetType: 'All' | 'Block' | 'Project' | 'Individual';
  targetGroupId?: string;
  priorityLevel: 1 | 2 | 3;
  status?: 'Draft' | 'Published' | 'Archived';
  attachmentURL?: string;
  expiresAt?: Date;
}

export interface UpdateAnnouncementDto {
  authorId?: string;
  categoryId?: string;
  title?: string;
  announcementDesc?: string;
  shortDescription?: string;
  targetType?: 'All' | 'Block' | 'Project' | 'Individual';
  targetGroupId?: string;
  priorityLevel?: 1 | 2 | 3;
  status?: 'Draft' | 'Published' | 'Archived';
  attachmentURL?: string;
  expiresAt?: Date;
}

export interface PublishAnnouncementDto {
  expiresAt?: Date;
  sendPushNotification?: boolean;
}

export interface AnnouncementQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  authorId?: string;
  targetType?: 'All' | 'Block' | 'Project' | 'Individual';
  targetGroupId?: string;
  priorityLevel?: 1 | 2 | 3;
  status?: 'Draft' | 'Published' | 'Archived';
  isActive?: boolean;
  isPushNotificationSent?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AnnouncementFilterParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  priorityLevel?: 1 | 2 | 3;
  targetType?: 'All' | 'Block' | 'Project' | 'Individual';
  targetGroupId?: string;
  includeExpired?: boolean;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetAnnouncementsResult {
  announcements: AnnouncementType[];
  summary: {
    totalAnnouncements: number;
    draftAnnouncements: number;
    publishedAnnouncements: number;
    archivedAnnouncements: number;
    activeAnnouncements: number;
    expiredAnnouncements: number;
    byPriority: {
      low: number;
      medium: number;
      high: number;
    };
    byTargetType: Record<string, number>;
  };
  pagination: PaginationResult;
}

export interface ActiveAnnouncementsResult {
  announcements: AnnouncementType[];
  total: number;
  pages: number;
}

export interface AnnouncementStatistics {
  totalAnnouncements: number;
  draftAnnouncements: number;
  publishedAnnouncements: number;
  archivedAnnouncements: number;
  activeAnnouncements: number;
  expiredAnnouncements: number;
  totalViews: number;
  averageViewsPerAnnouncement: number;
  announcementsWithAttachments: number;
  announcementsWithPushNotifications: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byTargetType: Record<string, number>;
  byAuthor: Record<string, number>;
  monthlyGrowth: Array<{
    month: string;
    count: number;
    views: number;
  }>;
}

export interface TimelineDay {
  date: Date;
  count: number;
  announcements: Array<{
    id: string;
    title: string;
    priorityLevel: number;
    category?: {
      name: string;
      color: string;
    };
    publishedAt: Date;
  }>;
}
