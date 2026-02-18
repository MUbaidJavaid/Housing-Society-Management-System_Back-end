import { Types } from 'mongoose';
import SrDevStatusModel from '../../Development/models/models-srdevstatus';
import Project from '../../Project/models/models-project';
import SalesStatus from '../../Sales/models/models-salesstatus';
import Plot, { IPlot, PlotType } from '../models/models-plot';
import PlotBlock from '../models/models-plotblock';
import PlotCategory from '../models/models-plotcategory';
import PlotSize from '../models/models-plotsize';
import {
  BulkPlotUpdateDto,
  CreatePlotDto,
  PlotAssignmentDto,
  PlotFilterOptions,
  PlotPriceCalculationDto,
  PlotQueryParams,
  PlotStatistics,
  UpdatePlotDto,
} from '../types/types-plot';
export interface IPlotWithExtras extends IPlot {
  pricePerSqft: number;
  isAvailable: boolean;
}
type PopulatedPlot = {
  _id: Types.ObjectId;
  plotNo: string;
  plotRegistrationNo: string;
  plotDimensions: string;
  plotArea: number;
  plotAreaUnit: string;
  plotType: string;
  plotBasePrice: number;
  surchargeAmount: number;
  discountAmount: number;
  plotTotalAmount: number;
  isPossessionReady: boolean;
  fileId?: {
    customerName: string;
    fileNumber: string;
  } | null;
  plotBlockId?:
    | {
        plotBlockName: string;
      }
    | Types.ObjectId;
  plotSizeId?:
    | {
        plotSizeName: string;
      }
    | Types.ObjectId;
  plotCategoryId?:
    | {
        categoryName: string;
      }
    | Types.ObjectId;
  salesStatusId?:
    | {
        statusName: string;
        colorCode: string;
      }
    | Types.ObjectId;
  srDevStatId?:
    | {
        srDevStatName: string;
      }
    | Types.ObjectId;
};

