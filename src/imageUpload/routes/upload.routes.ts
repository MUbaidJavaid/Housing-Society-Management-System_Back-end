// backend/src/uploads/routes/upload.routes.ts
import express, { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { uploadMultiple, uploadSingle } from '../middleware/multer.middleware';
import {
  validateDeleteFile,
  validateEntityParams,
  validateFileId,
  validateGetFiles,
  validateUploadFile,
} from '../validators/upload.validator';

const router: Router = express.Router();

// Get upload configuration
router.get('/config', uploadController.getUploadConfig);

// Upload single file
router.post(
  '/upload/single',
  uploadSingle('file'),
  validateUploadFile,
  uploadController.uploadFile
);

// Upload multiple files
router.post(
  '/upload/multiple',
  uploadMultiple('files'),
  validateUploadFile,
  uploadController.uploadMultipleFiles
);

// Get files with filtering and pagination
router.get('/files', validateGetFiles, uploadController.getFiles);

// Get file by ID
router.get('/files/:id', validateFileId, uploadController.getFileById);

// Get files by entity
router.get(
  '/entities/:entityType/:entityId',
  validateEntityParams,
  uploadController.getFilesByEntity
);

// Update file
router.put('/files/:id', uploadSingle('file'), validateFileId, uploadController.updateFile);

// Delete file
router.delete('/files/:id', validateDeleteFile, uploadController.deleteFile);

export default router;
