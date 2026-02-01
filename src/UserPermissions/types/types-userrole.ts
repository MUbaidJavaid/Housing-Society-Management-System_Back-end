import { Types } from 'mongoose';

export interface UserRoleType {
  _id: Types.ObjectId;
  roleName: string;
  roleCode: string;
  roleDescription?: string;
  isActive: boolean;
  isSystem: boolean;
  priority: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  userCount?: number;
  permissionCount?: number;
  roleBadgeColor?: string;
  roleLevel?: string;

  // Populated fields
  createdByUser?: any;
  updatedByUser?: any;
}

export interface CreateUserRoleDto {
  roleName: string;
  roleCode: string;
  roleDescription?: string;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateUserRoleDto {
  roleName?: string;
  roleCode?: string;
  roleDescription?: string;
  isActive?: boolean;
  priority?: number;
}

export interface UserRoleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
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

export interface GetUserRolesResult {
  userRoles: UserRoleType[];
  summary: {
    totalRoles: number;
    activeRoles: number;
    systemRoles: number;
    byRoleLevel: Record<string, number>;
  };
  pagination: PaginationResult;
}

export interface UserRoleStatistics {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  systemRoles: number;
  averagePriority: number;
  maxPriority: number;
  minPriority: number;
  rolesWithUsers: number;
  rolesWithoutUsers: number;
  totalUsers: number;
  maxUsersPerRole: number;
  distributionByLevel: Record<string, number>;
}

export interface RoleHierarchy {
  level: string;
  description: string;
  roles: UserRoleType[];
  minPriority: number;
  maxPriority: number;
}

export interface RoleWithCount {
  roleId: string;
  roleName: string;
  roleCode: string;
  userCount: number;
  permissionCount: number;
}
