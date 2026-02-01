import { Types } from 'mongoose';
import InstallmentCategory from '../models/models-installment-category';
import {
  CreateInstallmentCategoryDto,
  DEFAULT_INSTALLMENT_CATEGORIES,
  InstallmentCategoryQueryParams,
  InstallmentCategorySummary,
  InstallmentCategoryType,
  UpdateInstallmentCategoryDto,
} from '../types/types-installment-category';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): InstallmentCategoryType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as InstallmentCategoryType;
};

export const installmentCategoryService = {
  /**
   * Create new installment category
   */
  async createCategory(
    data: CreateInstallmentCategoryDto,
    userId: Types.ObjectId
  ): Promise<InstallmentCategoryType> {
    // Check if category name already exists
    const existingCategory = await InstallmentCategory.findOne({
      instCatName: { $regex: new RegExp(`^${data.instCatName}$`, 'i') },
    });

    if (existingCategory) {
      throw new Error(`Installment category "${data.instCatName}" already exists`);
    }

    const categoryData = {
      ...data,
      createdBy: userId,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    const category = await InstallmentCategory.create(categoryData);

    const createdCategory = await InstallmentCategory.findById(category._id).populate(
      'createdBy',
      'userName fullName designation'
    );

    if (!createdCategory) {
      throw new Error('Failed to create installment category');
    }

    return toPlainObject(createdCategory);
  },

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<InstallmentCategoryType> {
    try {
      const category = await InstallmentCategory.findById(id)
        .populate('createdBy', 'userName fullName designation')
        .populate('modifiedBy', 'userName fullName designation');

      if (!category || !category.isActive) {
        throw new Error('Installment category not found');
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
   * Get all categories with pagination
   */
  async getCategories(params: InstallmentCategoryQueryParams): Promise<{
    categories: InstallmentCategoryType[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      isRefundable,
      isMandatory,
      isActive = true,
      sortBy = 'sequenceOrder',
      sortOrder = 'asc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = {};

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (isRefundable !== undefined) {
      query.isRefundable = isRefundable;
    }

    if (isMandatory !== undefined) {
      query.isMandatory = isMandatory;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const [categories, total] = await Promise.all([
      InstallmentCategory.find(query)
        .populate('createdBy', 'userName fullName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      InstallmentCategory.countDocuments(query),
    ]);

    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get active categories in sequence order
   */
  async getActiveCategories(): Promise<InstallmentCategoryType[]> {
    const categories = await InstallmentCategory.getActiveCategories();
    return categories.map(doc => toPlainObject(doc));
  },

  /**
   * Get mandatory categories
   */
  async getMandatoryCategories(): Promise<InstallmentCategoryType[]> {
    const categories = await InstallmentCategory.getMandatoryCategories();
    return categories.map(doc => toPlainObject(doc));
  },

  /**
   * Update category
   */
  async updateCategory(
    id: string,
    data: UpdateInstallmentCategoryDto,
    userId: Types.ObjectId
  ): Promise<InstallmentCategoryType | null> {
    const existingCategory = await InstallmentCategory.findById(id);
    if (!existingCategory) {
      throw new Error('Installment category not found');
    }

    // Check if category name is being changed and already exists
    if (data.instCatName && data.instCatName !== existingCategory.instCatName) {
      const duplicateCategory = await InstallmentCategory.findOne({
        _id: { $ne: id },
        instCatName: { $regex: new RegExp(`^${data.instCatName}$`, 'i') },
      });

      if (duplicateCategory) {
        throw new Error(`Installment category "${data.instCatName}" already exists`);
      }
    }

    const updateObj = {
      ...data,
      modifiedBy: userId,
      updatedAt: new Date(),
    };

    const category = await InstallmentCategory.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('modifiedBy', 'userName fullName')
      .populate('createdBy', 'userName fullName');

    return category ? toPlainObject(category) : null;
  },

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingCategory = await InstallmentCategory.findById(id);
    if (!existingCategory) {
      throw new Error('Installment category not found');
    }

    // Don't allow deletion of mandatory categories that are active
    if (existingCategory.isMandatory && existingCategory.isActive) {
      throw new Error('Cannot delete mandatory category. Deactivate it instead.');
    }

    const result = await InstallmentCategory.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: false,
          modifiedBy: userId,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Get category statistics
   */
  async getCategoryStatistics(): Promise<InstallmentCategorySummary> {
    const [totalCategories, activeCategories, mandatoryCategories, refundableCategories] =
      await Promise.all([
        InstallmentCategory.countDocuments(),
        InstallmentCategory.countDocuments({ isActive: true }),
        InstallmentCategory.countDocuments({ isActive: true, isMandatory: true }),
        InstallmentCategory.countDocuments({ isActive: true, isRefundable: true }),
      ]);

    // Get categories by type
    const categoriesByType = await InstallmentCategory.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: {
            name: '$instCatName',
            isMandatory: '$isMandatory',
            isRefundable: '$isRefundable',
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: '$_id.name',
          isMandatory: '$_id.isMandatory',
          isRefundable: '$_id.isRefundable',
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    return {
      totalCategories,
      activeCategories,
      mandatoryCategories,
      refundableCategories,
      categoriesByType,
    };
  },

  /**
   * Seed default categories
   */
  async seedDefaultCategories(userId: Types.ObjectId): Promise<{
    created: number;
    updated: number;
    skipped: number;
  }> {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const categoryData of DEFAULT_INSTALLMENT_CATEGORIES) {
      const existingCategory = await InstallmentCategory.findOne({
        instCatName: { $regex: new RegExp(`^${categoryData.instCatName}$`, 'i') },
      });

      if (!existingCategory) {
        // Create new category
        await InstallmentCategory.create({
          ...categoryData,
          createdBy: userId,
          isActive: true,
        });
        created++;
      } else if (!existingCategory.isActive) {
        // Update existing inactive category
        await InstallmentCategory.findByIdAndUpdate(existingCategory._id, {
          $set: {
            ...categoryData,
            isActive: true,
            modifiedBy: userId,
            updatedAt: new Date(),
          },
        });
        updated++;
      } else {
        skipped++;
      }
    }

    return { created, updated, skipped };
  },

  /**
   * Get categories for dropdown/select
   */
  async getCategoryOptions(includeInactive: boolean = false): Promise<
    Array<{
      id: string;
      name: string;
      description?: string;
      isMandatory: boolean;
      isRefundable: boolean;
      sequenceOrder: number;
    }>
  > {
    const query: any = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    const categories = await InstallmentCategory.find(query)
      .sort({ sequenceOrder: 1 })
      .select('instCatName instCatDescription isMandatory isRefundable sequenceOrder');

    return categories.map(category => ({
      id: category._id.toString(),
      name: category.instCatName,
      description: category.instCatDescription,
      isMandatory: category.isMandatory,
      isRefundable: category.isRefundable,
      sequenceOrder: category.sequenceOrder,
    }));
  },

  /**
   * Validate category sequence
   */
  async validateSequenceOrder(
    sequenceOrder: number,
    excludeId?: string
  ): Promise<{ isValid: boolean; message?: string }> {
    const query: any = {
      sequenceOrder,
      isActive: true,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingCategory = await InstallmentCategory.findOne(query);

    if (existingCategory) {
      return {
        isValid: false,
        message: `Sequence order ${sequenceOrder} is already assigned to "${existingCategory.instCatName}"`,
      };
    }

    return { isValid: true };
  },

  /**
   * Reorder categories
   */
  async reorderCategories(
    categoryOrders: Array<{ id: string; sequenceOrder: number }>,
    userId: Types.ObjectId
  ): Promise<boolean> {
    const session = await InstallmentCategory.startSession();

    try {
      session.startTransaction();

      for (const order of categoryOrders) {
        await InstallmentCategory.findByIdAndUpdate(
          order.id,
          {
            $set: {
              sequenceOrder: order.sequenceOrder,
              modifiedBy: userId,
              updatedAt: new Date(),
            },
          },
          { session }
        );
      }

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
};
