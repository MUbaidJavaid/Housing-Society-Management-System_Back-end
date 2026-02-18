// backend/src/uploads/models/File.model.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { EntityType, FileType, IFile } from '../types/upload.types';

export interface IFileDocument extends IFile, Document<Types.ObjectId> {}

const FileSchema = new Schema<IFileDocument>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    secureUrl: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      enum: Object.values(FileType),
      required: true,
      index: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    pages: {
      type: Number,
    },
    entityType: {
      type: String,
      enum: Object.values(EntityType),
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    uploadedBy: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // Convert ObjectId to string and store as 'id'
        if (ret._id && ret._id.toString) {
          ret.id = ret._id.toString();
        }

        // Remove _id and __v and isDeleted fields from JSON output
        const { _id, __v, isDeleted, ...rest } = ret;
        return rest;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        // Convert ObjectId to string and store as 'id'
        if (ret._id && ret._id.toString) {
          ret.id = ret._id.toString();
        }

        // Remove _id and __v and isDeleted fields from object output
        const { _id, __v, isDeleted, ...rest } = ret;
        return rest;
      },
    },
  }
);

// Compound indexes for efficient queries
FileSchema.index({ entityType: 1, entityId: 1, fileType: 1 });
FileSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
FileSchema.index({ uploadedBy: 1, createdAt: -1 });

// Virtual for formatted size
FileSchema.virtual('formattedSize').get(function () {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
});

// Virtual for file icon
FileSchema.virtual('icon').get(function () {
  if (this.fileType === FileType.IMAGE) return 'image';
  if (this.fileType === FileType.PDF) return 'pdf';
  if (this.fileType === FileType.DOCUMENT) return 'document';
  return 'file';
});

// Static methods
interface IFileModel extends Model<IFileDocument> {
  findByEntity(entityType: EntityType, entityId: string): Promise<IFileDocument[]>;
  findByEntityAndType(
    entityType: EntityType,
    entityId: string,
    fileType: FileType
  ): Promise<IFileDocument[]>;
  softDelete(fileId: string, deletedBy: string): Promise<IFileDocument | null>;
}

FileSchema.statics.findByEntity = function (entityType: EntityType, entityId: string) {
  return this.find({ entityType, entityId, isDeleted: false }).sort({ createdAt: -1 });
};

FileSchema.statics.findByEntityAndType = function (
  entityType: EntityType,
  entityId: string,
  fileType: FileType
) {
  return this.find({ entityType, entityId, fileType, isDeleted: false }).sort({ createdAt: -1 });
};

FileSchema.statics.softDelete = function (fileId: string, deletedBy: string) {
  return this.findByIdAndUpdate(
    fileId,
    {
      isDeleted: true,
      metadata: {
        deletedBy,
        deletedAt: new Date(),
      },
    },
    { new: true }
  );
};

export const FileModel =
  (mongoose.models.UploadFile as IFileModel) ||
  mongoose.model<IFileDocument, IFileModel>('UploadFile', FileSchema);
