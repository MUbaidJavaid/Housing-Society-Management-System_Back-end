import { Types } from 'mongoose';
import { SrTransfer } from '../index-transfer';
import SrTransferType from '../models/models-transfer-type';
import {
  CreateSrTransferTypeDto,
  FeeCalculationParams,
  SrTransferTypeQueryParams,
  SrTransferTypeStatistics,
  SrTransferTypeType,
  TransferTypeSummary,
  UpdateSrTransferTypeDto,
} from '../types/types-transfer-type';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): SrTransferTypeType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as SrTransferTypeType;
};

export const srTransferTypeService = {
  /**
   * Create new transfer type
   */
  async createTransferType(
    data: CreateSrTransferTypeDto,
    userId: Types.ObjectId
  ): Promise<SrTransferTypeType> {
    // Format type name
    const formattedName = data.typeName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Check if transfer type name already exists
    const existingType = await SrTransferType.findOne({
      typeName: formattedName,
      isDeleted: false,
    });

    if (existingType) {
      throw new Error('Transfer type name already exists');
    }

    // Validate transfer fee
    if (data.transferFee < 0) {
      throw new Error('Transfer fee cannot be negative');
    }

    const transferTypeData = {
      ...data,
      typeName: formattedName,
      isActive: true,
      createdBy: userId,
      isDeleted: false,
    };

    const transferType = await SrTransferType.create(transferTypeData);

    const createdType = await SrTransferType.findById(transferType._id).populate(
      'createdBy',
      'userName fullName designation'
    );

    if (!createdType) {
      throw new Error('Failed to create transfer type');
    }

    return toPlainObject(createdType);
  },

  /**
   * Get transfer type by ID
   */
  async getTransferTypeById(id: string): Promise<SrTransferTypeType> {
    try {
      const transferType = await SrTransferType.findById(id)
        .populate('createdBy', 'userName fullName designation')
        .populate('modifiedBy', 'userName fullName designation');

      if (!transferType || transferType.isDeleted) {
        throw new Error('Transfer type not found');
      }

      return toPlainObject(transferType);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid transfer type ID');
    }
  },

  /**
   * Get transfer type by name
   */
  async getTransferTypeByName(name: string): Promise<SrTransferTypeType | null> {
    const formattedName = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    const transferType = await SrTransferType.findOne({
      typeName: formattedName,
      isDeleted: false,
    });

    if (!transferType) return null;
    return toPlainObject(transferType);
  },

  /**
   * Get all transfer types with pagination
   */
  async getTransferTypes(params: SrTransferTypeQueryParams): Promise<{
    transferTypes: SrTransferTypeType[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      isActive = true,
      minFee,
      maxFee,
      sortBy = 'typeName',
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

    if (minFee !== undefined || maxFee !== undefined) {
      query.transferFee = {};
      if (minFee !== undefined) query.transferFee.$gte = minFee;
      if (maxFee !== undefined) query.transferFee.$lte = maxFee;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const [transferTypes, total] = await Promise.all([
      SrTransferType.find(query)
        .populate('createdBy', 'userName fullName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      SrTransferType.countDocuments(query),
    ]);

    return {
      transferTypes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update transfer type
   */
  async updateTransferType(
    id: string,
    data: UpdateSrTransferTypeDto,
    userId: Types.ObjectId
  ): Promise<SrTransferTypeType | null> {
    const existingType = await SrTransferType.findById(id);
    if (!existingType || existingType.isDeleted) {
      throw new Error('Transfer type not found');
    }

    // Check if type name is being changed to an existing one
    if (data.typeName && data.typeName !== existingType.typeName) {
      const formattedName = data.typeName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      const duplicate = await SrTransferType.findOne({
        typeName: formattedName,
        isDeleted: false,
        _id: { $ne: id },
      });

      if (duplicate) {
        throw new Error('Transfer type name already exists');
      }

      data.typeName = formattedName;
    }

    // Prevent deactivation if transfers exist
    if (data.isActive === false && existingType.isActive) {
      const transferCount = await SrTransfer.countDocuments({
        transferTypeId: existingType._id,
        isDeleted: false,
      });

      if (transferCount > 0) {
        throw new Error('Cannot deactivate transfer type that has associated transfers');
      }
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    const transferType = await SrTransferType.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    ).populate('modifiedBy', 'userName fullName');

    return transferType ? toPlainObject(transferType) : null;
  },

  /**
   * Delete transfer type (soft delete)
   */
  async deleteTransferType(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingType = await SrTransferType.findById(id);
    if (!existingType || existingType.isDeleted) {
      throw new Error('Transfer type not found');
    }

    // Check if transfer type has associated transfers

    const transferCount = await SrTransfer.countDocuments({
      transferTypeId: existingType._id,
      isDeleted: false,
    });

    if (transferCount > 0) {
      throw new Error('Cannot delete transfer type that has associated transfers');
    }

    const result = await SrTransferType.findByIdAndUpdate(
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
   * Get active transfer types
   */
  async getActiveTransferTypes(): Promise<SrTransferTypeType[]> {
    const transferTypes = await SrTransferType.find({
      isActive: true,
      isDeleted: false,
    })
      .sort({ typeName: 1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return transferTypes;
  },

  /**
   * Calculate transfer fee
   */
  async calculateFee(params: FeeCalculationParams): Promise<{
    baseFee: number;
    discountAmount: number;
    totalFee: number;
    breakdown: Record<string, any>;
  }> {
    const transferType = await SrTransferType.findById(params.transferTypeId);
    if (!transferType || transferType.isDeleted || !transferType.isActive) {
      throw new Error('Transfer type not found or inactive');
    }

    let baseFee = transferType.transferFee;

    // Apply percentage-based fee for certain types
    if (params.propertyValue && params.propertyValue > 0) {
      switch (transferType.typeName.toLowerCase()) {
        case 'sale':
        case 'resale':
          // 2% of property value for sale/resale
          baseFee = Math.max(transferType.transferFee, params.propertyValue * 0.02);
          break;
        case 'gift':
        case 'hiba':
          // Fixed fee or 1% of property value, whichever is higher
          baseFee = Math.max(transferType.transferFee, params.propertyValue * 0.01);
          break;
        case 'legal heir':
        case 'inheritance':
          // Fixed fee only
          baseFee = transferType.transferFee;
          break;
      }
    }

    // Apply discount if requested
    let discountAmount = 0;
    if (params.applyDiscount && params.discountPercentage) {
      discountAmount = baseFee * (params.discountPercentage / 100);
      baseFee = Math.max(0, baseFee - discountAmount);
    }

    const totalFee = baseFee;

    return {
      baseFee: parseFloat(baseFee.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      totalFee: parseFloat(totalFee.toFixed(2)),
      breakdown: {
        typeName: transferType.typeName,
        baseTransferFee: transferType.transferFee,
        propertyValue: params.propertyValue,
        discountPercentage: params.discountPercentage,
        calculationMethod: params.propertyValue ? 'percentage' : 'fixed',
      },
    };
  },

  /**
   * Get transfer type statistics
   */
  async getTransferTypeStatistics(): Promise<SrTransferTypeStatistics> {
    const [stats, mostUsed] = await Promise.all([
      SrTransferType.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $lookup: {
            from: 'srtransfers',
            localField: '_id',
            foreignField: 'transferTypeId',
            as: 'transfers',
          },
        },
        {
          $project: {
            typeName: 1,
            transferFee: 1,
            isActive: 1,
            transferCount: { $size: '$transfers' },
            totalFee: {
              $multiply: ['$transferFee', { $size: '$transfers' }],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalTypes: { $sum: 1 },
            activeTypes: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
            totalTransfers: { $sum: '$transferCount' },
            totalFeeGenerated: { $sum: '$totalFee' },
            averageFee: { $avg: '$transferFee' },
          },
        },
      ]),
      SrTransferType.aggregate([
        {
          $match: { isDeleted: false, isActive: true },
        },
        {
          $lookup: {
            from: 'srtransfers',
            localField: '_id',
            foreignField: 'transferTypeId',
            as: 'transfers',
          },
        },
        {
          $project: {
            typeName: 1,
            transferFee: 1,
            transferCount: { $size: '$transfers' },
            totalFee: {
              $multiply: ['$transferFee', { $size: '$transfers' }],
            },
          },
        },
        {
          $match: { transferCount: { $gt: 0 } },
        },
        {
          $sort: { transferCount: -1 },
        },
        {
          $limit: 5,
        },
      ]),
    ]);

    const baseStats = stats[0] || {
      totalTypes: 0,
      activeTypes: 0,
      totalTransfers: 0,
      totalFeeGenerated: 0,
      averageFee: 0,
    };

    const mostUsedTypes = mostUsed.map(item => ({
      typeName: item.typeName,
      transferCount: item.transferCount,
      totalFee: item.totalFee,
    }));

    return {
      totalTypes: baseStats.totalTypes,
      activeTypes: baseStats.activeTypes,
      inactiveTypes: baseStats.totalTypes - baseStats.activeTypes,
      totalTransfers: baseStats.totalTransfers,
      totalFeeGenerated: baseStats.totalFeeGenerated,
      averageFee: baseStats.averageFee,
      mostUsedTypes,
    };
  },

  /**
   * Get transfer type summary for dashboard
   */
  async getTransferTypeSummary(): Promise<TransferTypeSummary> {
    const [totalTypes, activeTypes, recentlyAdded] = await Promise.all([
      SrTransferType.countDocuments({ isDeleted: false }),
      SrTransferType.countDocuments({
        isDeleted: false,
        isActive: true,
      }),
      SrTransferType.find({
        isDeleted: false,
        isActive: true,
      })
        .populate('createdBy', 'userName')
        .sort({ createdAt: -1 })
        .limit(5)
        .then(docs => docs.map(doc => toPlainObject(doc))),
    ]);

    // Calculate total transfers and revenue
    const revenueStats = await SrTransferType.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $lookup: {
          from: 'srtransfers',
          localField: '_id',
          foreignField: 'transferTypeId',
          as: 'transfers',
        },
      },
      {
        $project: {
          transferCount: { $size: '$transfers' },
          totalRevenue: {
            $multiply: ['$transferFee', { $size: '$transfers' }],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalTransfers: { $sum: '$transferCount' },
          revenueGenerated: { $sum: '$totalRevenue' },
        },
      },
    ]);

    return {
      totalTypes,
      activeTypes,
      totalTransfers: revenueStats[0]?.totalTransfers || 0,
      revenueGenerated: revenueStats[0]?.revenueGenerated || 0,
      recentlyAdded,
    };
  },

  /**
   * Search transfer types
   */
  async searchTransferTypes(searchTerm: string, limit: number = 10): Promise<SrTransferTypeType[]> {
    const transferTypes = await SrTransferType.find({
      $text: { $search: searchTerm },
      isDeleted: false,
      isActive: true,
    })
      .limit(limit)
      .sort({ score: { $meta: 'textScore' } })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return transferTypes;
  },

  /**
   * Bulk update transfer type status
   */
  async bulkUpdateStatus(
    transferTypeIds: string[],
    isActive: boolean,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    const objectIds = transferTypeIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid transfer type ID: ${id}`);
      }
    });

    // Check if any transfer type has associated transfers when deactivating
    if (!isActive) {
      const typesWithTransfers = await SrTransfer.countDocuments({
        transferTypeId: { $in: objectIds },
        isDeleted: false,
      });

      if (typesWithTransfers > 0) {
        throw new Error('Cannot deactivate transfer types that have associated transfers');
      }
    }

    const result = await SrTransferType.updateMany(
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
   * Validate transfer type configuration
   */
  async validateTransferTypeConfiguration(transferTypeId: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const transferType = await SrTransferType.findById(transferTypeId);
    if (!transferType || transferType.isDeleted) {
      throw new Error('Transfer type not found');
    }

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check fee configuration
    if (transferType.transferFee <= 0) {
      issues.push('Transfer fee should be greater than 0');
      suggestions.push('Consider setting a reasonable transfer fee based on market rates');
    }

    // Check if transfer type is being used

    const transferCount = await SrTransfer.countDocuments({
      transferTypeId: transferType._id,
      isDeleted: false,
    });

    if (transferCount === 0) {
      suggestions.push('This transfer type has not been used yet. Consider promoting it to users.');
    }

    // Check description
    if (!transferType.description || transferType.description.trim().length < 10) {
      suggestions.push('Add a detailed description to help users understand this transfer type');
    }

    // Check common transfer types
    const commonTypes = ['Sale', 'Resale', 'Gift/Hiba', 'Legal Heir/Inheritance'];
    if (!commonTypes.includes(transferType.typeName)) {
      suggestions.push(
        'Consider adding this to the list of common transfer types if frequently used'
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  },

  /**
   * Get transfer types dropdown (simplified)
   */
  async getTransferTypesDropdown(): Promise<
    Array<{
      value: string;
      label: string;
      fee: number;
      formattedFee: string;
    }>
  > {
    const transferTypes = await this.getActiveTransferTypes();

    return transferTypes.map(type => ({
      value: type._id.toString(),
      label: `${type.typeName} (Rs. ${type.transferFee.toLocaleString()})`,
      fee: type.transferFee,
      formattedFee: `Rs. ${type.transferFee.toLocaleString()}`,
    }));
  },

  /**
   * Update transfer fees by percentage
   */
  async updateFeesByPercentage(
    percentage: number,
    userId: Types.ObjectId
  ): Promise<{ updated: number; averageFee: number }> {
    if (percentage < -100 || percentage > 100) {
      throw new Error('Percentage must be between -100 and 100');
    }

    const multiplier = 1 + percentage / 100;

    const result = await SrTransferType.updateMany(
      {
        isDeleted: false,
        isActive: true,
      },
      [
        {
          $set: {
            transferFee: {
              $round: [{ $multiply: ['$transferFee', multiplier] }, 2],
            },
            modifiedBy: userId,
          },
        },
      ]
    );

    // Get new average fee
    const stats = await SrTransferType.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $group: {
          _id: null,
          averageFee: { $avg: '$transferFee' },
        },
      },
    ]);

    return {
      updated: result.modifiedCount,
      averageFee: stats[0]?.averageFee || 0,
    };
  },
};
