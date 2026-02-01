import { Types } from 'mongoose';

export interface AnnouncementCategoryType {
  _id: Types.ObjectId;
  categoryName: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  isSystem: boolean;
  priority: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  announcementCount?: number;
  categoryBadgeColor?: string;
  usagePercentage?: number;

  // Populated fields
  createdByUser?: any;
  updatedByUser?: any;
}

export interface CreateAnnouncementCategoryDto {
  categoryName: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateAnnouncementCategoryDto {
  categoryName?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  priority?: number;
}

export interface AnnouncementCategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetAnnouncementCategoriesResult {
  announcementCategories: AnnouncementCategoryType[];
  summary: {
    totalCategories: number;
    activeCategories: number;
    systemCategories: number;
  };
  pagination: PaginationResult;
}

export interface AnnouncementCategoryStatistics {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  systemCategories: number;
  averagePriority: number;
  maxPriority: number;
  minPriority: number;
  categoriesWithAnnouncements: number;
  categoriesWithoutAnnouncements: number;
  totalAnnouncements: number;
  maxAnnouncementsPerCategory: number;
  byColor: Record<string, number>;
  monthlyGrowth: Array<{
    month: string;
    count: number;
  }>;
}

export interface CategoryWithCount {
  categoryId: string;
  categoryName: string;
  announcementCount: number;
  color?: string;
  icon?: string;
}
