import { Types } from 'mongoose';

export interface SrApplicationType {
  _id: Types.ObjectId;
  applicationName: string;
  applicationDesc?: string;
  applicationFee: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

export interface CreateSrApplicationTypeDto {
  applicationName: string;
  applicationDesc?: string;
  applicationFee: number;
}

export interface UpdateSrApplicationTypeDto {
  applicationName?: string;
  applicationDesc?: string;
  applicationFee?: number;
}

export interface SrApplicationTypeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
