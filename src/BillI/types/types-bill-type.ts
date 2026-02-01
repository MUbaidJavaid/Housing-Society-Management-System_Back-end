import { Types } from 'mongoose';
import { BillTypeCategory } from '../models/models-bill-type';

export interface BillTypeType {
  _id: Types.ObjectId;
  billTypeName: string;
  billTypeCategory: BillTypeCategory;
  description?: string;
  isRecurring: boolean;
  defaultAmount?: number;
  frequency?: 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'ANNUALLY' | 'ONE_TIME';
  calculationMethod?: 'FIXED' | 'PER_UNIT' | 'PERCENTAGE' | 'TIERED';
  unitType?: string;
  ratePerUnit?: number;
  taxRate?: number;
  isTaxable: boolean;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  createdByUser?: any;
  modifiedByUser?: any;
  billCount?: number;
  categoryBadgeColor?: string;
}

export interface CreateBillTypeDto {
  billTypeName: string;
  billTypeCategory: BillTypeCategory;
  description?: string;
  isRecurring: boolean;
  defaultAmount?: number;
  frequency?: 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'ANNUALLY' | 'ONE_TIME';
  calculationMethod?: 'FIXED' | 'PER_UNIT' | 'PERCENTAGE' | 'TIERED';
  unitType?: string;
  ratePerUnit?: number;
  taxRate?: number;
  isTaxable?: boolean;
}

export interface UpdateBillTypeDto {
  billTypeName?: string;
  billTypeCategory?: BillTypeCategory;
  description?: string;
  isRecurring?: boolean;
  defaultAmount?: number;
  frequency?: 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'ANNUALLY' | 'ONE_TIME';
  calculationMethod?: 'FIXED' | 'PER_UNIT' | 'PERCENTAGE' | 'TIERED';
  unitType?: string;
  ratePerUnit?: number;
  taxRate?: number;
  isTaxable?: boolean;
  isActive?: boolean;
}

export interface BillTypeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: BillTypeCategory;
  isRecurring?: boolean;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BillTypeStatistics {
  totalBillTypes: number;
  byCategory: Record<string, number>;
  recurringCount: number;
  nonRecurringCount: number;
  activeCount: number;
  inactiveCount: number;
  mostUsedTypes: Array<{
    billTypeName: string;
    billCount: number;
    category: string;
  }>;
}

export interface CalculateAmountParams {
  billTypeId: string;
  units?: number;
  baseAmount?: number;
  applyTax?: boolean;
}
