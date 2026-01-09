import { Types } from 'mongoose';
import { CreatePlotTypeDto, PlotTypeQueryParams, UpdatePlotTypeDto } from '../index-plottype';
import PlotType from '../models/models-plottype';

export const plotTypeService = {
  async createPlotType(data: CreatePlotTypeDto, userId: Types.ObjectId): Promise<any> {
    const plotType = await PlotType.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    return plotType;
  },

  async getPlotTypeById(id: string): Promise<any | null> {
    const plotType = await PlotType.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return plotType?.toObject() || null;
  },

  async getPlotTypes(params: PlotTypeQueryParams): Promise<any> {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };
    if (search) {
      query.plotTypeName = { $regex: search, $options: 'i' };
    }

    const [plotTypes, total] = await Promise.all([
      PlotType.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      PlotType.countDocuments(query),
    ]);

    return {
      plotTypes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updatePlotType(
    id: string,
    data: UpdatePlotTypeDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const plotType = await PlotType.findByIdAndUpdate(
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

    return plotType?.toObject() || null;
  },

  async deletePlotType(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await PlotType.findByIdAndUpdate(
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

  async checkPlotTypeExists(plotTypeName: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      plotTypeName: { $regex: new RegExp(`^${plotTypeName}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await PlotType.countDocuments(query);
    return count > 0;
  },

  async getAllPlotTypes(): Promise<any[]> {
    const plotTypes = (await PlotType.find({ isDeleted: false })
      .select('plotTypeName')
      .sort('plotTypeName')
      .lean()) as any[];

    return plotTypes;
  },
};
