import { Types } from 'mongoose';

export interface SubscriptionPackageType {
  _id: Types.ObjectId;
  packageName: string;
  packageCode: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
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
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionPackageDto {
  packageName: string;
  packageCode: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency?: string;
  features?: {
    maxMembers?: number;
    maxProjects?: number;
    maxStaff?: number;
    maxPlots?: number;
    modules?: string[];
    storageGB?: number;
    supportLevel?: 'email' | 'priority' | 'dedicated';
    customBranding?: boolean;
    apiAccess?: boolean;
    visitorManagement?: boolean;
    facilityBooking?: boolean;
    advancedReporting?: boolean;
  };
  isPopular?: boolean;
  sortOrder?: number;
}

export interface UpdateSubscriptionPackageDto {
  packageName?: string;
  description?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  currency?: string;
  features?: {
    maxMembers?: number;
    maxProjects?: number;
    maxStaff?: number;
    maxPlots?: number;
    modules?: string[];
    storageGB?: number;
    supportLevel?: 'email' | 'priority' | 'dedicated';
    customBranding?: boolean;
    apiAccess?: boolean;
    visitorManagement?: boolean;
    facilityBooking?: boolean;
    advancedReporting?: boolean;
  };
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface SubscriptionHistoryType {
  _id: Types.ObjectId;
  societyId: Types.ObjectId;
  packageId: Types.ObjectId;
  action: 'subscribe' | 'upgrade' | 'downgrade' | 'renew' | 'cancel' | 'expire';
  previousPackageId?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  remarks?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Populated fields
  society?: any;
  package?: any;
  previousPackage?: any;
}

export interface SubscribeDto {
  societyId: string;
  packageId: string;
  billingCycle: 'monthly' | 'yearly';
  paymentReference?: string;
  remarks?: string;
}

export interface SubscriptionPackageQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetSubscriptionPackagesResult {
  packages: SubscriptionPackageType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetSubscriptionHistoryResult {
  history: SubscriptionHistoryType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
