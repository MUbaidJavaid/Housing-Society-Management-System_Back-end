import { Types } from 'mongoose';

export interface City {
  _id: Types.ObjectId;
  cityName: string;
  cityDescription?: string;
  stateId: Types.ObjectId;
  statusId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

export interface CreateCityDto {
  cityName: string;
  cityDescription?: string;
  stateId: string;
  statusId?: string;
}

export interface UpdateCityDto {
  cityName?: string;
  cityDescription?: string;
  stateId?: string;
  statusId?: string;
}

export interface CityQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  stateId?: string;
  statusId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
