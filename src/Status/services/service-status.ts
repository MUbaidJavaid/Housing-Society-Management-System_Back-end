import { Types } from 'mongoose';
import { CreateStatusDto, StatusQueryParams, UpdateStatusDto } from '../index-status';
import Status from '../models/models-status';

export const statusService = {
  async createStatus(data: CreateStatusDto, userId: Types.ObjectId): Promise<any> {
    const status = await Status.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    return status;
  },

  async getStatusById(id: string): Promise<any | null> {
    const status = await Status.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return status?.toObject() || null;
  },

  async getStatuses(params: StatusQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      statusType,
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
        { statusName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (statusType) query.statusType = statusType;

    const [statuses, total] = await Promise.all([
      Status.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      Status.countDocuments(query),
    ]);

    return {
      statuses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getStatusesByType(statusType: string): Promise<any[]> {
    const statuses = await Status.find({
      statusType,
      isDeleted: false,
    })
      .select('statusName description')
      .sort('statusName')
      .then(docs => docs.map(doc => doc.toObject()));

    return statuses;
  },

  async updateStatus(
    id: string,
    data: UpdateStatusDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const status = await Status.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          updatedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return status?.toObject() || null;
  },

  async deleteStatus(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await Status.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  async checkStatusExists(
    statusName: string,
    statusType: string,
    excludeId?: string
  ): Promise<boolean> {
    const query: any = {
      statusName: { $regex: new RegExp(`^${statusName}$`, 'i') },
      statusType,
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await Status.countDocuments(query);
    return count > 0;
  },

  async getAllStatusTypes(): Promise<string[]> {
    const types = await Status.distinct('statusType', { isDeleted: false });
    return types;
  },

  async getStatusSummary(): Promise<any> {
    const [totalStatuses, byType] = await Promise.all([
      Status.countDocuments({ isDeleted: false }),
      Status.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$statusType', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      totalStatuses,
      byType: byType.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  },
};
