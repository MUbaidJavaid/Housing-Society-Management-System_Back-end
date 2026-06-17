import { Types } from 'mongoose';
import LookupValue, { ILookupValue, LookupCategory } from '../models/models-lookup-value';
import {
  CreateLookupValueDto,
  LookupQueryParams,
  ReorderItem,
  SeedItem,
  UpdateLookupValueDto,
} from '../types/types-lookup-value';

export const lookupValueService = {
  /**
   * Create a new lookup value
   */
  async create(data: CreateLookupValueDto, userId: Types.ObjectId): Promise<ILookupValue> {
    // Check if category+code already exists
    const existing = await LookupValue.findOne({
      category: data.category,
      code: data.code.toUpperCase(),
      isDeleted: false,
    });

    if (existing) {
      throw new Error(
        `Lookup value with code "${data.code}" already exists in category "${data.category}"`
      );
    }

    // Auto-assign sequence if not provided
    if (!data.sequence) {
      const maxSeq = await LookupValue.findOne({
        category: data.category,
        isDeleted: false,
      })
        .sort({ sequence: -1 })
        .select('sequence');

      data.sequence = (maxSeq?.sequence || 0) + 1;
    }

    const lookupValue = await LookupValue.create({
      ...data,
      code: data.code.toUpperCase(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      isDefault: data.isDefault || false,
      isSystem: data.isSystem || false,
      createdBy: userId,
      modifiedBy: userId,
    });

    return lookupValue;
  },

  /**
   * Get all lookup values with pagination and filtering
   */
  async getAll(params: LookupQueryParams): Promise<{
    lookupValues: ILookupValue[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'sequence',
      sortOrder = 'asc',
      category,
      isActive,
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (search) {
      query.$or = [
        { label: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [lookupValues, total] = await Promise.all([
      LookupValue.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('modifiedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      LookupValue.countDocuments(query),
    ]);

    return {
      lookupValues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get all active values for a category (most used endpoint)
   */
  async getByCategory(category: LookupCategory): Promise<ILookupValue[]> {
    return LookupValue.getByCategory(category, true);
  },

  /**
   * Get a lookup value by ID
   */
  async getById(id: string): Promise<ILookupValue | null> {
    const lookupValue = await LookupValue.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    if (!lookupValue || lookupValue.isDeleted) return null;
    return lookupValue;
  },

  /**
   * Get a lookup value by category and code
   */
  async getByCode(category: LookupCategory, code: string): Promise<ILookupValue | null> {
    return LookupValue.getByCode(category, code);
  },

  /**
   * Update a lookup value
   */
  async update(
    id: string,
    data: UpdateLookupValueDto,
    userId: Types.ObjectId
  ): Promise<ILookupValue | null> {
    const existing = await LookupValue.findById(id);
    if (!existing || existing.isDeleted) return null;

    // If setting as default, unset other defaults in same category
    if (data.isDefault === true) {
      await LookupValue.updateMany(
        {
          _id: { $ne: id },
          category: existing.category,
          isDeleted: false,
        },
        { $set: { isDefault: false } }
      );
    }

    const updated = await LookupValue.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          modifiedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    return updated;
  },

  /**
   * Soft delete a lookup value (blocks if isSystem)
   */
  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const lookupValue = await LookupValue.findById(id);

    if (!lookupValue || lookupValue.isDeleted) {
      throw new Error('Lookup value not found');
    }

    if (lookupValue.isSystem) {
      throw new Error('System lookup values cannot be deleted');
    }

    if (lookupValue.isDefault) {
      throw new Error('Cannot delete default lookup value. Set another value as default first.');
    }

    const result = await LookupValue.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Reorder lookup values within a category
   */
  async reorder(items: ReorderItem[]): Promise<boolean> {
    const updates = items.map(item => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(item.id), isDeleted: false },
        update: { $set: { sequence: item.sequence } },
      },
    }));

    await LookupValue.bulkWrite(updates);
    return true;
  },

  /**
   * Seed initial lookup values (upsert pattern)
   */
  async seed(data: SeedItem[], systemUserId?: Types.ObjectId): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    // Use a fallback ObjectId for system seeding if no userId provided
    const createdBy = systemUserId || new Types.ObjectId('000000000000000000000000');

    for (const item of data) {
      const existing = await LookupValue.findOne({
        category: item.category,
        code: item.code.toUpperCase(),
        isDeleted: false,
      });

      if (existing) {
        skipped++;
        continue;
      }

      await LookupValue.create({
        category: item.category,
        code: item.code.toUpperCase(),
        label: item.label,
        description: item.description,
        colorCode: item.colorCode,
        icon: item.icon,
        sequence: item.sequence,
        isDefault: item.isDefault || false,
        isSystem: item.isSystem,
        isActive: true,
        metadata: item.metadata || {},
        allowedTransitions: item.allowedTransitions || [],
        createdBy,
        modifiedBy: createdBy,
      });

      created++;
    }

    return { created, skipped };
  },
};
