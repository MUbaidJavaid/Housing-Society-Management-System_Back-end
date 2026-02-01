import { Types } from 'mongoose';

export interface LoginCredentials {
  memContEmail: string; // Email identifier (case-insensitive)
  password: string;
}

export interface SignupCredentials {
  memNic: string; // REQUIRED for pre-registration verification
  memContEmail: string; // REQUIRED for pre-registration verification
  password: string;
  confirmPassword?: string;
}
export type UserStatus = 'ACTIVE' | 'INACTIVE';
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
// dto/auth.dto.ts
export interface RegisterDto {
  memName: string;
  memNic: string;
  memContMob: string;
  password: string;
}

export interface LoginDto {
  memNic: string;
  password: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}
