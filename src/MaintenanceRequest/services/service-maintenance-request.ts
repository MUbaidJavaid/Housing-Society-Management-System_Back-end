import { Types } from 'mongoose';
import MaintenanceRequest from '../models/models-maintenance-request';
import {
  CreateMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
  MaintenanceQueryParams,
  AddWorkLogDto,
} from '../types/types-maintenance-request';

export const maintenanceRequestService = {
  async create(data: CreateMaintenanceRequestDto, userId: Types.ObjectId) {
    const requestData = {
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    };

    const request = await MaintenanceRequest.create(requestData);

    const created = await MaintenanceRequest.findById(request._id)
      .populate('societyId', 'name')
      .populate('requestedBy', 'firstName lastName')
      .populate('plotId', 'plotNumber')
      .populate('createdBy', 'firstName lastName email');

    if (!created) {
      throw new Error('Failed to create maintenance request');
    }

    return created.toObject();
  },

  async getAll(params: MaintenanceQueryParams) {
    const {
      page = 1,
      limit = 20,
      search = '',
      societyId,
      status,
      category,
      priority,
      assignedTo,
      isOverdue,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { requestNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = new Types.ObjectId(assignedTo);
    if (isOverdue !== undefined) query.isOverdue = isOverdue === 'true';

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate('societyId', 'name')
        .populate('requestedBy', 'firstName lastName')
        .populate('assignedTo', 'firstName lastName')
        .populate('assignedVendor', 'vendorName')
        .populate('createdBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      MaintenanceRequest.countDocuments(query),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    const request = await MaintenanceRequest.findOne({ _id: id, isDeleted: false })
      .populate('societyId', 'name')
      .populate('requestedBy', 'firstName lastName')
      .populate('plotId', 'plotNumber')
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedVendor', 'vendorName companyName phone')
      .populate('workLog.loggedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName');

    if (!request) {
      throw new Error('Maintenance request not found');
    }

    return request.toObject();
  },

  async update(id: string, data: UpdateMaintenanceRequestDto, userId: Types.ObjectId) {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...data, modifiedBy: userId },
      { new: true, runValidators: true }
    )
      .populate('societyId', 'name')
      .populate('requestedBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName');

    if (!request) {
      throw new Error('Maintenance request not found');
    }

    return request.toObject();
  },

  async delete(id: string, userId: Types.ObjectId) {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        modifiedBy: userId,
      },
      { new: true }
    );

    if (!request) {
      throw new Error('Maintenance request not found');
    }

    return request.toObject();
  },

  async acknowledgeRequest(id: string, userId: Types.ObjectId) {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, isDeleted: false, status: 'submitted' },
      {
        status: 'acknowledged',
        modifiedBy: userId,
      },
      { new: true }
    )
      .populate('societyId', 'name')
      .populate('requestedBy', 'firstName lastName');

    if (!request) {
      throw new Error('Maintenance request not found or not in submitted status');
    }

    return request.toObject();
  },

  async assignToStaff(id: string, staffId: string, userId: Types.ObjectId) {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, isDeleted: false, status: { $in: ['submitted', 'acknowledged'] } },
      {
        status: 'assigned',
        assignedTo: new Types.ObjectId(staffId),
        modifiedBy: userId,
      },
      { new: true }
    )
      .populate('assignedTo', 'firstName lastName');

    if (!request) {
      throw new Error('Maintenance request not found or cannot be assigned in current status');
    }

    return request.toObject();
  },

  async assignToVendor(id: string, vendorId: string, estimatedCost: number, estimatedDate: string, userId: Types.ObjectId) {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, isDeleted: false, status: { $in: ['submitted', 'acknowledged'] } },
      {
        status: 'assigned',
        assignedVendor: new Types.ObjectId(vendorId),
        estimatedCost,
        estimatedCompletionDate: new Date(estimatedDate),
        modifiedBy: userId,
      },
      { new: true }
    )
      .populate('assignedVendor', 'vendorName companyName');

    if (!request) {
      throw new Error('Maintenance request not found or cannot be assigned in current status');
    }

    return request.toObject();
  },

  async startWork(id: string, userId: Types.ObjectId) {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, isDeleted: false, status: 'assigned' },
      {
        status: 'in_progress',
        modifiedBy: userId,
      },
      { new: true }
    );

    if (!request) {
      throw new Error('Maintenance request not found or not in assigned status');
    }

    return request.toObject();
  },

  async addWorkLog(id: string, log: AddWorkLogDto, userId: Types.ObjectId) {
    const request = await MaintenanceRequest.findOne({ _id: id, isDeleted: false });

    if (!request) {
      throw new Error('Maintenance request not found');
    }

    request.workLog.push({
      date: new Date(),
      description: log.description,
      loggedBy: userId,
      hoursWorked: log.hoursWorked,
      photos: log.photos || [],
    });

    request.modifiedBy = userId;
    await request.save();

    const updated = await MaintenanceRequest.findById(id)
      .populate('workLog.loggedBy', 'firstName lastName');

    return updated!.toObject();
  },

  async completeWork(id: string, userId: Types.ObjectId) {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, isDeleted: false, status: 'in_progress' },
      {
        status: 'completed',
        actualCompletionDate: new Date(),
        modifiedBy: userId,
      },
      { new: true }
    );

    if (!request) {
      throw new Error('Maintenance request not found or not in progress');
    }

    return request.toObject();
  },

  async verifyCompletion(id: string, userId: Types.ObjectId) {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, isDeleted: false, status: 'completed' },
      {
        status: 'verified',
        modifiedBy: userId,
      },
      { new: true }
    );

    if (!request) {
      throw new Error('Maintenance request not found or not in completed status');
    }

    return request.toObject();
  },

  async submitFeedback(id: string, rating: number, comment?: string) {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, isDeleted: false, status: { $in: ['completed', 'verified'] } },
      {
        residentFeedback: {
          rating,
          comment: comment || '',
          feedbackDate: new Date(),
        },
        status: 'closed',
      },
      { new: true }
    );

    if (!request) {
      throw new Error('Maintenance request not found or not in completed/verified status');
    }

    return request.toObject();
  },

  async rejectRequest(id: string, reason: string, userId: Types.ObjectId) {
    const request = await MaintenanceRequest.findOneAndUpdate(
      { _id: id, isDeleted: false, status: { $in: ['submitted', 'acknowledged'] } },
      {
        status: 'rejected',
        rejectionReason: reason,
        modifiedBy: userId,
      },
      { new: true }
    );

    if (!request) {
      throw new Error('Maintenance request not found or cannot be rejected in current status');
    }

    return request.toObject();
  },

  async getMyRequests(memberId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query: any = {
      requestedBy: new Types.ObjectId(memberId),
      isDeleted: false,
    };

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate('societyId', 'name')
        .populate('assignedTo', 'firstName lastName')
        .populate('assignedVendor', 'vendorName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      MaintenanceRequest.countDocuments(query),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getAssignedRequests(staffId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query: any = {
      assignedTo: new Types.ObjectId(staffId),
      isDeleted: false,
    };

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate('societyId', 'name')
        .populate('requestedBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      MaintenanceRequest.countDocuments(query),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getOverdueRequests(societyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query: any = {
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
      isOverdue: true,
      status: { $nin: ['completed', 'verified', 'closed', 'rejected'] },
    };

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(query)
        .populate('requestedBy', 'firstName lastName')
        .populate('assignedTo', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ slaDeadline: 1 })
        .lean(),
      MaintenanceRequest.countDocuments(query),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getMaintenanceStats(societyId: string) {
    const matchStage: any = {
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
    };

    const [statusCounts, categoryCounts, priorityCounts, overdueCounts] = await Promise.all([
      MaintenanceRequest.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      MaintenanceRequest.aggregate([
        { $match: matchStage },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      MaintenanceRequest.aggregate([
        { $match: matchStage },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      MaintenanceRequest.countDocuments({
        ...matchStage,
        isOverdue: true,
        status: { $nin: ['completed', 'verified', 'closed', 'rejected'] },
      }),
    ]);

    const totalRequests = await MaintenanceRequest.countDocuments(matchStage);

    // Average resolution time for completed requests
    const avgResolution = await MaintenanceRequest.aggregate([
      {
        $match: {
          ...matchStage,
          status: { $in: ['completed', 'verified', 'closed'] },
          actualCompletionDate: { $exists: true },
        },
      },
      {
        $project: {
          resolutionTime: {
            $subtract: ['$actualCompletionDate', '$createdAt'],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionMs: { $avg: '$resolutionTime' },
        },
      },
    ]);

    const avgResolutionHours = avgResolution.length > 0
      ? Math.round(avgResolution[0].avgResolutionMs / (1000 * 60 * 60) * 10) / 10
      : 0;

    return {
      totalRequests,
      overdue: overdueCounts,
      averageResolutionHours: avgResolutionHours,
      byStatus: statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byCategory: categoryCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: priorityCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  },
};
