// backend/src/config/cloudinary.config.ts
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

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

// Validate environment variables
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: {
    folder: string;
    publicId?: string;
    resourceType?: 'image' | 'raw' | 'auto';
    transformation?: any[];
  }
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: options.resourceType || 'auto',
        transformation: options.transformation || [],
        overwrite: false,
        unique_filename: true,
        use_filename: true,
        tags: ['upload-system'],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          // Type assertion with additional safety
          const typedResult = result as unknown as CloudinaryUploadResult;
          resolve(typedResult);
        } else {
          reject(new Error('Upload result is undefined'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<any> {
  return cloudinary.uploader.destroy(publicId);
}

export async function updateCloudinaryFile(
  publicId: string,
  fileBuffer: Buffer,
  options: {
    transformation?: any[];
  }
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        transformation: options.transformation || [],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          // Type assertion with additional safety
          const typedResult = result as unknown as CloudinaryUploadResult;
          resolve(typedResult);
        } else {
          reject(new Error('Upload result is undefined'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export { cloudinary };
