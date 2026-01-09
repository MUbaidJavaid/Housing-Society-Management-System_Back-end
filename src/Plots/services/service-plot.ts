import { Types } from 'mongoose';
import { CreatePlotDto, PlotQueryParams, UpdatePlotDto } from '../index-plot';
import SrApplicationType from '../models/models-applicationtype';
import SrDevStatus from '../models/models-devstatus';
import Plot from '../models/models-plot';
import PlotBlock from '../models/models-plotblock';
import PlotSize from '../models/models-plotsize';
import PlotType from '../models/models-plottype';

export const plotService = {
  async createPlot(data: CreatePlotDto, userId: Types.ObjectId): Promise<any> {
    const plot = await Plot.create({
      ...data,
      projId: data.projId ? new Types.ObjectId(data.projId) : undefined,
      plotBlockId: new Types.ObjectId(data.plotBlockId),
      plotSizeId: new Types.ObjectId(data.plotSizeId),
      plotTypeId: new Types.ObjectId(data.plotTypeId),
      srDevStatId: new Types.ObjectId(data.srDevStatId),
      developmentStatusId: new Types.ObjectId(data.developmentStatusId),
      applicationTypeId: new Types.ObjectId(data.applicationTypeId),
      discountDate: data.discountDate ? new Date(data.discountDate) : undefined,
      createdBy: userId,
      updatedBy: userId,
    });

    return plot;
  },

  async getPlotById(id: string): Promise<any | null> {
    const plot = await Plot.findById(id)
      .populate('projId', 'projectName')
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName')
      .populate('plotTypeId', 'plotTypeName')
      .populate('srDevStatId', 'statusName')
      .populate('developmentStatusId', 'statusName')
      .populate('applicationTypeId', 'typeName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return plot?.toObject() || null;
  },

  async getPlots(params: PlotQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      plotBlockId,
      plotSizeId,
      plotTypeId,
      developmentStatusId,
      applicationTypeId,
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
        { plotNo: { $regex: search, $options: 'i' } },
        { plotStreet: { $regex: search, $options: 'i' } },
        { plotRemarks: { $regex: search, $options: 'i' } },
      ];
    }

    if (plotBlockId) query.plotBlockId = new Types.ObjectId(plotBlockId);
    if (plotSizeId) query.plotSizeId = new Types.ObjectId(plotSizeId);
    if (plotTypeId) query.plotTypeId = new Types.ObjectId(plotTypeId);
    if (developmentStatusId) query.developmentStatusId = new Types.ObjectId(developmentStatusId);
    if (applicationTypeId) query.applicationTypeId = new Types.ObjectId(applicationTypeId);

    const [plots, total] = await Promise.all([
      Plot.find(query)
        .populate('plotBlockId', 'plotBlockName')
        .populate('plotSizeId', 'plotSizeName')
        .populate('plotTypeId', 'plotTypeName')
        .populate('developmentStatusId', 'statusName')
        .populate('applicationTypeId', 'typeName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      Plot.countDocuments(query),
    ]);

    return {
      plots,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updatePlot(id: string, data: UpdatePlotDto, userId: Types.ObjectId): Promise<any | null> {
    const updateData: any = { ...data };

    // Convert string IDs to ObjectId if provided
    if (data.projId) updateData.projId = new Types.ObjectId(data.projId);
    if (data.plotBlockId) updateData.plotBlockId = new Types.ObjectId(data.plotBlockId);
    if (data.plotSizeId) updateData.plotSizeId = new Types.ObjectId(data.plotSizeId);
    if (data.plotTypeId) updateData.plotTypeId = new Types.ObjectId(data.plotTypeId);
    if (data.srDevStatId) updateData.srDevStatId = new Types.ObjectId(data.srDevStatId);
    if (data.developmentStatusId)
      updateData.developmentStatusId = new Types.ObjectId(data.developmentStatusId);
    if (data.applicationTypeId)
      updateData.applicationTypeId = new Types.ObjectId(data.applicationTypeId);
    if (data.discountDate) updateData.discountDate = new Date(data.discountDate);

    updateData.updatedBy = userId;

    const plot = await Plot.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName')
      .populate('plotTypeId', 'plotTypeName')
      .populate('developmentStatusId', 'statusName')
      .populate('applicationTypeId', 'typeName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return plot?.toObject() || null;
  },

  async deletePlot(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await Plot.findByIdAndUpdate(
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

  async checkPlotNoExists(plotNo: string, projId?: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      plotNo: { $regex: new RegExp(`^${plotNo}$`, 'i') },
      isDeleted: false,
    };

    if (projId) {
      query.projId = new Types.ObjectId(projId);
    } else {
      query.projId = { $exists: false };
    }

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await Plot.countDocuments(query);
    return count > 0;
  },

  async getPlotSummary(): Promise<any> {
    const [totalPlots, totalAmount, activePlots] = await Promise.all([
      Plot.countDocuments({ isDeleted: false }),
      Plot.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$plotAmount' } } },
      ]),
      Plot.countDocuments({ isDeleted: false, developmentStatusId: { $exists: true } }),
    ]);

    return {
      totalPlots,
      totalAmount: totalAmount[0]?.total || 0,
      activePlots,
    };
  },

  async getFilterOptions(): Promise<any> {
    const [plotBlocks, plotSizes, plotTypes, developmentStatuses, applicationTypes, srDevStats] =
      await Promise.all([
        PlotBlock.find({ isDeleted: false })
          .select('plotBlockName')
          .sort('plotBlockName')
          .lean()
          .then(docs =>
            docs.map((doc: any) => ({
              id: doc._id,
              name: doc.plotBlockName,
            }))
          ),
        PlotSize.find({ isDeleted: false })
          .select('plotSizeName')
          .sort('plotSizeName')
          .lean()
          .then(docs =>
            docs.map((doc: any) => ({
              id: doc._id,
              name: doc.plotSizeName,
            }))
          ),
        PlotType.find({ isDeleted: false })
          .select('plotTypeName')
          .sort('plotTypeName')
          .lean()
          .then(docs =>
            docs.map((doc: any) => ({
              id: doc._id,
              name: doc.plotTypeName,
            }))
          ),
        SrDevStatus.find({ isDeleted: false })
          .select('statusName')
          .sort('statusName')
          .lean()
          .then(docs =>
            docs.map((doc: any) => ({
              id: doc._id,
              name: doc.statusName,
            }))
          ),
        SrApplicationType.find({ isDeleted: false })
          .select('typeName')
          .sort('typeName')
          .lean()
          .then(docs =>
            docs.map((doc: any) => ({
              id: doc._id,
              name: doc.typeName,
            }))
          ),
        SrDevStatus.find({ isDeleted: false })
          .select('srDevStatName')
          .sort('srDevStatName')
          .lean()
          .then(docs =>
            docs.map((doc: any) => ({
              id: doc._id,
              name: doc.srDevStatName,
            }))
          ),
      ]);

    return {
      plotBlocks,
      plotSizes,
      plotTypes,
      developmentStatuses,
      applicationTypes,
      srDevStats,
    };
  },
};
