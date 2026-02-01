import { Types } from 'mongoose';
import SrComplaintCategory from '../models/models-srcomplaintcategory';
import {
  BulkStatusUpdateDto,
  CategoryDropdownItem,
  CategoryStatistics,
  CreateSrComplaintCategoryDto,
  GetSrComplaintCategoriesResult,
  ImportCategoriesResult,
  SrComplaintCategoryQueryParams,
  SrComplaintCategoryType,
  UpdateSrComplaintCategoryDto,
} from '../types/types-srcomplaintcategory';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): SrComplaintCategoryType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as SrComplaintCategoryType;
};

export const srComplaintCategoryService = {
  /**
   * Create new complaint category
   */
  async createSrComplaintCategory(
    data: CreateSrComplaintCategoryDto,
    userId: Types.ObjectId
  ): Promise<SrComplaintCategoryType> {
    // Check if category code already exists
    const existingCode = await SrComplaintCategory.findOne({
      categoryCode: data.categoryCode.toUpperCase(),
      isDeleted: false,
    });

    if (existingCode) {
      throw new Error(`Complaint Category with code ${data.categoryCode} already exists`);
    }

    // Check if category name already exists
    const existingName = await SrComplaintCategory.findOne({
      categoryName: { $regex: new RegExp(`^${data.categoryName}$`, 'i') },
      isDeleted: false,
    });

    if (existingName) {
      throw new Error(`Complaint Category with name ${data.categoryName} already exists`);
    }

    const categoryData = {
      ...data,
      categoryCode: data.categoryCode.toUpperCase(),
      priorityLevel: data.priorityLevel || 5,
      slaHours: data.slaHours || 72,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: userId,
      updatedBy: userId,
    };

    const complaintCategory = await SrComplaintCategory.create(categoryData);
    return toPlainObject(complaintCategory);
  },

  /**
   * Get complaint category by ID
   */
  async getSrComplaintCategoryById(id: string): Promise<SrComplaintCategoryType | null> {
    try {
      const complaintCategory = await SrComplaintCategory.findById(id)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      if (!complaintCategory) return null;
      return toPlainObject(complaintCategory);
    } catch (error) {
      throw new Error('Invalid complaint category ID');
    }
  },

  /**
   * Get complaint category by code
   */
  async getSrComplaintCategoryByCode(
    categoryCode: string
  ): Promise<SrComplaintCategoryType | null> {
    const complaintCategory = await SrComplaintCategory.findOne({
      categoryCode: categoryCode.toUpperCase(),
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!complaintCategory) return null;
    return toPlainObject(complaintCategory);
  },

  /**
   * Get all complaint categories with pagination
   */
  async getSrComplaintCategories(
    params: SrComplaintCategoryQueryParams
  ): Promise<GetSrComplaintCategoriesResult> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'priorityLevel',
      sortOrder = 'asc',
      isActive,
      minPriority,
      maxPriority,
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search by name or code
    if (search) {
      query.$or = [
        { categoryName: { $regex: search, $options: 'i' } },
        { categoryCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Priority range filter
    if (minPriority !== undefined || maxPriority !== undefined) {
      query.priorityLevel = {};
      if (minPriority !== undefined) query.priorityLevel.$gte = minPriority;
      if (maxPriority !== undefined) query.priorityLevel.$lte = maxPriority;
    }

    // Execute queries
    const [complaintCategories, total] = await Promise.all([
      SrComplaintCategory.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      SrComplaintCategory.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = {
      totalCategories: complaintCategories.length,
      activeCategories: complaintCategories.filter(cat => cat.isActive).length,
      byPriority: {} as Record<number, number>,
    };

    // Initialize priority counters
    for (let i = 1; i <= 10; i++) {
      summary.byPriority[i] = 0;
    }

    // Count categories by priority
    complaintCategories.forEach(category => {
      summary.byPriority[category.priorityLevel] =
        (summary.byPriority[category.priorityLevel] || 0) + 1;
    });

    return {
      complaintCategories,
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
   * Update complaint category
   */
  async updateSrComplaintCategory(
    id: string,
    data: UpdateSrComplaintCategoryDto,
    userId: Types.ObjectId
  ): Promise<SrComplaintCategoryType | null> {
    // Check if category code is being updated and if it already exists
    if (data.categoryCode) {
      const existingCode = await SrComplaintCategory.findOne({
        categoryCode: data.categoryCode.toUpperCase(),
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingCode) {
        throw new Error(`Complaint Category with code ${data.categoryCode} already exists`);
      }
    }

    // Check if category name is being updated and if it already exists
    if (data.categoryName) {
      const existingName = await SrComplaintCategory.findOne({
        categoryName: { $regex: new RegExp(`^${data.categoryName}$`, 'i') },
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingName) {
        throw new Error(`Complaint Category with name ${data.categoryName} already exists`);
      }
    }

    const updateObj: any = {
      ...data,
      updatedBy: userId,
    };

    // Convert category code to uppercase if provided
    if (data.categoryCode) {
      updateObj.categoryCode = data.categoryCode.toUpperCase();
    }

    const complaintCategory = await SrComplaintCategory.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!complaintCategory) return null;
    return toPlainObject(complaintCategory);
  },

  /**
   * Delete complaint category (soft delete)
   */
  async deleteSrComplaintCategory(id: string, userId: Types.ObjectId): Promise<boolean> {
    // Check if category exists and is not deleted
    const existingCategory = await SrComplaintCategory.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existingCategory) {
      throw new Error('Complaint Category not found or already deleted');
    }

    // Check if category is in use (you can uncomment this when you have a Complaints model)
    // const inUse = await Complaint.countDocuments({ categoryId: id });
    // if (inUse > 0) {
    //   throw new Error('Cannot delete category that is in use');
    // }

    const result = await SrComplaintCategory.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          updatedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Get active complaint categories
   */
  async getActiveSrComplaintCategories(): Promise<SrComplaintCategoryType[]> {
    const complaintCategories = await SrComplaintCategory.find({
      isActive: true,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ priorityLevel: 1, categoryName: 1 });

    return complaintCategories.map(cat => toPlainObject(cat));
  },

  /**
   * Get categories by priority range
   */
  async getCategoriesByPriority(
    minPriority: number,
    maxPriority: number
  ): Promise<SrComplaintCategoryType[]> {
    if (minPriority < 1 || minPriority > 10 || maxPriority < 1 || maxPriority > 10) {
      throw new Error('Priority must be between 1 and 10');
    }

    if (minPriority > maxPriority) {
      throw new Error('Minimum priority cannot be greater than maximum priority');
    }

    const complaintCategories = await SrComplaintCategory.find({
      priorityLevel: { $gte: minPriority, $lte: maxPriority },
      isActive: true,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ priorityLevel: 1 });

    return complaintCategories.map(cat => toPlainObject(cat));
  },

  /**
   * Toggle category active status
   */
  async toggleCategoryStatus(
    id: string,
    userId: Types.ObjectId
  ): Promise<SrComplaintCategoryType | null> {
    const complaintCategory = await SrComplaintCategory.findById(id);

    if (!complaintCategory || complaintCategory.isDeleted) {
      throw new Error('Complaint Category not found');
    }

    const updatedCategory = await SrComplaintCategory.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !complaintCategory.isActive,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return updatedCategory ? toPlainObject(updatedCategory) : null;
  },

  /**
   * Bulk update category statuses
   */
  async bulkUpdateCategoryStatus(
    data: BulkStatusUpdateDto,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    if (!data.categoryIds || !Array.isArray(data.categoryIds) || data.categoryIds.length === 0) {
      throw new Error('Category IDs must be a non-empty array');
    }

    const objectIds = data.categoryIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid category ID: ${id}`);
      }
    });

    const result = await SrComplaintCategory.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
      },
      {
        $set: {
          isActive: data.isActive,
          updatedBy: userId,
        },
      }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },

  /**
   * Get complaint category statistics
   */
  async getSrComplaintCategoryStatistics(): Promise<CategoryStatistics> {
    const stats = await SrComplaintCategory.aggregate([
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
          avgPriorityLevel: { $avg: '$priorityLevel' },
          avgSlaHours: { $avg: '$slaHours' },
        },
      },
    ]);

    const priorityStats = await SrComplaintCategory.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: '$priorityLevel',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const baseStats = stats[0] || {
      totalCategories: 0,
      activeCategories: 0,
      avgPriorityLevel: 0,
      avgSlaHours: 0,
    };

    const byPriority: Record<number, { total: number; active: number }> = {};
    priorityStats.forEach(stat => {
      byPriority[stat._id] = { total: stat.count, active: stat.activeCount };
    });

    return {
      ...baseStats,
      byPriority,
    };
  },

  /**
   * Get high priority categories (priority 1-3)
   */
  async getHighPriorityCategories(): Promise<SrComplaintCategoryType[]> {
    const complaintCategories = await SrComplaintCategory.find({
      priorityLevel: { $gte: 1, $lte: 3 },
      isActive: true,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ priorityLevel: 1 });

    return complaintCategories.map(cat => toPlainObject(cat));
  },

  /**
   * Get categories with SLA less than 24 hours
   */
  async getUrgentSlaCategories(): Promise<SrComplaintCategoryType[]> {
    const complaintCategories = await SrComplaintCategory.find({
      slaHours: { $lt: 24 },
      isActive: true,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ slaHours: 1 });

    return complaintCategories.map(cat => toPlainObject(cat));
  },

  /**
   * Validate category data
   */
  validateCategoryData(
    data: CreateSrComplaintCategoryDto | UpdateSrComplaintCategoryDto
  ): string[] {
    const errors: string[] = [];

    if ('categoryName' in data && data.categoryName !== undefined) {
      if (!data.categoryName || data.categoryName.trim().length < 2) {
        errors.push('Category Name must be at least 2 characters');
      }
      if (data.categoryName.trim().length > 100) {
        errors.push('Category Name cannot exceed 100 characters');
      }
    }

    if ('categoryCode' in data && data.categoryCode !== undefined) {
      if (!data.categoryCode || data.categoryCode.trim().length < 2) {
        errors.push('Category Code must be at least 2 characters');
      }
      if (data.categoryCode.trim().length > 20) {
        errors.push('Category Code cannot exceed 20 characters');
      }
      if (!/^[A-Z0-9]+$/.test(data.categoryCode.toUpperCase())) {
        errors.push('Category Code must contain only uppercase letters and numbers');
      }
    }

    if ('priorityLevel' in data && data.priorityLevel !== undefined) {
      if (data.priorityLevel < 1 || data.priorityLevel > 10) {
        errors.push('Priority Level must be between 1 and 10');
      }
    }

    if ('slaHours' in data && data.slaHours !== undefined) {
      if (data.slaHours < 1) {
        errors.push('SLA Hours must be at least 1');
      }
    }

    if ('escalationLevels' in data && data.escalationLevels) {
      data.escalationLevels.forEach((level, index) => {
        if (level.level < 1 || level.level > 5) {
          errors.push(`Escalation level ${index + 1}: Level must be between 1 and 5`);
        }
        if (!level.role?.trim()) {
          errors.push(`Escalation level ${index + 1}: Role is required`);
        }
        if (level.hoursAfterCreation < 1) {
          errors.push(`Escalation level ${index + 1}: Hours must be at least 1`);
        }
      });
    }

    return errors;
  },

  /**
   * Search categories with advanced filters
   */
  async searchCategories(
    searchTerm?: string,
    isActive?: boolean,
    minPriority?: number,
    maxPriority?: number,
    minSlaHours?: number,
    maxSlaHours?: number
  ): Promise<SrComplaintCategoryType[]> {
    const query: any = { isDeleted: false };

    if (searchTerm) {
      query.$or = [
        { categoryName: { $regex: searchTerm, $options: 'i' } },
        { categoryCode: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (minPriority !== undefined || maxPriority !== undefined) {
      query.priorityLevel = {};
      if (minPriority !== undefined) query.priorityLevel.$gte = minPriority;
      if (maxPriority !== undefined) query.priorityLevel.$lte = maxPriority;
    }

    if (minSlaHours !== undefined || maxSlaHours !== undefined) {
      query.slaHours = {};
      if (minSlaHours !== undefined) query.slaHours.$gte = minSlaHours;
      if (maxSlaHours !== undefined) query.slaHours.$lte = maxSlaHours;
    }

    const complaintCategories = await SrComplaintCategory.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ priorityLevel: 1, categoryName: 1 })
      .limit(100);

    return complaintCategories.map(cat => toPlainObject(cat));
  },

  /**
   * Get categories for dropdown (simplified format)
   */
  async getCategoriesForDropdown(): Promise<CategoryDropdownItem[]> {
    const categories = await SrComplaintCategory.find({
      isActive: true,
      isDeleted: false,
    })
      .select('_id categoryName categoryCode priorityLevel')
      .sort({ priorityLevel: 1, categoryName: 1 });

    return categories.map(cat => ({
      value: cat._id.toString(),
      label: `${cat.categoryName} (${cat.categoryCode})`,
      priority: cat.priorityLevel,
    }));
  },

  /**
   * Import multiple categories
   */
  async importCategories(
    categories: CreateSrComplaintCategoryDto[],
    userId: Types.ObjectId
  ): Promise<ImportCategoriesResult> {
    const errors: string[] = [];
    const successful: SrComplaintCategoryType[] = [];

    for (const [index, category] of categories.entries()) {
      try {
        // Validate category
        const validationErrors = this.validateCategoryData(category);
        if (validationErrors.length > 0) {
          errors.push(`Row ${index + 1}: ${validationErrors.join(', ')}`);
          continue;
        }

        // Check for duplicates
        const existingCode = await SrComplaintCategory.findOne({
          categoryCode: category.categoryCode.toUpperCase(),
          isDeleted: false,
        });

        const existingName = await SrComplaintCategory.findOne({
          categoryName: { $regex: new RegExp(`^${category.categoryName}$`, 'i') },
          isDeleted: false,
        });

        if (existingCode || existingName) {
          errors.push(`Row ${index + 1}: Category already exists`);
          continue;
        }

        // Create category
        const createdCategory = await this.createSrComplaintCategory(category, userId);
        successful.push(createdCategory);
      } catch (error: any) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    return {
      success: successful.length,
      failed: categories.length - successful.length,
      errors,
    };
  },

  /**
   * Check if category exists by name and code
   */
  async checkCategoryExists(
    categoryName: string,
    categoryCode: string,
    excludeId?: string
  ): Promise<boolean> {
    const query: any = {
      $or: [
        { categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') } },
        { categoryCode: categoryCode.toUpperCase() },
      ],
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await SrComplaintCategory.countDocuments(query);
    return count > 0;
  },

  /**
   * Get categories with SLAs for escalation monitoring
   */
  async getCategoriesWithSlaForMonitoring(): Promise<
    Array<SrComplaintCategoryType & { escalationInfo: string }>
  > {
    const categories = await SrComplaintCategory.find({
      isActive: true,
      isDeleted: false,
      slaHours: { $exists: true, $ne: null },
    })
      .select('categoryName categoryCode slaHours escalationLevels priorityLevel')
      .sort({ slaHours: 1 });

    return categories.map(cat => {
      const categoryObj = toPlainObject(cat);
      return {
        ...categoryObj,
        escalationInfo: categoryObj.escalationLevels
          ? `${categoryObj.escalationLevels.length} escalation levels`
          : 'No escalation levels',
      };
    });
  },

  /**
   * Get category priority distribution
   */
  async getPriorityDistribution(): Promise<
    Array<{ priority: number; label: string; count: number; active: number }>
  > {
    const distribution = await SrComplaintCategory.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: '$priorityLevel',
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const priorityLabels: Record<number, string> = {
      1: 'Critical',
      2: 'High',
      3: 'High',
      4: 'Medium',
      5: 'Medium',
      6: 'Medium',
      7: 'Low',
      8: 'Low',
      9: 'Very Low',
      10: 'Very Low',
    };

    return distribution.map(item => ({
      priority: item._id,
      label: priorityLabels[item._id] || 'Unknown',
      count: item.total,
      active: item.active,
    }));
  },

  /**
   * Get categories by SLA range
   */
  async getCategoriesBySlaRange(
    minHours: number,
    maxHours: number
  ): Promise<SrComplaintCategoryType[]> {
    const categories = await SrComplaintCategory.find({
      slaHours: { $gte: minHours, $lte: maxHours },
      isActive: true,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ slaHours: 1 });

    return categories.map(cat => toPlainObject(cat));
  },

  /**
   * Restore deleted category
   */
  async restoreCategory(
    id: string,
    userId: Types.ObjectId
  ): Promise<SrComplaintCategoryType | null> {
    const category = await SrComplaintCategory.findOneAndUpdate(
      { _id: id, isDeleted: true },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          updatedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return category ? toPlainObject(category) : null;
  },

  /**
   * Get recently created categories
   */
  async getRecentlyCreatedCategories(limit: number = 10): Promise<SrComplaintCategoryType[]> {
    const categories = await SrComplaintCategory.find({
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit);

    return categories.map(cat => toPlainObject(cat));
  },

  /**
   * Get categories count by status
   */
  async getCountByStatus(): Promise<{
    active: number;
    inactive: number;
    total: number;
    deleted: number;
  }> {
    const [active, inactive, total, deleted] = await Promise.all([
      SrComplaintCategory.countDocuments({ isActive: true, isDeleted: false }),
      SrComplaintCategory.countDocuments({ isActive: false, isDeleted: false }),
      SrComplaintCategory.countDocuments({ isDeleted: false }),
      SrComplaintCategory.countDocuments({ isDeleted: true }),
    ]);

    return {
      active,
      inactive,
      total,
      deleted,
    };
  },

  /**
   * Get categories with upcoming SLA deadlines (for monitoring)
   */
  async getCategoriesWithUpcomingSlaDeadlines(): Promise<
    Array<{
      category: SrComplaintCategoryType;
      urgency: 'Critical' | 'High' | 'Medium' | 'Low';
      hoursLeft: number;
    }>
  > {
    const categories = await SrComplaintCategory.find({
      isActive: true,
      isDeleted: false,
      slaHours: { $exists: true, $ne: null },
    })
      .select('categoryName categoryCode slaHours priorityLevel')
      .sort({ slaHours: 1 });

    return categories.map(cat => {
      const categoryObj = toPlainObject(cat);
      const slaHours = categoryObj.slaHours || 72;
      let urgency: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';

      if (slaHours <= 24) urgency = 'Critical';
      else if (slaHours <= 48) urgency = 'High';
      else if (slaHours <= 72) urgency = 'Medium';
      else urgency = 'Low';

      return {
        category: categoryObj,
        urgency,
        hoursLeft: slaHours,
      };
    });
  },
};
