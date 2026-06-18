import { Types } from 'mongoose';

export interface MaintenanceRequestType {
  _id: Types.ObjectId;
  requestNumber: string;
  societyId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  plotId?: Types.ObjectId;
  category: string;
  title: string;
  description: string;
  location: string;
  priority: string;
  images: Array<{ url: string; description?: string }>;
  status: string;
  assignedTo?: Types.ObjectId;
  assignedVendor?: Types.ObjectId;
  estimatedCost?: number;
  actualCost?: number;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  workLog: WorkLogType[];
  residentFeedback?: ResidentFeedbackType;
  rejectionReason?: string;
  slaDeadline?: Date;
  isOverdue: boolean;
  metadata: any;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkLogType {
  date: Date;
  description: string;
  loggedBy: Types.ObjectId;
  hoursWorked?: number;
  photos: string[];
}

export interface ResidentFeedbackType {
  rating: number;
  comment?: string;
  feedbackDate: Date;
}

export interface CreateMaintenanceRequestDto {
  societyId: string;
  requestedBy: string;
  plotId?: string;
  category: string;
  title: string;
  description: string;
  location: string;
  priority?: string;
  images?: Array<{ url: string; description?: string }>;
  metadata?: any;
}

export interface UpdateMaintenanceRequestDto {
  category?: string;
  title?: string;
  description?: string;
  location?: string;
  priority?: string;
  images?: Array<{ url: string; description?: string }>;
  metadata?: any;
}

export interface MaintenanceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  societyId?: string;
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  isOverdue?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AssignStaffDto {
  staffId: string;
}

export interface AssignVendorDto {
  vendorId: string;
  estimatedCost: number;
  estimatedDate: string;
}

export interface AddWorkLogDto {
  description: string;
  hoursWorked?: number;
  photos?: string[];
}

export interface SubmitFeedbackDto {
  rating: number;
  comment?: string;
}

export interface RejectRequestDto {
  reason: string;
}
