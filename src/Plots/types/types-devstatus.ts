import { Types } from 'mongoose';

export interface SrDevStatus {
  _id: Types.ObjectId;
  srDevStatName: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

export interface CreateSrDevStatusDto {
  srDevStatName: string;
}

export interface UpdateSrDevStatusDto {
  srDevStatName?: string;
}

export interface SrDevStatusQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
