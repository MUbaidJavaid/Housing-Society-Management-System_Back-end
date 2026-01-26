import { Types } from 'mongoose';

export interface PlotSize {
  _id: Types.ObjectId;
  plotSizeName: string;
  totalArea: number;
  areaUnit: string;
  ratePerUnit: number;
  standardBasePrice: number;
  formattedPrice?: string; // Virtual
  formattedRate?: string; // Virtual
  createdBy: any;
  createdAt: Date;
  updatedBy?: any;
  updatedAt: Date;
}

export interface CreatePlotSizeDto {
  plotSizeName: string;
  totalArea: number;
  areaUnit: string;
  ratePerUnit: number;
  standardBasePrice?: number; // Optional, will be calculated automatically
}

export interface UpdatePlotSizeDto {
  plotSizeName?: string;
  totalArea?: number;
  areaUnit?: string;
  ratePerUnit?: number;
  standardBasePrice?: number; // Will be recalculated if totalArea or ratePerUnit changes
}

export interface PlotSizeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  areaUnit?: string;
  minArea?: number;
  maxArea?: number;
}

export interface PlotSizeResponse {
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
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    totalSizes: number;
  };
}

export interface PriceCalculationDto {
  totalArea: number;
  areaUnit: string;
  ratePerUnit: number;
}

export interface AreaUnitConversion {
  [key: string]: {
    toSqft: number;
    toSqm: number;
  };
}
