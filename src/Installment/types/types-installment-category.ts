import { Types } from 'mongoose';

export interface InstallmentCategoryType {
  _id: Types.ObjectId;
  instCatName: string;
  instCatDescription?: string;
  isRefundable: boolean;
  isMandatory: boolean;
  sequenceOrder: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  createdByUser?: any;
  modifiedByUser?: any;
}

export interface CreateInstallmentCategoryDto {
  instCatName: string;
  instCatDescription?: string;
  isRefundable?: boolean;
  isMandatory?: boolean;
  sequenceOrder: number;
  isActive?: boolean;
}

export interface UpdateInstallmentCategoryDto {
  instCatName?: string;
  instCatDescription?: string;
  isRefundable?: boolean;
  isMandatory?: boolean;
  sequenceOrder?: number;
  isActive?: boolean;
}

export interface InstallmentCategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isRefundable?: boolean;
  isMandatory?: boolean;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InstallmentCategorySummary {
  totalCategories: number;
  activeCategories: number;
  mandatoryCategories: number;
  refundableCategories: number;
  categoriesByType: Array<{
    name: string;
    count: number;
    isMandatory: boolean;
    isRefundable: boolean;
  }>;
}

// Default categories for seeding
export const DEFAULT_INSTALLMENT_CATEGORIES = [
  {
    instCatName: 'Down Payment',
    instCatDescription: 'Initial payment made when booking a property',
    isRefundable: false,
    isMandatory: true,
    sequenceOrder: 1,
  },
  {
    instCatName: 'Monthly Installment',
    instCatDescription: 'Regular monthly payment',
    isRefundable: false,
    isMandatory: true,
    sequenceOrder: 2,
  },
  {
    instCatName: 'Quarterly Balloon',
    instCatDescription: 'Quarterly lump sum payment',
    isRefundable: false,
    isMandatory: true,
    sequenceOrder: 3,
  },
  {
    instCatName: 'Possession Fee',
    instCatDescription: 'Fee charged at the time of possession',
    isRefundable: false,
    isMandatory: true,
    sequenceOrder: 4,
  },
  {
    instCatName: 'Balloting Fee',
    instCatDescription: 'Fee for participating in balloting process',
    isRefundable: false,
    isMandatory: true,
    sequenceOrder: 5,
  },
  {
    instCatName: 'Utility Connection Charges',
    instCatDescription: 'Charges for water, electricity, gas connections',
    isRefundable: false,
    isMandatory: true,
    sequenceOrder: 6,
  },
  {
    instCatName: 'Security Deposit',
    instCatDescription: 'Refundable deposit for utilities',
    isRefundable: true,
    isMandatory: true,
    sequenceOrder: 7,
  },
  {
    instCatName: 'Development Charges',
    instCatDescription: 'Charges for infrastructure development',
    isRefundable: false,
    isMandatory: true,
    sequenceOrder: 8,
  },
  {
    instCatName: 'Legal Fee',
    instCatDescription: 'Legal documentation and processing fee',
    isRefundable: false,
    isMandatory: true,
    sequenceOrder: 9,
  },
  {
    instCatName: 'Transfer Fee',
    instCatDescription: 'Fee for property transfer',
    isRefundable: false,
    isMandatory: false,
    sequenceOrder: 10,
  },
];
