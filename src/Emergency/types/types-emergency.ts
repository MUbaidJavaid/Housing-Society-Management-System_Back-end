import { Types } from 'mongoose';

export interface ResponderType {
  userId: Types.ObjectId;
  respondedAt: Date;
  action?: string;
}

export interface TriggerLocationType {
  latitude?: number;
  longitude?: number;
}

export interface EmergencyAttachmentType {
  name: string;
  fileUrl: string;
}

export interface EmergencyContactType {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface EmergencyAlertType {
  _id: Types.ObjectId;
  societyId: Types.ObjectId;
  alertType: 'sos' | 'fire' | 'medical' | 'security' | 'natural_disaster' | 'gas_leak' | 'other';
  title: string;
  description?: string;
  triggeredBy: Types.ObjectId;
  triggerLocation?: TriggerLocationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'responding' | 'resolved' | 'false_alarm';
  responders: ResponderType[];
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  resolutionNotes?: string;
  affectedArea?: string;
  notificationsSent: number;
  attachments: EmergencyAttachmentType[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalProfileType {
  _id: Types.ObjectId;
  memberId: Types.ObjectId;
  societyId: Types.ObjectId;
  bloodGroup?: string;
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
  emergencyContact?: EmergencyContactType;
  doctorName?: string;
  doctorPhone?: string;
  hospitalPreference?: string;
  insuranceInfo?: string;
  metadata?: any;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriggerAlertDto {
  societyId: string;
  alertType: 'sos' | 'fire' | 'medical' | 'security' | 'natural_disaster' | 'gas_leak' | 'other';
  title: string;
  description?: string;
  triggerLocation?: TriggerLocationType;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  affectedArea?: string;
  attachments?: EmergencyAttachmentType[];
}

export interface RespondToAlertDto {
  action: string;
}

export interface ResolveAlertDto {
  notes?: string;
}

export interface UpsertMedicalProfileDto {
  societyId?: string;
  bloodGroup?: string;
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  emergencyContact?: EmergencyContactType;
  doctorName?: string;
  doctorPhone?: string;
  hospitalPreference?: string;
  insuranceInfo?: string;
  metadata?: any;
}

export interface AlertHistoryParams {
  page?: number;
  limit?: number;
  societyId?: string;
  alertType?: string;
  severity?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AlertHistoryResult {
  alerts: EmergencyAlertType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
