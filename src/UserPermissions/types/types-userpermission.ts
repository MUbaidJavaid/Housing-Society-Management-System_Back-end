import { Types } from 'mongoose';

export interface UserPermissionType {
  _id: Types.ObjectId;
  srModuleId: Types.ObjectId;
  roleId: Types.ObjectId;
  moduleName: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport?: boolean;
  canImport?: boolean;
  canApprove?: boolean;
  canVerify?: boolean;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  permissionLevel?: string;
  accessType?: string;
  accessBadgeColor?: string;
  permissionScore?: number;

  // Populated fields
  srModule?: any;
  role?: any;
  createdByUser?: any;
  updatedByUser?: any;
}

export interface CreateUserPermissionDto {
  srModuleId: string;
  roleId: string;
  moduleName?: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport?: boolean;
  canImport?: boolean;
  canApprove?: boolean;
  canVerify?: boolean;
  isActive?: boolean;
}

export interface UpdateUserPermissionDto {
  canRead?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  canImport?: boolean;
  canApprove?: boolean;
  canVerify?: boolean;
  isActive?: boolean;
}

export interface BulkPermissionUpdateDto {
  permissionIds: string[];
  canRead?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  canImport?: boolean;
  canApprove?: boolean;
  canVerify?: boolean;
  isActive?: boolean;
}

export interface SetPermissionsDto {
  srModuleId: string;
  roleId: string;
  permissions: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canExport?: boolean;
    canImport?: boolean;
    canApprove?: boolean;
    canVerify?: boolean;
  };
}

export interface CopyPermissionsDto {
  sourceRoleId: string;
  targetRoleId: string;
  overrideExisting?: boolean;
}

export interface UserPermissionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  srModuleId?: string;
  roleId?: string;
  isActive?: boolean;
  hasAccess?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PermissionCheckDto {
  roleId: string;
  srModuleId: string;
  permissionType: string;
}

export interface RolePermissionsSummary {
  roleId: string;
  roleName: string;
  totalModules: number;
  accessibleModules: number;
  fullAccessModules: number;
  readOnlyModules: number;
  noAccessModules: number;
  permissionsByModule: Array<{
    moduleId: string;
    moduleName: string;
    moduleCode: string;
    accessType: string;
    permissions: string[];
  }>;
}

export interface ModulePermissionsSummary {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  totalRoles: number;
  accessibleRoles: number;
  rolesWithAccess: Array<{
    roleId: string;
    roleName: string;
    accessType: string;
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetUserPermissionsResult {
  userPermissions: UserPermissionType[];
  summary: {
    totalPermissions: number;
    activePermissions: number;
    byAccessType: Record<string, number>;
    byModule: Record<string, number>;
    byRole: Record<string, number>;
  };
  pagination: PaginationResult;
}

export interface UserPermissionStatistics {
  totalPermissions: number;
  activePermissions: number;
  inactivePermissions: number;
  modulesWithPermissions: number;
  rolesWithPermissions: number;
  byAccessType: Record<string, number>;
  byModule: Record<string, number>;
  byRole: Record<string, number>;
  permissionDistribution: {
    read: number;
    create: number;
    update: number;
    delete: number;
    export: number;
    import: number;
    approve: number;
    verify: number;
  };
}

// Permission types
export enum PermissionType {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  VERIFY = 'verify',
}

// Access types
export enum AccessType {
  NO_ACCESS = 'No Access',
  VIEW_ONLY = 'View Only',
  LIMITED_ACCESS = 'Limited Access',
  FULL_ACCESS = 'Full Access',
}
