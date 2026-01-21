// backend/src/uploads/controllers/upload.controller.ts
import { NextFunction, Request, Response } from 'express';
import { uploadService } from '../services/upload.service';
import { EntityType, FileType } from '../types/upload.types';
import { createApiResponse } from '../utils/api-response';
import { createApiError } from '../utils/error-handler';

export class UploadController {
  /**
   * Upload single file
   */
  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw createApiError(400, 'NO_FILE', 'No file uploaded');
      }

      const { entityType, entityId, uploadedBy } = req.body;

      if (!entityType || !entityId || !uploadedBy) {
        throw createApiError(
          400,
          'MISSING_FIELDS',
          'Missing required fields: entityType, entityId, uploadedBy'
        );
      }

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw createApiError(
          400,
          'INVALID_ENTITY_TYPE',
          `Invalid entity type. Allowed: ${Object.values(EntityType).join(', ')}`
        );
      }

      const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

      const file = await uploadService.uploadFile({
        file: req.file,
        entityType: entityType as EntityType,
        entityId,
        uploadedBy,
        metadata,
      });

      res.status(201).json(createApiResponse(file, 'File uploaded successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        throw createApiError(400, 'NO_FILES', 'No files uploaded');
      }

      const { entityType, entityId, uploadedBy } = req.body;

      if (!entityType || !entityId || !uploadedBy) {
        throw createApiError(
          400,
          'MISSING_FIELDS',
          'Missing required fields: entityType, entityId, uploadedBy'
        );
      }

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw createApiError(
          400,
          'INVALID_ENTITY_TYPE',
          `Invalid entity type. Allowed: ${Object.values(EntityType).join(', ')}`
        );
      }

      const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

      const files = await uploadService.uploadMultipleFiles(req.files as Express.Multer.File[], {
        entityType: entityType as EntityType,
        entityId,
        uploadedBy,
        metadata,
      });

      res.status(201).json(createApiResponse(files, 'Files uploaded successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get files with filtering and pagination
   */
  async getFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId, fileType, uploadedBy, page, limit, sortBy, sortOrder } =
        req.query;

      // Validate entity type if provided
      if (entityType && !Object.values(EntityType).includes(entityType as EntityType)) {
        throw createApiError(
          400,
          'INVALID_ENTITY_TYPE',
          `Invalid entity type. Allowed: ${Object.values(EntityType).join(', ')}`
        );
      }

      // Validate file type if provided
      if (fileType && !Object.values(FileType).includes(fileType as FileType)) {
        throw createApiError(
          400,
          'INVALID_FILE_TYPE',
          `Invalid file type. Allowed: ${Object.values(FileType).join(', ')}`
        );
      }

      const result = await uploadService.getFiles({
        entityType: entityType as EntityType,
        entityId: entityId as string,
        fileType: fileType as FileType,
        uploadedBy: uploadedBy as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.status(200).json(createApiResponse(result, 'Files retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get files by entity
   */
  async getFilesByEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;

      // Validate entity type
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        throw createApiError(
          400,
          'INVALID_ENTITY_TYPE',
          `Invalid entity type. Allowed: ${Object.values(EntityType).join(', ')}`
        );
      }

      const files = await uploadService.getFilesByEntity(entityType as EntityType, entityId);

      res.status(200).json(createApiResponse(files, 'Files retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get file by ID
   */
  async getFileById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const file = await uploadService.getFileById(id);

      if (!file) {
        throw createApiError(404, 'FILE_NOT_FOUND', 'File not found');
      }

      res.status(200).json(createApiResponse(file, 'File retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update file
   */
  async updateFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { metadata, updatedBy } = req.body;

      if (!updatedBy) {
        throw createApiError(400, 'MISSING_FIELDS', 'Missing required field: updatedBy');
      }

      const updateData: any = {};

      if (req.file) {
        updateData.file = req.file;
      }

      if (metadata) {
        updateData.metadata = JSON.parse(metadata);
      }

      const file = await uploadService.updateFile(id, updateData, updatedBy);

      res.status(200).json(createApiResponse(file, 'File updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { deletedBy } = req.body;

      if (!deletedBy) {
        throw createApiError(400, 'MISSING_FIELDS', 'Missing required field: deletedBy');
      }

      const file = await uploadService.deleteFile(id, deletedBy);

      res.status(200).json(createApiResponse(file, 'File deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upload configuration
   */
  async getUploadConfig(_req: Request, res: Response, next: NextFunction) {
    try {
      const config = uploadService.getUploadConfig();
      const entityTypes = Object.values(EntityType);
      const fileTypes = Object.values(FileType);

      res.status(200).json(
        createApiResponse(
          {
            ...config,
            entityTypes,
            fileTypes,
            cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
          },
          'Upload configuration retrieved'
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

// Export instance
export const uploadController = new UploadController();
