import { Types } from 'mongoose';
import { BillStatus, BillType } from '../models/models-bill-info';

export interface BillInfoType {
  _id: Types.ObjectId;
  billNo: string;
  billType: BillType;
  fileId: Types.ObjectId;
  memId: Types.ObjectId;
  billMonth: string;
  previousReading?: number;
  currentReading?: number;
  unitsConsumed?: number;
  billAmount: number;
  fineAmount: number;
  arrears: number;
  totalPayable: number;
  dueDate: Date;
  gracePeriodDays: number;
  status: BillStatus;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  file?: any;
  member?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  isOverdue?: boolean;
  daysOverdue?: number;
  totalPaid?: number;
  remainingBalance?: number;
  statusBadgeColor?: string;
}

export interface CreateBillInfoDto {
  billNo?: string;
  billType: BillType;
  fileId: string;
  memId: string;
  billMonth: string;
  previousReading?: number;
  currentReading?: number;
  billAmount: number;
  fineAmount?: number;
  arrears?: number;
  dueDate: Date;
  gracePeriodDays?: number;
  notes?: string;
}

export interface UpdateBillInfoDto {
  previousReading?: number;
  currentReading?: number;
  billAmount?: number;
  fineAmount?: number;
  arrears?: number;
  dueDate?: Date;
  gracePeriodDays?: number;
  status?: BillStatus;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface RecordPaymentDto {
  paymentAmount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export interface BillQueryParams {
  page?: number;
  limit?: number;
  memId?: string;
  fileId?: string;
  billType?: BillType;
  status?: BillStatus;
  billMonth?: string;
  year?: number;
  isOverdue?: boolean;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BillStatistics {
  totalBills: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  byType: Record<string, number>;
  byMonth: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface GenerateBillsDto {
  memberIds: string[];
  billType: BillType;
  billMonth: string;
  dueDate: Date;
  gracePeriodDays?: number;
  templateData?: Record<string, any>;
}
