import { Types } from 'mongoose';

export interface UserStaffType {
  _id: Types.ObjectId;
  userName: string;
  password?: string; // Optional, usually excluded from responses
  fullName: string;
  cnic: string;
  mobileNo?: string;
  email?: string;
  roleId: Types.ObjectId;
  cityId: Types.ObjectId;
  designation?: string;
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  role?: any;
  city?: any;
  createdByUser?: any;
  updatedByUser?: any;
  statusBadge?: string;
  fullAddress?: string;
  initials?: string;
}

export interface CreateUserStaffDto {
  userName: string;
  password: string;
  fullName: string;
  cnic: string;
  mobileNo?: string;
  email?: string;
  roleId: string;
  cityId: string;
  designation?: string;
  isActive?: boolean;
}

export interface UpdateUserStaffDto {
  userName?: string;
  password?: string;
  fullName?: string;
  cnic?: string;
  mobileNo?: string;
  email?: string;
  roleId?: string;
  cityId?: string;
  designation?: string;
  isActive?: boolean;
}

export interface UserStaffQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  cityId?: string;
  designation?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetUserStaffsResult {
  userStaffs: UserStaffType[];
  summary: {
    totalUsers: number;
    activeUsers: number;
    byRole: Record<string, number>;
    byCity: Record<string, number>;
    byDesignation: Record<string, number>;
  };
  pagination: PaginationResult;
}

export interface UserStaffStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers: number;
  usersWithEmail: number;
  usersWithoutEmail: number;
  byRole: Record<string, number>;
  byCity: Record<string, number>;
  byDesignation: Record<string, number>;
  monthlyGrowth: Array<{
    month: string;
    count: number;
  }>;
}

export interface UserStatusChangeDto {
  isActive: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ResetPasswordDto {
  newPassword: string;
  confirmPassword?: string;
}

export interface LoginDto {
  userName: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: UserStaffType;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface UserDashboardStats {
  user: {
    id: Types.ObjectId;
    userName: string;
    fullName: string;
    role: any;
    city: any;
    designation?: string;
    lastLogin?: Date;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  };
  recentActivities: any[];
  quickActions: Array<{
    label: string;
    action: string;
  }>;
}
