import { Request } from 'express';
import { Types } from 'mongoose';

// JWT Payload
export interface JwtPayload {
  userId: Types.ObjectId;
  email: string;
  role: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

// Token Pair
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// User session
export interface UserSession {
  id: string;
  userId: Types.ObjectId;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  lastActive: Date;
  isRevoked: boolean;
}

// Authentication request
export interface AuthRequest extends Request {
  user?: DecodedToken;
  session?: UserSession;
}

// Decoded token
export interface DecodedToken extends JwtPayload {
  iat: number;
  exp: number;
}

// Login DTO
export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Register DTO
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Refresh token DTO
export interface RefreshTokenDto {
  refreshToken: string;
}

// Change password DTO
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// Forgot password DTO
export interface ForgotPasswordDto {
  email: string;
}

// Reset password DTO
export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

// Verify email DTO
export interface VerifyEmailDto {
  token: string;
}

// User roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPER_ADMIN = 'super_admin',
}

// Permission levels
export enum Permission {
  // User permissions
  READ_OWN_PROFILE = 'read:own_profile',
  UPDATE_OWN_PROFILE = 'update:own_profile',
  DELETE_OWN_ACCOUNT = 'delete:own_account',

  // Admin permissions
  READ_ANY_PROFILE = 'read:any_profile',
  UPDATE_ANY_PROFILE = 'update:any_profile',
  DELETE_ANY_ACCOUNT = 'delete:any_account',
  MANAGE_USERS = 'manage:users',
  MANAGE_ROLES = 'manage:roles',

  // Content permissions
  CREATE_CONTENT = 'create:content',
  READ_CONTENT = 'read:content',
  UPDATE_CONTENT = 'update:content',
  DELETE_CONTENT = 'delete:content',

  // System permissions
  VIEW_SYSTEM_LOGS = 'view:system_logs',
  MANAGE_SYSTEM_SETTINGS = 'manage:system_settings',
}

// Role-Permission mapping
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.READ_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.DELETE_OWN_ACCOUNT,
    Permission.READ_CONTENT,
  ],
  [UserRole.MODERATOR]: [
    Permission.READ_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.READ_ANY_PROFILE,
    Permission.CREATE_CONTENT,
    Permission.READ_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT,
  ],
  [UserRole.ADMIN]: [
    Permission.READ_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.READ_ANY_PROFILE,
    Permission.UPDATE_ANY_PROFILE,
    Permission.DELETE_ANY_ACCOUNT,
    Permission.MANAGE_USERS,
    Permission.CREATE_CONTENT,
    Permission.READ_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.VIEW_SYSTEM_LOGS,
  ],
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
};

// Token configuration
export interface TokenConfig {
  accessToken: {
    secret: string;
    expiresIn: string; // e.g., '15m', '1h', '7d'
  };
  refreshToken: {
    secret: string;
    expiresIn: string;
  };
  passwordResetToken: {
    expiresIn: string;
  };
  emailVerificationToken: {
    expiresIn: string;
  };
}

// Auth configuration
export interface AuthConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  passwordMinLength: number;
  requireEmailVerification: boolean;
  requireStrongPassword: boolean;
  sessionTimeout: number; // in minutes
  refreshTokenRotation: boolean;
}
// types/google.auth.ts
export enum GoogleAuthErrorCode {
  INVALID_TOKEN = 'GOOGLE_INVALID_TOKEN',
  TOKEN_EXPIRED = 'GOOGLE_TOKEN_EXPIRED',
  INVALID_AUDIENCE = 'GOOGLE_INVALID_AUDIENCE',
  ACCOUNT_EXISTS = 'GOOGLE_ACCOUNT_EXISTS',
  ACCOUNT_LINKED = 'GOOGLE_ACCOUNT_LINKED',
}

export class GoogleAuthError extends Error {
  constructor(
    message: string,
    public code: GoogleAuthErrorCode,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}
