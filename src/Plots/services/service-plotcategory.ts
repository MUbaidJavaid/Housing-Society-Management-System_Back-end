import { Types } from 'mongoose';
import PlotCategory from '../models/models-plotcategory';
import {
  BulkPriceCalculationDto,
  CreatePlotCategoryDto,
  PlotCategoryQueryParams,
  PriceCalculationDto,
  SurchargeInfo,
  UpdatePlotCategoryDto,
} from '../types/types-plotcategory';

export const plotCategoryService = {
  /**
   * Create new plot category
   */
  async createPlotCategory(data: CreatePlotCategoryDto, userId: Types.ObjectId): Promise<any> {
    // Validate surcharge exclusivity
    if (data.surchargePercentage && data.surchargeFixedAmount) {
      throw new Error('Cannot have both percentage and fixed amount surcharge');
    }

    // Set default values
    const categoryData = {
      ...data,
      surchargePercentage: data.surchargePercentage || 0,
      surchargeFixedAmount: data.surchargeFixedAmount || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: userId,
      updatedBy: userId,
    };

    const plotCategory = await PlotCategory.create(categoryData);
    return plotCategory;
  },

  /**
   * Get plot category by ID
   */
  async getPlotCategoryById(id: string): Promise<any | null> {
    const plotCategory = await PlotCategory.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!plotCategory) return null;
    return plotCategory.toObject();
  },

  /**
   * Get all plot categories with pagination
   */
  async getPlotCategories(params: PlotCategoryQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'categoryName',
      sortOrder = 'asc',
      isActive,
      surchargeType,
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search by name or description
    if (search) {
      query.$or = [
        { categoryName: { $regex: search, $options: 'i' } },
        { categoryDesc: { $regex: search, $options: 'i' } },
      ];
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Surcharge type filter
    if (surchargeType) {
      if (surchargeType === 'percentage') {
        query.surchargePercentage = { $gt: 0 };
        query.surchargeFixedAmount = 0;
      } else if (surchargeType === 'fixed') {
        query.surchargeFixedAmount = { $gt: 0 };
        query.surchargePercentage = 0;
      } else if (surchargeType === 'none') {
        query.surchargePercentage = 0;
        query.surchargeFixedAmount = 0;
      }
    }

    // Execute queries
    const [plotCategories, total] = await Promise.all([
      PlotCategory.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      PlotCategory.countDocuments(query),
    ]);

    const activeCount = plotCategories.filter(cat => cat.isActive).length;

    const percentageSurchargeCount = plotCategories.filter(
      cat => (cat.surchargePercentage ?? 0) > 0
    ).length;

    const fixedSurchargeCount = plotCategories.filter(
      cat => (cat.surchargeFixedAmount ?? 0) > 0
    ).length;

    return {
      plotCategories,
      summary: {
        total,
        activeCount,
        inactiveCount: total - activeCount,
        percentageSurchargeCount,
        fixedSurchargeCount,
        noSurchargeCount: total - percentageSurchargeCount - fixedSurchargeCount,
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
   * Update plot category
   */
  async updatePlotCategory(
    id: string,
    data: UpdatePlotCategoryDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    // Validate surcharge exclusivity if both are being updated
    if (data.surchargePercentage !== undefined && data.surchargeFixedAmount !== undefined) {
      if (data.surchargePercentage > 0 && data.surchargeFixedAmount > 0) {
        throw new Error('Cannot have both percentage and fixed amount surcharge');
      }
    }

    const plotCategory = await PlotCategory.findByIdAndUpdate(
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

    if (!plotCategory) return null;
    return plotCategory.toObject();
  },

  /**
   * Delete plot category (soft delete)
   */
  async deletePlotCategory(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await PlotCategory.findByIdAndUpdate(
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
   * Check if plot category exists
   */
  async checkPlotCategoryExists(categoryName: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await PlotCategory.countDocuments(query);
    return count > 0;
  },

  /**
   * Get active plot categories
   */
  async getActivePlotCategories(): Promise<any[]> {
    const plotCategories = await PlotCategory.find({
      isActive: true,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ categoryName: 1 });

    return plotCategories.map(cat => cat.toObject());
  },

  /**
   * Calculate price with category surcharge
   */
  async calculatePriceWithSurcharge(data: PriceCalculationDto): Promise<SurchargeInfo> {
    const plotCategory = await PlotCategory.findById(data.categoryId);

    if (!plotCategory || plotCategory.isDeleted || !plotCategory.isActive) {
      throw new Error('Plot category not found or inactive');
    }

    let surchargeAmount = 0;
    let finalPrice = data.basePrice;
    let type: 'percentage' | 'fixed' | 'none' = 'none';
    let value = 0;
    const percentage = plotCategory.surchargePercentage ?? 0;
    const fixed = plotCategory.surchargeFixedAmount ?? 0;

    if (percentage > 0) {
      type = 'percentage';
      value = percentage; // use local variable
      surchargeAmount = (data.basePrice * percentage) / 100;
      finalPrice = data.basePrice + surchargeAmount;
    } else if (fixed > 0) {
      type = 'fixed';
      value = fixed; // use local variable
      surchargeAmount = fixed;
      finalPrice = data.basePrice + surchargeAmount;
    } else {
      type = 'none';
      value = 0;
      surchargeAmount = 0;
      finalPrice = data.basePrice;
    }

    return {
      type,
      value,
      formattedValue:
        type === 'percentage'
          ? `${value}%`
          : new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'PKR',
            }).format(value),
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      surchargeAmount: parseFloat(surchargeAmount.toFixed(2)),
    };
  },

  /**
   * Calculate prices for multiple categories
   */
  async calculateBulkPrices(data: BulkPriceCalculationDto): Promise<Record<string, SurchargeInfo>> {
    const plotCategories = await PlotCategory.find({
      _id: { $in: data.categoryIds.map(id => new Types.ObjectId(id)) },
      isActive: true,
      isDeleted: false,
    });

    const results: Record<string, SurchargeInfo> = {};

    for (const category of plotCategories) {
      let surchargeAmount = 0;
      let finalPrice = data.basePrice;
      let type: 'percentage' | 'fixed' | 'none' = 'none';
      let value = 0;

      const percentage = category.surchargePercentage ?? 0;
      const fixed = category.surchargeFixedAmount ?? 0;

      if (percentage > 0) {
        type = 'percentage';
        value = percentage;
        surchargeAmount = (data.basePrice * percentage) / 100;
        finalPrice = data.basePrice + surchargeAmount;
      } else if (fixed > 0) {
        type = 'fixed';
        value = fixed;
        surchargeAmount = fixed;
        finalPrice = data.basePrice + surchargeAmount;
      } else {
        type = 'none';
        value = 0;
        surchargeAmount = 0;
        finalPrice = data.basePrice;
      }

      results[category._id.toString()] = {
        type,
        value,
        formattedValue:
          type === 'percentage'
            ? `${value}%`
            : new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'PKR',
              }).format(value),
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        surchargeAmount: parseFloat(surchargeAmount.toFixed(2)),
      };
    }

    return results;
  },

  /**
   * Toggle category active status
   */
  async toggleCategoryStatus(id: string, userId: Types.ObjectId): Promise<any | null> {
    const plotCategory = await PlotCategory.findById(id);

    if (!plotCategory) return null;

    const updatedCategory = await PlotCategory.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !plotCategory.isActive,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return updatedCategory?.toObject();
  },

  /**
   * Get categories by surcharge type
   */
  async getCategoriesBySurchargeType(type: 'percentage' | 'fixed' | 'none'): Promise<any[]> {
    const query: any = { isDeleted: false, isActive: true };

    if (type === 'percentage') {
      query.surchargePercentage = { $gt: 0 };
      query.surchargeFixedAmount = 0;
    } else if (type === 'fixed') {
      query.surchargeFixedAmount = { $gt: 0 };
      query.surchargePercentage = 0;
    } else {
      query.surchargePercentage = 0;
      query.surchargeFixedAmount = 0;
    }

    const plotCategories = await PlotCategory.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ categoryName: 1 });

    return plotCategories.map(cat => cat.toObject());
  },

  /**
   * Get category statistics
   */
  async getCategoryStatistics(): Promise<any> {
    const stats = await PlotCategory.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          percentageSurchargeCount: {
            $sum: { $cond: [{ $gt: ['$surchargePercentage', 0] }, 1, 0] },
          },
          fixedSurchargeCount: {
            $sum: { $cond: [{ $gt: ['$surchargeFixedAmount', 0] }, 1, 0] },
          },
          avgPercentageSurcharge: { $avg: '$surchargePercentage' },
          avgFixedSurcharge: { $avg: '$surchargeFixedAmount' },
        },
      },
    ]);

    return (
      stats[0] || {
        totalCategories: 0,
        activeCategories: 0,
        percentageSurchargeCount: 0,
        fixedSurchargeCount: 0,
        avgPercentageSurcharge: 0,
        avgFixedSurcharge: 0,
      }
    );
  },

  /**
   * Update surcharge for multiple categories
   */
  async bulkUpdateSurcharge(
    categoryIds: string[],
    userId: Types.ObjectId,
    surchargePercentage?: number,
    surchargeFixedAmount?: number
  ): Promise<any> {
    if (surchargePercentage && surchargeFixedAmount) {
      throw new Error('Cannot set both percentage and fixed amount surcharge');
    }

    const updateData: any = { updatedBy: userId };

    if (surchargePercentage !== undefined) {
      updateData.surchargePercentage = surchargePercentage;
      updateData.surchargeFixedAmount = 0;
    }

    if (surchargeFixedAmount !== undefined) {
      updateData.surchargeFixedAmount = surchargeFixedAmount;
      updateData.surchargePercentage = 0;
    }

    const result = await PlotCategory.updateMany(
      {
        _id: { $in: categoryIds.map(id => new Types.ObjectId(id)) },
        isDeleted: false,
      },
      { $set: updateData }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },
};
