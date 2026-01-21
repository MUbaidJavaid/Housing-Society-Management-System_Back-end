import { Types } from 'mongoose';

export interface Member {
  _id: Types.ObjectId;
  memName: string;
  statusId?: Types.ObjectId;
  memNic: string;
  memImg?: string;
  memFHName?: string;
  memFHRelation?: string;
  memAddr1: string;
  memAddr2?: string;
  memAddr3?: string;
  cityId?: Types.ObjectId;
  memZipPost?: string;
  memContRes?: string;
  memContWork?: string;
  memContMob: string;
  memContEmail?: string;
  memIsOverseas: boolean;
  memPermAdd?: string;
  memRemarks?: string;
  memRegNo?: string;
  dateOfBirth?: Date;
  memOccupation?: string;
  memState?: string;
  memCountry?: string;
  memPermAddress1?: string;
  memPermCity?: string;
  memPermState?: string;
  memPermCountry?: string;
  memberFingerTemplate?: string;
  memberFingerPrint?: string;
  gender?: 'male' | 'female' | 'other';
  // Authentication fields
  password?: string;
  isActive: boolean;
  lastLogin?: Date;
  emailVerified: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  // Audit fields
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface CreateMemberDto {
  memName: string;
  statusId?: string;
  memNic: string;
  memImg?: string;
  memFHName?: string;
  memFHRelation?: string;
  memAddr1: string;
  memAddr2?: string;
  memAddr3?: string;
  cityId?: string;
  memZipPost?: string;
  memContRes?: string;
  memContWork?: string;
  memContMob: string;
  memContEmail?: string;
  memIsOverseas?: boolean;
  memPermAdd?: string;
  memRemarks?: string;
  memRegNo?: string;
  dateOfBirth?: string;
  memOccupation?: string;
  memState?: string;
  memCountry?: string;
  memPermAddress1?: string;
  memPermCity?: string;
  memPermState?: string;
  memPermCountry?: string;
  memberFingerTemplate?: string;
  memberFingerPrint?: string;
  gender?: 'male' | 'female' | 'other';
  // Optional password for direct creation
  password?: string;
  isActive?: boolean;
}

export interface UpdateMemberDto {
  memName?: string;
  statusId?: string;
  memNic?: string;
  memImg?: string;
  memFHName?: string;
  memFHRelation?: string;
  memAddr1?: string;
  memAddr2?: string;
  memAddr3?: string;
  cityId?: string;
  memZipPost?: string;
  memContRes?: string;
  memContWork?: string;
  memContMob?: string;
  memContEmail?: string;
  memIsOverseas?: boolean;
  memPermAdd?: string;
  memRemarks?: string;
  memRegNo?: string;
  dateOfBirth?: string;
  memOccupation?: string;
  memState?: string;
  memCountry?: string;
  memPermAddress1?: string;
  memPermCity?: string;
  memPermState?: string;
  memPermCountry?: string;
  memberFingerTemplate?: string;
  memberFingerPrint?: string;
  gender?: 'male' | 'female' | 'other';
  // Authentication fields
  password?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface MemberQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  statusId?: string;
  cityId?: string;
  memIsOverseas?: boolean;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LoginCredentials {
  identifier: string; // CNIC or Email
  password: string;
}

export interface AuthMember {
  id: Types.ObjectId;
  memName: string;
  memNic: string;
  memContEmail?: string;
  memContMob: string;
  memImg?: string;
  isActive: boolean;
  emailVerified: boolean;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface MemberAuthResponse {
  member: AuthMember;
  tokens: TokenPair;
}

export interface LoginCredentials {
  identifier: string; // CNIC or Email
  password: string;
}

export interface SignupCredentials {
  memNic: string;
  memContEmail?: string;
  password: string;
  memName?: string;
  memContMob?: string;
  confirmPassword?: string;
}

export interface ResetPasswordRequest {
  identifier: string; // CNIC or Email
}

export interface ResetPasswordConfirm {
  token: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthMember {
  id: Types.ObjectId;
  memName: string;
  memNic: string;
  memContEmail?: string;
  memContMob: string;
  memImg?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  role: string;
}

export interface AuthResponse {
  member: AuthMember;
  tokens: TokenPair;
}

export interface ProfileUpdate {
  memName?: string;
  memContMob?: string;
  memContEmail?: string;
  memAddr1?: string;
  memAddr2?: string;
  memAddr3?: string;
  memZipPost?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  memOccupation?: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  identifier: string;
}
export type UserStatus = 'ACTIVE' | 'INACTIVE';
