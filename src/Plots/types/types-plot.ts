import { Types } from 'mongoose';

export interface Plot {
  _id: Types.ObjectId;
  plotNo: string;
  projId?: Types.ObjectId; // Project reference
  plotBlockId: Types.ObjectId;
  plotSizeId: Types.ObjectId;
  plotTypeId: Types.ObjectId;
  plotStreet?: string;
  srDevStatId: Types.ObjectId;
  plotRemarks?: string;
  plotAmount: number;
  discountAmount?: number;
  discountDate?: Date;
  developmentStatusId: Types.ObjectId;
  applicationTypeId: Types.ObjectId;
  developmentChargeMethod?: string;
  discountMethod?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface CreatePlotDto {
  plotNo: string;
  projId?: string;
  plotBlockId: string;
  plotSizeId: string;
  plotTypeId: string;
  plotStreet?: string;
  srDevStatId: string;
  plotRemarks?: string;
  plotAmount: number;
  discountAmount?: number;
  discountDate?: string;
  developmentStatusId: string;
  applicationTypeId: string;
  developmentChargeMethod?: string;
  discountMethod?: string;
}

export interface UpdatePlotDto {
  plotNo?: string;
  projId?: string;
  plotBlockId?: string;
  plotSizeId?: string;
  plotTypeId?: string;
  plotStreet?: string;
  srDevStatId?: string;
  plotRemarks?: string;
  plotAmount?: number;
  discountAmount?: number;
  discountDate?: string;
  developmentStatusId?: string;
  applicationTypeId?: string;
  developmentChargeMethod?: string;
  discountMethod?: string;
}

export interface PlotQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  plotBlockId?: string;
  plotSizeId?: string;
  plotTypeId?: string;
  developmentStatusId?: string;
  applicationTypeId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PlotFilterOptions {
  plotBlocks?: any[];
  plotSizes?: any[];
  plotTypes?: any[];
  developmentStatuses?: any[];
  applicationTypes?: any[];
}
