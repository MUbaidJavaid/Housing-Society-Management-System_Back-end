import { Types } from 'mongoose';
import SrDevStatusModel, { DevCategory, DevPhase } from '../models/models-srdevstatus';
import {
  BulkStatusUpdateDto,
  CreateSrDevStatusDto,
  ProgressReport,
  SrDevStatus,
  SrDevStatusQueryParams,
  StatusTransitionDto,
  UpdateSrDevStatusDto,
} from '../types/types-srdevstatus';

export const srDevStatusService = {
  /**
   * Create new development status
   */
  async createSrDevStatus(data: CreateSrDevStatusDto, userId: Types.ObjectId): Promise<any> {
    // Check if status code already exists
    const existingCode = await SrDevStatusModel.findOne({
      srDevStatCode: data.srDevStatCode.toUpperCase(),
      isDeleted: false,
    });

    if (existingCode) {
      throw new Error(`Development Status with code ${data.srDevStatCode} already exists`);
    }

    // Check if status name already exists
    const existingName = await SrDevStatusModel.findOne({
      srDevStatName: { $regex: new RegExp(`^${data.srDevStatName}$`, 'i') },
      isDeleted: false,
    });

    if (existingName) {
      throw new Error(`Development Status with name ${data.srDevStatName} already exists`);
    }

    // Validate percentage based on phase
    this.validatePhasePercentage(data.devPhase, data.percentageComplete || 0);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await SrDevStatusModel.updateMany({ isDeleted: false }, { $set: { isDefault: false } });
    }

    // Convert allowedTransitions string array to ObjectId array
    const allowedTransitions = data.allowedTransitions
      ? data.allowedTransitions.map(id => new Types.ObjectId(id))
      : [];

    const srDevStatusData = {
      ...data,
      srDevStatCode: data.srDevStatCode.toUpperCase(),
      colorCode: data.colorCode || '#808080',
      isActive: data.isActive !== undefined ? data.isActive : true,
      isDefault: data.isDefault || false,
      sequence: data.sequence || 1,
      percentageComplete: data.percentageComplete || 0,
      requiresDocumentation: data.requiresDocumentation || false,
      allowedTransitions,
      estimatedDurationDays: data.estimatedDurationDays || 0,
      createdBy: userId,
      updatedBy: userId,
    };

    const srDevStatus = await SrDevStatusModel.create(srDevStatusData);
    return srDevStatus;
  },

  /**
   * Get development status by ID
   */
  async getSrDevStatusById(id: string): Promise<any | null> {
    const srDevStatus = await SrDevStatusModel.findById(id)
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!srDevStatus) return null;
    return srDevStatus.toObject();
  },

  /**
   * Get development status by code
   */
  async getSrDevStatusByCode(statusCode: string): Promise<any | null> {
    const srDevStatus = await SrDevStatusModel.findOne({
      srDevStatCode: statusCode.toUpperCase(),
      isDeleted: false,
    })
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!srDevStatus) return null;
    return srDevStatus.toObject();
  },

  /**
   * Get all development statuses with pagination
   */
  async getSrDevStatuses(params: SrDevStatusQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'sequence',
      sortOrder = 'asc',
      devCategory,
      devPhase,
      isActive,
      requiresDocumentation,
      minPercentage,
      maxPercentage,
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
        { srDevStatName: { $regex: search, $options: 'i' } },
        { srDevStatCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (devCategory && devCategory.length > 0) {
      query.devCategory = { $in: devCategory };
    }

    // Phase filter
    if (devPhase && devPhase.length > 0) {
      query.devPhase = { $in: devPhase };
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Documentation requirement filter
    if (requiresDocumentation !== undefined) {
      query.requiresDocumentation = requiresDocumentation;
    }

    // Percentage range filter
    if (minPercentage !== undefined || maxPercentage !== undefined) {
      query.percentageComplete = {};
      if (minPercentage !== undefined) query.percentageComplete.$gte = minPercentage;
      if (maxPercentage !== undefined) query.percentageComplete.$lte = maxPercentage;
    }

    // Execute queries
    const [srDevStatuses, total] = await Promise.all([
      SrDevStatusModel.find(query)
        .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      SrDevStatusModel.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = {
      totalStatuses: srDevStatuses.length,
      activeStatuses: srDevStatuses.filter(status => status.isActive).length,
      byCategory: {} as Record<DevCategory, number>,
      byPhase: {} as Record<DevPhase, number>,
      averagePercentage:
        srDevStatuses.length > 0
          ? parseFloat(
              (
                srDevStatuses.reduce((sum, status) => sum + status.percentageComplete, 0) /
                srDevStatuses.length
              ).toFixed(1)
            )
          : 0,
    };

    // Initialize category and phase counters
    Object.values(DevCategory).forEach(category => {
      summary.byCategory[category] = 0;
    });

    Object.values(DevPhase).forEach(phase => {
      summary.byPhase[phase] = 0;
    });

    // Count statuses by category and phase
    srDevStatuses.forEach(status => {
      summary.byCategory[status.devCategory] = (summary.byCategory[status.devCategory] || 0) + 1;
      summary.byPhase[status.devPhase] = (summary.byPhase[status.devPhase] || 0) + 1;
    });

    return {
      srDevStatuses,
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
   * Update development status
   */
  async updateSrDevStatus(
    id: string,
    data: UpdateSrDevStatusDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    // Check if status code is being updated and if it already exists
    if (data.srDevStatCode) {
      const existingCode = await SrDevStatusModel.findOne({
        srDevStatCode: data.srDevStatCode.toUpperCase(),
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingCode) {
        throw new Error(`Development Status with code ${data.srDevStatCode} already exists`);
      }
    }

    // Check if status name is being updated and if it already exists
    if (data.srDevStatName) {
      const existingName = await SrDevStatusModel.findOne({
        srDevStatName: { $regex: new RegExp(`^${data.srDevStatName}$`, 'i') },
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingName) {
        throw new Error(`Development Status with name ${data.srDevStatName} already exists`);
      }
    }

    // Validate percentage based on phase if either is being updated
    if (data.devPhase !== undefined || data.percentageComplete !== undefined) {
      const currentStatus = await SrDevStatusModel.findById(id);
      if (currentStatus) {
        const phase = data.devPhase !== undefined ? data.devPhase : currentStatus.devPhase;
        const percentage =
          data.percentageComplete !== undefined
            ? data.percentageComplete
            : currentStatus.percentageComplete;
        this.validatePhasePercentage(phase, percentage);
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefault === true) {
      await SrDevStatusModel.updateMany(
        {
          _id: { $ne: id },
          isDeleted: false,
        },
        { $set: { isDefault: false } }
      );
    }

    // Convert allowedTransitions string array to ObjectId array if provided
    let updateData: any = { ...data, updatedBy: userId };
    if (data.allowedTransitions !== undefined) {
      updateData.allowedTransitions = data.allowedTransitions.map(id => new Types.ObjectId(id));
    }

    const srDevStatus = await SrDevStatusModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!srDevStatus) return null;
    return srDevStatus.toObject();
  },

  /**
   * Delete development status (soft delete)
   */
  async deleteSrDevStatus(id: string, userId: Types.ObjectId): Promise<boolean> {
    // Check if this is a default status
    const status = await SrDevStatusModel.findById(id);
    if (status?.isDefault) {
      throw new Error('Cannot delete default development status');
    }

    const result = await SrDevStatusModel.findByIdAndUpdate(
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
   * Get active development statuses
   */
  async getActiveSrDevStatuses(): Promise<any[]> {
    const srDevStatuses = await SrDevStatusModel.find({
      isActive: true,
      isDeleted: false,
    })
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
      .populate('createdBy', 'firstName lastName email')
      .sort({ sequence: 1, srDevStatName: 1 });

    return srDevStatuses.map(status => status.toObject());
  },

  /**
   * Get default development status
   */
  async getDefaultSrDevStatus(): Promise<any | null> {
    const srDevStatus = await SrDevStatusModel.findOne({
      isDefault: true,
      isActive: true,
      isDeleted: false,
    })
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
      .populate('createdBy', 'firstName lastName email');

    if (!srDevStatus) return null;
    return srDevStatus.toObject();
  },

  /**
   * Get statuses by category
   */
  async getStatusesByCategory(category: DevCategory): Promise<any[]> {
    const srDevStatuses = await SrDevStatusModel.find({
      devCategory: category,
      isActive: true,
      isDeleted: false,
    })
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
      .populate('createdBy', 'firstName lastName email')
      .sort({ sequence: 1 });

    return srDevStatuses.map(status => status.toObject());
  },

  /**
   * Get statuses by phase
   */
  async getStatusesByPhase(phase: DevPhase): Promise<any[]> {
    const srDevStatuses = await SrDevStatusModel.find({
      devPhase: phase,
      isActive: true,
      isDeleted: false,
    })
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
      .populate('createdBy', 'firstName lastName email')
      .sort({ sequence: 1 });

    return srDevStatuses.map(status => status.toObject());
  },

  /**
   * Validate phase percentage
   */
  validatePhasePercentage(phase: DevPhase, percentage: number): void {
    const phasePercentages = {
      [DevPhase.PRE_CONSTRUCTION]: { min: 0, max: 30 },
      [DevPhase.CONSTRUCTION]: { min: 31, max: 80 },
      [DevPhase.POST_CONSTRUCTION]: { min: 81, max: 99 },
      [DevPhase.COMPLETION]: { min: 100, max: 100 },
    };

    const limits = phasePercentages[phase];
    if (limits && (percentage < limits.min || percentage > limits.max)) {
      throw new Error(
        `Percentage for ${phase} phase must be between ${limits.min} and ${limits.max}`
      );
    }
  },

  /**
   * Validate status transition
   */
  async validateStatusTransition(data: StatusTransitionDto): Promise<{
    isValid: boolean;
    message?: string;
    validationRules?: any[];
    estimatedDays?: number;
  }> {
    const currentStatus = await SrDevStatusModel.findById(data.currentStatusId);
    const targetStatus = await SrDevStatusModel.findById(data.targetStatusId);

    if (!currentStatus || !targetStatus) {
      return {
        isValid: false,
        message: 'One or both statuses not found',
      };
    }

    // Check if target status is in allowed transitions
    const allowedTransitions = currentStatus.allowedTransitions || [];
    const isAllowed = allowedTransitions.some(id => id.toString() === targetStatus._id.toString());

    // Also allow transitions to higher sequence numbers (logical progression)
    const isLogical = targetStatus.sequence > currentStatus.sequence;

    const isValid = isAllowed || isLogical;

    return {
      isValid,
      message: isValid
        ? 'Transition is valid'
        : `Cannot transition from ${currentStatus.srDevStatName} to ${targetStatus.srDevStatName}`,
      validationRules: targetStatus.requiresDocumentation
        ? [
            {
              field: 'documents',
              required: true,
              message: 'Documentation is required for this status',
            },
            { field: 'remarks', required: true, message: 'Remarks are required for status change' },
          ]
        : [],
      estimatedDays: targetStatus.estimatedDurationDays,
    };
  },

  /**
   * Get next logical statuses
   */
  async getNextLogicalStatuses(currentStatusId: string): Promise<any[]> {
    const currentStatus = await SrDevStatusModel.findById(currentStatusId);

    if (!currentStatus) {
      throw new Error('Current status not found');
    }

    // First try allowed transitions
    if (currentStatus.allowedTransitions && currentStatus.allowedTransitions.length > 0) {
      const nextStatuses = await SrDevStatusModel.find({
        _id: { $in: currentStatus.allowedTransitions },
        isActive: true,
        isDeleted: false,
      })
        .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
        .sort({ sequence: 1 });

      return nextStatuses.map(status => status.toObject());
    }

    // Otherwise get next statuses by sequence
    const nextStatuses = await SrDevStatusModel.find({
      sequence: { $gt: currentStatus.sequence },
      isActive: true,
      isDeleted: false,
    })
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
      .sort({ sequence: 1 })
      .limit(3);

    return nextStatuses.map(status => status.toObject());
  },

  /**
   * Get development workflow
   */
  async getDevelopmentWorkflow(): Promise<any[]> {
    const srDevStatuses = await SrDevStatusModel.find({
      isActive: true,
      isDeleted: false,
    })
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
      .sort({ sequence: 1 });

    // Group by phase
    const workflowByPhase: Record<DevPhase, any[]> = {
      [DevPhase.PRE_CONSTRUCTION]: [],
      [DevPhase.CONSTRUCTION]: [],
      [DevPhase.POST_CONSTRUCTION]: [],
      [DevPhase.COMPLETION]: [],
    };

    srDevStatuses.forEach(status => {
      const statusObj = status.toObject();
      workflowByPhase[status.devPhase].push(statusObj);
    });

    // Calculate phase progress
    const workflow = Object.entries(workflowByPhase).map(([phase, statuses]) => {
      const phaseData = statuses as any[];
      const phaseProgress =
        phaseData.length > 0
          ? Math.round(
              phaseData.reduce((sum, status) => sum + status.percentageComplete, 0) /
                phaseData.length
            )
          : 0;

      return {
        phase: phase as DevPhase,
        statuses: phaseData,
        phaseProgress,
        totalStatuses: phaseData.length,
        estimatedDuration: phaseData.reduce(
          (sum, status) => sum + (status.estimatedDurationDays || 0),
          0
        ),
      };
    });

    return workflow;
  },

  /**
   * Toggle development status active status
   */
  async toggleStatusActive(id: string, userId: Types.ObjectId): Promise<any | null> {
    const srDevStatus = await SrDevStatusModel.findById(id);

    if (!srDevStatus) return null;

    // Don't allow deactivating default status
    if (srDevStatus.isDefault && srDevStatus.isActive) {
      throw new Error('Cannot deactivate default development status');
    }

    const updatedStatus = await SrDevStatusModel.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !srDevStatus.isActive,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
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

    const srDevStatus = await SrDevStatusModel.findByIdAndUpdate(
      statusId,
      {
        $set: {
          sequence,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('allowedTransitions', 'srDevStatName srDevStatCode devCategory devPhase sequence')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!srDevStatus) return null;
    return srDevStatus.toObject();
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
        filter: { _id: new Types.ObjectId(order.id), isDeleted: false },
        update: {
          $set: {
            sequence: order.sequence,
            updatedBy: userId,
          },
        },
      },
    }));

    await SrDevStatusModel.bulkWrite(updates);
    return true;
  },

  /**
   * Bulk update status fields
   */
  async bulkUpdateStatuses(
    data: BulkStatusUpdateDto,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    const result = await SrDevStatusModel.updateMany(
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
   * Get development status statistics
   */
  async getSrDevStatusStatistics(): Promise<any> {
    const stats = await SrDevStatusModel.aggregate([
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
          documentationRequiredCount: {
            $sum: { $cond: [{ $eq: ['$requiresDocumentation', true] }, 1, 0] },
          },
          avgPercentageComplete: { $avg: '$percentageComplete' },
          totalEstimatedDuration: { $sum: '$estimatedDurationDays' },
        },
      },
    ]);

    const categoryStats = await SrDevStatusModel.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: '$devCategory',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          avgPercentage: { $avg: '$percentageComplete' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const phaseStats = await SrDevStatusModel.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: '$devPhase',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          avgPercentage: { $avg: '$percentageComplete' },
          totalDuration: { $sum: '$estimatedDurationDays' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const baseStats = stats[0] || {
      totalStatuses: 0,
      activeStatuses: 0,
      documentationRequiredCount: 0,
      avgPercentageComplete: 0,
      totalEstimatedDuration: 0,
    };

    return {
      ...baseStats,
      byCategory: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          active: stat.activeCount,
          avgPercentage: parseFloat(stat.avgPercentage?.toFixed(1) || '0'),
        };
        return acc;
      }, {}),
      byPhase: phaseStats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          active: stat.activeCount,
          avgPercentage: parseFloat(stat.avgPercentage?.toFixed(1) || '0'),
          totalDuration: stat.totalDuration,
        };
        return acc;
      }, {}),
    };
  },

  /**
   * Calculate project development progress
   */
  async calculateProjectProgress(statusIds: string[]): Promise<ProgressReport> {
    const statuses = await SrDevStatusModel.find({
      _id: { $in: statusIds.map(id => new Types.ObjectId(id)) },
      isActive: true,
      isDeleted: false,
    }).sort({ sequence: 1 });

    if (statuses.length === 0) {
      return {
        currentStatus: null as any,
        nextStatuses: [],
        overallProgress: 0,
        timeline: [],
      };
    }

    const currentStatus = statuses[statuses.length - 1];
    const nextStatuses = await this.getNextLogicalStatuses(currentStatus._id.toString());

    // Calculate overall progress based on current status percentage
    const overallProgress = currentStatus.percentageComplete;

    const timeline = statuses.map((status, index) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (statuses.length - index) * 7);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (status.estimatedDurationDays || 7));

      return {
        status: status as unknown as SrDevStatus, // ✅ type-cast
        startDate,
        endDate,
        actualEndDate: index < statuses.length - 1 ? endDate : undefined,
        isCompleted: index < statuses.length - 1,
        durationDays: status.estimatedDurationDays || 7,
      };
    });

    return {
      currentStatus: currentStatus as unknown as SrDevStatus,
      nextStatuses: nextStatuses,
      overallProgress,
      timeline,
    };
  },

  /**
   * Get development phases with progress
   */
  async getDevelopmentPhasesProgress(): Promise<
    Array<{
      phase: DevPhase;
      phaseName: string;
      statuses: any[];
      phaseProgress: number;
      estimatedDuration: number;
      completedStatuses: number;
      totalStatuses: number;
    }>
  > {
    const srDevStatuses = await SrDevStatusModel.find({
      isActive: true,
      isDeleted: false,
    }).sort({ sequence: 1 });

    const phases = Object.values(DevPhase);

    return phases.map(phase => {
      const phaseStatuses = srDevStatuses.filter(status => status.devPhase === phase);
      const phaseProgress =
        phaseStatuses.length > 0
          ? Math.round(
              phaseStatuses.reduce((sum, status) => sum + status.percentageComplete, 0) /
                phaseStatuses.length
            )
          : 0;

      const phaseNames = {
        [DevPhase.PRE_CONSTRUCTION]: 'Pre-Construction',
        [DevPhase.CONSTRUCTION]: 'Construction',
        [DevPhase.POST_CONSTRUCTION]: 'Post-Construction',
        [DevPhase.COMPLETION]: 'Completion',
      };

      return {
        phase,
        phaseName: phaseNames[phase] || phase,
        statuses: phaseStatuses.map(status => status.toObject()),
        phaseProgress,
        estimatedDuration: phaseStatuses.reduce(
          (sum, status) => sum + (status.estimatedDurationDays || 0),
          0
        ),
        completedStatuses: phaseStatuses.filter(status => status.percentageComplete === 100).length,
        totalStatuses: phaseStatuses.length,
      };
    });
  },

  /**
   * Check if status requires documentation
   */
  async requiresDocumentation(statusId: string): Promise<boolean> {
    const status = await SrDevStatusModel.findById(statusId);
    return !!(status?.requiresDocumentation && status.isActive && !status.isDeleted);
  },

  /**
   * Get estimated completion time for status
   */
  async getEstimatedCompletion(statusId: string): Promise<{
    estimatedDays: number;
    formattedText: string;
  }> {
    const status = await SrDevStatusModel.findById(statusId);

    if (!status) {
      throw new Error('Status not found');
    }

    const estimatedDays = status.estimatedDurationDays || 0;
    let formattedText = 'No estimate';

    if (estimatedDays > 0) {
      if (estimatedDays === 1) formattedText = '1 day';
      else if (estimatedDays < 30) formattedText = `${estimatedDays} days`;
      else {
        const months = Math.round(estimatedDays / 30);
        formattedText = months === 1 ? '1 month' : `${months} months`;
      }
    }

    return {
      estimatedDays,
      formattedText,
    };
  },
};
