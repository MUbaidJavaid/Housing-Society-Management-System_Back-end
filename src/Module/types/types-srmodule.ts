import { Types } from 'mongoose';

export interface SrModuleType {
  _id: Types.ObjectId;
  moduleName: string;
  moduleCode: string;
  description?: string;
  displayOrder: number;
  iconName?: string;
  routePath?: string;
  parentModuleId?: Types.ObjectId;
  isActive: boolean;
  permissions: string[];
  isDefault: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  moduleType?: string;
  fullPath?: string;
  iconClass?: string;
  badgeColor?: string;

  // Populated fields
  parentModule?: SrModuleType;
  createdByUser?: any;
  updatedByUser?: any;
}

export interface CreateSrModuleDto {
  moduleName: string;
  moduleCode: string;
  description?: string;
  displayOrder?: number;
  iconName?: string;
  routePath?: string;
  parentModuleId?: string;
  isActive?: boolean;
  permissions?: string[];
  isDefault?: boolean;
}

export interface UpdateSrModuleDto {
  moduleName?: string;
  moduleCode?: string;
  description?: string;
  displayOrder?: number;
  iconName?: string;
  routePath?: string;
  parentModuleId?: string;
  isActive?: boolean;
  permissions?: string[];
  isDefault?: boolean;
}

export interface SrModuleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  parentModuleId?: string;
  isDefault?: boolean;
}

export interface BulkStatusUpdateDto {
  moduleIds: string[];
  isActive: boolean;
}

export interface ModuleHierarchyItem {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
  children: ModuleHierarchyItem[];
  iconName?: string;
  routePath?: string;
  isActive: boolean;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetSrModulesResult {
  modules: SrModuleType[];
  summary: {
    totalModules: number;
    activeModules: number;
    mainModules: number;
    submodules: number;
    defaultModules: number;
  };
  pagination: PaginationResult;
}

export interface ModuleStatistics {
  totalModules: number;
  activeModules: number;
  inactiveModules: number;
  mainModules: number;
  submodules: number;
  defaultModules: number;
  byParent: Record<string, number>;
  modulesWithPermissions: number;
  modulesWithoutRoute: number;
}

export interface ModuleDropdownItem {
  value: string;
  label: string;
  code: string;
  isParent: boolean;
}

export interface ImportModulesResult {
  success: number;
  failed: number;
  errors: string[];
}

// Common module codes
export enum ModuleCode {
  MEMBER_MANAGEMENT = 'MEM',
  PLOT_INVENTORY = 'INV',
  ACCOUNTS = 'ACC',
  TRANSFERS = 'TRF',
  POSSESSION = 'POS',
  REPORTS = 'REP',
  COMPLAINTS = 'COMP',
  ADMINISTRATION = 'ADM',
  SETTINGS = 'SET',
  DASHBOARD = 'DASH',
}

// Common module names
export enum ModuleName {
  MEMBER_MANAGEMENT = 'Member Management',
  PLOT_INVENTORY = 'Plot Inventory',
  ACCOUNTS = 'Accounts',
  TRANSFERS = 'Transfers',
  POSSESSION = 'Possession',
  REPORTS = 'Reports',
  COMPLAINTS = 'Complaints',
  ADMINISTRATION = 'Administration',
  SETTINGS = 'Settings',
  DASHBOARD = 'Dashboard',
}

// Default permissions
export enum ModulePermission {
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  VERIFY = 'VERIFY',
}
