export type EntityType = 'member' | 'plot' | 'bill' | 'payment' | 'installment' | 'visitor';
export type ExportFormat = 'csv' | 'json';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface TemplateColumn {
  key: string;
  label: string;
  required: boolean;
  type: string;
  example: string;
  validation?: string;
}

export interface RowValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export interface ExportParams {
  entityType: EntityType;
  societyId: string;
  filters?: Record<string, any>;
  format?: ExportFormat;
}

export interface ExportResult {
  data: string;
  fileName: string;
  contentType: string;
}

export interface ImportParams {
  entityType: EntityType;
  societyId: string;
  csvData: string;
  userId: string;
}

export interface ImportResult {
  importId: string;
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; field: string; message: string; data?: any }>;
}

export interface TemplateResult {
  columns: TemplateColumn[];
  csvHeader: string;
  exampleData: string;
}

export interface ImportLogQuery {
  societyId?: string;
  entityType?: EntityType;
  status?: ImportStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedImportLogs {
  logs: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
