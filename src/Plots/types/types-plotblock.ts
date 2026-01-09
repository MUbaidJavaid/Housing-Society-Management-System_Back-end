import { Types } from 'mongoose';

export interface PlotBlock {
  _id: Types.ObjectId;
  plotBlockName: string;
  plotBlockDesc?: string;
  createdBy: any;
  createdAt: Date;
  updatedBy?: any;
  updatedAt: Date;
}

export interface CreatePlotBlockDto {
  plotBlockName: string;
  plotBlockDesc?: string;
}

export interface UpdatePlotBlockDto {
  plotBlockName?: string;
  plotBlockDesc?: string;
}

export interface PlotBlockQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PlotBlockResponse {
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
