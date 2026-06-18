import { Types } from 'mongoose';

export interface GatePassType {
  _id: Types.ObjectId;
  passNumber: string;
  societyId: Types.ObjectId;
  passType: string;
  requestedBy: Types.ObjectId;
  plotId?: Types.ObjectId;
  description: string;
  items: GatePassItemType[];
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  driverCNIC?: string;
  driverPhone?: string;
  companyName?: string;
  expectedDate: Date;
  expectedTime?: string;
  actualEntryTime?: Date;
  actualExitTime?: Date;
  photos: GatePassPhotoType[];
  approvedBy?: Types.ObjectId;
  approvalDate?: Date;
  checkedInBy?: Types.ObjectId;
  checkedOutBy?: Types.ObjectId;
  securityNotes?: string;
  status: string;
  rejectionReason?: string;
  passCode: string;
  metadata: any;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GatePassItemType {
  name: string;
  quantity?: number;
  unit?: string;
  estimatedValue?: number;
}

export interface GatePassPhotoType {
  url: string;
  description?: string;
  capturedAt?: Date;
}

export interface CreateGatePassDto {
  societyId: string;
  passType: string;
  requestedBy: string;
  plotId?: string;
  description: string;
  items?: Array<{ name: string; quantity?: number; unit?: string; estimatedValue?: number }>;
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  driverCNIC?: string;
  driverPhone?: string;
  companyName?: string;
  expectedDate: string;
  expectedTime?: string;
  metadata?: any;
}

export interface UpdateGatePassDto {
  description?: string;
  items?: Array<{ name: string; quantity?: number; unit?: string; estimatedValue?: number }>;
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  driverCNIC?: string;
  driverPhone?: string;
  companyName?: string;
  expectedDate?: string;
  expectedTime?: string;
  metadata?: any;
}

export interface GatePassQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  societyId?: string;
  status?: string;
  passType?: string;
  requestedBy?: string;
  expectedDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RejectPassDto {
  reason: string;
}

export interface CheckInDto {
  notes?: string;
}

export interface CheckOutDto {
  notes?: string;
  photos?: Array<{ url: string; description?: string }>;
}
