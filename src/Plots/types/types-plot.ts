import { Types } from 'mongoose';

export enum PlotType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  AGRICULTURAL = 'agricultural',
  CORNER = 'corner',
  PARK_FACING = 'park_facing',
  MAIN_BOULEVARD = 'main_boulevard',
  STANDARD = 'standard',
}

export interface Plot {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  possId?: Types.ObjectId;
  plotNo: string;
  plotBlockId: Types.ObjectId;
  plotSizeId: Types.ObjectId;
  plotType: PlotType;
  plotCategoryId: Types.ObjectId;
  plotStreet?: string;
  plotLength: number;
  plotWidth: number;
  plotArea: number;
  plotAreaUnit: string;
  srDevStatId?: Types.ObjectId;
  salesStatusId: Types.ObjectId;
  surchargeAmount: number;
  fileId?: Types.ObjectId;
  plotBasePrice: number;
  plotTotalAmount: number;
  discountAmount: number;
  discountDate?: Date;
  isPossessionReady: boolean;
  plotRegistrationNo?: string;
  plotCornerNo?: number;
  plotFacing?: string;
  plotDimensions?: string;
  plotRemarks?: string;
  plotLatitude?: number;
  plotLongitude?: number;
  plotBoundaryPoints?: Array<{ lat: number; lng: number }>;
  plotDocuments?: Array<{
    documentType: string;
    documentPath: string;
    uploadedDate: Date;
    uploadedBy: Types.ObjectId;
  }>;
  // Virtual fields
  plotNetPrice?: number;
  pricePerUnit?: number;
  discountPercentage?: number;
  formattedTotalAmount?: string;
  formattedArea?: string;
  dimensionsWithUnit?: string;
  plotStatus?: any;
  nextActions?: string[];
  locationDescription?: string;
  createdBy: any;
  createdAt: Date;
  updatedBy?: any;
  updatedAt: Date;
}

export interface CreatePlotDto {
  projectId: string;
  plotNo: string;
  plotBlockId: string;
  plotSizeId: string;
  plotType: PlotType;
  plotCategoryId: string;
  plotStreet?: string;
  plotLength: number;
  plotWidth: number;
  plotAreaUnit?: string;
  srDevStatId?: string;
  salesStatusId: string;
  surchargeAmount?: number;
  plotBasePrice: number;
  plotTotalAmount: number;
  discountAmount?: number;
  discountDate?: Date;
  plotCornerNo?: number;
  plotFacing?: string;
  plotRemarks?: string;
  plotLatitude?: number;
  plotLongitude?: number;
  plotBoundaryPoints?: Array<{ lat: number; lng: number }>;
}

export interface UpdatePlotDto {
  plotNo?: string;
  plotBlockId?: string;
  plotSizeId?: string;
  plotType?: PlotType;
  plotCategoryId?: string;
  plotStreet?: string;
  plotLength?: number;
  plotWidth?: number;
  plotAreaUnit?: string;
  srDevStatId?: string;
  salesStatusId?: string;
  surchargeAmount?: number;
  fileId?: string;
  plotBasePrice?: number;
  plotTotalAmount?: number;
  discountAmount?: number;
  discountDate?: Date;
  isPossessionReady?: boolean;
  plotCornerNo?: number;
  plotFacing?: string;
  plotRemarks?: string;
  plotLatitude?: number;
  plotLongitude?: number;
  plotBoundaryPoints?: Array<{ lat: number; lng: number }>;
}

export interface PlotQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  projectId?: string;
  plotBlockId?: string;
  plotType?: PlotType[];
  salesStatusId?: string[];
  srDevStatId?: string[];
  plotCategoryId?: string[];
  isAvailable?: boolean;
  isPossessionReady?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  plotFacing?: string[];
  hasFile?: boolean;
}

export interface PlotResponse {
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
    totalPlots: number;
    availablePlots: number;
    soldPlots: number;
    totalArea: number;
    totalValue: number;
    avgPrice: number;
  };
}

export interface PlotPriceCalculationDto {
  plotSizeId: string;
  plotCategoryId: string;
  plotType: PlotType;
  plotLength: number;
  plotWidth: number;
  discountAmount?: number;
}

export interface PlotAssignmentDto {
  plotId: string;
  fileId: string;
  salesStatusId: string;
  assignedBy: string;
  remarks?: string;
}

export interface BulkPlotUpdateDto {
  plotIds: string[];
  field: 'salesStatusId' | 'srDevStatId' | 'isPossessionReady' | 'plotCategoryId';
  value: any;
}

export interface PlotFilterOptions {
  projectId?: string;
  blockId?: string;
  type?: PlotType[];
  category?: string[];
  status?: string[];
  minArea?: number;
  maxArea?: number;
  minPrice?: number;
  maxPrice?: number;
  facing?: string[];
  availability?: 'available' | 'sold' | 'all';
}

export interface PlotStatistics {
  total: number;
  available: number;
  sold: number;
  reserved: number;
  byType: Record<PlotType, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  totalArea: number;
  totalValue: number;
  averagePrice: number;
}
