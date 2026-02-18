import { Types } from 'mongoose';
import { BillStatus } from '../models/models-bill-info';

export interface IBillTypePopulated {
  _id: Types.ObjectId;
  billTypeName: string;
  billTypeCategory?: string;
  defaultAmount?: number;
  isRecurring?: boolean;
}

export interface BillInfoType {
  _id: Types.ObjectId;
  billNo: string;
  billTypeId: Types.ObjectId;
  billType?: IBillTypePopulated;
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
  billTypeId: string;
  fileId: string;
  memId: string;
  billMonth: string;
  previousReading?: number;
  currentReading?: number;
  billAmount?: number; // Optional: uses BillType.defaultAmount if not provided
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
  billTypeId?: string;
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
  billTypeId: string;
  billMonth: string;
  dueDate: Date;
  gracePeriodDays?: number;
  templateData?: Record<string, any>;
}
