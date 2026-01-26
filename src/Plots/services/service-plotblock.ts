import { Types } from 'mongoose';
import { CreatePlotBlockDto, PlotBlockQueryParams, UpdatePlotBlockDto } from '../index-plotblock';
import PlotBlock from '../models/models-plotblock';

export const plotBlockService = {
  /**
   * Create new plot block
   */
  async createPlotBlock(data: CreatePlotBlockDto, userId: Types.ObjectId): Promise<any> {
    const plotBlock = await PlotBlock.create({
      ...data,
      projectId: new Types.ObjectId(data.projectId),
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
      .populate('projectId', 'projName projectCode') // Added: populate project info
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!plotBlock) return null;

    return plotBlock.toObject();
  },

  /**
   * Get all plot blocks with pagination
   */
  async getPlotBlocks(params: PlotBlockQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      projectId,
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    if (projectId) {
      query.projectId = new Types.ObjectId(projectId);
    }

    if (search) {
      query.$or = [
        { plotBlockName: { $regex: search, $options: 'i' } },
        { plotBlockDesc: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute queries
    const [plotBlocks, total] = await Promise.all([
      PlotBlock.find(query)
        .populate('projectId', 'projName projectCode') // Added
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      PlotBlock.countDocuments(query),
    ]);

    // Calculate total area for the query result
    const totalArea = plotBlocks.reduce((sum, block) => sum + (block.blockTotalArea || 0), 0);

    return {
      plotBlocks,
      summary: {
        totalArea,
        unit: plotBlocks[0]?.blockAreaUnit || 'acres',
      },
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
      .populate('projectId', 'projName projectCode')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!plotBlock) return null;

    return plotBlock.toObject();
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
   * Check if plot block exists within a project
   */
  async checkPlotBlockExists(
    plotBlockName: string,
    projectId: string,
    excludeId?: string
  ): Promise<boolean> {
    const query: any = {
      plotBlockName: { $regex: new RegExp(`^${plotBlockName}$`, 'i') },
      projectId: new Types.ObjectId(projectId),
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await PlotBlock.countDocuments(query);
    return count > 0;
  },

  /**
   * Get plot blocks by project ID
   */
  async getPlotBlocksByProject(projectId: string): Promise<any[]> {
    const plotBlocks = await PlotBlock.find({
      projectId: new Types.ObjectId(projectId),
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ plotBlockName: 1 });

    return plotBlocks.map(block => block.toObject());
  },

  /**
   * Calculate total area for a project
   */
  async getProjectTotalArea(projectId: string): Promise<{ totalArea: number; unit: string }> {
    const result = await PlotBlock.aggregate([
      {
        $match: {
          projectId: new Types.ObjectId(projectId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$blockAreaUnit',
          totalArea: { $sum: '$blockTotalArea' },
        },
      },
    ]);

    return result.length > 0
      ? { totalArea: result[0].totalArea, unit: result[0]._id || 'acres' }
      : { totalArea: 0, unit: 'acres' };
  },
};
