import { Types } from 'mongoose';
import SalesStatus, { SalesStatusType } from '../models/models-salesstatus';
import {
  BulkStatusUpdateDto,
  CreateSalesStatusDto,
  SalesStatusQueryParams,
  StatusWorkflow,
  UpdateSalesStatusDto,
  WorkflowValidationDto,
} from '../types/types-salesstatus';

export const salesStatusService = {
  /**
   * Create new sales status
   */
  async createSalesStatus(data: CreateSalesStatusDto, userId: Types.ObjectId): Promise<any> {
    // Check if status code already exists
    const existingCode = await SalesStatus.findOne({
      statusCode: data.statusCode.toUpperCase(),
      isDeleted: false,
    });

    if (existingCode) {
      throw new Error(`Sales Status with code ${data.statusCode} already exists`);
    }

    // Check if status name already exists
    const existingName = await SalesStatus.findOne({
      statusName: { $regex: new RegExp(`^${data.statusName}$`, 'i') },
      isDeleted: false,
    });

    if (existingName) {
      throw new Error(`Sales Status with name ${data.statusName} already exists`);
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await SalesStatus.updateMany({ isDeleted: false }, { $set: { isDefault: false } });
    }

    const salesStatusData = {
      ...data,
      statusCode: data.statusCode.toUpperCase(),
      colorCode: data.colorCode || '#808080',
      isActive: data.isActive !== undefined ? data.isActive : true,
      isDefault: data.isDefault || false,
      sequence: data.sequence || 1,
      allowsSale: data.allowsSale || false,
      requiresApproval: data.requiresApproval || false,
      createdBy: userId,
      updatedBy: userId,
    };

    const salesStatus = await SalesStatus.create(salesStatusData);
    return salesStatus;
  },

  /**
   * Get sales status by ID
   */
  async getSalesStatusById(id: string): Promise<any | null> {
    const salesStatus = await SalesStatus.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!salesStatus) return null;
    return salesStatus.toObject();
  },

  /**
   * Get sales status by code
   */
  async getSalesStatusByCode(statusCode: string): Promise<any | null> {
    const salesStatus = await SalesStatus.findOne({
      statusCode: statusCode.toUpperCase(),
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!salesStatus) return null;
    return salesStatus.toObject();
  },

  /**
   * Get all sales statuses with pagination
   */
  async getSalesStatuses(params: SalesStatusQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'sequence',
      sortOrder = 'asc',
      statusType,
      isActive,
      allowsSale,
      requiresApproval,
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
        { statusName: { $regex: search, $options: 'i' } },
        { statusCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Status type filter
    if (statusType && statusType.length > 0) {
      query.statusType = { $in: statusType };
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Allows sale filter
    if (allowsSale !== undefined) {
      query.allowsSale = allowsSale;
    }

    // Requires approval filter
    if (requiresApproval !== undefined) {
      query.requiresApproval = requiresApproval;
    }

    // Execute queries
    const [salesStatuses, total] = await Promise.all([
      SalesStatus.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      SalesStatus.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = {
      totalStatuses: salesStatuses.length,
      activeStatuses: salesStatuses.filter(status => status.isActive).length,
      salesAllowedCount: salesStatuses.filter(status => status.allowsSale).length,
      byType: {} as Record<SalesStatusType, number>,
    };

    // Initialize type counters
    Object.values(SalesStatusType).forEach(type => {
      summary.byType[type] = 0;
    });

    // Count statuses by type
    salesStatuses.forEach(status => {
      summary.byType[status.statusType] = (summary.byType[status.statusType] || 0) + 1;
    });

    return {
      salesStatuses,
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
   * Update sales status
   */
  async updateSalesStatus(
    id: string,
    data: UpdateSalesStatusDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    // Check if status code is being updated and if it already exists
    if (data.statusCode) {
      const existingCode = await SalesStatus.findOne({
        statusCode: data.statusCode.toUpperCase(),
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingCode) {
        throw new Error(`Sales Status with code ${data.statusCode} already exists`);
      }
    }

    // Check if status name is being updated and if it already exists
    if (data.statusName) {
      const existingName = await SalesStatus.findOne({
        statusName: { $regex: new RegExp(`^${data.statusName}$`, 'i') },
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingName) {
        throw new Error(`Sales Status with name ${data.statusName} already exists`);
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefault === true) {
      await SalesStatus.updateMany(
        {
          _id: { $ne: id },
          isDeleted: false,
        },
        { $set: { isDefault: false } }
      );
    }

    const salesStatus = await SalesStatus.findByIdAndUpdate(
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

    if (!salesStatus) return null;
    return salesStatus.toObject();
  },

  /**
   * Delete sales status (soft delete)
   */
  async deleteSalesStatus(id: string, userId: Types.ObjectId): Promise<boolean> {
    // Check if this is a default status
    const status = await SalesStatus.findById(id);
    if (status?.isDefault) {
      throw new Error('Cannot delete default sales status');
    }

    // Check if status is in use (you might want to check in plots/sales tables)
    // const inUse = await Plot.countDocuments({ salesStatus: id });
    // if (inUse > 0) {
    //   throw new Error('Cannot delete status that is in use');
    // }

    const result = await SalesStatus.findByIdAndUpdate(
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
   * Get active sales statuses
   */
  async getActiveSalesStatuses(): Promise<any[]> {
    const salesStatuses = await SalesStatus.find({
      isActive: true,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ sequence: 1, statusName: 1 });

    return salesStatuses.map(status => status.toObject());
  },

  /**
   * Get default sales status
   */
  async getDefaultSalesStatus(): Promise<any | null> {
    const salesStatus = await SalesStatus.findOne({
      isDefault: true,
      isActive: true,
      isDeleted: false,
    }).populate('createdBy', 'firstName lastName email');

    if (!salesStatus) return null;
    return salesStatus.toObject();
  },

  /**
   * Get statuses by type
   */
  async getStatusesByType(statusType: SalesStatusType): Promise<any[]> {
    const salesStatuses = await SalesStatus.find({
      statusType,
      isActive: true,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ sequence: 1 });

    return salesStatuses.map(status => status.toObject());
  },

  /**
   * Get statuses that allow sales
   */
  async getSalesAllowedStatuses(): Promise<any[]> {
    const salesStatuses = await SalesStatus.find({
      allowsSale: true,
      isActive: true,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ sequence: 1 });

    return salesStatuses.map(status => status.toObject());
  },

  /**
   * Validate status transition
   */
  async validateStatusTransition(data: WorkflowValidationDto): Promise<{
    isValid: boolean;
    message?: string;
    allowedTransitions?: string[];
  }> {
    const currentStatus = await SalesStatus.findById(data.currentStatusId);
    const targetStatus = await SalesStatus.findById(data.targetStatusId);

    if (!currentStatus || !targetStatus) {
      return {
        isValid: false,
        message: 'One or both statuses not found',
      };
    }

    // Check if target status is in allowed transitions
    const allowedTransitions = currentStatus.allowedTransitions || [];
    const isValid = allowedTransitions.includes(targetStatus.statusType);

    return {
      isValid,
      message: isValid
        ? 'Transition is valid'
        : `Cannot transition from ${currentStatus.statusName} to ${targetStatus.statusName}`,
      allowedTransitions: allowedTransitions,
    };
  },

  /**
   * Get status workflow information
   */
  async getStatusWorkflow(currentStatusId: string): Promise<StatusWorkflow | null> {
    const currentStatusDoc = await SalesStatus.findById(currentStatusId).populate(
      'createdBy',
      'firstName lastName email'
    );

    if (!currentStatusDoc) return null;

    const currentStatus = currentStatusDoc.toObject() as any;

    // Get all allowed transition statuses
    const allowedDocs = await SalesStatus.find({
      statusType: { $in: currentStatus.allowedTransitions ?? [] },
      isActive: true,
      isDeleted: false,
    }).sort({ sequence: 1 });

    const allowedTransitions = allowedDocs.map(doc => doc.toObject() as any);

    return {
      currentStatus,
      allowedTransitions,
      validationRules: this.getValidationRules(currentStatus.statusType),
    };
  },
  /**
   * Get validation rules for status transitions
   */
  getValidationRules(statusType: SalesStatusType): any[] {
    const rules: Record<SalesStatusType, any[]> = {
      [SalesStatusType.AVAILABLE]: [],
      [SalesStatusType.BOOKED]: [
        {
          field: 'depositPaid',
          required: true,
          message: 'Deposit payment is required for booking',
        },
        { field: 'bookingDate', required: true, message: 'Booking date is required' },
      ],
      [SalesStatusType.RESERVED]: [
        { field: 'reservationFee', required: true, message: 'Reservation fee is required' },
        { field: 'reservationDate', required: true, message: 'Reservation date is required' },
      ],
      [SalesStatusType.ALLOTTED]: [
        { field: 'allotmentLetter', required: true, message: 'Allotment letter is required' },
        { field: 'allotmentDate', required: true, message: 'Allotment date is required' },
      ],
      [SalesStatusType.CONTRACTED]: [
        { field: 'contractNumber', required: true, message: 'Contract number is required' },
        { field: 'contractDate', required: true, message: 'Contract date is required' },
      ],
      [SalesStatusType.CANCELLED]: [
        { field: 'cancellationReason', required: true, message: 'Cancellation reason is required' },
        { field: 'cancellationDate', required: true, message: 'Cancellation date is required' },
      ],
      [SalesStatusType.ON_HOLD]: [
        { field: 'holdReason', required: true, message: 'Hold reason is required' },
        { field: 'holdUntil', required: true, message: 'Hold until date is required' },
      ],
      [SalesStatusType.SOLD]: [
        { field: 'saleDate', required: true, message: 'Sale date is required' },
        { field: 'saleAmount', required: true, message: 'Sale amount is required' },
        { field: 'paymentCompleted', required: true, message: 'Payment must be completed' },
      ],
      [SalesStatusType.PENDING]: [
        { field: 'pendingReason', required: true, message: 'Pending reason is required' },
      ],
      [SalesStatusType.CLOSED]: [
        { field: 'closingDate', required: true, message: 'Closing date is required' },
        {
          field: 'allDocumentsSubmitted',
          required: true,
          message: 'All documents must be submitted',
        },
      ],
    };

    return rules[statusType] || [];
  },

  /**
   * Toggle sales status active status
   */
  async toggleStatusActive(id: string, userId: Types.ObjectId): Promise<any | null> {
    const salesStatus = await SalesStatus.findById(id);

    if (!salesStatus) return null;

    // Don't allow deactivating default status
    if (salesStatus.isDefault && salesStatus.isActive) {
      throw new Error('Cannot deactivate default sales status');
    }

    const updatedStatus = await SalesStatus.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !salesStatus.isActive,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return updatedStatus?.toObject();
  },

  /**
   * Update status sequence
   */
  async updateStatusSequence(
    statusId: string,
    sequence: number,
    userId: Types.ObjectId
  ): Promise<any | null> {
    if (sequence < 1) {
      throw new Error('Sequence must be at least 1');
    }

    const salesStatus = await SalesStatus.findByIdAndUpdate(
      statusId,
      {
        $set: {
          sequence,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!salesStatus) return null;
    return salesStatus.toObject();
  },

  /**
   * Reorder statuses
   */
  async reorderStatuses(
    statusOrders: Array<{ id: string; sequence: number }>,
    userId: Types.ObjectId
  ): Promise<boolean> {
    const updates = statusOrders.map(order => ({
      updateOne: {
        filter: { _id: order.id, isDeleted: false },
        update: {
          $set: {
            sequence: order.sequence,
            updatedBy: userId,
          },
        },
      },
    }));

    await SalesStatus.bulkWrite(updates);
    return true;
  },

  /**
   * Bulk update status fields
   */
  async bulkUpdateStatuses(
    data: BulkStatusUpdateDto,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    const result = await SalesStatus.updateMany(
      {
        _id: { $in: data.statusIds.map(id => new Types.ObjectId(id)) },
        isDeleted: false,
      },
      {
        $set: {
          [data.field]: data.value,
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
   * Get sales status statistics
   */
  async getSalesStatusStatistics(): Promise<any> {
    const stats = await SalesStatus.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: null,
          totalStatuses: { $sum: 1 },
          activeStatuses: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          salesAllowedCount: {
            $sum: { $cond: [{ $eq: ['$allowsSale', true] }, 1, 0] },
          },
          approvalRequiredCount: {
            $sum: { $cond: [{ $eq: ['$requiresApproval', true] }, 1, 0] },
          },
        },
      },
    ]);

    const typeStats = await SalesStatus.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: '$statusType',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const baseStats = stats[0] || {
      totalStatuses: 0,
      activeStatuses: 0,
      salesAllowedCount: 0,
      approvalRequiredCount: 0,
    };

    return {
      ...baseStats,
      byType: typeStats.reduce((acc, stat) => {
        acc[stat._id] = { total: stat.count, active: stat.activeCount };
        return acc;
      }, {}),
    };
  },

  /**
   * Get next statuses in workflow
   */
  async getNextStatuses(currentStatusId: string): Promise<any[]> {
    const currentStatus = await SalesStatus.findById(currentStatusId);

    if (!currentStatus) {
      throw new Error('Current status not found');
    }

    const allowedTransitions = currentStatus.allowedTransitions || [];

    const nextStatuses = await SalesStatus.find({
      statusType: { $in: allowedTransitions },
      isActive: true,
      isDeleted: false,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ sequence: 1 });

    return nextStatuses.map(status => status.toObject());
  },

  /**
   * Check if status allows sales
   */
  async isSalesAllowed(statusId: string): Promise<boolean> {
    const status = await SalesStatus.findById(statusId);
    return !!(status?.allowsSale && status.isActive && !status.isDeleted);
  },

  /**
   * Check if status requires approval
   */
  async requiresApproval(statusId: string): Promise<boolean> {
    const status = await SalesStatus.findById(statusId);
    return !!(status?.requiresApproval && status.isActive && !status.isDeleted);
  },
};
