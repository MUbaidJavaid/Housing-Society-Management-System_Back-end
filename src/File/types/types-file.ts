// src/database/File/types/types-file.ts
import { Types } from 'mongoose';
import { FileStatus, PaymentMode } from '../models/models-file';

export interface FileType {
  _id: Types.ObjectId;
  fileRegNo: string;
  fileBarCode: string;
  memId: Types.ObjectId;
  nomineeId?: Types.ObjectId;
  applicationId?: Types.ObjectId;
  plotId: Types.ObjectId; // REQUIRED

  totalAmount: number;
  downPayment: number;
  paymentMode: PaymentMode;
  isAdjusted: boolean;
  adjustmentRef?: string;
  status: FileStatus;
  fileRemarks?: string;
  bookingDate: Date;
  expectedCompletionDate?: Date;
  actualCompletionDate?: Date;
  cancellationDate?: Date;
  cancellationReason?: string;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  member?: any;
  nominee?: any;
  application?: any;
  plot?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  balanceAmount?: number;
  paymentPercentage?: number;
  fileAge?: number;
  statusBadgeColor?: string;
}

export interface CreateFileDto {
  fileRegNo?: string;
  memId: string;
  nomineeId?: string;
  applicationId?: string;
  plotId: string; // REQUIRED
  totalAmount: number;
  downPayment: number;
  paymentMode: PaymentMode;
  isAdjusted?: boolean;
  adjustmentRef?: string;
  fileRemarks?: string;
  bookingDate: Date;
  expectedCompletionDate?: Date;
}

export interface UpdateFileDto {
  nomineeId?: string;
  plotId?: string;
  totalAmount?: number;
  downPayment?: number;
  paymentMode?: PaymentMode;
  isAdjusted?: boolean;
  adjustmentRef?: string;
  status?: FileStatus;
  fileRemarks?: string;
  expectedCompletionDate?: Date;
  actualCompletionDate?: Date;
  cancellationReason?: string;
  isActive?: boolean;
}

export interface FileQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fileRegNo?: string;
  fileBarCode?: string;
  projId?: string; // Filter by project
  projectId?: string; // Back-compat alias
  memId?: string;
  nomineeId?: string;
  plotId?: string;
  status?: FileStatus;
  isAdjusted?: boolean;
  isActive?: boolean;
  minAmount?: number;
  maxAmount?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface FileStatistics {
  totalFiles: number;
  activeFiles: number;
  pendingFiles: number;
  cancelledFiles: number;
  closedFiles: number;
  totalAmount: number;
  totalDownPayment: number;
  averageAmount: number;
  averageDownPayment: number;
  byStatus: Record<string, number>;
  byProject: Record<string, number>;
  byMonth: Record<string, number>;
}

export interface FileDashboardSummary {
  totalFiles: number;
  activeFiles: number;
  pendingFiles: number;
  totalRevenue: number;
  recentFiles: FileType[];
  topProjects: Array<{
    projectId: Types.ObjectId;
    projectName: string;
    fileCount: number;
    totalAmount: number;
  }>;
}

export interface TransferFileDto {
  newMemberId: string;
  transferDate: Date;
  transferReason: string;
  transferFee?: number;
  transferRemarks?: string;
}

export interface AdjustFileDto {
  adjustmentType: 'REFUND' | 'CREDIT' | 'TRANSFER';
  adjustmentAmount: number;
  adjustmentDate: Date;
  adjustmentReason: string;
  referenceFileId?: string;
  remarks?: string;
}

// Enhanced type with plot details
export interface FileWithPlotDetails extends FileType {
  plotDetails?: {
    plotBlock?: {
      _id: string;
      plotBlockName: string;
      plotBlockDesc?: string;
    };
    plotSize?: {
      _id: string;
      plotSizeName: string;
      totalArea: number;
      areaUnit: string;
      ratePerUnit: number;
    };
    plotType?: {
      _id: string;
      plotTypeName: string;
      plotTypeCode?: string;
    };
    plotCategory?: {
      _id: string;
      categoryName: string;
      surchargePercentage?: number;
      surchargeFixedAmount?: number;
    };
    salesStatus?: {
      _id: string;
      statusName: string;
      statusCode: string;
      colorCode?: string;
    };
    developmentStatus?: {
      _id: string;
      srDevStatName: string;
      devCategory: string;
      devPhase: string;
      percentageComplete: number;
    };
    project?: {
      _id: string;
      projName: string;
      projCode: string;
      projPrefix?: string;
      projLocation?: string;
    };
  };
}
