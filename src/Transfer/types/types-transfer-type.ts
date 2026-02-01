import { Types } from 'mongoose';

export interface SrTransferTypeType {
  _id: Types.ObjectId;
  typeName: string;
  description?: string;
  transferFee: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  createdByUser?: any;
  modifiedByUser?: any;
  transferCount?: number;
  formattedFee?: string;
}

export interface CreateSrTransferTypeDto {
  typeName: string;
  description?: string;
  transferFee: number;
}

export interface UpdateSrTransferTypeDto {
  typeName?: string;
  description?: string;
  transferFee?: number;
  isActive?: boolean;
}

export interface SrTransferTypeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  minFee?: number;
  maxFee?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SrTransferTypeStatistics {
  totalTypes: number;
  activeTypes: number;
  inactiveTypes: number;
  totalTransfers: number;
  totalFeeGenerated: number;
  averageFee: number;
  mostUsedTypes: Array<{
    typeName: string;
    transferCount: number;
    totalFee: number;
  }>;
}

export interface TransferTypeSummary {
  totalTypes: number;
  activeTypes: number;
  totalTransfers: number;
  revenueGenerated: number;
  recentlyAdded: SrTransferTypeType[];
}

export interface FeeCalculationParams {
  transferTypeId: string;
  propertyValue?: number;
  applyDiscount?: boolean;
  discountPercentage?: number;
}
