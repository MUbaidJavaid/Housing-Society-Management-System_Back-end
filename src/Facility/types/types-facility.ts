import { Types } from 'mongoose';
import { FacilityTypeEnum } from '../models/models-facility';

export interface IOperatingHourDto {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface FacilityPlainType {
  _id: Types.ObjectId;
  facilityName: string;
  facilityCode: string;
  description?: string;
  facilityType: FacilityTypeEnum;
  location?: string;
  capacity?: number;
  images?: string[];
  amenities?: string[];
  hourlyRate: number;
  halfDayRate: number;
  fullDayRate: number;
  securityDeposit: number;
  currency: string;
  operatingHours: IOperatingHourDto[];
  slotDurationMinutes: number;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  cancellationPolicyHours: number;
  requiresApproval: boolean;
  rules?: string;
  societyId?: Types.ObjectId;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFacilityDto {
  facilityName: string;
  description?: string;
  facilityType: FacilityTypeEnum;
  location?: string;
  capacity?: number;
  images?: string[];
  amenities?: string[];
  hourlyRate?: number;
  halfDayRate?: number;
  fullDayRate?: number;
  securityDeposit?: number;
  currency?: string;
  operatingHours?: IOperatingHourDto[];
  slotDurationMinutes?: number;
  maxAdvanceBookingDays?: number;
  minAdvanceBookingHours?: number;
  cancellationPolicyHours?: number;
  requiresApproval?: boolean;
  rules?: string;
  societyId?: string;
}

export interface UpdateFacilityDto {
  facilityName?: string;
  description?: string;
  facilityType?: FacilityTypeEnum;
  location?: string;
  capacity?: number;
  images?: string[];
  amenities?: string[];
  hourlyRate?: number;
  halfDayRate?: number;
  fullDayRate?: number;
  securityDeposit?: number;
  currency?: string;
  operatingHours?: IOperatingHourDto[];
  slotDurationMinutes?: number;
  maxAdvanceBookingDays?: number;
  minAdvanceBookingHours?: number;
  cancellationPolicyHours?: number;
  requiresApproval?: boolean;
  rules?: string;
  societyId?: string;
}

export interface FacilityQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  facilityType?: FacilityTypeEnum;
  isActive?: boolean;
  societyId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetFacilitiesResult {
  facilities: FacilityPlainType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
