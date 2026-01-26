import { Types } from 'mongoose';

export enum ProjectStatus {
  PLANNING = 'planning',
  UNDER_DEVELOPMENT = 'under_development',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum ProjectType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  MIXED_USE = 'mixed_use',
  AGRICULTURAL = 'agricultural',
}

export interface Project {
  _id: Types.ObjectId;
  projName: string;
  projCode: string;
  projLocation: string;
  projPrefix: string;
  projDescription?: string;
  totalArea: number;
  areaUnit: string;
  totalPlots: number;
  plotsAvailable: number;
  plotsSold: number;
  plotsReserved: number;
  launchDate: Date;
  completionDate?: Date;
  projStatus: ProjectStatus;
  projType: ProjectType;
  isActive: boolean;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  cityId: Types.ObjectId; // Foreign key reference
  cityName?: string; // Populated field
  stateName?: string; // Populated through city
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  amenities?: string[];
  progressPercentage?: number;
  formattedArea?: string;
  projectAgeMonths?: number;
  statusColor?: string;
  nextPlotNumber?: number;
  createdBy: any;
  createdAt: Date;
  updatedBy?: any;
  updatedAt: Date;
}

export interface CreateProjectDto {
  projName: string;
  projCode?: string;
  projLocation: string;
  projPrefix: string;
  projDescription?: string;
  totalArea: number;
  areaUnit: string;
  totalPlots: number;
  launchDate: Date;
  completionDate?: Date;
  projStatus?: ProjectStatus;
  projType?: ProjectType;
  isActive?: boolean;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  cityId: Types.ObjectId; // Changed from city to cityId
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  amenities?: string[];
}

export interface UpdateProjectDto {
  projName?: string;
  projCode?: string;
  projLocation?: string;
  projPrefix?: string;
  projDescription?: string;
  totalArea?: number;
  areaUnit?: string;
  totalPlots?: number;
  plotsSold?: number;
  plotsReserved?: number;
  launchDate?: Date;
  completionDate?: Date;
  projStatus?: ProjectStatus;
  projType?: ProjectType;
  isActive?: boolean;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  cityId?: Types.ObjectId; // Changed from city to cityId
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  amenities?: string[];
}

export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: ProjectStatus[];
  type?: ProjectType[];
  isActive?: boolean;
  cityId?: string; // Changed from city to cityId
  country?: string;
  minPlots?: number;
  maxPlots?: number;
  minArea?: number;
  maxArea?: number;
  launchedAfter?: Date;
  launchedBefore?: Date;
}

export interface ProjectResponse {
  success: boolean;
  data?: any;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: {
    totalProjects: number;
    totalPlots: number;
    totalArea: number;
    averageProgress: number;
    byStatus: Record<ProjectStatus, number>;
    byType: Record<ProjectType, number>;
  };
}

export interface ProjectStats {
  totalProjects: number;
  totalPlots: number;
  totalArea: number;
  plotsSold: number;
  plotsReserved: number;
  plotsAvailable: number;
  averageProgress: number;
  byStatus: Record<ProjectStatus, number>;
  byType: Record<ProjectType, number>;
  byCity: Record<string, number>;
  recentProjects: Project[];
}

export interface PlotRegistrationDto {
  projectId: string;
  plotSizeId: string;
  plotBlockId: string;
  plotCategoryId: string;
  customerId: string;
  registrationNumber: string;
  plotNumber: number;
}
