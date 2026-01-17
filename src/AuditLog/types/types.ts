import { Types } from 'mongoose';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum EntityType {
  USER = 'USER',
  MEMBER = 'MEMBER',
  PLOT = 'PLOT',
  PLOT_BLOCK = 'PLOT_BLOCK',
  PLOT_TYPE = 'PLOT_TYPE',
  PLOT_SIZE = 'PLOT_SIZE',
  CITY = 'CITY',
  STATE = 'STATE',
  STATUS = 'STATUS',
  SR_APPLICATION_TYPE = 'SR_APPLICATION_TYPE',
  SR_DEV_STATUS = 'SR_DEV_STATUS',
  DEVELOPMENT = 'DEVELOPMENT',
  PROJECT = 'PROJECT',
}

export interface AuditLog {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  action: AuditAction;
  entityType: EntityType;
  entityId?: Types.ObjectId;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreateAuditLogDto {
  userId: Types.ObjectId;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
