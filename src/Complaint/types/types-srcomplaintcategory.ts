import { Types } from 'mongoose';

export interface SrComplaintCategoryType {
  _id: Types.ObjectId;
  categoryName: string;
  categoryCode: string;
  description?: string;
  priorityLevel: number;
  slaHours?: number;
  isActive: boolean;
  escalationLevels?: {
    level: number;
    role: string;
    hoursAfterCreation: number;
  }[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  priorityLabel?: string;
  priorityColor?: string;
  slaDescription?: string;

  // MongoDB internal fields
  __v?: number;
}

export interface CreateSrComplaintCategoryDto {
  categoryName: string;
  categoryCode: string;
  description?: string;
  priorityLevel?: number;
  slaHours?: number;
  isActive?: boolean;
  escalationLevels?: {
    level: number;
    role: string;
    hoursAfterCreation: number;
  }[];
}

export interface UpdateSrComplaintCategoryDto {
  categoryName?: string;
  categoryCode?: string;
  description?: string;
  priorityLevel?: number;
  slaHours?: number;
  isActive?: boolean;
  escalationLevels?: {
    level: number;
    role: string;
    hoursAfterCreation: number;
  }[];
}

export interface SrComplaintCategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  minPriority?: number;
  maxPriority?: number;
}

export interface BulkStatusUpdateDto {
  categoryIds: string[];
  isActive: boolean;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetSrComplaintCategoriesResult {
  complaintCategories: SrComplaintCategoryType[];
  summary: {
    totalCategories: number;
    activeCategories: number;
    byPriority: Record<number, number>;
  };
  pagination: PaginationResult;
}

export interface CategoryDropdownItem {
  value: string;
  label: string;
  priority: number;
}

export interface ImportCategoriesResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface CategoryStatistics {
  totalCategories: number;
  activeCategories: number;
  avgPriorityLevel: number;
  avgSlaHours: number;
  byPriority: Record<number, { total: number; active: number }>;
}
