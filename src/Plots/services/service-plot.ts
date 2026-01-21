import { Types } from 'mongoose';
import { CreatePlotDto, PlotQueryParams, UpdatePlotDto } from '../index-plot';

import SrApplicationType from '../../Application/models/models-applicationtype';
import Status from '../../CityState/models/models-status';
import Plot from '../models/models-plot';
import PlotBlock from '../models/models-plotblock';
import PlotSize from '../models/models-plotsize';
import PlotType from '../models/models-plottype';

export const plotService = {
  async createPlot(data: CreatePlotDto, userId: Types.ObjectId): Promise<any> {
    const plot = await Plot.create({
      ...data,
      projectId: data.projectId ? new Types.ObjectId(data.projectId) : undefined,
      plotBlockId: new Types.ObjectId(data.plotBlockId),
      plotSizeId: new Types.ObjectId(data.plotSizeId),
      plotTypeId: new Types.ObjectId(data.plotTypeId),
      statusId: new Types.ObjectId(data.statusId),

      // developmentStatusId: new Types.ObjectId(data.developmentStatusId),
      applicationTypeId: new Types.ObjectId(data.applicationTypeId),
      discountDate: data.discountDate ? new Date(data.discountDate) : undefined,
      createdBy: userId,
      updatedBy: userId,
    });

    return plot;
  },

  async getPlotById(id: string): Promise<any | null> {
    const plot = await Plot.findById(id)
      .populate('projectId', 'projName')
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName')
      .populate('plotTypeId', 'plotTypeName')
      .populate('statusId', 'statusName')

      // .populate('developmentStatusId', 'statusName')
      .populate('applicationTypeId', 'applicationName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
    console.log(plot);
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
      projectId,
      // developmentStatusId,
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
    if (projectId) query.projectId = new Types.ObjectId(projectId);
    // if (developmentStatusId) query.developmentStatusId = new Types.ObjectId(developmentStatusId);
    if (applicationTypeId) query.applicationTypeId = new Types.ObjectId(applicationTypeId);

    const [plots, total] = await Promise.all([
      Plot.find(query)
        .populate('plotBlockId', 'plotBlockName')
        .populate('plotSizeId', 'plotSizeName')
        .populate('plotTypeId', 'plotTypeName')
        .populate('statusId', 'statusName')
        .populate('projectId', 'projName')
        // .populate('developmentStatusId', 'statusName')
        .populate('applicationTypeId', 'applicationName')
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
  // async updatePlot(id: string, data: UpdatePlotDto, userId: Types.ObjectId) {
  //   const plot = await Plot.findById(id);
  //   if (!plot) throw new Error('Plot not found');
  //   console.log(data);
  //   // Ensure discountAmount <= plotAmount
  //   if (data.discountAmount != null) {
  //     const plotAmount = data.plotAmount ?? plot.plotAmount;
  //     if (data.discountAmount > plotAmount) {
  //       throw new Error('Discount Amount cannot exceed Plot Amount');
  //     }
  //   }

  //   // Update fields
  //   if (data.plotAmount != null) plot.plotAmount = data.plotAmount;
  //   if (data.discountAmount != null) plot.discountAmount = data.discountAmount;
  //   if (data.plotNo != null) plot.plotNo = data.plotNo;
  //   if (data.plotBlockId) plot.plotBlockId = new Types.ObjectId(data.plotBlockId);
  //   if (data.plotSizeId) plot.plotSizeId = new Types.ObjectId(data.plotSizeId);
  //   if (data.plotTypeId) plot.plotTypeId = new Types.ObjectId(data.plotTypeId);
  //   if (data.statusId) plot.statusId = new Types.ObjectId(data.statusId);
  //   if (data.applicationTypeId) plot.applicationTypeId = new Types.ObjectId(data.applicationTypeId);
  //   if (data.projectId != null) plot.projectId = new Types.ObjectId(data.projectId);
  //   // if (data.developmentStatusId)
  //   //   plot.developmentStatusId = new Types.ObjectId(data.developmentStatusId);
  //   if (data.discountDate) plot.discountDate = new Date(data.discountDate);
  //   if (data.plotStreet != null) plot.plotStreet = data.plotStreet;
  //   if (data.plotRemarks != null) plot.plotRemarks = data.plotRemarks;
  //   if (data.statusId != null) plot.statusId = new Types.ObjectId(data.statusId);
  //   if (data.updatedBy != null) plot.updatedBy = userId;
  //   if (data.updatedAt != null) plot.updatedAt = new Date(data.updatedAt);
  //   await plot.save(); // full validators run here

  //   return plot.toObject();
  // },

  // async updatePlot(id: string, data: UpdatePlotDto, userId: Types.ObjectId): Promise<any | null> {
  //   const updateData: any = { ...data };

  //   // Convert string IDs to ObjectId if provided
  //   if (data.projectId) updateData.projectId = new Types.ObjectId(data.projectId);
  //   if (data.plotBlockId) updateData.plotBlockId = new Types.ObjectId(data.plotBlockId);
  //   if (data.plotSizeId) updateData.plotSizeId = new Types.ObjectId(data.plotSizeId);
  //   if (data.plotTypeId) updateData.plotTypeId = new Types.ObjectId(data.plotTypeId);
  //   if (data.statusId) updateData.statusId = new Types.ObjectId(data.statusId);
  //   if (data.projectId) updateData.projectId = new Types.ObjectId(data.projectId);
  //   // if (data.developmentStatusId)
  //   //   updateData.developmentStatusId = new Types.ObjectId(data.developmentStatusId);
  //   if (data.applicationTypeId)
  //     updateData.applicationTypeId = new Types.ObjectId(data.applicationTypeId);
  //   if (data.discountDate) updateData.discountDate = new Date(data.discountDate);

  //   updateData.updatedBy = userId;

  //   const plot = await Plot.findByIdAndUpdate(
  //     id,
  //     { $set: updateData },
  //     { new: true, runValidators: true, context: 'query' }
  //   )
  //     .populate('plotBlockId', 'plotBlockName')
  //     .populate('plotSizeId', 'plotSizeName')
  //     .populate('plotTypeId', 'plotTypeName')
  //     .populate('statusId', 'statusName')
  //     .populate('projectId', 'projName')
  //     // .populate('developmentStatusId', 'statusName')
  //     .populate('applicationTypeId', 'typeName')
  //     .populate('createdBy', 'firstName lastName email')
  //     .populate('updatedBy', 'firstName lastName email');

  //   return plot?.toObject() || null;
  // },
  async updatePlot(id: string, data: UpdatePlotDto, userId: Types.ObjectId) {
    const plot = await Plot.findById(id);
    if (!plot) throw new Error('Plot not found');

    console.log('Update Data Received:', data);
    console.log('ProjectId in data:', data.projectId);
    console.log('ProjectId type:', typeof data.projectId);

    // Ensure discountAmount <= plotAmount
    if (data.discountAmount != null) {
      const plotAmount = data.plotAmount ?? plot.plotAmount;
      if (data.discountAmount > plotAmount) {
        throw new Error('Discount Amount cannot exceed Plot Amount');
      }
    }

    // Update fields
    if (data.plotAmount != null) plot.plotAmount = data.plotAmount;
    if (data.discountAmount != null) plot.discountAmount = data.discountAmount;
    if (data.plotNo != null) plot.plotNo = data.plotNo;
    if (data.plotBlockId) plot.plotBlockId = new Types.ObjectId(data.plotBlockId);
    if (data.plotSizeId) plot.plotSizeId = new Types.ObjectId(data.plotSizeId);
    if (data.plotTypeId) plot.plotTypeId = new Types.ObjectId(data.plotTypeId);
    if (data.statusId) plot.statusId = new Types.ObjectId(data.statusId);
    if (data.applicationTypeId) plot.applicationTypeId = new Types.ObjectId(data.applicationTypeId);

    // PROJECT ID FIX - Ye sahi tarika hai:
    if (data.projectId !== undefined) {
      if (data.projectId) {
        // Agar projectId string hai (not empty)
        plot.projectId = new Types.ObjectId(data.projectId);
        console.log('Setting projectId to:', data.projectId);
      } else {
        // Agar projectId empty string ya null hai
        plot.projectId = undefined;
        console.log('Clearing projectId');
      }
    }

    if (data.discountDate) plot.discountDate = new Date(data.discountDate);
    if (data.plotStreet !== undefined) plot.plotStreet = data.plotStreet;
    if (data.plotRemarks !== undefined) plot.plotRemarks = data.plotRemarks;
    if (data.developmentChargeMethod !== undefined)
      plot.developmentChargeMethod = data.developmentChargeMethod;
    if (data.discountMethod !== undefined) plot.discountMethod = data.discountMethod;

    plot.updatedBy = userId;

    console.log('Plot before save:', {
      plotNo: plot.plotNo,
      projectId: plot.projectId,
      hasProjectId: !!plot.projectId,
    });

    await plot.save(); // full validators run here

    console.log('Plot after save:', {
      plotNo: plot.plotNo,
      projectId: plot.projectId,
      hasProjectId: !!plot.projectId,
    });

    // Ab populate karke return karein
    const populatedPlot = await Plot.findById(plot._id)
      .populate('projectId', 'projName')
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName')
      .populate('plotTypeId', 'plotTypeName')
      .populate('statusId', 'statusName')
      .populate('applicationTypeId', 'applicationName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return populatedPlot?.toObject() || null;
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

  async checkPlotNoExists(
    plotNo: string,
    projectId?: string,
    excludeId?: string
  ): Promise<boolean> {
    const query: any = {
      plotNo: { $regex: new RegExp(`^${plotNo}$`, 'i') },
      isDeleted: false,
    };

    if (projectId) {
      query.projectId = new Types.ObjectId(projectId);
    } else {
      query.projectId = { $exists: false };
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
      Plot.countDocuments({ isDeleted: false, statusId: { $exists: true } }),
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
        Status.find({ isDeleted: false })
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
          .select('applicationName')
          .sort('applicationName')
          .lean()
          .then(docs =>
            docs.map((doc: any) => ({
              id: doc._id,
              name: doc.applicationName,
            }))
          ),
        Status.find({ isDeleted: false })
          .select('statusName')
          .sort('statusName')
          .lean()
          .then(docs =>
            docs.map((doc: any) => ({
              id: doc._id,
              name: doc.statusName,
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
