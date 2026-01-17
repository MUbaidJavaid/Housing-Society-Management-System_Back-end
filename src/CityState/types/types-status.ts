// types-status.ts
import { Types } from 'mongoose';

export interface Status {
  _id: Types.ObjectId;
  statusName: string;
  statusDescription?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

export interface CreateStatusDto {
  statusName: string;
  statusDescription?: string;
}

export interface UpdateStatusDto {
  statusName?: string;
  statusDescription?: string;
}

export interface StatusQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
