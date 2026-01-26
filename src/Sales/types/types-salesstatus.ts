import { Types } from 'mongoose';

export enum SalesStatusType {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  RESERVED = 'reserved',
  ALLOTTED = 'allotted',
  CONTRACTED = 'contracted',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
  SOLD = 'sold',
  PENDING = 'pending',
  CLOSED = 'closed',
}

export interface SalesStatus {
  _id: Types.ObjectId;
  statusName: string;
  statusCode: string;
  statusType: SalesStatusType;
  description?: string;
  colorCode: string;
  isActive: boolean;
  isDefault: boolean;
  sequence: number;
  allowsSale: boolean;
  requiresApproval: boolean;
  notificationTemplate?: string;
  colorName?: string; // Virtual
  cssClass?: string; // Virtual
  badgeVariant?: string; // Virtual
  allowedTransitions?: SalesStatusType[]; // Virtual
  createdBy: any;
  createdAt: Date;
  updatedBy?: any;
  updatedAt: Date;
}

export interface CreateSalesStatusDto {
  statusName: string;
  statusCode: string;
  statusType: SalesStatusType;
  description?: string;
  colorCode?: string;
  isActive?: boolean;
  isDefault?: boolean;
  sequence?: number;
  allowsSale?: boolean;
  requiresApproval?: boolean;
  notificationTemplate?: string;
}

export interface UpdateSalesStatusDto {
  statusName?: string;
  statusCode?: string;
  statusType?: SalesStatusType;
  description?: string;
  colorCode?: string;
  isActive?: boolean;
  isDefault?: boolean;
  sequence?: number;
  allowsSale?: boolean;
  requiresApproval?: boolean;
  notificationTemplate?: string;
}

export interface SalesStatusQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  statusType?: SalesStatusType[];
  isActive?: boolean;
  allowsSale?: boolean;
  requiresApproval?: boolean;
}

export interface SalesStatusResponse {
  success: boolean;
  data?: any;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary?: {
    totalStatuses: number;
    activeStatuses: number;
    salesAllowedCount: number;
    byType: Record<SalesStatusType, number>;
  };
}

export interface StatusTransitionDto {
  fromStatusId: string;
  toStatusId: string;
  plotId?: string;
  customerId?: string;
  remarks?: string;
}

export interface BulkStatusUpdateDto {
  statusIds: string[];
  field: 'isActive' | 'allowsSale' | 'requiresApproval';
  value: boolean;
}

export interface WorkflowValidationDto {
  currentStatusId: string;
  targetStatusId: string;
}

export interface StatusWorkflow {
  currentStatus: SalesStatus;
  allowedTransitions: SalesStatus[];
  validationRules?: any[];
}
