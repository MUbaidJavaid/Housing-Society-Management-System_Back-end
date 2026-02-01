import { Types } from 'mongoose';
import { InstallmentStatus, PaymentMode } from '../models/models-installment';

export interface InstallmentType {
  _id: Types.ObjectId;
  fileId: Types.ObjectId;
  memId: Types.ObjectId;
  plotId: Types.ObjectId;
  installmentCategoryId: Types.ObjectId;
  installmentNo: number;
  installmentTitle: string;
  installmentType: InstallmentType;
  dueDate: Date;
  amountDue: number;
  lateFeeSurcharge?: number;
  totalPayable: number;
  amountPaid: number;
  balanceAmount: number;
  paidDate?: Date;
  paymentMode?: PaymentMode;
  transactionRefNo?: string;
  status: InstallmentStatus;
  installmentRemarks?: string;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  file?: any;
  member?: any;
  plot?: any;
  installmentCategory?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  isOverdue?: boolean;
  daysOverdue?: number;
  paymentStatusColor?: string;
}

export interface CreateInstallmentDto {
  fileId: string;
  memId: string;
  plotId: string;
  installmentCategoryId: string;
  installmentNo: number;
  installmentTitle: string;
  installmentType: InstallmentType;
  dueDate: Date;
  amountDue: number;
  lateFeeSurcharge?: number;
  installmentRemarks?: string;
}

export interface UpdateInstallmentDto {
  installmentNo?: number;
  installmentTitle?: string;
  installmentType?: InstallmentType;
  dueDate?: Date;
  amountDue?: number;
  lateFeeSurcharge?: number;
  amountPaid?: number;
  paidDate?: Date;
  paymentMode?: PaymentMode;
  transactionRefNo?: string;
  status?: InstallmentStatus;
  installmentRemarks?: string;
}

export interface RecordPaymentDto {
  amountPaid: number;
  paidDate: Date;
  paymentMode: PaymentMode;
  transactionRefNo?: string;
  remarks?: string;
}

export interface InstallmentQueryParams {
  page?: number;
  limit?: number;
  fileId?: string;
  memId?: string;
  plotId?: string;
  installmentCategoryId?: string;
  status?: InstallmentStatus;
  installmentType?: InstallmentType;
  paymentMode?: PaymentMode;
  fromDate?: Date;
  toDate?: Date;
  overdue?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InstallmentSummary {
  totalInstallments: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  totalBalance: number;
  totalLateFee: number;
  paidInstallments: number;
  unpaidInstallments: number;
  overdueInstallments: number;
  partiallyPaidInstallments: number;
  byStatus: Record<string, { count: number; amount: number; paid: number; balance: number }>;
  byCategory: Record<string, { count: number; amount: number; paid: number }>;
  byMonth: Record<string, number>;
}

export interface InstallmentDashboardSummary {
  totalOutstanding: number;
  totalPaidToday: number;
  totalDueToday: number;
  totalOverdue: number;
  recentPayments: InstallmentType[];
  upcomingDue: InstallmentType[];
  topPayers: Array<{
    memId: Types.ObjectId;
    memberName: string;
    totalPaid: number;
    totalDue: number;
  }>;
}

export interface InstallmentReportParams {
  startDate: Date;
  endDate: Date;
  fileId?: string;
  memId?: string;
  plotId?: string;
  installmentCategoryId?: string;
  status?: InstallmentStatus;
  installmentType?: InstallmentType;
}

export interface InstallmentReport {
  summary: {
    totalRecords: number;
    totalAmountDue: number;
    totalAmountPaid: number;
    totalBalance: number;
    totalLateFee: number;
  };
  data: InstallmentType[];
  byDate: Array<{ date: string; amount: number; count: number }>;
  byCategory: Array<{ category: string; amount: number; count: number }>;
  byStatus: Array<{ status: string; amount: number; count: number }>;
}

export interface BulkInstallmentCreationDto {
  fileId: string;
  memId: string;
  plotId: string;
  installmentCategoryId: string;
  installmentType: InstallmentType;
  totalInstallments: number;
  amountPerInstallment: number;
  startDate: Date;
  frequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  installmentTitle?: string;
}
