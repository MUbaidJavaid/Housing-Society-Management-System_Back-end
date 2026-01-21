// backend/src/uploads/services/upload.service.ts
import mongoose from 'mongoose';

import {
  CloudinaryUploadResult,
  deleteFromCloudinary,
  uploadToCloudinary,
} from '../config/cloudinary.config';
import { FileModel } from '../models/File.model';
import {
  EntityType,
  FileType,
  IFile,
  PaginatedResponse,
  QueryFilesDTO,
  UpdateFileDTO,
  UploadFileDTO,
} from '../types/upload.types';
import { createApiError } from '../utils/error-handler';

export class UploadService {
  /**
   * Upload a single file
   */
  async uploadFile(dto: UploadFileDTO): Promise<IFile> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const { file, entityType, entityId, uploadedBy, metadata } = dto;

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const originalName = file.originalname.replace(/\.[^/.]+$/, '');
      const safeName = originalName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const fileName = `${entityType}_${entityId}_${timestamp}_${randomString}_${safeName}`;

      // Determine resource type and transformations
      const { resourceType, transformation } = this.getCloudinaryUploadConfig(file.mimetype);

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file.buffer, {
        folder: `uploads/${entityType}/${entityId}`,
        publicId: fileName,
        resourceType,
        transformation,
      });

      // Determine file type
      const fileType = this.determineFileType(file.mimetype);

      // Create file document
      const fileDoc = new FileModel({
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: fileName,
        originalName: file.originalname,
        fileType,
        mimeType: file.mimetype,
        size: file.size,
        width: uploadResult.width,
        height: uploadResult.height,
        pages: uploadResult.pages,
        entityType,
        entityId,
        uploadedBy,
        metadata: {
          ...metadata,
          cloudinaryInfo: {
            assetId: uploadResult.asset_id,
            version: uploadResult.version,
            signature: uploadResult.signature,
            format: uploadResult.format,
            resourceType: uploadResult.resource_type,
          },
        },
      });

      await fileDoc.save({ session });

      await session.commitTransaction();

      return fileDoc.toObject();
    } catch (error: any) {
      await session.abortTransaction();

      if (error.http_code === 400) {
        throw createApiError(400, 'CLOUDINARY_ERROR', error.message);
      }

      throw createApiError(500, 'UPLOAD_FAILED', error.message);
    } finally {
      session.endSession();
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    dto: Omit<UploadFileDTO, 'file'>
  ): Promise<IFile[]> {
    const uploadPromises = files.map(file => this.uploadFile({ ...dto, file }));

    return Promise.all(uploadPromises);
  }

  /**
   * Get files with pagination and filtering
   */
  async getFiles(query: QueryFilesDTO): Promise<PaginatedResponse<IFile>> {
    const {
      entityType,
      entityId,
      fileType,
      uploadedBy,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build filter
    const filter: any = { isDeleted: false };

    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (fileType) filter.fileType = fileType;
    if (uploadedBy) filter.uploadedBy = uploadedBy;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [files, total] = await Promise.all([
      FileModel.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      FileModel.countDocuments(filter),
    ]);

    // Calculate pagination info
    const pages = Math.ceil(total / limit);

    return {
      data: files,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get files by entity
   */
  async getFilesByEntity(entityType: EntityType, entityId: string): Promise<IFile[]> {
    const files = await FileModel.findByEntity(entityType, entityId);
    return files.map(file => file.toObject());
  }

  /**
   * Get file by ID
   */
  async getFileById(id: string): Promise<IFile | null> {
    const file = await FileModel.findOne({ _id: id, isDeleted: false }).lean();
    return file;
  }

  /**
   * Update file (replace file or update metadata)
   */
  async updateFile(id: string, dto: UpdateFileDTO, updatedBy: string): Promise<IFile> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Find existing file
      const existingFile = await FileModel.findById(id).session(session);

      if (!existingFile || existingFile.isDeleted) {
        throw createApiError(404, 'FILE_NOT_FOUND', 'File not found');
      }

      let cloudinaryResult: CloudinaryUploadResult | null = null;

      // If new file is provided, replace it
      if (dto.file) {
        // Delete old file from Cloudinary
        await deleteFromCloudinary(existingFile.publicId);

        // Upload new file
        const { resourceType, transformation } = this.getCloudinaryUploadConfig(dto.file.mimetype);

        cloudinaryResult = await uploadToCloudinary(dto.file.buffer, {
          folder: `uploads/${existingFile.entityType}/${existingFile.entityId}`,
          publicId: existingFile.publicId,
          resourceType,
          transformation,
        });

        // Update file metadata
        existingFile.url = cloudinaryResult.url;
        existingFile.secureUrl = cloudinaryResult.secure_url;
        existingFile.originalName = dto.file.originalname;
        existingFile.size = dto.file.size;
        existingFile.mimeType = dto.file.mimetype;
        existingFile.fileType = this.determineFileType(dto.file.mimetype);
        existingFile.width = cloudinaryResult.width;
        existingFile.height = cloudinaryResult.height;
        existingFile.pages = cloudinaryResult.pages;
      }

      // Update metadata if provided
      if (dto.metadata) {
        existingFile.metadata = {
          ...existingFile.metadata,
          ...dto.metadata,
          updatedBy,
          updatedAt: new Date(),
        };
      }

      await existingFile.save({ session });
      await session.commitTransaction();

      return existingFile.toObject();
    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Delete file (soft delete)
   */
  async deleteFile(id: string, deletedBy: string): Promise<IFile> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Find file
      const file = await FileModel.findById(id).session(session);

      if (!file || file.isDeleted) {
        throw createApiError(404, 'FILE_NOT_FOUND', 'File not found');
      }

      // Delete from Cloudinary
      await deleteFromCloudinary(file.publicId);

      // Soft delete in database
      const deletedFile = await FileModel.softDelete(id, deletedBy);

      if (!deletedFile) {
        throw createApiError(500, 'DELETE_FAILED', 'Failed to delete file');
      }

      await session.commitTransaction();
      return deletedFile.toObject();
    } catch (error: any) {
      await session.abortTransaction();

      if (error.http_code === 404) {
        // File not found in Cloudinary, still mark as deleted in DB
        const deletedFile = await FileModel.softDelete(id, deletedBy);
        if (deletedFile) {
          return deletedFile.toObject();
        }
      }

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get upload configuration
   */
  getUploadConfig(): {
    maxFileSize: number;
    allowedTypes: string[];
    maxFiles: number;
    cloudinaryCloudName?: string;
  } {
    return {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
      allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [],
      maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD || '10'),
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    };
  }

  /**
   * Helper: Get Cloudinary upload configuration
   */
  private getCloudinaryUploadConfig(mimeType: string): {
    resourceType: 'image' | 'raw' | 'auto';
    transformation?: any[];
  } {
    if (mimeType.startsWith('image/')) {
      return {
        resourceType: 'image',
        transformation: [{ width: 1920, crop: 'limit', quality: 'auto' }, { fetch_format: 'auto' }],
      };
    }

    if (mimeType === 'application/pdf') {
      return { resourceType: 'raw' };
    }

    return { resourceType: 'auto' };
  }

  /**
   * Helper: Determine file type enum
   */
  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType === 'application/pdf') return FileType.PDF;
    if (
      mimeType.includes('document') ||
      mimeType.includes('sheet') ||
      mimeType.includes('presentation') ||
      mimeType.includes('text/')
    )
      return FileType.DOCUMENT;
    return FileType.OTHER;
  }
}

// Export singleton instance
export const uploadService = new UploadService();
