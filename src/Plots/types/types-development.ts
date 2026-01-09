import { Types } from 'mongoose';

export interface Development {
  _id: Types.ObjectId;
  plotId: Types.ObjectId;
  memId: Types.ObjectId;
  developmentStatusName: string;
  applicationId: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedOn?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

export interface CreateDevelopmentDto {
  plotId: string;
  memId: string;
  developmentStatusName: string;
  applicationId: string;
  approvedBy?: string;
  approvedOn?: string;
}

export interface UpdateDevelopmentDto {
  plotId?: string;
  memId?: string;
  developmentStatusName?: string;
  applicationId?: string;
  approvedBy?: string;
  approvedOn?: string;
}

export interface DevelopmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  plotId?: string;
  memId?: string;
  applicationId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
