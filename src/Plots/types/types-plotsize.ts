import { Types } from 'mongoose';

export interface PlotSize {
  _id: Types.ObjectId;
  plotSizeName: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

export interface CreatePlotSizeDto {
  plotSizeName: string;
}

export interface UpdatePlotSizeDto {
  plotSizeName?: string;
}

export interface PlotSizeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
