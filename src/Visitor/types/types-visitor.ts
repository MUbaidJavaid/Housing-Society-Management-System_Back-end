import { Types } from 'mongoose';

export enum VisitorPurpose {
  PERSONAL = 'Personal',
  BUSINESS = 'Business',
  DELIVERY = 'Delivery',
  MAINTENANCE = 'Maintenance',
  GOVERNMENT = 'Government',
  EMERGENCY = 'Emergency',
  OTHER = 'Other',
}

export enum VisitorStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  CHECKED_IN = 'CheckedIn',
  CHECKED_OUT = 'CheckedOut',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
  CANCELLED = 'Cancelled',
}

export enum VehicleType {
  CAR = 'car',
  MOTORCYCLE = 'motorcycle',
  BICYCLE = 'bicycle',
  OTHER = 'other',
}

export interface VisitorType {
  _id: Types.ObjectId;
  visitorName: string;
  visitorNic?: string;
  visitorPhone: string;
  visitorEmail?: string;
  visitorCompany?: string;
  visitorPhoto?: string;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  purpose: VisitorPurpose;
  hostMemberId: Types.ObjectId;
  hostPlotId?: Types.ObjectId;
  passCode: string;
  qrCodeData: string;
  preApproved: boolean;
  preApprovedBy?: Types.ObjectId;
  preApprovedAt?: Date;
  expectedDate: Date;
  expectedTimeIn?: string;
  expectedTimeOut?: string;
  actualTimeIn?: Date;
  actualTimeOut?: Date;
  checkedInBy?: Types.ObjectId;
  checkedOutBy?: Types.ObjectId;
  status: VisitorStatus;
  remarks?: string;
  gateNumber?: string;
  numberOfGuests: number;
  societyId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Populated fields
  hostMember?: any;
  hostPlot?: any;
  preApprovedByMember?: any;
  checkedInByStaff?: any;
  checkedOutByStaff?: any;
  createdByUser?: any;
  modifiedByUser?: any;
}

export interface CreateVisitorDto {
  visitorName: string;
  visitorNic?: string;
  visitorPhone: string;
  visitorEmail?: string;
  visitorCompany?: string;
  visitorPhoto?: string;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  purpose: VisitorPurpose;
  hostMemberId: string;
  hostPlotId?: string;
  expectedDate: string | Date;
  expectedTimeIn?: string;
  expectedTimeOut?: string;
  remarks?: string;
  gateNumber?: string;
  numberOfGuests?: number;
  societyId?: string;
}

export interface UpdateVisitorDto {
  visitorName?: string;
  visitorNic?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorCompany?: string;
  visitorPhoto?: string;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  purpose?: VisitorPurpose;
  hostMemberId?: string;
  hostPlotId?: string;
  expectedDate?: string | Date;
  expectedTimeIn?: string;
  expectedTimeOut?: string;
  remarks?: string;
  gateNumber?: string;
  numberOfGuests?: number;
  status?: VisitorStatus;
}

export interface CheckInDto {
  gateNumber?: string;
  remarks?: string;
}

export interface CheckOutDto {
  remarks?: string;
}

export interface PreApproveDto {
  visitorName: string;
  visitorNic?: string;
  visitorPhone: string;
  visitorEmail?: string;
  visitorCompany?: string;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  purpose: VisitorPurpose;
  hostPlotId?: string;
  expectedDate: string | Date;
  expectedTimeIn?: string;
  expectedTimeOut?: string;
  remarks?: string;
  numberOfGuests?: number;
}

export interface VisitorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VisitorStatus;
  purpose?: VisitorPurpose;
  hostMemberId?: string;
  hostPlotId?: string;
  fromDate?: Date;
  toDate?: Date;
  preApproved?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetVisitorsResult {
  items: VisitorType[];
  pagination: PaginationResult;
}

export interface VisitorStats {
  total: number;
  pending: number;
  approved: number;
  checkedIn: number;
  checkedOut: number;
  rejected: number;
  expired: number;
  cancelled: number;
  todayVisitors: number;
  todayCheckedIn: number;
  todayCheckedOut: number;
  byPurpose: Record<string, number>;
}
