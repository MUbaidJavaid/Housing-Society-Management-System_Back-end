import { Types } from 'mongoose';
import Plot from '../../Plots/models/models-plot';
import {
  CreateDevelopmentDto,
  DevelopmentQueryParams,
  UpdateDevelopmentDto,
} from '../index-development';
import Development from '../models/models-development';

export const developmentService = {
  async createDevelopment(data: CreateDevelopmentDto, userId: Types.ObjectId): Promise<any> {
    // Check if plot already has a development
    const existingDevelopment = await Development.findOne({
      plotId: new Types.ObjectId(data.plotId),
      isDeleted: false,
    });

    if (existingDevelopment) {
      throw new Error('Plot already has a development record');
    }

    const development = await Development.create({
      ...data,
      plotId: new Types.ObjectId(data.plotId),
      memId: new Types.ObjectId(data.memId),
      applicationId: new Types.ObjectId(data.applicationId),
      approvedBy: data.approvedBy ? new Types.ObjectId(data.approvedBy) : undefined,
      approvedOn: data.approvedOn ? new Date(data.approvedOn) : undefined,
      createdBy: userId,
      updatedBy: userId,
    });

    // Update plot's development status
    await Plot.findByIdAndUpdate(data.plotId, {
      $set: {
        developmentStatus: data.developmentStatusName,
        updatedBy: userId,
      },
    });

    return development;
  },

  async getDevelopmentById(id: string): Promise<any | null> {
    const development = await Development.findById(id)
      .populate('plotId', 'plotNo plotBlockId plotSizeId')
      .populate('memId', 'firstName lastName')
      .populate('applicationId', 'applicationName applicationFee')
      .populate('approvedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return development?.toObject() || null;
  },

  async getDevelopmentByPlotId(plotId: string): Promise<any | null> {
    const development = await Development.findOne({
      plotId: new Types.ObjectId(plotId),
      isDeleted: false,
    })
      .populate('plotId', 'plotNo plotBlockId plotSizeId')
      .populate('memId', 'firstName lastName')
      .populate('applicationId', 'applicationName applicationFee')
      .populate('approvedBy', 'firstName lastName email');

    return development?.toObject() || null;
  },

  async getDevelopments(params: DevelopmentQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      plotId,
      memId,
      applicationId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.developmentStatusName = { $regex: search, $options: 'i' };
    }

    if (plotId) query.plotId = new Types.ObjectId(plotId);
    if (memId) query.memId = new Types.ObjectId(memId);
    if (applicationId) query.applicationId = new Types.ObjectId(applicationId);

    const [developments, total] = await Promise.all([
      Development.find(query)
        .populate('plotId', 'plotNo')
        .populate('memId', 'firstName lastName')
        .populate('applicationId', 'applicationName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      Development.countDocuments(query),
    ]);

    return {
      developments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updateDevelopment(
    id: string,
    data: UpdateDevelopmentDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const updateData: any = { ...data };

    // Convert string IDs to ObjectId if provided
    if (data.plotId) updateData.plotId = new Types.ObjectId(data.plotId);
    if (data.memId) updateData.memId = new Types.ObjectId(data.memId);
    if (data.applicationId) updateData.applicationId = new Types.ObjectId(data.applicationId);
    if (data.approvedBy) updateData.approvedBy = new Types.ObjectId(data.approvedBy);
    if (data.approvedOn) updateData.approvedOn = new Date(data.approvedOn);

    updateData.updatedBy = userId;

    const development = await Development.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('plotId', 'plotNo plotBlockId plotSizeId')
      .populate('memId', 'firstName lastName')
      .populate('applicationId', 'applicationName applicationFee')
      .populate('approvedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    // Update plot's development status if changed
    if (data.developmentStatusName && development) {
      await Plot.findByIdAndUpdate(development.plotId, {
        $set: {
          developmentStatus: data.developmentStatusName,
          updatedBy: userId,
        },
      });
    }

    return development?.toObject() || null;
  },

  async deleteDevelopment(id: string, userId: Types.ObjectId): Promise<boolean> {
    const development = await Development.findByIdAndUpdate(
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

    return !!development;
  },

  async getDevelopmentSummary(): Promise<any> {
    const [totalDevelopments, approvedDevelopments, pendingDevelopments] = await Promise.all([
      Development.countDocuments({ isDeleted: false }),
      Development.countDocuments({ isDeleted: false, approvedBy: { $exists: true } }),
      Development.countDocuments({ isDeleted: false, approvedBy: { $exists: false } }),
    ]);

    return {
      totalDevelopments,
      approvedDevelopments,
      pendingDevelopments,
    };
  },
};
