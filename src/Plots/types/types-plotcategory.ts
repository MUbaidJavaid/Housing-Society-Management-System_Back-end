import { Types } from 'mongoose';

export interface PlotCategory {
  _id: Types.ObjectId;
  categoryName: string;
  surchargePercentage?: number;
  surchargeFixedAmount?: number;
  categoryDesc?: string;
  isActive: boolean;
  surchargeType?: string; // Virtual
  formattedSurcharge?: string; // Virtual
  calculatePrice?: (basePrice: number) => number; // Virtual
  createdBy: any;
  createdAt: Date;
  updatedBy?: any;
  updatedAt: Date;
}

export interface CreatePlotCategoryDto {
  categoryName: string;
  surchargePercentage?: number;
  surchargeFixedAmount?: number;
  categoryDesc?: string;
  isActive?: boolean;
}

export interface UpdatePlotCategoryDto {
  categoryName?: string;
  surchargePercentage?: number;
  surchargeFixedAmount?: number;
  categoryDesc?: string;
  isActive?: boolean;
}

export interface PlotCategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  surchargeType?: 'percentage' | 'fixed' | 'none';
}

export interface PlotCategoryResponse {
  success: boolean;
  data?: any;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PriceCalculationDto {
  basePrice: number;
  categoryId: string;
}

export interface BulkPriceCalculationDto {
  basePrice: number;
  categoryIds: string[];
}

export interface SurchargeInfo {
  type: 'percentage' | 'fixed' | 'none';
  value: number;
  formattedValue: string;
  finalPrice: number;
  surchargeAmount: number;
}
