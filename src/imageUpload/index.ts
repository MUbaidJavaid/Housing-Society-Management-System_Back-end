// backend/src/uploads/index.ts
// Re-export everything explicitly to avoid ambiguity
export { UploadController, uploadController } from './controllers/upload.controller';
export { uploadMultiple, uploadSingle } from './middleware/multer.middleware';
export { FileModel } from './models/File.model';
export { default as uploadRoutes } from './routes/upload.routes';
export { UploadService, uploadService } from './services/upload.service';
export * from './types/upload.types';
export * from './validators/upload.validator';
