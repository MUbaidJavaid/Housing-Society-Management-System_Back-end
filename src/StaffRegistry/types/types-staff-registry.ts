import { Types } from 'mongoose';

// ============ Domestic Staff Types ============

export interface DomesticStaffType {
  _id: Types.ObjectId;
  fullName: string;
  cnic: string;
  phone?: string;
  photo?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  address?: string;
  staffType: string;
  isVerified: boolean;
  verificationDate?: Date;
  verifiedBy?: Types.ObjectId;
  verificationMethod?: string;
  employmentHistory: EmploymentHistoryType[];
  averageRating: number;
  totalRatings: number;
  blacklisted: boolean;
  blacklistReason?: string;
  blacklistedBy?: Types.ObjectId;
  blacklistedAt?: Date;
  skills: string[];
  languages: string[];
  documents: StaffDocumentType[];
  metadata: any;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmploymentHistoryType {
  societyId: Types.ObjectId;
  memberId: Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  role: string;
  rating?: number;
  review?: string;
  isCurrentlyEmployed: boolean;
}

export interface StaffDocumentType {
  type: string;
  fileUrl: string;
  verifiedAt?: Date;
}

export interface CreateDomesticStaffDto {
  fullName: string;
  cnic: string;
  phone?: string;
  photo?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  address?: string;
  staffType: string;
  skills?: string[];
  languages?: string[];
  documents?: Array<{ type: string; fileUrl: string }>;
  metadata?: any;
}

export interface UpdateDomesticStaffDto {
  fullName?: string;
  phone?: string;
  photo?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  address?: string;
  staffType?: string;
  skills?: string[];
  languages?: string[];
  documents?: Array<{ type: string; fileUrl: string }>;
  metadata?: any;
}

export interface StaffQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  staffType?: string;
  isVerified?: string;
  minRating?: number;
  blacklisted?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AddEmploymentDto {
  memberId: string;
  societyId: string;
  role: string;
}

export interface EndEmploymentDto {
  societyId: string;
  rating?: number;
  review?: string;
}

export interface RateStaffDto {
  societyId: string;
  memberId: string;
  rating: number;
  review?: string;
}

export interface BlacklistStaffDto {
  reason: string;
}
