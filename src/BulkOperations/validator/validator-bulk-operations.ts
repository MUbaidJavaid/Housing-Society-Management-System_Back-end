import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';

const VALID_ENTITY_TYPES = ['member', 'plot', 'bill', 'payment', 'installment', 'visitor'];
const VALID_EXPORT_FORMATS = ['csv', 'json'];
const VALID_IMPORT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'];

export const validateExport = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const { entityType, societyId, format } = req.body;

  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
    throw new AppError(400, `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
  }

  if (!societyId || typeof societyId !== 'string') {
    throw new AppError(400, 'Society ID is required');
  }

  if (format && !VALID_EXPORT_FORMATS.includes(format)) {
    throw new AppError(400, `Invalid format. Must be one of: ${VALID_EXPORT_FORMATS.join(', ')}`);
  }

  next();
};

export const validateImport = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const { entityType, societyId, csvData } = req.body;

  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
    throw new AppError(400, `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
  }

  if (!societyId || typeof societyId !== 'string') {
    throw new AppError(400, 'Society ID is required');
  }

  if (!csvData || typeof csvData !== 'string' || csvData.trim().length === 0) {
    throw new AppError(400, 'CSV data is required and must be a non-empty string');
  }

  // Basic CSV validation - must have at least a header and one data row
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    throw new AppError(400, 'CSV data must contain at least a header row and one data row');
  }

  next();
};

export const validateEntityTypeParam = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const { entityType } = req.params;

  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType as string)) {
    throw new AppError(400, `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
  }

  next();
};

export const validateImportLogQuery = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const { entityType, status, page, limit } = req.query;

  if (entityType && !VALID_ENTITY_TYPES.includes(entityType as string)) {
    throw new AppError(400, `Invalid entity type filter. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`);
  }

  if (status && !VALID_IMPORT_STATUSES.includes(status as string)) {
    throw new AppError(400, `Invalid status filter. Must be one of: ${VALID_IMPORT_STATUSES.join(', ')}`);
  }

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    throw new AppError(400, 'Page must be a positive number');
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    throw new AppError(400, 'Limit must be between 1 and 100');
  }

  next();
};

export const validateMongoId = (paramName: string) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const id = req.params[paramName] as string;
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      throw new AppError(400, `Invalid ${paramName}. Must be a valid MongoDB ObjectId`);
    }
    next();
  };
};
