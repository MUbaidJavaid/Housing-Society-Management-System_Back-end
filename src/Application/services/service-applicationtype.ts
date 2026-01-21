import { Types } from 'mongoose';
import {
  CreateSrApplicationTypeDto,
  SrApplicationTypeQueryParams,
  UpdateSrApplicationTypeDto,
} from '../index-applicationtype';
import SrApplicationType from '../models/models-applicationtype';

export const srApplicationTypeService = {
  async createSrApplicationType(
    data: CreateSrApplicationTypeDto,
    userId: Types.ObjectId
  ): Promise<any> {
    const srApplicationType = await SrApplicationType.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    return srApplicationType;
  },

  async getSrApplicationTypeById(id: string): Promise<any | null> {
    const srApplicationType = await SrApplicationType.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return srApplicationType?.toObject() || null;
  },

  async getSrApplicationTypes(params: SrApplicationTypeQueryParams): Promise<any> {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };
    if (search) {
      query.$or = [
        { applicationName: { $regex: search, $options: 'i' } },
        { applicationDesc: { $regex: search, $options: 'i' } },
      ];
    }

    const [srApplicationTypes, total] = await Promise.all([
      SrApplicationType.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      SrApplicationType.countDocuments(query),
    ]);

    return {
      srApplicationTypes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updateSrApplicationType(
    id: string,
    data: UpdateSrApplicationTypeDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const srApplicationType = await SrApplicationType.findByIdAndUpdate(
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

    return srApplicationType?.toObject() || null;
  },

  async deleteSrApplicationType(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await SrApplicationType.findByIdAndUpdate(
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

  async checkSrApplicationTypeExists(
    applicationName: string,
    excludeId?: string
  ): Promise<boolean> {
    const query: any = {
      applicationName: { $regex: new RegExp(`^${applicationName}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await SrApplicationType.countDocuments(query);
    return count > 0;
  },

  async getAllSrApplicationTypes(): Promise<any[]> {
    const srApplicationTypes = await SrApplicationType.find({ isDeleted: false })
      .select('applicationName applicationFee')
      .sort('applicationName')
      .then(docs => docs.map(doc => doc.toObject()));

    return srApplicationTypes;
  },
};
