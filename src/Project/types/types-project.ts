import { Types } from 'mongoose';

export interface Project {
  _id: Types.ObjectId;
  projName: string;
  projSiteName?: string;
  projLocation: string;
  projStartDate?: Date;
  projEndDate?: Date;
  projCovArea?: number;
  projRemarks?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface CreateProjectDto {
  projName: string;
  projSiteName?: string;
  projLocation: string;
  projStartDate?: string;
  projEndDate?: string;
  projCovArea?: number;
  projRemarks?: string;
}

export interface UpdateProjectDto {
  projName?: string;
  projSiteName?: string;
  projLocation?: string;
  projStartDate?: string;
  projEndDate?: string;
  projCovArea?: number;
  projRemarks?: string;
}

export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: 'active' | 'completed' | 'upcoming';
}
