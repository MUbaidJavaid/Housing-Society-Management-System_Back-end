import { Types } from 'mongoose';

export interface PlotType {
  _id: Types.ObjectId;
  plotTypeName: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

export interface CreatePlotTypeDto {
  plotTypeName: string;
}

export interface UpdatePlotTypeDto {
  plotTypeName?: string;
}

export interface PlotTypeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
