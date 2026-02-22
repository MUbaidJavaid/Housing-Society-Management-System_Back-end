import { Types } from 'mongoose';

export interface InstallmentPlanDetailType {
  _id: Types.ObjectId;
  planId: Types.ObjectId;
  instCatId: Types.ObjectId;
  occurrence: number;
  percentageAmount: number;
  fixedAmount: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;

  planId_populated?: { planName: string; projId?: any };
  instCatId_populated?: { instCatName: string; instCatDescription?: string };
  createdByUser?: any;
  updatedByUser?: any;
}

export interface CreateInstallmentPlanDetailDto {
  planId: string;
  instCatId: string;
  occurrence: number;
  percentageAmount?: number;
  fixedAmount?: number;
}

export interface BulkCreateInstallmentPlanDetailDto {
  planId: string;
  details: Array<{
    instCatId: string;
    occurrence: number;
    percentageAmount?: number;
    fixedAmount?: number;
  }>;
}

export interface UpdateInstallmentPlanDetailDto {
  occurrence?: number;
  percentageAmount?: number;
  fixedAmount?: number;
}

export interface InstallmentPlanDetailQueryParams {
  page?: number;
  limit?: number;
  planId?: string;
  instCatId?: string;
  occurrence?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InstallmentPlanDetailSummary {
  totalDetails: number;
  totalPercentageSum: number;
  totalFixedSum: number;
  byPlan: Array<{
    planId: string;
    planName: string;
    count: number;
    totalPercentage: number;
    totalFixed: number;
  }>;
}
