// backend/src/uploads/middleware/multer.middleware.ts
import { RequestHandler } from 'express';
import multer from 'multer';
import { createApiError } from '../utils/error-handler';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createApiError(400, 'INVALID_FILE_TYPE', `File type ${file.mimetype} not allowed`) as any);
  }
};

// Create multer instance with limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
});

// Single file upload middleware
export const uploadSingle = (fieldName: string): RequestHandler => {
  return upload.single(fieldName);
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string, maxCount?: number): RequestHandler => {
  return upload.array(fieldName, maxCount || parseInt(process.env.MAX_FILES_PER_UPLOAD || '10'));
};

// Export the multer instance for custom usage
export default upload;
