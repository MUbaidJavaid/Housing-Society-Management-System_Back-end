import { Types } from 'mongoose';

export enum DevCategory {
  INFRASTRUCTURE = 'infrastructure',
  CONSTRUCTION = 'construction',
  LEGAL = 'legal',
  PLANNING = 'planning',
  SERVICES = 'services',
  COMPLETION = 'completion',
}

export enum DevPhase {
  PRE_CONSTRUCTION = 'pre_construction',
  CONSTRUCTION = 'construction',
  POST_CONSTRUCTION = 'post_construction',
  COMPLETION = 'completion',
}

export interface SrDevStatus {
  _id: Types.ObjectId;
  srDevStatName: string;
  srDevStatCode: string;
  devCategory: DevCategory;
  devPhase: DevPhase;
  description?: string;
  sequence: number;
  isActive: boolean;
  isDefault: boolean;
  colorCode: string;
  icon?: string;
  percentageComplete: number;
  requiresDocumentation: boolean;
  allowedTransitions: Types.ObjectId[];
  estimatedDurationDays?: number;
  colorName?: string; // Virtual
  cssClass?: string; // Virtual
  badgeVariant?: string; // Virtual
  phaseDescription?: string; // Virtual
  progressColor?: string; // Virtual
  estimatedCompletionText?: string; // Virtual
  createdBy: any;
  createdAt: Date;
  updatedBy?: any;
  updatedAt: Date;
}

export interface CreateSrDevStatusDto {
  srDevStatName: string;
  srDevStatCode: string;
  devCategory: DevCategory;
  devPhase: DevPhase;
  description?: string;
  sequence?: number;
  isActive?: boolean;
  isDefault?: boolean;
  colorCode?: string;
  icon?: string;
  percentageComplete?: number;
  requiresDocumentation?: boolean;
  allowedTransitions?: string[];
  estimatedDurationDays?: number;
}

export interface UpdateSrDevStatusDto {
  srDevStatName?: string;
  srDevStatCode?: string;
  devCategory?: DevCategory;
  devPhase?: DevPhase;
  description?: string;
  sequence?: number;
  isActive?: boolean;
  isDefault?: boolean;
  colorCode?: string;
  icon?: string;
  percentageComplete?: number;
  requiresDocumentation?: boolean;
  allowedTransitions?: string[];
  estimatedDurationDays?: number;
}

export interface SrDevStatusQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  devCategory?: DevCategory[];
  devPhase?: DevPhase[];
  isActive?: boolean;
  requiresDocumentation?: boolean;
  minPercentage?: number;
  maxPercentage?: number;
}

export interface SrDevStatusResponse {
  success: boolean;
  data?: any;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: {
    totalStatuses: number;
    activeStatuses: number;
    byCategory: Record<DevCategory, number>;
    byPhase: Record<DevPhase, number>;
    averagePercentage: number;
  };
}

export interface StatusTransitionDto {
  currentStatusId: string;
  targetStatusId: string;
  projectId?: string;
  remarks?: string;
  documents?: string[];
}

export interface BulkStatusUpdateDto {
  statusIds: string[];
  field: 'isActive' | 'requiresDocumentation';
  value: boolean;
}

export interface DevelopmentTimelineDto {
  statuses: Array<{
    statusId: string;
    startDate: Date;
    endDate?: Date;
    actualEndDate?: Date;
    isCompleted: boolean;
  }>;
}

export interface ProgressReport {
  currentStatus: SrDevStatus;
  nextStatuses: SrDevStatus[];
  overallProgress: number;
  timeline: Array<{
    status: SrDevStatus;
    startDate: Date;
    endDate?: Date;
    actualEndDate?: Date;
    isCompleted: boolean;
    durationDays: number;
  }>;
}
