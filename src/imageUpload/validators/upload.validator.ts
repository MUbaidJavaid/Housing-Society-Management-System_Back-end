// backend/src/uploads/validators/upload.validator.ts
import { NextFunction, Request, Response } from 'express';
import { createApiError } from '../utils/error-handler';

// Validation for upload file request
export const validateUploadFile = (req: Request, _res: Response, next: NextFunction) => {
  const { entityType, entityId, uploadedBy } = req.body;

  if (!entityType || !entityId || !uploadedBy) {
    throw createApiError(
      400,
      'MISSING_FIELDS',
      'Missing required fields: entityType, entityId, uploadedBy'
    );
  }

  next();
};

// Validation for file ID parameter
export const validateFileId = (req: Request, _res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!id || id.length !== 24) {
    throw createApiError(400, 'INVALID_ID', 'Invalid file ID format');
  }

  next();
};

// Validation for entity parameters
export const validateEntityParams = (req: Request, _res: Response, next: NextFunction) => {
  const { entityType, entityId } = req.params;

  if (!entityType || !entityId) {
    throw createApiError(400, 'INVALID_PARAMS', 'Missing entityType or entityId parameters');
  }

  next();
};

// Validation for get files query
export const validateGetFiles = (req: Request, _res: Response, next: NextFunction) => {
  const { page, limit } = req.query;

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    throw createApiError(400, 'INVALID_PAGE', 'Page must be a positive number');
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    throw createApiError(400, 'INVALID_LIMIT', 'Limit must be between 1 and 100');
  }

  next();
};

// Validation for delete file
export const validateDeleteFile = (req: Request, _res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { deletedBy } = req.body;

  if (!id || id.length !== 24) {
    throw createApiError(400, 'INVALID_ID', 'Invalid file ID format');
  }

  if (!deletedBy) {
    throw createApiError(400, 'MISSING_FIELDS', 'Missing required field: deletedBy');
  }

  next();
};
