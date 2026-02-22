import { Types } from 'mongoose';

export interface InstallmentPlanType {
  _id: Types.ObjectId;
  projId: Types.ObjectId;
  planName: string;
  totalMonths: number;
  totalAmount: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;

  // Populated
  projId_populated?: { projName: string; projCode?: string };
  createdByUser?: any;
  updatedByUser?: any;
}

export interface CreateInstallmentPlanDto {
  projId: string;
  planName: string;
  totalMonths: number;
  totalAmount: number;
  isActive?: boolean;
}

export interface UpdateInstallmentPlanDto {
  planName?: string;
  totalMonths?: number;
  totalAmount?: number;
  isActive?: boolean;
}

export interface InstallmentPlanQueryParams {
  page?: number;
  limit?: number;
  projectId?: string;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InstallmentPlanDashboardSummary {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  avgTotalMonths: number;
  totalAmountAllPlans: number;
}
