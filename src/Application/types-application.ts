import { Types } from 'mongoose';

export interface Application {
  _id: Types.ObjectId;
  applicationDesc: string;
  applicationTypeID: Types.ObjectId; // Reference to ApplicationType
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface CreateApplicationDto {
  applicationDesc: string;
  applicationTypeID: string;
}

export interface UpdateApplicationDto {
  applicationDesc?: string;
  applicationTypeID?: string;
}

export interface ApplicationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  applicationTypeID?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApplicationSummary {
  totalApplications: number;
  applicationsByType: { typeName: string; count: number }[];
  recentApplications: number;
  activeApplications: number;
}

export interface ApplicationType {
  _id: Types.ObjectId;
  typeName: string;
  typeCode: string;
  description?: string;
  isActive: boolean;
}
