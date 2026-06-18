import { Types } from 'mongoose';

export interface PrivacySettings {
  _id: Types.ObjectId;
  memberId: Types.ObjectId;
  userId: Types.ObjectId;
  societyId: Types.ObjectId;
  profileVisibility: 'everyone' | 'committee-only' | 'hidden';
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  directoryOptOut: boolean;
  allowAnonymousComplaints: boolean;
  thirdPartySharing: boolean;
  showOnLeaderboard: boolean;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
    digest: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
  };
  dataRetentionConsent: boolean;
  marketingConsent: boolean;
  consentHistory: {
    consentType: string;
    granted: boolean;
    timestamp: Date;
    ipAddress: string;
  }[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrivacySettingsDto {
  memberId: string;
  userId: string;
  societyId: string;
  profileVisibility?: 'everyone' | 'committee-only' | 'hidden';
  showEmail?: boolean;
  showPhone?: boolean;
  showAddress?: boolean;
  directoryOptOut?: boolean;
  allowAnonymousComplaints?: boolean;
  thirdPartySharing?: boolean;
  showOnLeaderboard?: boolean;
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    digest?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  };
  dataRetentionConsent?: boolean;
  marketingConsent?: boolean;
}

export interface UpdatePrivacySettingsDto {
  profileVisibility?: 'everyone' | 'committee-only' | 'hidden';
  showEmail?: boolean;
  showPhone?: boolean;
  showAddress?: boolean;
  directoryOptOut?: boolean;
  allowAnonymousComplaints?: boolean;
  thirdPartySharing?: boolean;
  showOnLeaderboard?: boolean;
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    digest?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  };
  dataRetentionConsent?: boolean;
  marketingConsent?: boolean;
}

export interface PrivacyAccessLogQueryParams {
  page?: number;
  limit?: number;
  accessType?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAccessLogDto {
  memberId: string;
  accessorId: string;
  accessorRole: string;
  accessType:
    | 'view-profile'
    | 'view-contact'
    | 'view-documents'
    | 'export-data'
    | 'view-financial'
    | 'view-directory';
  fieldsAccessed?: string[];
  ipAddress?: string;
  userAgent?: string;
  societyId: string;
}

export interface DataExportRequest {
  memberId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
}

export interface DataDeletionRequest {
  memberId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
}

export interface PrivacyScoreResult {
  societyId: string;
  score: number;
  totalMembers: number;
  metrics: {
    profileHiddenCount: number;
    emailHiddenCount: number;
    phoneHiddenCount: number;
    directoryOptOutCount: number;
    thirdPartySharingDisabledCount: number;
    dataRetentionConsentCount: number;
    marketingConsentCount: number;
  };
}
