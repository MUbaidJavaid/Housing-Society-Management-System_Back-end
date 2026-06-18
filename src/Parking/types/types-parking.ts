import { Types } from 'mongoose';

export enum SpotType {
  RESIDENT = 'resident',
  VISITOR = 'visitor',
  RESERVED = 'reserved',
  HANDICAP = 'handicap',
  EV_CHARGING = 'ev_charging',
}

export enum VehicleType {
  CAR = 'car',
  MOTORCYCLE = 'motorcycle',
  SUV = 'suv',
  VAN = 'van',
  BICYCLE = 'bicycle',
  OTHER = 'other',
}

export enum SpotStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  BLOCKED = 'blocked',
}

export enum PassPurpose {
  VISITOR = 'visitor',
  DELIVERY = 'delivery',
  CONTRACTOR = 'contractor',
  EVENT = 'event',
}

export enum PassStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export interface ParkingSpotType {
  _id: Types.ObjectId;
  spotNumber: string;
  societyId: Types.ObjectId;
  blockId?: Types.ObjectId;
  spotType: string;
  assignedTo?: Types.ObjectId;
  assignedPlotId?: Types.ObjectId;
  vehicleNumber?: string;
  vehicleType?: string;
  isOccupied: boolean;
  isAvailableForRent: boolean;
  rentPrice?: number;
  status: string;
  location?: string;
  metadata?: any;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingPassType {
  _id: Types.ObjectId;
  societyId: Types.ObjectId;
  spotId?: Types.ObjectId;
  issuedTo: string;
  vehicleNumber: string;
  vehicleType?: string;
  purpose: string;
  issuedBy: Types.ObjectId;
  authorizedBy?: Types.ObjectId;
  validFrom: Date;
  validUntil: Date;
  passCode?: string;
  status: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSpotDto {
  spotNumber: string;
  societyId: string;
  blockId?: string;
  spotType: string;
  assignedTo?: string;
  assignedPlotId?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  isOccupied?: boolean;
  isAvailableForRent?: boolean;
  rentPrice?: number;
  status?: string;
  location?: string;
  metadata?: any;
}

export interface UpdateSpotDto {
  spotNumber?: string;
  blockId?: string;
  spotType?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  isOccupied?: boolean;
  status?: string;
  location?: string;
  metadata?: any;
}

export interface AssignSpotDto {
  memberId: string;
  vehicleNumber: string;
  plotId?: string;
}

export interface IssuePassDto {
  societyId: string;
  spotId?: string;
  issuedTo: string;
  vehicleNumber: string;
  vehicleType?: string;
  purpose: string;
  authorizedBy?: string;
  validFrom: string | Date;
  validUntil: string | Date;
}

export interface SpotQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  societyId?: string;
  spotType?: string;
  status?: string;
  isOccupied?: boolean;
  isAvailableForRent?: boolean;
  blockId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PassQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  societyId?: string;
  purpose?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetSpotsResult {
  items: ParkingSpotType[];
  pagination: PaginationResult;
}

export interface GetPassesResult {
  items: ParkingPassType[];
  pagination: PaginationResult;
}

export interface ParkingStats {
  totalSpots: number;
  occupiedSpots: number;
  availableSpots: number;
  maintenanceSpots: number;
  activeVisitorPasses: number;
  bySpotType: Record<string, number>;
}
