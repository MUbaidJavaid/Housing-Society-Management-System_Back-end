import { Types } from 'mongoose';
import AnnouncementCategory from '../models/models-announcementcategory';
import {
  AnnouncementCategoryQueryParams,
  AnnouncementCategoryStatistics,
  AnnouncementCategoryType,
  CreateAnnouncementCategoryDto,
  GetAnnouncementCategoriesResult,
  UpdateAnnouncementCategoryDto,
} from '../types/types-announcementcategory';
import Announcement from '../models/models-announcement';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): AnnouncementCategoryType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as AnnouncementCategoryType;
};

export const announcementCategoryService = {
  /**
   * Create new announcement category
   */
  async createAnnouncementCategory(
    data: CreateAnnouncementCategoryDto,
    userId: Types.ObjectId
  ): Promise<AnnouncementCategoryType> {
    // Check if category name already exists (case-insensitive)
    const existingCategory = await AnnouncementCategory.findOne({
      categoryName: { $regex: new RegExp(`^${data.categoryName}$`, 'i') },
      isDeleted: false,
    });

    if (existingCategory) {
      throw new Error('Category name already exists');
    }

    const categoryData = {
      ...data,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isSystem: false,
      priority: data.priority || 0,
      createdBy: userId,
      updatedBy: userId,
    };

    const announcementCategory = await AnnouncementCategory.create(categoryData);

    // Populate and return the created category
    const createdCategory = await AnnouncementCategory.findById(announcementCategory._id)
      .populate('createdBy', 'userName fullName')
      .populate('updatedBy', 'userName fullName');

    if (!createdCategory) {
      throw new Error('Failed to create category');
    }

    return toPlainObject(createdCategory);
  },

  /**
   * Get announcement category by ID
   */
  async getAnnouncementCategoryById(id: string): Promise<AnnouncementCategoryType> {
    try {
      const category = await AnnouncementCategory.findById(id)
        .populate('createdBy', 'userName fullName email')
        .populate('updatedBy', 'userName fullName email');

      if (!category || category.isDeleted) {
        throw new Error('Category not found');
      }

      return toPlainObject(category);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid category ID');
    }
  },

  /**
   * Find category by ID (returns null if not found)
   */
  async findAnnouncementCategoryById(id: string): Promise<AnnouncementCategoryType | null> {
    try {
      const category = await AnnouncementCategory.findById(id);

      if (!category || category.isDeleted) return null;
      return toPlainObject(category);
    } catch (error) {
      return null;
    }
  },

  /**
   * Find category by name (case-insensitive)
   */
  async findCategoryByName(categoryName: string): Promise<AnnouncementCategoryType | null> {
    const category = await AnnouncementCategory.findOne({
      categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') },
      isDeleted: false,
    });

    if (!category) return null;
    return toPlainObject(category);
  },

  /**
   * Get category by name
   */
  async getCategoryByName(categoryName: string): Promise<AnnouncementCategoryType | null> {
    const category = await AnnouncementCategory.findOne({
      categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') },
      isDeleted: false,
    })
      .populate('createdBy', 'userName fullName')
      .populate('updatedBy', 'userName fullName');

    if (!category) return null;
    return toPlainObject(category);
  },

  /**
   * Get all announcement categories with pagination
   */
  async getAnnouncementCategories(
    params: AnnouncementCategoryQueryParams
  ): Promise<GetAnnouncementCategoriesResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      isActive,
      sortBy = 'priority',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search
    if (search) {
      query.$or = [
        { categoryName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Execute queries
    const [announcementCategories, total] = await Promise.all([
      AnnouncementCategory.find(query)
        .populate('createdBy', 'userName fullName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      AnnouncementCategory.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = {
      totalCategories: announcementCategories.length,
      activeCategories: announcementCategories.filter(cat => cat.isActive).length,
      systemCategories: announcementCategories.filter(cat => cat.isSystem).length,
    };

    return {
      announcementCategories,
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
   * Update announcement category
   */
  async updateAnnouncementCategory(
    id: string,
    data: UpdateAnnouncementCategoryDto,
    userId: Types.ObjectId
  ): Promise<AnnouncementCategoryType | null> {
    // Check if category exists
    const existingCategory = await AnnouncementCategory.findById(id);
    if (!existingCategory || existingCategory.isDeleted) {
      throw new Error('Category not found');
    }

    // Prevent modification of system categories for non-system fields
    if (existingCategory.isSystem) {
      const restrictedFields = ['categoryName', 'isSystem', 'priority'];
      const hasRestrictedUpdate = Object.keys(data).some(field => restrictedFields.includes(field));

      if (hasRestrictedUpdate) {
        throw new Error('Cannot modify system category properties');
      }
    }

    // If category name is being updated, check for duplicates (case-insensitive)
    if (data.categoryName && data.categoryName !== existingCategory.categoryName) {
      const duplicateCategory = await AnnouncementCategory.findOne({
        categoryName: { $regex: new RegExp(`^${data.categoryName}$`, 'i') },
        isDeleted: false,
        _id: { $ne: id },
      });

      if (duplicateCategory) {
        throw new Error('Category name already exists');
      }
    }

    const updateObj: any = {
      ...data,
      updatedBy: userId,
    };

    const category = await AnnouncementCategory.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'userName fullName')
      .populate('updatedBy', 'userName fullName');

    return category ? toPlainObject(category) : null;
  },

  /**
   * Delete announcement category (soft delete)
   */
  async deleteAnnouncementCategory(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingCategory = await AnnouncementCategory.findById(id);
    if (!existingCategory || existingCategory.isDeleted) {
      throw new Error('Category not found');
    }

    // Prevent deletion of system categories
    if (existingCategory.isSystem) {
      throw new Error('Cannot delete system categories');
    }

    const result = await AnnouncementCategory.findByIdAndUpdate(
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
   * Get active categories
   */
  async getActiveCategories(): Promise<AnnouncementCategoryType[]> {
    const categories = await AnnouncementCategory.find({
      isActive: true,
      isDeleted: false,
    })
      .select('_id categoryName description icon color priority isSystem')
      .sort({ priority: -1, categoryName: 1 });

    return categories.map(category => toPlainObject(category));
  },

  /**
   * Search categories
   */
  async searchCategories(
    searchTerm: string,
    limit: number = 10
  ): Promise<AnnouncementCategoryType[]> {
    const categories = await AnnouncementCategory.find({
      $or: [
        { categoryName: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ],
      isDeleted: false,
      isActive: true,
    })
      .select('_id categoryName description icon color priority')
      .limit(limit)
      .sort({ priority: -1, categoryName: 1 });

    return categories.map(category => toPlainObject(category));
  },

  /**
   * Get categories with announcement count
   */
  async getCategoriesWithAnnouncementCount(): Promise<any[]> {
    const categories = await AnnouncementCategory.aggregate([
      {
        $match: {
          isDeleted: false,
          isActive: true,
        },
      },
      {
        $lookup: {
          from: 'announcements',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$categoryId', '$$categoryId'] },
                    { $eq: ['$isDeleted', false] },
                    { $eq: ['$isActive', true] },
                  ],
                },
              },
            },
            {
              $count: 'count',
            },
          ],
          as: 'announcementCountInfo',
        },
      },
      {
        $addFields: {
          announcementCount: {
            $ifNull: [{ $arrayElemAt: ['$announcementCountInfo.count', 0] }, 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          categoryName: 1,
          description: 1,
          icon: 1,
          color: 1,
          priority: 1,
          isSystem: 1,
          announcementCount: 1,
          createdAt: 1,
        },
      },
      {
        $sort: { priority: -1, categoryName: 1 },
      },
    ]);

    return categories;
  },

  /**
   * Bulk update categories
   */
  async bulkUpdateCategories(
    categoryIds: string[],
    isActive: boolean,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new Error('Category IDs must be a non-empty array');
    }

    const objectIds = categoryIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid category ID: ${id}`);
      }
    });

    // Check if any of the categories are system categories
    const systemCategories = await AnnouncementCategory.find({
      _id: { $in: objectIds },
      isSystem: true,
    });

    if (systemCategories.length > 0) {
      throw new Error('Cannot modify status of system categories');
    }

    const result = await AnnouncementCategory.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
      },
      {
        $set: {
          isActive,
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
   * Check if category is used by announcements
   */
  async isCategoryUsedByAnnouncements(categoryId: string): Promise<boolean> {
    try {
      // Assuming you have an Announcement model

      const announcementCount = await Announcement.countDocuments({
        categoryId: new Types.ObjectId(categoryId),
        isDeleted: false,
        isActive: true,
      });

      return announcementCount > 0;
    } catch (error) {
      return false;
    }
  },

  /**
   * Toggle category status
   */
  async toggleCategoryStatus(
    id: string,
    userId: Types.ObjectId
  ): Promise<AnnouncementCategoryType | null> {
    const category = await AnnouncementCategory.findById(id);

    if (!category || category.isDeleted) {
      throw new Error('Category not found');
    }

    // Prevent toggling system categories
    if (category.isSystem) {
      throw new Error('Cannot modify status of system categories');
    }

    const updatedCategory = await AnnouncementCategory.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !category.isActive,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('createdBy', 'userName fullName')
      .populate('updatedBy', 'userName fullName');

    return updatedCategory ? toPlainObject(updatedCategory) : null;
  },

  /**
   * Get announcement category statistics
   */
  async getAnnouncementCategoryStatistics(): Promise<AnnouncementCategoryStatistics> {
    const stats = await AnnouncementCategory.aggregate([
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
          systemCategories: {
            $sum: { $cond: [{ $eq: ['$isSystem', true] }, 1, 0] },
          },
          averagePriority: { $avg: '$priority' },
          maxPriority: { $max: '$priority' },
          minPriority: { $min: '$priority' },
        },
      },
    ]);

    const announcementStats = await AnnouncementCategory.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $lookup: {
          from: 'announcements',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$categoryId', '$$categoryId'] },
                    { $eq: ['$isDeleted', false] },
                    { $eq: ['$isActive', true] },
                  ],
                },
              },
            },
            {
              $count: 'count',
            },
          ],
          as: 'announcementCountInfo',
        },
      },
      {
        $addFields: {
          announcementCount: {
            $ifNull: [{ $arrayElemAt: ['$announcementCountInfo.count', 0] }, 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAnnouncements: { $sum: '$announcementCount' },
          categoriesWithAnnouncements: {
            $sum: { $cond: [{ $gt: ['$announcementCount', 0] }, 1, 0] },
          },
          maxAnnouncementsPerCategory: { $max: '$announcementCount' },
        },
      },
    ]);

    const colorDistribution = await AnnouncementCategory.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $group: {
          _id: '$color',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const monthlyStats = await AnnouncementCategory.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $limit: 12,
      },
    ]);

    const baseStats = stats[0] || {
      totalCategories: 0,
      activeCategories: 0,
      systemCategories: 0,
      averagePriority: 0,
      maxPriority: 0,
      minPriority: 0,
    };

    const announcementData = announcementStats[0] || {
      totalAnnouncements: 0,
      categoriesWithAnnouncements: 0,
      maxAnnouncementsPerCategory: 0,
    };

    const byColor: Record<string, number> = {};
    colorDistribution.forEach(item => {
      byColor[item._id] = item.count;
    });

    const monthlyGrowth = monthlyStats.map(stat => ({
      month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
      count: stat.count,
    }));

    return {
      ...baseStats,
      inactiveCategories: baseStats.totalCategories - baseStats.activeCategories,
      categoriesWithoutAnnouncements:
        baseStats.activeCategories - announcementData.categoriesWithAnnouncements,
      totalAnnouncements: announcementData.totalAnnouncements,
      categoriesWithAnnouncements: announcementData.categoriesWithAnnouncements,
      maxAnnouncementsPerCategory: announcementData.maxAnnouncementsPerCategory,
      byColor,
      monthlyGrowth,
    };
  },

  /**
   * Initialize default categories
   */
  async initializeDefaultCategories(
    userId: Types.ObjectId
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    try {
      // Define default categories
      const defaultCategories = [
        {
          categoryName: 'Maintenance',
          description: 'System maintenance and downtime notifications',
          icon: 'tools',
          color: '#F59E0B',
          isSystem: true,
          priority: 1000,
          isActive: true,
        },
        {
          categoryName: 'Event',
          description: 'Company events, meetings, and gatherings',
          icon: 'calendar-event',
          color: '#10B981',
          isSystem: true,
          priority: 900,
          isActive: true,
        },
        {
          categoryName: 'Emergency',
          description: 'Urgent and critical announcements',
          icon: 'alert-triangle',
          color: '#EF4444',
          isSystem: true,
          priority: 950,
          isActive: true,
        },
        {
          categoryName: 'Billing',
          description: 'Billing, invoices, and payment related announcements',
          icon: 'credit-card',
          color: '#3B82F6',
          isSystem: true,
          priority: 800,
          isActive: true,
        },
        {
          categoryName: 'Update',
          description: 'System updates and feature releases',
          icon: 'refresh-cw',
          color: '#8B5CF6',
          isSystem: false,
          priority: 700,
          isActive: true,
        },
        {
          categoryName: 'News',
          description: 'General news and company updates',
          icon: 'newspaper',
          color: '#6B7280',
          isSystem: false,
          priority: 600,
          isActive: true,
        },
        {
          categoryName: 'Holiday',
          description: 'Public holidays and office closures',
          icon: 'umbrella-beach',
          color: '#EC4899',
          isSystem: false,
          priority: 500,
          isActive: true,
        },
        {
          categoryName: 'Policy',
          description: 'Company policy changes and updates',
          icon: 'file-text',
          color: '#6366F1',
          isSystem: false,
          priority: 400,
          isActive: true,
        },
        {
          categoryName: 'Training',
          description: 'Training sessions and workshops',
          icon: 'graduation-cap',
          color: '#14B8A6',
          isSystem: false,
          priority: 300,
          isActive: true,
        },
        {
          categoryName: 'Recognition',
          description: 'Employee achievements and recognition',
          icon: 'award',
          color: '#F97316',
          isSystem: false,
          priority: 200,
          isActive: true,
        },
      ];

      for (const defaultCategory of defaultCategories) {
        try {
          // Check if category already exists (case-insensitive)
          const existingCategory = await AnnouncementCategory.findOne({
            categoryName: { $regex: new RegExp(`^${defaultCategory.categoryName}$`, 'i') },
            isDeleted: false,
          });

          if (existingCategory) {
            // Update existing category
            await AnnouncementCategory.findByIdAndUpdate(
              existingCategory._id,
              {
                $set: {
                  description: defaultCategory.description,
                  icon: defaultCategory.icon,
                  color: defaultCategory.color,
                  priority: defaultCategory.priority,
                  isActive: defaultCategory.isActive,
                  isSystem: defaultCategory.isSystem,
                  updatedBy: userId,
                },
              },
              { new: true, runValidators: true }
            );
            updated++;
          } else {
            // Create new category
            await AnnouncementCategory.create({
              ...defaultCategory,
              createdBy: userId,
              updatedBy: userId,
            });
            created++;
          }
        } catch (error: any) {
          errors.push(`Category ${defaultCategory.categoryName}: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`Initialization failed: ${error.message}`);
    }

    return { created, updated, errors };
  },
};
