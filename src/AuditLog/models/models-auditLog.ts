import { Document, Model, Schema, Types, model } from 'mongoose';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum EntityType {
  USER = 'USER',
  MEMBER = 'MEMBER',
  PLOT = 'PLOT',
  PLOT_BLOCK = 'PLOT_BLOCK',
  PLOT_TYPE = 'PLOT_TYPE',
  PLOT_SIZE = 'PLOT_SIZE',
  CITY = 'CITY',
  STATE = 'STATE',
  STATUS = 'STATUS',
  SR_APPLICATION_TYPE = 'SR_APPLICATION_TYPE',
  SR_DEV_STATUS = 'SR_DEV_STATUS',
  DEVELOPMENT = 'DEVELOPMENT',
  PROJECT = 'PROJECT',
}

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  action: AuditAction;
  entityType: EntityType;
  entityId?: Types.ObjectId;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      enum: Object.values(EntityType),
      required: true,
      index: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
      sparse: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    ipAddress: {
      type: String,
      trim: true,
      index: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    oldValues: {
      type: Schema.Types.Mixed,
    },

    newValues: {
      type: Schema.Types.Mixed,
    },

    changes: {
      type: Schema.Types.Mixed,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// Text index for search
auditLogSchema.index(
  { description: 'text' },
  {
    weights: { description: 10 },
    name: 'auditlog_text_search',
  }
);

const AuditLog: Model<IAuditLog> = model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
