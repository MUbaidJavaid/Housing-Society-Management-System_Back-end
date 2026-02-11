import { Types } from 'mongoose';
import { DefaulterStatus } from '../models/models-defaulter';

export interface DefaulterType {
  _id: Types.ObjectId;
  memId: Types.ObjectId;
  plotId: Types.ObjectId;
  fileId: Types.ObjectId;
  totalOverdueAmount: number;
  lastPaymentDate?: Date;
  daysOverdue: number;
  noticeSentCount: number;
  status: DefaulterStatus;
  remarks?: string;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isActive: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  member?: any;
  plot?: any;
  file?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  statusBadgeColor?: string;
}

export interface CreateDefaulterDto {
  memId: string;
  plotId: string;
  fileId: string;
  totalOverdueAmount: number;
  lastPaymentDate?: Date;
  noticeSentCount?: number;
  remarks?: string;
}

export interface UpdateDefaulterDto {
  totalOverdueAmount?: number;
  lastPaymentDate?: Date;
  noticeSentCount?: number;
  status?: DefaulterStatus;
  remarks?: string;
  isActive?: boolean;
}

export interface DefaulterQueryParams {
  page?: number;
  limit?: number;
  memId?: string;
  plotId?: string;
  fileId?: string;
  status?: DefaulterStatus;
  minAmount?: number;
  maxAmount?: number;
  minDays?: number;
  maxDays?: number;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DefaulterStatistics {
  totalDefaulters: number;
  activeDefaulters: number;
  byStatus: Record<string, number>;
  totalOverdueAmount: number;
  averageOverdueAmount: number;
  averageDaysOverdue: number;
  topDefaulters: Array<{
    memId: Types.ObjectId;
    memName: string;
    totalAmount: number;
    daysOverdue: number;
  }>;
  byNoticeCount: Record<string, number>;
}

export interface SendNoticeDto {
  noticeType: 'WARNING' | 'FINAL' | 'LEGAL';
  noticeContent: string;
  sendMethod: 'EMAIL' | 'SMS' | 'LETTER' | 'ALL';
}

export interface ResolveDefaulterDto {
  paymentAmount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId?: string;
  remarks?: string;
}