type PopulatedPlotMapData = {
  _id: Types.ObjectId;
  plotNo: string;
  plotLatitude: number;
  plotLongitude: number;
  plotArea: number;
  plotTotalAmount: number;
  plotBlockId?: { plotBlockName: string } | Types.ObjectId;
  plotSizeId?: { plotSizeName: string } | Types.ObjectId;
  salesStatusId?: { statusName: string; colorCode: string } | Types.ObjectId;
  fileId?: { customerName: string; fileNumber: string } | Types.ObjectId;
};
export const plotService = {
  /**
   * Create new plot
   */
  // In service-plot.ts, update the createPlot method

  async createPlot(data: CreatePlotDto, userId: Types.ObjectId): Promise<any> {
    // Calculate plot area
    const plotArea = parseFloat((data.plotLength * data.plotWidth).toFixed(2));

    // Calculate total amount if not provided
    let plotTotalAmount = data.plotTotalAmount;
    if (!plotTotalAmount) {
      plotTotalAmount =
        data.plotBasePrice + (data.surchargeAmount || 0) - (data.discountAmount || 0);
    }

    // Validate that project and block exist
    const [project, plotBlock] = await Promise.all([
      Project.findById(data.projectId),
      PlotBlock.findById(data.plotBlockId),
    ]);

    if (!project) {
      throw new Error('Project not found');
    }

    if (!plotBlock) {
      throw new Error('Plot block not found');
    }

    const plotData = {
      ...data,
      plotArea,
      plotTotalAmount,
      plotType: data.plotType,
      projectId: new Types.ObjectId(data.projectId),
      plotBlockId: new Types.ObjectId(data.plotBlockId),
      plotSizeId: new Types.ObjectId(data.plotSizeId),
      plotCategoryId: new Types.ObjectId(data.plotCategoryId),
      salesStatusId: new Types.ObjectId(data.salesStatusId),
      srDevStatId: data.srDevStatId ? new Types.ObjectId(data.srDevStatId) : undefined,
      surchargeAmount: data.surchargeAmount || 0,
      discountAmount: data.discountAmount || 0,
      plotAreaUnit: data.plotAreaUnit || 'sqft',
      isPossessionReady: false,
      createdBy: userId,
      updatedBy: userId,
    };

    const plot = await Plot.create(plotData);
    return plot;
  },
  /**
   * Get plot by ID
   */
  // In service-plot.ts, update the getPlotById method:

  async getPlotById(id: string): Promise<IPlotWithExtras | null> {
    const plot = await Plot.findById(id)
      .populate('projectId', 'projName projCode projPrefix')
      .populate('plotBlockId', 'plotBlockName plotBlockDesc')
      .populate('plotSizeId', 'plotSizeName totalArea areaUnit ratePerUnit')
      .populate('plotCategoryId', 'categoryName surchargePercentage surchargeFixedAmount')
      .populate({
        path: 'srDevStatId',
        select: 'srDevStatName devCategory devPhase percentageComplete -_id',
        options: { virtuals: false }, // Exclude virtuals
      })
      .populate('salesStatusId', 'statusName statusCode colorCode allowsSale')
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('possId', 'possessionCode possessionStatus')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('plotDocuments.uploadedBy', 'firstName lastName')
      .lean();

    if (!plot) return null;

    const plotObj = plot as unknown as IPlotWithExtras;
    plotObj.pricePerSqft =
      plotObj.plotArea > 0 ? parseFloat((plotObj.plotBasePrice / plotObj.plotArea).toFixed(2)) : 0;
    plotObj.isAvailable = !plotObj.fileId;

    return plotObj;
  },
  /**
   * Get plot by registration number
   */
  async getPlotByRegistrationNo(registrationNo: string): Promise<any | null> {
    const plot = await Plot.findOne({
      plotRegistrationNo: registrationNo.toUpperCase(),
      isDeleted: false,
    })
      .populate('projectId', 'projName projCode projPrefix')
      .populate('plotBlockId', 'plotBlockName plotBlockDesc')
      .populate('plotSizeId', 'plotSizeName totalArea areaUnit ratePerUnit')
      .populate('plotCategoryId', 'categoryName surchargePercentage surchargeFixedAmount')
      .populate('srDevStatId', 'srDevStatName devCategory devPhase percentageComplete')
      .populate('salesStatusId', 'statusName statusCode colorCode allowsSale')
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('possId', 'possessionCode possessionStatus');

    if (!plot) return null;
    return plot.toObject();
  },

  /**
   * Get all plots with pagination
   */
  async getPlots(params: PlotQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'plotNo',
      sortOrder = 'asc',
      projectId,
      plotBlockId,
      plotType,
      salesStatusId,
      srDevStatId,
      plotCategoryId,
      isAvailable,
      isPossessionReady,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      plotFacing,
      hasFile,
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search by multiple fields
    if (search) {
      query.$or = [
        { plotNo: { $regex: search, $options: 'i' } },
        { plotRegistrationNo: { $regex: search, $options: 'i' } },
        { plotStreet: { $regex: search, $options: 'i' } },
        { plotRemarks: { $regex: search, $options: 'i' } },
        { plotDimensions: { $regex: search, $options: 'i' } },
      ];
    }

    // Project filter
    if (projectId) {
      query.projectId = new Types.ObjectId(projectId);
    }

    // Block filter
    if (plotBlockId) {
      query.plotBlockId = new Types.ObjectId(plotBlockId);
    }

    // Type filter
    if (plotType && plotType.length > 0) {
      query.plotType = { $in: plotType };
    }

    // Sales status filter
    if (salesStatusId && salesStatusId.length > 0) {
      query.salesStatusId = { $in: salesStatusId.map(id => new Types.ObjectId(id)) };
    }

    // Development status filter
    if (srDevStatId && srDevStatId.length > 0) {
      query.srDevStatId = { $in: srDevStatId.map(id => new Types.ObjectId(id)) };
    }

    // Category filter
    if (plotCategoryId && plotCategoryId.length > 0) {
      query.plotCategoryId = { $in: plotCategoryId.map(id => new Types.ObjectId(id)) };
    }

    // Availability filter
    if (isAvailable !== undefined) {
      if (isAvailable) {
        query.fileId = { $exists: false };
      } else {
        query.fileId = { $exists: true };
      }
    }

    // Possession ready filter
    if (isPossessionReady !== undefined) {
      query.isPossessionReady = isPossessionReady;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.plotTotalAmount = {};
      if (minPrice !== undefined) query.plotTotalAmount.$gte = minPrice;
      if (maxPrice !== undefined) query.plotTotalAmount.$lte = maxPrice;
    }

    // Area range filter
    if (minArea !== undefined || maxArea !== undefined) {
      query.plotArea = {};
      if (minArea !== undefined) query.plotArea.$gte = minArea;
      if (maxArea !== undefined) query.plotArea.$lte = maxArea;
    }

    // Facing filter
    if (plotFacing && plotFacing.length > 0) {
      query.plotFacing = { $in: plotFacing };
    }

    // File association filter
    if (hasFile !== undefined) {
      if (hasFile) {
        query.fileId = { $exists: true, $ne: null };
      } else {
        query.fileId = { $exists: false };
      }
    }

    // Update the service-plot.ts getPlots method

    const [plots, total] = await Promise.all([
      Plot.find(query)
        .populate('projectId', 'projName projCode')
        .populate('plotBlockId', 'plotBlockName')
        .populate('plotSizeId', 'plotSizeName totalArea areaUnit')
        .populate('plotCategoryId', 'categoryName')
        .populate('salesStatusId', 'statusName statusCode colorCode')
        .populate('srDevStatId', 'srDevStatName devPhase')
        .populate('fileId', 'fileNumber customerName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean() // Use lean() for better performance
        .then(docs => {
          // Ensure all required fields have default values
          return docs.map(doc => {
            // First create the base object
            const plotBase = {
              ...doc,
              plotArea: doc.plotArea || 0,
              plotBasePrice: doc.plotBasePrice || 0,
              surchargeAmount: doc.surchargeAmount || 0,
              discountAmount: doc.discountAmount || 0,
              plotTotalAmount: doc.plotTotalAmount || 0,
              plotAreaUnit: doc.plotAreaUnit || 'sqft',
              isAvailable: !doc.fileId,
            };

            // Calculate price per sqft
            const pricePerSqft =
              plotBase.plotArea > 0
                ? parseFloat((plotBase.plotBasePrice / plotBase.plotArea).toFixed(2))
                : 0;

            // Now create the full object with all required properties
            const plotObj: IPlotWithExtras = {
              ...plotBase,
              pricePerSqft,
              // Add any other required properties from IPlotWithExtras interface
            };

            return plotObj;
          });
        }),
      Plot.countDocuments(query),
    ]);
    // Calculate summary statistics
    const summary = {
      totalPlots: plots.length,
      availablePlots: plots.filter(plot => !plot.fileId).length,
      soldPlots: plots.filter(plot => plot.fileId).length,
      totalArea: parseFloat(plots.reduce((sum, plot) => sum + plot.plotArea, 0).toFixed(2)),
      totalValue: plots.reduce((sum, plot) => sum + plot.plotTotalAmount, 0),
      avgPrice:
        plots.length > 0
          ? Math.round(plots.reduce((sum, plot) => sum + plot.plotTotalAmount, 0) / plots.length)
          : 0,
    };

    return {
      plots,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update plot
   */
  /**
   * Update plot
   */
  async updatePlot(id: string, data: UpdatePlotDto, userId: Types.ObjectId): Promise<any | null> {
    const plot = await Plot.findById(id);
    if (!plot) {
      throw new Error('Plot not found');
    }

    // Prepare update data
    const updateData: any = { ...data, updatedBy: userId };

    // Convert ObjectId fields if provided
    if (data.plotBlockId) {
      updateData.plotBlockId = new Types.ObjectId(data.plotBlockId);
    }

    if (data.plotSizeId) {
      updateData.plotSizeId = new Types.ObjectId(data.plotSizeId);
    }

    if (data.plotCategoryId) {
      updateData.plotCategoryId = new Types.ObjectId(data.plotCategoryId);
    }

    if (data.salesStatusId) {
      updateData.salesStatusId = new Types.ObjectId(data.salesStatusId);
    }

    if (data.srDevStatId !== undefined) {
      updateData.srDevStatId = data.srDevStatId ? new Types.ObjectId(data.srDevStatId) : null;
    }

    if (data.fileId !== undefined) {
      updateData.fileId = data.fileId ? new Types.ObjectId(data.fileId) : null;
    }

    // Manually recalculate total amount if price components are being updated
    const newBasePrice = data.plotBasePrice !== undefined ? data.plotBasePrice : plot.plotBasePrice;
    const newSurcharge =
      data.surchargeAmount !== undefined ? data.surchargeAmount : plot.surchargeAmount;
    const newDiscount =
      data.discountAmount !== undefined ? data.discountAmount : plot.discountAmount;

    // ALWAYS update the total amount
    updateData.plotTotalAmount = newBasePrice + newSurcharge - newDiscount;

    // Recalculate area if dimensions changed
    if (data.plotLength !== undefined || data.plotWidth !== undefined) {
      const length = data.plotLength !== undefined ? data.plotLength : plot.plotLength;
      const width = data.plotWidth !== undefined ? data.plotWidth : plot.plotWidth;
      updateData.plotArea = parseFloat((length * width).toFixed(2));
      updateData.plotDimensions = `${length}×${width}`;
    }

    // Validate plot number uniqueness if changing
    if (data.plotNo) {
      const existingPlot = await Plot.findOne({
        projectId: plot.projectId,
        plotNo: data.plotNo,
        isDeleted: false,
        _id: { $ne: id },
      });

      if (existingPlot) {
        throw new Error(`Plot number ${data.plotNo} already exists in this project`);
      }
    }

    const updatedPlot = await Plot.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('projectId', 'projName projCode')
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName totalArea areaUnit')
      .populate('plotCategoryId', 'categoryName')
      .populate('salesStatusId', 'statusName statusCode')
      .populate('srDevStatId', 'srDevStatName')
      .populate('fileId', 'fileNumber customerName');

    if (!updatedPlot) return null;

    const plotObj = updatedPlot.toObject() as unknown as IPlotWithExtras;
    plotObj.isAvailable = !plotObj.fileId;

    return plotObj;
  },

  /**
   * Delete plot (soft delete)
   */
  async deletePlot(id: string, userId: Types.ObjectId): Promise<boolean> {
    // Check if plot has a file assigned (sold)
    const plot = await Plot.findById(id);
    if (plot?.fileId) {
      throw new Error('Cannot delete plot that is assigned to a customer');
    }

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

  /**
   * Calculate plot price
   */
  async calculatePlotPrice(data: PlotPriceCalculationDto): Promise<{
    basePrice: number;
    surchargeAmount: number;
    discountAmount: number;
    totalAmount: number;
    pricePerUnit: number;
    details: any;
  }> {
    // Fetch plot size and category
    const [plotSize, plotCategory] = await Promise.all([
      PlotSize.findById(data.plotSizeId),
      PlotCategory.findById(data.plotCategoryId),
    ]);

    if (!plotSize) {
      throw new Error('Plot size not found');
    }

    if (!plotCategory) {
      throw new Error('Plot category not found');
    }

    // Calculate area
    const area = data.plotLength * data.plotWidth;

    // Calculate base price (rate per unit × area)
    const basePrice = plotSize.ratePerUnit * area;

    let surchargeAmount = 0;

    const percentage = plotCategory.surchargePercentage ?? 0;
    const fixed = plotCategory.surchargeFixedAmount ?? 0;

    if (percentage > 0) {
      surchargeAmount = (basePrice * percentage) / 100;
    } else if (fixed > 0) {
      surchargeAmount = fixed;
    }

    // Apply discount
    const discountAmount = data.discountAmount || 0;

    // Calculate total
    const totalAmount = basePrice + surchargeAmount - discountAmount;

    // Calculate price per unit
    const pricePerUnit = area > 0 ? parseFloat((basePrice / area).toFixed(2)) : 0;

    return {
      basePrice: parseFloat(basePrice.toFixed(2)),
      surchargeAmount: parseFloat(surchargeAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      pricePerUnit,
      details: {
        plotSize: plotSize.toObject(),
        plotCategory: plotCategory.toObject(),
        area,
        calculation: `Base: ${plotSize.ratePerUnit} × ${area} = ${basePrice} | Surcharge: ${surchargeAmount} | Discount: ${discountAmount} | Total: ${totalAmount}`,
      },
    };
  },

  /**
   * Assign plot to customer (file)
   */
  async assignPlotToCustomer(
    data: PlotAssignmentDto,
    _userId: Types.ObjectId
  ): Promise<any | null> {
    const plot = await Plot.findById(data.plotId);

    if (!plot) {
      throw new Error('Plot not found');
    }

    if (plot.fileId) {
      throw new Error('Plot is already assigned to a customer');
    }

    // Check if sales status allows assignment
    const salesStatus = await SalesStatus.findById(data.salesStatusId);
    if (!salesStatus?.allowsSale) {
      throw new Error('Selected sales status does not allow plot assignment');
    }

    const updateData = {
      fileId: new Types.ObjectId(data.fileId),
      salesStatusId: new Types.ObjectId(data.salesStatusId),
      updatedBy: new Types.ObjectId(data.assignedBy),
    };

    const updatedPlot = await Plot.findByIdAndUpdate(
      data.plotId,
      { $set: updateData },
      { new: true }
    )
      .populate('projectId', 'projName projCode')
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName totalArea')
      .populate('plotCategoryId', 'categoryName')
      .populate('salesStatusId', 'statusName statusCode')
      .populate('fileId', 'fileNumber customerName customerCnic');

    if (!updatedPlot) return null;

    // Update project plot counts
    // Plot counts now calculated dynamically per project

    return updatedPlot.toObject();
  },

  /**
   * Unassign plot from customer
   */
  async unassignPlotFromCustomer(plotId: string, userId: Types.ObjectId): Promise<any | null> {
    const plot = await Plot.findById(plotId);

    if (!plot) {
      throw new Error('Plot not found');
    }

    if (!plot.fileId) {
      throw new Error('Plot is not assigned to any customer');
    }

    const updateData = {
      fileId: null,
      salesStatusId: null, // Reset to default available status
      updatedBy: userId,
    };

    const updatedPlot = await Plot.findByIdAndUpdate(plotId, { $set: updateData }, { new: true })
      .populate('projectId', 'projName projCode')
      .populate('plotBlockId', 'plotBlockName');

    if (!updatedPlot) return null;

    // Update project plot counts
    // Plot counts now calculated dynamically per project

    return updatedPlot.toObject();
  },

  /**
   * Get available plots
   */
  async getAvailablePlots(projectId?: string, blockId?: string): Promise<any[]> {
    const query: any = {
      isDeleted: false,
      fileId: { $exists: false },
    };

    if (projectId) {
      query.projectId = new Types.ObjectId(projectId);
    }

    if (blockId) {
      query.plotBlockId = new Types.ObjectId(blockId);
    }

    const plots = await Plot.find(query)
      .populate('projectId', 'projName projCode')
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName totalArea areaUnit')
      .populate('plotCategoryId', 'categoryName')
      .populate('salesStatusId', 'statusName statusCode')
      .sort({ plotNo: 1 });

    return plots.map(plot => {
      const plotObj = plot.toObject() as unknown as IPlotWithExtras;
      plotObj.isAvailable = true;
      plotObj.pricePerSqft =
        plotObj.plotArea > 0
          ? parseFloat((plotObj.plotBasePrice / plotObj.plotArea).toFixed(2))
          : 0;
      return plotObj;
    });
  },

  /**
   * Get plots by project
   */
  async getPlotsByProject(projectId: string): Promise<any[]> {
    const plots = await Plot.find({
      projectId: new Types.ObjectId(projectId),
      isDeleted: false,
    })
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName totalArea')
      .populate('plotCategoryId', 'categoryName')
      .populate('salesStatusId', 'statusName statusCode')
      .populate('fileId', 'fileNumber customerName')
      .sort({ plotBlockId: 1, plotNo: 1 });

    return plots.map(plot => {
      const plotObj = plot.toObject() as unknown as IPlotWithExtras;
      plotObj.isAvailable = !plotObj.fileId;
      return plotObj;
    });
  },

  /**
   * Get plots by block
   */
  async getPlotsByBlock(blockId: string): Promise<any[]> {
    const plots = await Plot.find({
      plotBlockId: new Types.ObjectId(blockId),
      isDeleted: false,
    })
      .populate('projectId', 'projName projCode')
      .populate('plotSizeId', 'plotSizeName totalArea')
      .populate('plotCategoryId', 'categoryName')
      .populate('salesStatusId', 'statusName statusCode')
      .populate('fileId', 'fileNumber customerName')
      .sort({ plotNo: 1 });

    return plots.map(plot => plot.toObject());
  },

  /**
   * Get plots by file/customer
   */
  async getPlotsByFile(fileId: string): Promise<any[]> {
    const plots = await Plot.find({
      fileId: new Types.ObjectId(fileId),
      isDeleted: false,
    })
      .populate('projectId', 'projName projCode')
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName totalArea')
      .populate('plotCategoryId', 'categoryName')
      .populate('salesStatusId', 'statusName statusCode')
      .populate('srDevStatId', 'srDevStatName devPhase')
      .sort({ createdAt: -1 });

    return plots.map(plot => plot.toObject());
  },

  /**
   * Mark plot possession ready
   */
  async markPossessionReady(plotId: string, userId: Types.ObjectId): Promise<any | null> {
    const plot = await Plot.findById(plotId);

    if (!plot) {
      throw new Error('Plot not found');
    }

    if (!plot.fileId) {
      throw new Error('Plot must be assigned to a customer first');
    }

    // Check if development status is appropriate
    if (plot.srDevStatId) {
      const devStatus = await SrDevStatusModel.findById(plot.srDevStatId);
      if (devStatus?.devPhase !== 'completion') {
        throw new Error('Plot development status must be completion phase');
      }
    }

    const updatedPlot = await Plot.findByIdAndUpdate(
      plotId,
      {
        $set: {
          isPossessionReady: true,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('projectId', 'projName projCode')
      .populate('plotBlockId', 'plotBlockName')
      .populate('fileId', 'fileNumber customerName customerCnic');

    if (!updatedPlot) return null;
    return updatedPlot.toObject();
  },

  /**
   * Update plot documents
   */
  async updatePlotDocuments(
    plotId: string,
    documents: Array<{
      documentType: string;
      documentPath: string;
      uploadedBy: Types.ObjectId;
    }>,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const plot = await Plot.findByIdAndUpdate(
      plotId,
      {
        $push: {
          plotDocuments: {
            $each: documents.map(doc => ({
              ...doc,
              uploadedDate: new Date(),
            })),
          },
        },
        $set: {
          updatedBy: userId,
        },
      },
      { new: true }
    ).populate('plotDocuments.uploadedBy', 'firstName lastName');

    if (!plot) return null;
    return plot.toObject();
  },

  /**
   * Bulk update plots
   */
  async bulkUpdatePlots(
    data: BulkPlotUpdateDto,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number; errors: string[] }> {
    const errors: string[] = [];
    const updates = data.plotIds.map(async plotId => {
      try {
        const plot = await Plot.findById(plotId);
        if (!plot) {
          errors.push(`Plot ${plotId} not found`);
          return null;
        }

        // Validate field-specific rules
        if (data.field === 'salesStatusId' && plot.fileId && data.value) {
          const salesStatus = await SalesStatus.findById(data.value);
          if (!salesStatus?.allowsSale) {
            errors.push(`Plot ${plot.plotNo} cannot be assigned status ${data.value}`);
            return null;
          }
        }

        return { plotId, updateData: { [data.field]: data.value } };
      } catch (error: any) {
        errors.push(`Error processing ${plotId}: ${error.message}`);
        return null;
      }
    });

    const updateResults = await Promise.all(updates);
    const validUpdates = updateResults.filter(result => result !== null);

    if (validUpdates.length === 0) {
      return { matched: 0, modified: 0, errors };
    }

    const bulkOps = validUpdates.map(result => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(result!.plotId) },
        update: {
          $set: {
            [data.field]: data.value,
            updatedBy: userId,
          },
        },
      },
    }));

    const bulkResult = await Plot.bulkWrite(bulkOps);

    return {
      matched: bulkResult.matchedCount,
      modified: bulkResult.modifiedCount,
      errors,
    };
  },

  /**
   * Get plot statistics
   */
  async getPlotStatistics(projectId?: string): Promise<PlotStatistics> {
    const matchStage: any = { isDeleted: false };
    if (projectId) {
      matchStage.projectId = new Types.ObjectId(projectId);
    }

    const stats = await Plot.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: [{ $ifNull: ['$fileId', null] }, null] }, 1, 0] },
          },
          sold: {
            $sum: { $cond: [{ $ne: [{ $ifNull: ['$fileId', null] }, null] }, 1, 0] },
          },
          totalArea: { $sum: '$plotArea' },
          totalValue: { $sum: '$plotTotalAmount' },
          averagePrice: { $avg: '$plotTotalAmount' },
        },
      },
    ]);

    const typeStats = await Plot.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: '$plotType',
          count: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: [{ $ifNull: ['$fileId', null] }, null] }, 1, 0] },
          },
          totalArea: { $sum: '$plotArea' },
          totalValue: { $sum: '$plotTotalAmount' },
        },
      },
    ]);

    const categoryStats = await Plot.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'plotcategories',
          localField: 'plotCategoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $group: {
          _id: '$category.categoryName',
          count: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: [{ $ifNull: ['$fileId', null] }, null] }, 1, 0] },
          },
        },
      },
    ]);

    const statusStats = await Plot.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'salesstatuses',
          localField: 'salesStatusId',
          foreignField: '_id',
          as: 'status',
        },
      },
      {
        $unwind: '$status',
      },
      {
        $group: {
          _id: '$status.statusName',
          count: { $sum: 1 },
        },
      },
    ]);

    const baseStats = stats[0] || {
      total: 0,
      available: 0,
      sold: 0,
      totalArea: 0,
      totalValue: 0,
      averagePrice: 0,
    };

    const byType: Record<PlotType, number> = {} as Record<PlotType, number>;

    typeStats.forEach((stat: any) => {
      byType[stat._id as PlotType] = stat.count;
    });

    const byCategory: Record<string, number> = {};
    categoryStats.forEach((stat: any) => {
      byCategory[stat._id] = stat.count;
    });

    const byStatus: Record<string, number> = {};
    statusStats.forEach((stat: any) => {
      byStatus[stat._id] = stat.count;
    });

    return {
      ...baseStats,
      reserved: baseStats.total - baseStats.available - baseStats.sold,
      byType,
      byCategory,
      byStatus,
      totalArea: parseFloat(baseStats.totalArea.toFixed(2)),
      totalValue: parseFloat(baseStats.totalValue.toFixed(2)),
      averagePrice: parseFloat(baseStats.averagePrice.toFixed(2)),
    };
  },

  /**
   * Search plots with filters
   */
  async searchPlotsWithFilters(filters: PlotFilterOptions): Promise<any[]> {
    const query: any = { isDeleted: false };

    if (filters.projectId) {
      query.projectId = new Types.ObjectId(filters.projectId);
    }

    if (filters.blockId) {
      query.plotBlockId = new Types.ObjectId(filters.blockId);
    }

    if (filters.type && filters.type.length > 0) {
      query.plotType = { $in: filters.type };
    }

    if (filters.category && filters.category.length > 0) {
      query.plotCategoryId = { $in: filters.category.map(id => new Types.ObjectId(id)) };
    }

    if (filters.status && filters.status.length > 0) {
      query.salesStatusId = { $in: filters.status.map(id => new Types.ObjectId(id)) };
    }

    if (filters.minArea !== undefined || filters.maxArea !== undefined) {
      query.plotArea = {};
      if (filters.minArea !== undefined) query.plotArea.$gte = filters.minArea;
      if (filters.maxArea !== undefined) query.plotArea.$lte = filters.maxArea;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.plotTotalAmount = {};
      if (filters.minPrice !== undefined) query.plotTotalAmount.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.plotTotalAmount.$lte = filters.maxPrice;
    }

    if (filters.facing && filters.facing.length > 0) {
      query.plotFacing = { $in: filters.facing };
    }

    if (filters.availability === 'available') {
      query.fileId = { $exists: false };
    } else if (filters.availability === 'sold') {
      query.fileId = { $exists: true };
    }

    const plots = await Plot.find(query)
      .populate('projectId', 'projName projCode')
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName totalArea areaUnit')
      .populate('plotCategoryId', 'categoryName')
      .populate('salesStatusId', 'statusName statusCode colorCode')
      .populate('srDevStatId', 'srDevStatName devPhase')
      .populate('fileId', 'fileNumber customerName')
      .sort({ plotNo: 1 })
      .limit(100);

    return plots.map(plot => {
      const plotObj = plot.toObject() as unknown as IPlotWithExtras;
      plotObj.isAvailable = !plotObj.fileId;
      plotObj.pricePerSqft =
        plotObj.plotArea > 0
          ? parseFloat((plotObj.plotBasePrice / plotObj.plotArea).toFixed(2))
          : 0;
      return plotObj;
    });
  },

  /**
   * Get plot map data (for GIS/mapping)
   */
  async getPlotMapData(projectId: string): Promise<any[]> {
    const plots = await Plot.find({
      projectId: new Types.ObjectId(projectId),
      isDeleted: false,
      plotLatitude: { $exists: true },
      plotLongitude: { $exists: true },
    })
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName')
      .populate('salesStatusId', 'statusName statusCode colorCode')
      .populate('fileId', 'fileNumber customerName')
      .select(
        'plotNo plotLatitude plotLongitude plotArea plotTotalAmount plotBlockId plotSizeId salesStatusId fileId'
      )
      .limit(500);

    return plots.map(plot => {
      const plotObj = plot.toObject() as PopulatedPlotMapData;
      return {
        id: plotObj._id,
        plotNo: plotObj.plotNo,
        coordinates: {
          lat: plotObj.plotLatitude,
          lng: plotObj.plotLongitude,
        },
        area: plotObj.plotArea,
        price: plotObj.plotTotalAmount,
        block: (plotObj.plotBlockId as any)?.plotBlockName,
        size: (plotObj.plotSizeId as any)?.plotSizeName,
        status: (plotObj.salesStatusId as any)?.statusName,
        color: (plotObj.salesStatusId as any)?.colorCode,
        isAvailable: !plotObj.fileId,
        customer: (plotObj.fileId as any)?.customerName,
      };
    });
  },

  /**
   * Generate plot inventory report
   */
  async generatePlotInventoryReport(projectId: string): Promise<any> {
    const plots = await Plot.find({
      projectId: new Types.ObjectId(projectId),
      isDeleted: false,
    })
      .populate('plotBlockId', 'plotBlockName')
      .populate('plotSizeId', 'plotSizeName totalArea areaUnit')
      .populate('plotCategoryId', 'categoryName')
      .populate('salesStatusId', 'statusName statusCode')
      .populate('srDevStatId', 'srDevStatName')
      .populate('fileId', 'fileNumber customerName customerCnic')
      .sort({ plotBlockId: 1, plotNo: 1 });

    const blocks = new Map();
    let totalPlots = 0;
    let totalArea = 0;
    let totalValue = 0;
    let availablePlots = 0;
    let soldPlots = 0;

    plots.forEach(plot => {
      const plotObj = plot.toObject() as unknown as PopulatedPlot;
      const blockName = (plotObj.plotBlockId as any)?.plotBlockName || 'Unknown';

      if (!blocks.has(blockName)) {
        blocks.set(blockName, {
          blockName,
          plots: [],
          totalPlots: 0,
          availablePlots: 0,
          soldPlots: 0,
          totalArea: 0,
          totalValue: 0,
        });
      }

      const block = blocks.get(blockName);
      block.plots.push({
        plotNo: plotObj.plotNo,
        plotRegistrationNo: plotObj.plotRegistrationNo,
        dimensions: plotObj.plotDimensions,
        area: plotObj.plotArea,
        areaUnit: plotObj.plotAreaUnit,
        category: (plotObj.plotCategoryId as any)?.categoryName,
        type: plotObj.plotType,
        status: (plotObj.salesStatusId as any)?.statusName,
        developmentStatus: (plotObj.srDevStatId as any)?.srDevStatName,
        basePrice: plotObj.plotBasePrice,
        surcharge: plotObj.surchargeAmount,
        discount: plotObj.discountAmount,
        totalAmount: plotObj.plotTotalAmount,
        isAvailable: !plotObj.fileId,
        customer: (plotObj.fileId as any)?.customerName,
        fileNumber: (plotObj.fileId as any)?.fileNumber,
        possessionReady: plotObj.isPossessionReady,
      });

      block.totalPlots++;
      block.totalArea += plotObj.plotArea;
      block.totalValue += plotObj.plotTotalAmount;

      if (!plotObj.fileId) {
        block.availablePlots++;
      } else {
        block.soldPlots++;
      }

      totalPlots++;
      totalArea += plotObj.plotArea;
      totalValue += plotObj.plotTotalAmount;

      if (!plotObj.fileId) {
        availablePlots++;
      } else {
        soldPlots++;
      }
    });

    return {
      summary: {
        totalPlots,
        availablePlots,
        soldPlots,
        totalArea: parseFloat(totalArea.toFixed(2)),
        totalValue: parseFloat(totalValue.toFixed(2)),
        averagePrice: totalPlots > 0 ? parseFloat((totalValue / totalPlots).toFixed(2)) : 0,
      },
      blocks: Array.from(blocks.values()),
      generatedDate: new Date(),
    };
  },
};
