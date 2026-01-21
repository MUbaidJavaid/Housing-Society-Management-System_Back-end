import { Types } from 'mongoose';

export enum PaymentModeName {
  CASH = 'cash',
  BANK_TRANSFER = 'Bank transfer',
  CHEQUE = 'check',
  PAY_ORDER = 'p/0',
}

export interface PaymentMode {
  _id: Types.ObjectId;
  paymentModeName: PaymentModeName;
  description?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  modifiedOn?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface CreatePaymentModeDto {
  paymentModeName: PaymentModeName;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePaymentModeDto {
  paymentModeName?: PaymentModeName;
  description?: string;
  isActive?: boolean;
}

export interface PaymentModeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}
