import { Types } from 'mongoose';
import PlotBlock from '../models/models-plotblock';
import { CreatePlotBlockDto, PlotBlockQueryParams, UpdatePlotBlockDto } from '../index-plotblock';

export const plotBlockService = {
  /**
   * Create new plot block
   */
  async createPlotBlock(data: CreatePlotBlockDto, userId: Types.ObjectId): Promise<any> {
    const plotBlock = await PlotBlock.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    return plotBlock;
  },

  /**
   * Get plot block by ID
   */
  async getPlotBlockById(id: string): Promise<any | null> {
    const plotBlock = await PlotBlock.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!plotBlock) return null;

    return plotBlock.toObject(); // Convert to plain object instead of using .lean()
  },

  /**
   * Get all plot blocks with pagination
   */
  async getPlotBlocks(params: PlotBlockQueryParams): Promise<any> {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };
    if (search) {
      query.$or = [
        { plotBlockName: { $regex: search, $options: 'i' } },
        { plotBlockDesc: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute queries
    const [plotBlocks, total] = await Promise.all([
      PlotBlock.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())), // Convert all to plain objects
      PlotBlock.countDocuments(query),
    ]);

    return {
      plotBlocks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update plot block
   */
  async updatePlotBlock(
    id: string,
    data: UpdatePlotBlockDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const plotBlock = await PlotBlock.findByIdAndUpdate(
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

    if (!plotBlock) return null;

    return plotBlock.toObject(); // Convert to plain object
  },

  /**
   * Delete plot block (soft delete)
   */
  async deletePlotBlock(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await PlotBlock.findByIdAndUpdate(
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

  /**
   * Check if plot block exists
   */
  async checkPlotBlockExists(plotBlockName: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      plotBlockName: { $regex: new RegExp(`^${plotBlockName}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await PlotBlock.countDocuments(query);
    return count > 0;
  },
};
