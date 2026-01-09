import { Types } from 'mongoose';
import {
  CreateSrDevStatusDto,
  SrDevStatusQueryParams,
  UpdateSrDevStatusDto,
} from '../index-devstatus';
import SrDevStatus from '../models/models-devstatus';

export const srDevStatusService = {
  async createSrDevStatus(data: CreateSrDevStatusDto, userId: Types.ObjectId): Promise<any> {
    const srDevStatus = await SrDevStatus.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    return srDevStatus;
  },

  async getSrDevStatusById(id: string): Promise<any | null> {
    const srDevStatus = await SrDevStatus.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return srDevStatus?.toObject() || null;
  },

  async getSrDevStatuses(params: SrDevStatusQueryParams): Promise<any> {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };
    if (search) {
      query.srDevStatName = { $regex: search, $options: 'i' };
    }

    const [srDevStatuses, total] = await Promise.all([
      SrDevStatus.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      SrDevStatus.countDocuments(query),
    ]);

    return {
      srDevStatuses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updateSrDevStatus(
    id: string,
    data: UpdateSrDevStatusDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const srDevStatus = await SrDevStatus.findByIdAndUpdate(
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

    return srDevStatus?.toObject() || null;
  },

  async deleteSrDevStatus(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await SrDevStatus.findByIdAndUpdate(
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

  async checkSrDevStatusExists(srDevStatName: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      srDevStatName: { $regex: new RegExp(`^${srDevStatName}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await SrDevStatus.countDocuments(query);
    return count > 0;
  },

  async getAllSrDevStatuses(): Promise<any[]> {
    const srDevStatuses = await SrDevStatus.find({ isDeleted: false })
      .select('srDevStatName')
      .sort('srDevStatName')
      .then(docs => docs.map(doc => doc.toObject()));

    return srDevStatuses;
  },
};
