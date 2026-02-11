// services-status.ts
import { Types } from 'mongoose';
import Status from '../models/models-status';
import { CreateStatusDto, StatusQueryParams, UpdateStatusDto } from '../types/types-status'; // Fixed import path

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

  async getStatus(params: StatusQueryParams): Promise<any> {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { statusName: { $regex: search, $options: 'i' } },
        { statusDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const [status, total] = await Promise.all([
      Status.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .populate('createdBy', 'firstName lastName email')
        .then(docs => docs.map(doc => doc.toObject())),
      Status.countDocuments(query),
    ]);
    console.log('Status', status);
    return {
      status,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updateStatus(
    id: string,
    data: UpdateStatusDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const updateData: any = { ...data };
    updateData.updatedBy = userId;

    const status = await Status.findByIdAndUpdate(
      id,
      { $set: updateData },
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

  async checkStatusExists(statusName: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      statusName: { $regex: new RegExp(`^${statusName}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await Status.countDocuments(query);
    return count > 0;
  },

  async getAllStatus(): Promise<any[]> {
    const status = await Status.find({ isDeleted: false })
      .select('statusName')
      .sort('statusName')
      .then(docs => docs.map(doc => doc.toObject()));

    return status;
  },
};
