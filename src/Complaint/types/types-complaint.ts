import { Types } from 'mongoose';

export enum ComplaintPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency',
}

export enum ComplaintStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
  REOPENED = 'reopened',
  ON_HOLD = 'on_hold',
}

export interface ComplaintType {
  _id: Types.ObjectId;
  memId: Types.ObjectId;
  fileId?: Types.ObjectId;
  compCatId: Types.ObjectId;
  compTitle: string;
  compDescription: string;
  compDate: Date;
  compPriority: ComplaintPriority;
  statusId: Types.ObjectId;
  status?: ComplaintStatus; // Added status field
  assignedTo?: Types.ObjectId;
  resolutionNotes?: string;
  resolutionDate?: Date;
  attachmentPaths: string[];
  dueDate?: Date;
  escalationLevel: number;
  lastEscalatedAt?: Date;
  isEscalated: boolean;
  slaHours: number;
  slaBreached: boolean;
  satisfactionRating?: number;
  feedback?: string;
  estimatedResolutionDate?: Date;
  tags: string[];
  followUpDate?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  slaStatus?: string;
  ageInDays?: number;
  resolutionTimeInDays?: number;
  priorityColor?: string;
  statusLabel?: string;

  // Populated fields
  member?: any;
  file?: any;
  category?: any;
  assignedUser?: any;
  statusObj?: any; // Renamed to avoid conflict
  createdByUser?: any;
  updatedByUser?: any;
}

export interface CreateComplaintDto {
  memId: string;
  fileId?: string;
  compCatId: string;
  compTitle: string;
  compDescription: string;
  compDate?: Date;
  compPriority?: ComplaintPriority;
  statusId?: string;
  status?: ComplaintStatus;
  assignedTo?: string;
  resolutionNotes?: string;
  resolutionDate?: Date;
  attachmentPaths?: string[];
  slaHours?: number;
  tags?: string[];
  followUpDate?: Date;
}

export interface UpdateComplaintDto {
  compTitle?: string;
  compDescription?: string;
  compPriority?: ComplaintPriority;
  statusId?: string;
  status?: ComplaintStatus;
  assignedTo?: string;
  resolutionNotes?: string;
  resolutionDate?: Date;
  attachmentPaths?: string[];
  escalationLevel?: number;
  lastEscalatedAt?: Date;
  isEscalated?: boolean;
  satisfactionRating?: number;
  feedback?: string;
  estimatedResolutionDate?: Date;
  tags?: string[];
  followUpDate?: Date;
}

export interface ComplaintQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  memId?: string;
  fileId?: string;
  compCatId?: string;
  statusId?: string;
  status?: ComplaintStatus;
  assignedTo?: string;
  compPriority?: ComplaintPriority;
  fromDate?: Date;
  toDate?: Date;
  slaBreached?: boolean;
  isEscalated?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BulkStatusUpdateDto {
  complaintIds: string[];
  statusId: string;
  status?: ComplaintStatus;
  resolutionNotes?: string;
}

export interface AssignComplaintDto {
  assignedTo: string;
  estimatedResolutionDate?: Date;
}

export interface ResolveComplaintDto {
  resolutionNotes: string;
  satisfactionRating?: number;
  feedback?: string;
}

export interface EscalateComplaintDto {
  escalationLevel: number;
  assignedTo?: string;
  notes: string;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetComplaintsResult {
  complaints: ComplaintType[];
  statistics: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    overdue: number;
    escalated: number;
    byPriority: Record<string, { total: number; open: number }>; // Fixed type
    byCategory: Record<string, { total: number; open: number }>; // Fixed type
  };
  pagination: PaginationResult;
}

export interface ComplaintStatistics {
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  closedComplaints: number;
  overdueComplaints: number;
  escalatedComplaints: number;
  averageResolutionTime: number;
  satisfactionScore: number;
  byPriority: Record<string, { total: number; open: number }>;
  byCategory: Record<string, { total: number; open: number }>;
  byStatus: Record<string, number>;
  monthlyTrend: Array<{ month: string; count: number }>;
}

export interface DashboardStats {
  overview: {
    total: number;
    open: number;
    inProgress: number;
    overdue: number;
    escalated: number;
  };
  priorityDistribution: Array<{ priority: string; count: number; percentage: number }>;
  categoryDistribution: Array<{ category: string; count: number; percentage: number }>;
  resolutionRate: {
    resolved: number;
    total: number;
    rate: number;
  };
  averageResolutionTime: number;
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: ComplaintType[];
}

// Helper interface for service statistics
export interface ComplaintStatsResult {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  overdue: number;
  escalated: number;
  byPriority: Record<string, { total: number; open: number }>;
  byCategory: Record<string, { total: number; open: number }>;
}
