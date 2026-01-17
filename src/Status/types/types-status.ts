import { Types } from 'mongoose';

export interface Status {
  _id: Types.ObjectId;
  statusName: string;
  statusType?: string; // e.g., 'general', 'member', 'plot', etc.
  description?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

export interface CreateStatusDto {
  statusName: string;
  statusType?: string;
  description?: string;
}

export interface UpdateStatusDto {
  statusName?: string;
  statusType?: string;
  description?: string;
}

export interface StatusQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  statusType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
