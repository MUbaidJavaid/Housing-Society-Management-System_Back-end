import { Types } from 'mongoose';

export enum PossessionStatus {
  REQUESTED = 'requested',
  SURVEYED = 'surveyed',
  READY = 'ready',
  HANDED_OVER = 'handed_over',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export interface Possession {
  _id: Types.ObjectId;
  fileId: Types.ObjectId;
  plotId: Types.ObjectId;
  possessionStatus: PossessionStatus;
  possessionCode: string;
  possessionInitDate: Date;
  possessionHandoverDate?: Date;
  possessionSurveyPerson?: string;
  possessionSurveyDate?: Date;
  possessionIsCollected: boolean;
  possessionCollectorName?: string;
  possessionCollectorNic?: string;
  possessionCollectionDate?: Date;
  possessionHandoverCSR: Types.ObjectId;
  possessionAttachment1?: string;
  possessionAttachment2?: string;
  possessionAttachment3?: string;
  possessionRemarks?: string;
  possessionSurveyRemarks?: string;
  possessionHandoverRemarks?: string;
  possessionLatitude?: number;
  possessionLongitude?: number;
  // Virtual fields
  possessionDurationDays?: number;
  possessionAgeDays?: number;
  statusColor?: string;
  statusDisplayName?: string;
  allowedNextStatuses?: PossessionStatus[];
  formattedInitDate?: string;
  formattedHandoverDate?: string;
  createdBy: any;
  createdAt: Date;
  updatedBy?: any;
  updatedAt: Date;
}

export interface CreatePossessionDto {
  fileId: string;
  plotId: string;
  possessionStatus?: PossessionStatus;
  possessionInitDate: Date;
  possessionSurveyPerson?: string;
  possessionSurveyDate?: Date;
  possessionCollectorName?: string;
  possessionCollectorNic?: string;
  possessionCollectionDate?: Date;
  possessionHandoverCSR: string;
  possessionAttachment1?: string;
  possessionAttachment2?: string;
  possessionAttachment3?: string;
  possessionRemarks?: string;
  possessionSurveyRemarks?: string;
  possessionHandoverRemarks?: string;
  possessionLatitude?: number;
  possessionLongitude?: number;
}

export interface UpdatePossessionDto {
  possessionStatus?: PossessionStatus;
  possessionHandoverDate?: Date;
  possessionSurveyPerson?: string;
  possessionSurveyDate?: Date;
  possessionIsCollected?: boolean;
  possessionCollectorName?: string;
  possessionCollectorNic?: string;
  possessionCollectionDate?: Date;
  possessionHandoverCSR?: string;
  possessionAttachment1?: string;
  possessionAttachment2?: string;
  possessionAttachment3?: string;
  possessionRemarks?: string;
  possessionSurveyRemarks?: string;
  possessionHandoverRemarks?: string;
  possessionLatitude?: number;
  possessionLongitude?: number;
}

export interface PossessionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fileId?: string;
  plotId?: string;
  status?: PossessionStatus[];
  isCollected?: boolean;
  csrId?: string;
  startDate?: Date;
  endDate?: Date;
  minDuration?: number;
  maxDuration?: number;
  projectId?: string; // Filter by project through plot
}

export interface PossessionResponse {
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
    totalPossessions: number;
    byStatus: Record<PossessionStatus, number>;
    collectedCount: number;
    pendingCount: number;
    averageDuration: number;
  };
}

export interface StatusTransitionDto {
  possessionId: string;
  newStatus: PossessionStatus;
  remarks?: string;
  surveyPerson?: string;
  surveyDate?: Date;
  handoverDate?: Date;
  attachments?: {
    certificate?: string;
    photo?: string;
    other?: string;
  };
}

export interface CollectorUpdateDto {
  possessionId: string;
  collectorName: string;
  collectorNic: string;
  collectionDate: Date;
  isCollected: boolean;
}

export interface BulkStatusUpdateDto {
  possessionIds: string[];
  status: PossessionStatus;
  remarks?: string;
}

export interface PossessionReportDto {
  startDate: Date;
  endDate: Date;
  status?: PossessionStatus;
  projectId?: string;
  csrId?: string;
}

export interface HandoverCertificateDto {
  possessionId: string;
  certificateNumber: string;
  certificateDate: Date;
  issuedBy: string;
  authorizedSignatory: string;
  certificatePath: string;
}
