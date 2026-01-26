import { Types } from 'mongoose';
import PlotSize from '../models/models-plotsize';
import {
  AreaUnitConversion,
  CreatePlotSizeDto,
  PlotSizeQueryParams,
  PriceCalculationDto,
  UpdatePlotSizeDto,
} from '../types/types-plotsize';

// Area unit conversion rates (example values, adjust as needed)
export const AREA_UNIT_CONVERSION: AreaUnitConversion = {
  marla: { toSqft: 225, toSqm: 20.9 },
  sqft: { toSqft: 1, toSqm: 0.0929 },
  sqm: { toSqft: 10.764, toSqm: 1 },
  acre: { toSqft: 43560, toSqm: 4046.86 },
  hectare: { toSqft: 107639, toSqm: 10000 },
  kanal: { toSqft: 5445, toSqm: 505.857 },
};

export const plotSizeService = {
  /**
   * Create new plot size
   */
  async createPlotSize(data: CreatePlotSizeDto, userId: Types.ObjectId): Promise<any> {
    // Calculate standard base price if not provided
    const plotSizeData = {
      ...data,
      standardBasePrice:
        data.standardBasePrice || parseFloat((data.totalArea * data.ratePerUnit).toFixed(2)),
      createdBy: userId,
      updatedBy: userId,
    };

    const plotSize = await PlotSize.create(plotSizeData);
    return plotSize;
  },

  /**
   * Get plot size by ID
   */
  async getPlotSizeById(id: string): Promise<any | null> {
    const plotSize = await PlotSize.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!plotSize) return null;
    return plotSize.toObject();
  },

  /**
   * Get all plot sizes with pagination and filtering
   */
  async getPlotSizes(params: PlotSizeQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'totalArea',
      sortOrder = 'asc',
      minPrice,
      maxPrice,
      areaUnit,
      minArea,
      maxArea,
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search by name
    if (search) {
      query.plotSizeName = { $regex: search, $options: 'i' };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.standardBasePrice = {};
      if (minPrice !== undefined) query.standardBasePrice.$gte = minPrice;
      if (maxPrice !== undefined) query.standardBasePrice.$lte = maxPrice;
    }

    // Area range filter
    if (minArea !== undefined || maxArea !== undefined) {
      query.totalArea = {};
      if (minArea !== undefined) query.totalArea.$gte = minArea;
      if (maxArea !== undefined) query.totalArea.$lte = maxArea;
    }

    // Area unit filter
    if (areaUnit) {
      query.areaUnit = areaUnit;
    }

    // Execute queries
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

    // Calculate summary statistics
    const summary =
      plotSizes.length > 0
        ? {
            minPrice: Math.min(...plotSizes.map(p => p.standardBasePrice)),
            maxPrice: Math.max(...plotSizes.map(p => p.standardBasePrice)),
            averagePrice: parseFloat(
              (
                plotSizes.reduce((sum, p) => sum + p.standardBasePrice, 0) / plotSizes.length
              ).toFixed(2)
            ),
            totalSizes: plotSizes.length,
          }
        : {
            minPrice: 0,
            maxPrice: 0,
            averagePrice: 0,
            totalSizes: 0,
          };

    return {
      plotSizes,
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
   * Update plot size
   */
  async updatePlotSize(
    id: string,
    data: UpdatePlotSizeDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    // If totalArea or ratePerUnit is being updated, ensure standardBasePrice is recalculated
    if (data.totalArea !== undefined || data.ratePerUnit !== undefined) {
      const existingPlotSize = await PlotSize.findById(id);
      if (existingPlotSize) {
        const totalArea =
          data.totalArea !== undefined ? data.totalArea : existingPlotSize.totalArea;
        const ratePerUnit =
          data.ratePerUnit !== undefined ? data.ratePerUnit : existingPlotSize.ratePerUnit;

        // Only update standardBasePrice if it wasn't explicitly provided
        if (data.standardBasePrice === undefined) {
          data.standardBasePrice = parseFloat((totalArea * ratePerUnit).toFixed(2));
        }
      }
    }

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

    if (!plotSize) return null;
    return plotSize.toObject();
  },

  /**
   * Delete plot size (soft delete)
   */
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

  /**
   * Check if plot size exists
   */
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

  /**
   * Calculate price based on area and rate
   */
  calculatePrice(data: PriceCalculationDto): number {
    return parseFloat((data.totalArea * data.ratePerUnit).toFixed(2));
  },

  /**
   * Get plot sizes by area unit
   */
  async getPlotSizesByUnit(areaUnit: string): Promise<any[]> {
    const plotSizes = await PlotSize.find({
      areaUnit,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ totalArea: 1 });

    return plotSizes.map(size => size.toObject());
  },

  /**
   * Convert area from one unit to another
   */
  convertArea(value: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return value;

    const fromConversion = AREA_UNIT_CONVERSION[fromUnit];
    const toConversion = AREA_UNIT_CONVERSION[toUnit];

    if (!fromConversion || !toConversion) {
      throw new Error(`Unsupported area unit: ${fromUnit} or ${toUnit}`);
    }

    // Convert to square feet first as intermediate unit
    const valueInSqft = value * fromConversion.toSqft;

    // Convert from square feet to target unit
    return parseFloat((valueInSqft / toConversion.toSqft).toFixed(4));
  },

  /**
   * Get price breakdown for a plot size
   */
  async getPriceBreakdown(id: string): Promise<any> {
    const plotSize = await PlotSize.findById(id);
    if (!plotSize) return null;

    return {
      plotSize: plotSize.toObject(),
      breakdown: {
        totalArea: plotSize.totalArea,
        areaUnit: plotSize.areaUnit,
        ratePerUnit: plotSize.ratePerUnit,
        totalPrice: plotSize.standardBasePrice,
        calculation: `${plotSize.totalArea} ${plotSize.areaUnit} × ${plotSize.ratePerUnit} = ${plotSize.standardBasePrice}`,
      },
    };
  },

  /**
   * Get all available area units
   */
  getAvailableAreaUnits(): string[] {
    return Object.keys(AREA_UNIT_CONVERSION);
  },

  /**
   * Get plot size statistics
   */
  async getPlotSizeStatistics(): Promise<any> {
    const stats = await PlotSize.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: '$areaUnit',
          count: { $sum: 1 },
          minArea: { $min: '$totalArea' },
          maxArea: { $max: '$totalArea' },
          avgArea: { $avg: '$totalArea' },
          minPrice: { $min: '$standardBasePrice' },
          maxPrice: { $max: '$standardBasePrice' },
          avgPrice: { $avg: '$standardBasePrice' },
          totalArea: { $sum: '$totalArea' },
          totalValue: { $sum: '$standardBasePrice' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return stats;
  },
};
