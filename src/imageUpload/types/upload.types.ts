import { Types } from 'mongoose';

// backend/src/uploads/types/upload.types.ts
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  PDF = 'pdf',
  OTHER = 'other',
}

export enum EntityType {
  USER = 'user',
  PLOT = 'plot',
  PROJECT = 'project',
  MEMBER = 'member',
  APPLICATION = 'application',
  DOCUMENT = 'document',
  TRANSFER = 'transfer',
  // Add more entity types as needed
}

export interface IFile {
  _id: Types.ObjectId;
  url: string;
  secureUrl: string;
  publicId: string;
  fileName: string;
  originalName: string;
  fileType: FileType;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  pages?: number;
  entityType: EntityType;
  entityId: string;
  uploadedBy: string;
  metadata?: Record<string, any>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadFileDTO {
  file: Express.Multer.File;
  entityType: EntityType;
  entityId: string;
  uploadedBy: string;
  metadata?: Record<string, any>;
}

export interface UpdateFileDTO {
  file?: Express.Multer.File;
  metadata?: Record<string, any>;
}

export interface QueryFilesDTO {
  entityType?: EntityType;
  entityId?: string;
  fileType?: FileType;
  uploadedBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  original_filename: string;
}
export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  pages: number;
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
  // Cloudinary may include additional fields
  [key: string]: any;
}
