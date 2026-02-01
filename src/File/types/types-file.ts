import { Types } from 'mongoose';
import { FileStatus, PaymentMode } from '../models/models-file';

export interface FileType {
  _id: Types.ObjectId;
  fileRegNo: string;
  fileBarCode: string;
  projId: Types.ObjectId;
  memId: Types.ObjectId;
  nomineeId?: Types.ObjectId;
  applicationId?: Types.ObjectId;
  plotId?: Types.ObjectId;
  plotTypeId?: Types.ObjectId;
  plotSizeId?: Types.ObjectId;
  plotBlockId?: Types.ObjectId;
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
  project?: any;
  member?: any;
  nominee?: any;
  application?: any;
  plot?: any;
  plotType?: any;
  plotSize?: any;
  plotBlock?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  balanceAmount?: number;
  paymentPercentage?: number;
  fileAge?: number;
  statusBadgeColor?: string;
}

export interface CreateFileDto {
  fileRegNo?: string;
  projId: string;
  memId: string;
  nomineeId?: string;
  applicationId?: string;
  plotId?: string;
  plotTypeId?: string;
  plotSizeId?: string;
  plotBlockId?: string;
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
  plotTypeId?: string;
  plotSizeId?: string;
  plotBlockId?: string;
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
  projId?: string;
  memId?: string;
  nomineeId?: string;
  plotId?: string;
  plotTypeId?: string;
  plotSizeId?: string;
  plotBlockId?: string;
  status?: FileStatus;
  isAdjusted?: boolean;
  isActive?: boolean;
  minAmount?: number;
  maxAmount?: number;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
