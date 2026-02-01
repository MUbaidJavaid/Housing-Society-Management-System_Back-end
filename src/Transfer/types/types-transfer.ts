import { Types } from 'mongoose';
import { TransferStatus } from '../models/models-transfer';

export interface SrTransferType {
  _id: Types.ObjectId;
  fileId: Types.ObjectId;
  transferTypeId: Types.ObjectId;
  sellerMemId: Types.ObjectId;
  buyerMemId: Types.ObjectId;
  applicationId?: Types.ObjectId;
  ndcId?: Types.ObjectId;
  ndcDocPath?: string; // NEW
  transferFeePaid: boolean;
  transferFeeAmount?: number;
  transferFeePaidDate?: Date;
  transferInitDate: Date;
  transferExecutionDate?: Date; // NEW
  witness1Name?: string; // NEW
  witness1CNIC?: string; // NEW
  witness2Name?: string; // NEW
  witness2CNIC?: string; // NEW
  officerName?: string; // NEW
  officerDesignation?: string; // NEW
  transfIsAtt: boolean;
  transfClearanceCertPath?: string;
  nomineeId?: Types.ObjectId;
  status: TransferStatus;
  remarks?: string;
  legalReviewNotes?: string;
  cancellationReason?: string;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  file?: any;
  transferType?: any;
  seller?: any;
  buyer?: any;
  application?: any;
  ndc?: any;
  nominee?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  transferAge?: number;
  statusBadgeColor?: string;
  isOverdue?: boolean;
}

export interface CreateSrTransferDto {
  fileId: string;
  transferTypeId: string;
  sellerMemId: string;
  buyerMemId: string;
  applicationId?: string;
  ndcId?: string;
  ndcDocPath?: string; // NEW
  transferFeeAmount?: number;
  transferInitDate: Date;
  witness1Name?: string; // NEW
  witness1CNIC?: string; // NEW
  witness2Name?: string; // NEW
  witness2CNIC?: string; // NEW
  transfIsAtt?: boolean;
  transfClearanceCertPath?: string;
  nomineeId?: string;
  remarks?: string;
}

export interface UpdateSrTransferDto {
  transferTypeId?: string;
  ndcId?: string;
  ndcDocPath?: string; // NEW
  transferFeePaid?: boolean;
  transferFeeAmount?: number;
  transferFeePaidDate?: Date;
  transferExecutionDate?: Date; // NEW
  witness1Name?: string; // NEW
  witness1CNIC?: string; // NEW
  witness2Name?: string; // NEW
  witness2CNIC?: string; // NEW
  officerName?: string; // NEW
  officerDesignation?: string; // NEW
  transfIsAtt?: boolean;
  transfClearanceCertPath?: string;
  nomineeId?: string;
  status?: TransferStatus;
  remarks?: string;
  legalReviewNotes?: string;
  cancellationReason?: string;
  isActive?: boolean;
}

export interface RecordFeePaymentDto {
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId?: string;
  receiptNumber?: string;
}

export interface ExecuteTransferDto {
  executionDate: Date;
  witness1Name: string;
  witness1CNIC: string;
  witness2Name?: string;
  witness2CNIC?: string;
  officerName: string;
  officerDesignation: string;
  remarks?: string;
}

export interface TransferQueryParams {
  page?: number;
  limit?: number;
  fileId?: string;
  sellerMemId?: string;
  buyerMemId?: string;
  transferTypeId?: string;
  status?: TransferStatus;
  transferFeePaid?: boolean;
  transfIsAtt?: boolean;
  isActive?: boolean;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TransferStatistics {
  totalTransfers: number;
  pendingTransfers: number;
  underReviewTransfers: number;
  completedTransfers: number;
  cancelledTransfers: number;
  feePendingTransfers: number;
  totalFeeCollected: number;
  averageProcessingTime: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byMonth: Record<string, number>;
}

export interface TransferDashboardSummary {
  totalTransfers: number;
  pendingTransfers: number;
  feePendingTransfers: number;
  revenueGenerated: number;
  recentTransfers: SrTransferType[];
  topTransferTypes: Array<{
    typeId: Types.ObjectId;
    typeName: string;
    count: number;
    revenue: number;
  }>;
}

export interface TransferTimelineItem {
  date: Date;
  action: string;
  status: TransferStatus;
  performedBy: string;
  notes?: string;
}

export interface UploadNDCDocumentDto {
  file: Buffer;
  fileName: string;
  mimeType: string;
}
