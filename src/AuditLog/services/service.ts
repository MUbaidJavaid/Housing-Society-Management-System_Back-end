import { Types } from 'mongoose';
import AuditLog, { AuditAction, EntityType } from '../models/models-auditLog';
import { AuditLogQueryParams, CreateAuditLogDto } from '../types/types';

export const auditLogService = {
  async createAuditLog(data: CreateAuditLogDto): Promise<any> {
    const auditLog = await AuditLog.create({
      ...data,
      entityId: data.entityId ? new Types.ObjectId(data.entityId) : undefined,
    });

    return auditLog;
  },

  async logActivity(
    userId: Types.ObjectId,
    action: AuditAction,
    entityType: EntityType,
    description: string,
    options: {
      entityId?: string;
      ipAddress?: string;
      userAgent?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      changes?: Record<string, { old: any; new: any }>;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action,
        entityType,
        description,
        ...options,
      });
    } catch (error) {
      // Don't throw error if audit logging fails
      console.error('Audit log failed:', error);
    }
  },

  async getAuditLogs(params: AuditLogQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = {};

    if (userId) query.userId = new Types.ObjectId(userId);
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = new Types.ObjectId(entityId);

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const [auditLogs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'firstName lastName email role')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      AuditLog.countDocuments(query),
    ]);

    return {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getAuditLogById(id: string): Promise<any | null> {
    const auditLog = await AuditLog.findById(id).populate(
      'userId',
      'firstName lastName email role'
    );

    return auditLog?.toObject() || null;
  },

  async getUserActivity(userId: string): Promise<any[]> {
    const auditLogs = await AuditLog.find({
      userId: new Types.ObjectId(userId),
    })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(100)
      .then(docs => docs.map(doc => doc.toObject()));

    return auditLogs;
  },

  async getEntityActivity(entityType: EntityType, entityId: string): Promise<any[]> {
    const auditLogs = await AuditLog.find({
      entityType,
      entityId: new Types.ObjectId(entityId),
    })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .then(docs => docs.map(doc => doc.toObject()));

    return auditLogs;
  },

  async getAuditSummary(startDate?: Date, endDate?: Date): Promise<any> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;
    }

    const matchStage: any = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

    const summary = await AuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalActions: { $sum: 1 },
          byAction: { $push: '$action' },
          byEntity: { $push: '$entityType' },
          byUser: { $push: '$userId' },
        },
      },
      {
        $project: {
          totalActions: 1,
          actionDistribution: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: '$byAction' },
                as: 'action',
                in: {
                  k: '$$action',
                  v: {
                    $size: {
                      $filter: {
                        input: '$byAction',
                        as: 'a',
                        cond: { $eq: ['$$a', '$$action'] },
                      },
                    },
                  },
                },
              },
            },
          },
          entityDistribution: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: '$byEntity' },
                as: 'entity',
                in: {
                  k: '$$entity',
                  v: {
                    $size: {
                      $filter: {
                        input: '$byEntity',
                        as: 'e',
                        cond: { $eq: ['$$e', '$$entity'] },
                      },
                    },
                  },
                },
              },
            },
          },
          uniqueUsers: { $size: { $setUnion: '$byUser' } },
        },
      },
    ]);

    return (
      summary[0] || {
        totalActions: 0,
        actionDistribution: {},
        entityDistribution: {},
        uniqueUsers: 0,
      }
    );
  },

  async getRecentActivity(limit: number = 20): Promise<any[]> {
    const auditLogs = await AuditLog.find({})
      .populate('userId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .then(docs => docs.map(doc => doc.toObject()));

    return auditLogs;
  },

  async cleanupOldLogs(days: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return result.deletedCount || 0;
  },
};
