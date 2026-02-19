import { Types } from 'mongoose';

export interface PaymentMode {
  _id: Types.ObjectId;
  paymentModeName: string;
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
  paymentModeName: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePaymentModeDto {
  paymentModeName?: string;
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
