import { Types } from 'mongoose';
import BillInfo from '../models/models-bill-info';
import BillType, { BillTypeCategory } from '../models/models-bill-type';
import {
  BillTypeQueryParams,
  BillTypeStatistics,
  BillTypeType,
  CalculateAmountParams,
  CreateBillTypeDto,
  UpdateBillTypeDto,
} from '../types/types-bill-type';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): BillTypeType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as BillTypeType;
};

export const billTypeService = {
  /**
   * Create new bill type
   */
  async createBillType(data: CreateBillTypeDto, userId: Types.ObjectId): Promise<BillTypeType> {
    // Check if bill type name already exists
    const existingBillType = await BillType.findOne({
      billTypeName: data.billTypeName,
      isDeleted: false,
    });

    if (existingBillType) {
      throw new Error('Bill type name already exists');
    }

    // Validate frequency for recurring bill types
    if (data.isRecurring && !data.frequency) {
      throw new Error('Frequency is required for recurring bill types');
    }

    if (!data.isRecurring && data.frequency && data.frequency !== 'ONE_TIME') {
      throw new Error('Non-recurring bill types can only have ONE_TIME frequency');
    }

    // Validate calculation method for PER_UNIT
    if (data.calculationMethod === 'PER_UNIT') {
      if (!data.unitType) {
        throw new Error('Unit type is required for PER_UNIT calculation method');
      }
      if (!data.ratePerUnit || data.ratePerUnit <= 0) {
        throw new Error(
          'Rate per unit is required and must be positive for PER_UNIT calculation method'
        );
      }
    }

    // Validate tax
    if (data.isTaxable && (!data.taxRate || data.taxRate <= 0)) {
      throw new Error('Tax rate is required and must be positive for taxable bill types');
    }

    const billTypeData = {
      ...data,
      isTaxable: data.isTaxable || false,
      isActive: true,
      createdBy: userId,
      isDeleted: false,
    };

    const billType = await BillType.create(billTypeData);

    const createdBillType = await BillType.findById(billType._id).populate(
      'createdBy',
      'userName fullName designation'
    );

    if (!createdBillType) {
      throw new Error('Failed to create bill type');
    }

    return toPlainObject(createdBillType);
  },

  /**
   * Get bill type by ID
   */
  async getBillTypeById(id: string): Promise<BillTypeType> {
    try {
      const billType = await BillType.findById(id)
        .populate('createdBy', 'userName fullName designation')
        .populate('modifiedBy', 'userName fullName designation');

      if (!billType || billType.isDeleted) {
        throw new Error('Bill type not found');
      }

      return toPlainObject(billType);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid bill type ID');
    }
  },

  /**
   * Get bill type by name
   */
  async getBillTypeByName(name: string): Promise<BillTypeType | null> {
    const billType = await BillType.findOne({
      billTypeName: name,
      isDeleted: false,
    });

    if (!billType) return null;
    return toPlainObject(billType);
  },

  /**
   * Get all bill types with pagination
   */
  async getBillTypes(params: BillTypeQueryParams): Promise<{
    billTypes: BillTypeType[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      isRecurring,
      isActive = true,
      sortBy = 'billTypeName',
      sortOrder = 'asc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (category) {
      query.billTypeCategory = category;
    }

    if (isRecurring !== undefined) {
      query.isRecurring = isRecurring;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const [billTypes, total] = await Promise.all([
      BillType.find(query)
        .populate('createdBy', 'userName fullName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      BillType.countDocuments(query),
    ]);

    return {
      billTypes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update bill type
   */
  async updateBillType(
    id: string,
    data: UpdateBillTypeDto,
    userId: Types.ObjectId
  ): Promise<BillTypeType | null> {
    const existingBillType = await BillType.findById(id);
    if (!existingBillType || existingBillType.isDeleted) {
      throw new Error('Bill type not found');
    }

    // Check if bill type name is being changed to an existing one
    if (data.billTypeName && data.billTypeName !== existingBillType.billTypeName) {
      const duplicate = await BillType.findOne({
        billTypeName: data.billTypeName,
        isDeleted: false,
        _id: { $ne: id },
      });

      if (duplicate) {
        throw new Error('Bill type name already exists');
      }
    }

    // Prevent deactivation if bills exist
    if (data.isActive === false && existingBillType.isActive) {
      const billCount = await BillInfo.countDocuments({
        billType: existingBillType._id,
        isDeleted: false,
      });

      if (billCount > 0) {
        throw new Error('Cannot deactivate bill type that has associated bills');
      }
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    const billType = await BillType.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    ).populate('modifiedBy', 'userName fullName');

    return billType ? toPlainObject(billType) : null;
  },

  /**
   * Delete bill type (soft delete)
   */
  async deleteBillType(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingBillType = await BillType.findById(id);
    if (!existingBillType || existingBillType.isDeleted) {
      throw new Error('Bill type not found');
    }

    // Check if bill type has associated bills
    const billCount = await BillInfo.countDocuments({
      billType: existingBillType._id,
      isDeleted: false,
    });

    if (billCount > 0) {
      throw new Error('Cannot delete bill type that has associated bills');
    }

    const result = await BillType.findByIdAndUpdate(
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
   * Get active bill types
   */
  async getActiveBillTypes(category?: string): Promise<BillTypeType[]> {
    const query: any = {
      isActive: true,
      isDeleted: false,
    };

    if (category) {
      query.billTypeCategory = category;
    }

    const billTypes = await BillType.find(query)
      .sort({ billTypeName: 1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return billTypes;
  },

  /**
   * Get recurring bill types
   */
  async getRecurringBillTypes(): Promise<BillTypeType[]> {
    const billTypes = await BillType.find({
      isRecurring: true,
      isActive: true,
      isDeleted: false,
    })
      .sort({ frequency: 1, billTypeName: 1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return billTypes;
  },

  /**
   * Calculate amount for a bill type
   */
  async calculateAmount(params: CalculateAmountParams): Promise<{
    baseAmount: number;
    taxAmount: number;
    totalAmount: number;
    breakdown: Record<string, any>;
  }> {
    const billType = await BillType.findById(params.billTypeId);
    if (!billType || billType.isDeleted || !billType.isActive) {
      throw new Error('Bill type not found or inactive');
    }

    let baseAmount = params.baseAmount || billType.defaultAmount || 0;

    // Apply calculation method
    switch (billType.calculationMethod) {
      case 'PER_UNIT':
        if (!params.units || params.units <= 0) {
          throw new Error('Units are required for PER_UNIT calculation');
        }
        baseAmount = params.units * (billType.ratePerUnit || 0);
        break;

      case 'PERCENTAGE':
        if (!params.baseAmount || params.baseAmount <= 0) {
          throw new Error('Base amount is required for PERCENTAGE calculation');
        }
        baseAmount = params.baseAmount * ((billType.ratePerUnit || 0) / 100);
        break;

      case 'TIERED':
        // Simple tiered calculation (can be extended)
        if (!params.units || params.units <= 0) {
          throw new Error('Units are required for TIERED calculation');
        }
        baseAmount = this.calculateTieredAmount(params.units, billType);
        break;

      case 'FIXED':
      default:
        baseAmount = billType.defaultAmount || 0;
        break;
    }

    // Calculate tax
    let taxAmount = 0;
    if (params.applyTax !== false && billType.isTaxable && billType.taxRate) {
      taxAmount = baseAmount * (billType.taxRate / 100);
    }

    const totalAmount = baseAmount + taxAmount;

    return {
      baseAmount: parseFloat(baseAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      breakdown: {
        calculationMethod: billType.calculationMethod,
        units: params.units,
        ratePerUnit: billType.ratePerUnit,
        taxRate: billType.taxRate,
        isTaxable: billType.isTaxable,
      },
    };
  },

  /**
   * Calculate tiered amount (helper method)
   */
  calculateTieredAmount(units: number, billType: any): number {
    // Simple tiered calculation - can be extended with actual tier configuration
    // For now, using a simple tier: first 100 units at rate1, next at rate2
    const rate1 = billType.ratePerUnit || 10;
    const rate2 = (billType.ratePerUnit || 10) * 1.5; // 50% higher for additional units

    if (units <= 100) {
      return units * rate1;
    } else {
      return 100 * rate1 + (units - 100) * rate2;
    }
  },

  /**
   * Get bill type statistics
   */
  async getBillTypeStatistics(): Promise<BillTypeStatistics> {
    const [stats, categoryStats, mostUsed] = await Promise.all([
      BillType.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $group: {
            _id: null,
            totalBillTypes: { $sum: 1 },
            recurringCount: {
              $sum: { $cond: [{ $eq: ['$isRecurring', true] }, 1, 0] },
            },
            activeCount: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
          },
        },
      ]),
      BillType.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $group: {
            _id: '$billTypeCategory',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
      BillInfo.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $group: {
            _id: '$billType',
            billCount: { $sum: 1 },
          },
        },
        {
          $sort: { billCount: -1 },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: 'billtypes',
            localField: '_id',
            foreignField: '_id',
            as: 'billType',
          },
        },
        {
          $unwind: '$billType',
        },
        {
          $project: {
            billTypeName: '$billType.billTypeName',
            billTypeCategory: '$billType.billTypeCategory',
            billCount: 1,
          },
        },
      ]),
    ]);

    const baseStats = stats[0] || {
      totalBillTypes: 0,
      recurringCount: 0,
      activeCount: 0,
    };

    const byCategory: Record<string, number> = {};
    categoryStats.forEach(stat => {
      byCategory[stat._id] = stat.count;
    });

    const mostUsedTypes = mostUsed.map(item => ({
      billTypeName: item.billTypeName,
      billCount: item.billCount,
      category: item.billTypeCategory,
    }));

    return {
      totalBillTypes: baseStats.totalBillTypes,
      recurringCount: baseStats.recurringCount,
      nonRecurringCount: baseStats.totalBillTypes - baseStats.recurringCount,
      activeCount: baseStats.activeCount,
      inactiveCount: baseStats.totalBillTypes - baseStats.activeCount,
      byCategory,
      mostUsedTypes,
    };
  },

  /**
   * Search bill types
   */
  async searchBillTypes(searchTerm: string, limit: number = 10): Promise<BillTypeType[]> {
    const billTypes = await BillType.find({
      $text: { $search: searchTerm },
      isDeleted: false,
      isActive: true,
    })
      .limit(limit)
      .sort({ score: { $meta: 'textScore' } })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return billTypes;
  },

  /**
   * Bulk update bill type status
   */
  async bulkUpdateStatus(
    billTypeIds: string[],
    isActive: boolean,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    const objectIds = billTypeIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid bill type ID: ${id}`);
      }
    });

    // Check if any bill type has associated bills when deactivating
    if (!isActive) {
      const billTypesWithBills = await BillInfo.countDocuments({
        billType: { $in: objectIds },
        isDeleted: false,
      });

      if (billTypesWithBills > 0) {
        throw new Error('Cannot deactivate bill types that have associated bills');
      }
    }

    const result = await BillType.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
      },
      {
        $set: {
          isActive,
          modifiedBy: userId,
        },
      }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },

  /**
   * Get bill types by category
   */
  async getBillTypesByCategory(category: BillTypeCategory): Promise<BillTypeType[]> {
    const billTypes = await BillType.find({
      billTypeCategory: category,
      isDeleted: false,
      isActive: true,
    })
      .sort({ billTypeName: 1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return billTypes;
  },

  /**
   * Validate bill type configuration
   */
  async validateBillTypeConfiguration(billTypeId: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const billType = await BillType.findById(billTypeId);
    if (!billType || billType.isDeleted) {
      throw new Error('Bill type not found');
    }

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check required fields based on configuration
    if (billType.isRecurring && !billType.frequency) {
      issues.push('Recurring bill type is missing frequency');
      suggestions.push('Set frequency to MONTHLY, QUARTERLY, BIANNUALLY, or ANNUALLY');
    }

    if (billType.calculationMethod === 'PER_UNIT') {
      if (!billType.unitType) {
        issues.push('PER_UNIT calculation method requires unit type');
        suggestions.push('Set unit type (e.g., kWh, gallons, sqft)');
      }
      if (!billType.ratePerUnit || billType.ratePerUnit <= 0) {
        issues.push('PER_UNIT calculation method requires positive rate per unit');
        suggestions.push('Set rate per unit (e.g., 15.5 for $15.50 per unit)');
      }
    }

    if (billType.isTaxable && (!billType.taxRate || billType.taxRate <= 0)) {
      issues.push('Taxable bill type requires positive tax rate');
      suggestions.push('Set tax rate percentage (e.g., 15 for 15%)');
    }

    if (
      billType.calculationMethod === 'FIXED' &&
      (!billType.defaultAmount || billType.defaultAmount <= 0)
    ) {
      issues.push('FIXED calculation method requires positive default amount');
      suggestions.push('Set default amount for this bill type');
    }

    // Check if bill type is being used
    const billCount = await BillInfo.countDocuments({
      billType: billType._id,
      isDeleted: false,
    });

    if (billCount === 0) {
      suggestions.push('This bill type has not been used yet. Consider creating sample bills.');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  },
};
