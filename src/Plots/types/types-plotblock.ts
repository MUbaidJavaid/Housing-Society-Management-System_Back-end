import { Types } from 'mongoose';

export interface PlotBlock {
  _id: Types.ObjectId;
  projectId: Types.ObjectId; // Added
  plotBlockName: string;
  plotBlockDesc?: string;
  blockTotalArea?: number; // Added
  blockAreaUnit?: string; // Added
  createdBy: any;
  createdAt: Date;
  updatedBy?: any;
  updatedAt: Date;
}

export interface CreatePlotBlockDto {
  projectId: string; // Added
  plotBlockName: string;
  plotBlockDesc?: string;
  blockTotalArea?: number; // Added
  blockAreaUnit?: string; // Added
}

export interface UpdatePlotBlockDto {
  plotBlockName?: string;
  plotBlockDesc?: string;
  blockTotalArea?: number; // Added
  blockAreaUnit?: string; // Added
}

export interface PlotBlockQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  projectId?: string; // Added: filter by project
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
