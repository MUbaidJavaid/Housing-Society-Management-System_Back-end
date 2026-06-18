import { Types } from 'mongoose';

// ============ Vendor Profile Types ============

export interface VendorProfileType {
  _id: Types.ObjectId;
  vendorName: string;
  companyName?: string;
  email: string;
  phone: string;
  address?: string;
  vendorType: string;
  registrationNumber?: string;
  taxId?: string;
  serviceAreas: Types.ObjectId[];
  documents: Array<{ name: string; fileUrl: string; fileType: string }>;
  bankDetails: {
    bankName?: string;
    accountNumber?: string;
    accountTitle?: string;
    branchCode?: string;
  };
  status: 'pending-verification' | 'active' | 'suspended' | 'blacklisted';
  verifiedBy?: Types.ObjectId;
  verificationDate?: Date;
  rating: number;
  totalRatings: number;
  totalContracts: number;
  completedContracts: number;
  userId?: Types.ObjectId;
  metadata: any;
  createdBy?: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVendorProfileDto {
  vendorName: string;
  companyName?: string;
  email: string;
  phone: string;
  address?: string;
  vendorType: string;
  registrationNumber?: string;
  taxId?: string;
  serviceAreas?: string[];
  documents?: Array<{ name: string; fileUrl: string; fileType: string }>;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountTitle?: string;
    branchCode?: string;
  };
  userId?: string;
}

export interface UpdateVendorProfileDto {
  vendorName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  vendorType?: string;
  registrationNumber?: string;
  taxId?: string;
  serviceAreas?: string[];
  documents?: Array<{ name: string; fileUrl: string; fileType: string }>;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountTitle?: string;
    branchCode?: string;
  };
  userId?: string;
}

// ============ Work Order Types ============

export interface WorkOrderType {
  _id: Types.ObjectId;
  title: string;
  description: string;
  societyId: Types.ObjectId;
  category: string;
  estimatedBudget?: number;
  deadline?: Date;
  scope?: string;
  documents: Array<{ name: string; fileUrl: string }>;
  status: 'draft' | 'open' | 'bidding' | 'awarded' | 'in-progress' | 'completed' | 'cancelled';
  awardedVendorId?: Types.ObjectId;
  awardedAmount?: number;
  awardedDate?: Date;
  completionDate?: Date;
  completionNotes?: string;
  bids: Array<{
    vendorId: Types.ObjectId;
    amount: number;
    proposal: string;
    submittedAt: Date;
    status: 'submitted' | 'under-review' | 'accepted' | 'rejected';
  }>;
  metadata: any;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkOrderDto {
  title: string;
  description: string;
  societyId: string;
  category: string;
  estimatedBudget?: number;
  deadline?: Date;
  scope?: string;
  documents?: Array<{ name: string; fileUrl: string }>;
}

export interface UpdateWorkOrderDto {
  title?: string;
  description?: string;
  category?: string;
  estimatedBudget?: number;
  deadline?: Date;
  scope?: string;
  documents?: Array<{ name: string; fileUrl: string }>;
  status?: string;
}

// ============ Vendor Contract Types ============

export interface VendorContractType {
  _id: Types.ObjectId;
  vendorId: Types.ObjectId;
  societyId: Types.ObjectId;
  workOrderId?: Types.ObjectId;
  contractName: string;
  description?: string;
  scope?: string;
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  amount: number;
  paymentFrequency: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
  documents: Array<{ name: string; fileUrl: string }>;
  performanceReviews: Array<{
    date: Date;
    rating: number;
    comments: string;
    reviewedBy: Types.ObjectId;
  }>;
  autoRenew: boolean;
  terminationReason?: string;
  metadata: any;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVendorContractDto {
  vendorId: string;
  societyId: string;
  workOrderId?: string;
  contractName: string;
  description?: string;
  scope?: string;
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  amount: number;
  paymentFrequency?: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  documents?: Array<{ name: string; fileUrl: string }>;
  autoRenew?: boolean;
}

export interface UpdateVendorContractDto {
  contractName?: string;
  description?: string;
  scope?: string;
  startDate?: Date;
  endDate?: Date;
  renewalDate?: Date;
  amount?: number;
  paymentFrequency?: 'one-time' | 'monthly' | 'quarterly' | 'annually';
  documents?: Array<{ name: string; fileUrl: string }>;
  autoRenew?: boolean;
}

// ============ Vendor Invoice Types ============

export interface VendorInvoiceType {
  _id: Types.ObjectId;
  vendorId: Types.ObjectId;
  societyId: Types.ObjectId;
  contractId?: Types.ObjectId;
  workOrderId?: Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  description?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  documents: Array<{ name: string; fileUrl: string }>;
  status: 'submitted' | 'under-review' | 'approved' | 'paid' | 'rejected' | 'disputed';
  approvedBy?: Types.ObjectId;
  approvalDate?: Date;
  paymentDate?: Date;
  paymentReference?: string;
  rejectionReason?: string;
  metadata: any;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVendorInvoiceDto {
  vendorId: string;
  societyId: string;
  contractId?: string;
  workOrderId?: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  description?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  documents?: Array<{ name: string; fileUrl: string }>;
}

export interface UpdateVendorInvoiceDto {
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  amount?: number;
  taxAmount?: number;
  totalAmount?: number;
  description?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  documents?: Array<{ name: string; fileUrl: string }>;
}

// ============ Query Params ============

export interface VendorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vendorType?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface WorkOrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  societyId?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContractQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vendorId?: string;
  societyId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InvoiceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  vendorId?: string;
  societyId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============ Pagination ============

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
