import { LookupCategory } from '../models/models-lookup-value';

export interface CreateLookupValueDto {
  category: LookupCategory;
  code: string;
  label: string;
  description?: string;
  colorCode?: string;
  icon?: string;
  sequence?: number;
  isActive?: boolean;
  isDefault?: boolean;
  isSystem?: boolean;
  metadata?: Record<string, any>;
  parentId?: string;
  allowedTransitions?: string[];
}

export interface UpdateLookupValueDto {
  label?: string;
  description?: string;
  colorCode?: string;
  icon?: string;
  sequence?: number;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, any>;
  parentId?: string;
  allowedTransitions?: string[];
}

export interface LookupQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: LookupCategory;
  isActive?: boolean;
}

export interface ReorderItem {
  id: string;
  sequence: number;
}

export interface SeedItem {
  category: LookupCategory | string;
  code: string;
  label: string;
  description?: string;
  colorCode?: string;
  icon?: string;
  sequence: number;
  isDefault?: boolean;
  isSystem: boolean;
  metadata?: Record<string, any>;
  allowedTransitions?: string[];
}
