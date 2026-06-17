import { Types } from 'mongoose';

export interface SocietyType {
  _id: Types.ObjectId;
  societyName: string;
  societyCode: string;
  address: string;
  cityId?: Types.ObjectId;
  stateId?: Types.ObjectId;
  country: string;
  zipCode?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  logo?: string;
  subscriptionPlanId?: Types.ObjectId;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'suspended';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  trialEndsAt: Date;
  maxMembers: number;
  maxProjects: number;
  maxStaff: number;
  enabledModules: string[];
  settings: {
    currency: string;
    dateFormat: string;
    timezone: string;
    lateFeeEnabled: boolean;
    lateFeeRate: number;
  };
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSocietyDto {
  societyName: string;
  societyCode?: string;
  address?: string;
  cityId?: string;
  stateId?: string;
  country?: string;
  zipCode?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  logo?: string;
  subscriptionPlanId?: string;
  maxMembers?: number;
  maxProjects?: number;
  maxStaff?: number;
  enabledModules?: string[];
  settings?: {
    currency?: string;
    dateFormat?: string;
    timezone?: string;
    lateFeeEnabled?: boolean;
    lateFeeRate?: number;
  };
}

export interface UpdateSocietyDto {
  societyName?: string;
  address?: string;
  cityId?: string;
  stateId?: string;
  country?: string;
  zipCode?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logo?: string;
  subscriptionPlanId?: string;
  maxMembers?: number;
  maxProjects?: number;
  maxStaff?: number;
  enabledModules?: string[];
  settings?: {
    currency?: string;
    dateFormat?: string;
    timezone?: string;
    lateFeeEnabled?: boolean;
    lateFeeRate?: number;
  };
}

export interface SocietyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'suspended';
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SocietyStats {
  totalMembers: number;
  totalPlots: number;
  totalProjects: number;
  totalStaff: number;
  subscriptionStatus: string;
  subscriptionDaysRemaining: number | null;
  limits: {
    maxMembers: number;
    maxProjects: number;
    maxStaff: number;
    membersUsed: number;
    projectsUsed: number;
    staffUsed: number;
  };
}

export interface GetSocietiesResult {
  societies: SocietyType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
