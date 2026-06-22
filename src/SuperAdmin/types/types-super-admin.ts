import { Types } from 'mongoose';

// ── Society Onboarding ──
export interface CreateSocietyDto {
  societyName: string;
  societyCode?: string; // Auto-generated if not provided
  address: string;
  cityId?: string;
  stateId?: string;
  country?: string;
  zipCode?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  subscriptionPlanId: string;
  billingCycle: 'monthly' | 'yearly';
  // Admin user to create for this society
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
  adminPassword?: string; // Auto-generated if not provided
}

export interface UpdateSocietyDto {
  societyName?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isActive?: boolean;
  subscriptionPlanId?: string;
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'suspended';
  subscriptionEndDate?: Date;
  maxMembers?: number;
  maxProjects?: number;
  maxStaff?: number;
  enabledModules?: string[];
}

// ── Global Analytics ──
export interface PlatformStats {
  totalSocieties: number;
  activeSocieties: number;
  trialSocieties: number;
  expiredSocieties: number;
  totalUsers: number;
  totalMembers: number;
  totalPlots: number;
  monthlyRevenue: number;
  mrr: number;
  storageUsedGB: number;
}

export interface SocietyHealth {
  societyId: string;
  societyName: string;
  societyCode: string;
  subscriptionStatus: string;
  subscriptionPlanName: string;
  activeUsers: number;
  totalMembers: number;
  totalPlots: number;
  mrr: number;
  lastActivityAt: Date;
  healthScore: number; // 0-100
}

// ── Impersonation ──
export interface ImpersonateDto {
  targetUserId: string;
  reason: string;
}

export interface ImpersonationLog {
  superAdminId: Types.ObjectId;
  targetUserId: Types.ObjectId;
  targetSocietyId?: Types.ObjectId;
  reason: string;
  startedAt: Date;
  endedAt?: Date;
  actionsPerformed: string[];
}

// ── Subscription Management ──
export interface CreateSubscriptionPlanDto {
  packageName: string;
  packageCode: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency?: string;
  features: {
    maxMembers: number;
    maxProjects: number;
    maxStaff: number;
    maxPlots: number;
    modules: string[];
    storageGB: number;
    supportLevel: 'email' | 'priority' | 'dedicated';
    customBranding: boolean;
    apiAccess: boolean;
    visitorManagement: boolean;
    facilityBooking: boolean;
    advancedReporting: boolean;
  };
  isPopular?: boolean;
  sortOrder?: number;
}

// ── Query params ──
export interface SocietyListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'trial' | 'active' | 'expired' | 'suspended';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  societyId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
