import { Types } from 'mongoose';

export interface State {
  _id: Types.ObjectId;
  stateName: string;
  stateDescription?: string;
  statusId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

export interface CreateStateDto {
  stateName: string;
  stateDescription?: string;
  statusId?: string;
}

export interface UpdateStateDto {
  stateName?: string;
  stateDescription?: string;
  statusId?: string;
}

export interface StateQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  statusId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
