import { Types } from 'mongoose';
import { CreatePlotSizeDto, PlotSizeQueryParams, UpdatePlotSizeDto } from '../types/types-plotsize';
import PlotSize from '../models/models-plotsize';

export const plotSizeService = {
  async createPlotSize(data: CreatePlotSizeDto, userId: Types.ObjectId): Promise<any> {
    const plotSize = await PlotSize.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    return plotSize;
  },

  async getPlotSizeById(id: string): Promise<any | null> {
    const plotSize = await PlotSize.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return plotSize?.toObject() || null;
  },

  async getPlotSizes(params: PlotSizeQueryParams): Promise<any> {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };
    if (search) {
      query.plotSizeName = { $regex: search, $options: 'i' };
    }

    const [plotSizes, total] = await Promise.all([
      PlotSize.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      PlotSize.countDocuments(query),
    ]);

    return {
      plotSizes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updatePlotSize(
    id: string,
    data: UpdatePlotSizeDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const plotSize = await PlotSize.findByIdAndUpdate(
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

    return plotSize?.toObject() || null;
  },

  async deletePlotSize(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await PlotSize.findByIdAndUpdate(
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

  async checkPlotSizeExists(plotSizeName: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      plotSizeName: { $regex: new RegExp(`^${plotSizeName}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await PlotSize.countDocuments(query);
    return count > 0;
  },

  async getAllPlotSizes(): Promise<any[]> {
    const plotSizes = (await PlotSize.find({ isDeleted: false })
      .select('plotSizeName')
      .sort('plotSizeName')
      .lean()) as any[];

    return plotSizes;
  },
};
