import { Types } from 'mongoose';

export enum InstallmentType {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
}

export enum InstallmentStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export interface Installment {
  _id: Types.ObjectId;
  memID: Types.ObjectId; // Member reference
  plotID: Types.ObjectId; // Plot reference
  installmentNo: number;
  installmentType: InstallmentType;
  dueDate: Date;
  amountDue: number;
  amountPaid: number;
  lateFeeSurcharge?: number;
  discountApplied?: number;
  totalReceived: number;
  paidDate?: Date;
  paymentModeID?: Types.ObjectId; // Payment Mode reference
  statusID?: Types.ObjectId; // Status reference (if using separate status table)
  status: InstallmentStatus; // Direct status field
  installmentRemarks?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface CreateInstallmentDto {
  memID: string;
  plotID: string;
  installmentNo: number;
  installmentType: InstallmentType;
  dueDate: string;
  amountDue: number;
  amountPaid?: number;
  lateFeeSurcharge?: number;
  discountApplied?: number;
  paidDate?: string;
  paymentModeID?: string;
  status?: InstallmentStatus;
  installmentRemarks?: string;
}

export interface UpdateInstallmentDto {
  amountPaid?: number;
  lateFeeSurcharge?: number;
  discountApplied?: number;
  paidDate?: string;
  paymentModeID?: string;
  status?: InstallmentStatus;
  installmentRemarks?: string;
}

export interface InstallmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: InstallmentStatus;
  installmentType?: InstallmentType;
  memID?: string;
  plotID?: string;
  paymentModeID?: string;
  startDate?: string;
  endDate?: string;
  dueDateStart?: string;
  dueDateEnd?: string;
  isOverdue?: boolean;
}

export interface InstallmentSummary {
  totalAmountDue: number;
  totalAmountPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalLateFees: number;
  totalDiscounts: number;
  totalInstallments: number;
  pendingInstallments: number;
  paidInstallments: number;
  overdueInstallments: number;
}

export interface MemberInstallmentSummary {
  memberId: string;
  memberName: string;
  totalAmountDue: number;
  totalAmountPaid: number;
  pendingAmount: number;
  overdueAmount: number;
  totalInstallments: number;
}
