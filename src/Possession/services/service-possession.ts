import { Types } from 'mongoose';
import Possession, { PossessionStatus } from '../models/models-possession';
import {
  BulkStatusUpdateDto,
  CollectorUpdateDto,
  CreatePossessionDto,
  HandoverCertificateDto,
  PossessionQueryParams,
  PossessionReportDto,
  StatusTransitionDto,
  UpdatePossessionDto,
} from '../types/types-possession';
interface IPlot {
  plotStatus: string;
}

interface IFile {
  paymentStatus: string;
}

interface PopulatedFile {
  fileNumber?: string;
  customerName?: string;
  customerCnic?: string;
  customerPhone?: string;
  customerFatherName?: string;
  customerAddress?: string;
  paymentStatus?: string;
}

interface PopulatedPlot {
  plotNumber?: string;
  plotSize?: string;
  blockName?: string;
  projName?: string;
  plotStatus?: string;
  dimensions?: string;
}

interface PopulatedUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  designation?: string;
}

type PopulatedPossession = {
  fileId?: Types.ObjectId | PopulatedFile;
  plotId?: Types.ObjectId | PopulatedPlot;
  possessionHandoverCSR?: Types.ObjectId | PopulatedUser;
  createdBy?: Types.ObjectId | PopulatedUser;
  updatedBy?: Types.ObjectId | PopulatedUser;
};

export const possessionService = {
  /**
   * Create new possession request
   */
  async createPossession(data: CreatePossessionDto, userId: Types.ObjectId): Promise<any> {
    // Generate possession code
    const possessionCode = await Possession.generatePossessionCode();

    // Check if plot already has an active possession request
    const existingPossession = await Possession.findOne({
      plotId: new Types.ObjectId(data.plotId),
      isDeleted: false,
      possessionStatus: { $nin: [PossessionStatus.CANCELLED, PossessionStatus.HANDED_OVER] },
    });

    if (existingPossession) {
      throw new Error(
        `Plot already has an active possession request (${existingPossession.possessionCode})`
      );
    }

    const possessionData = {
      ...data,
      possessionCode,
      fileId: new Types.ObjectId(data.fileId),
      plotId: new Types.ObjectId(data.plotId),
      possessionHandoverCSR: new Types.ObjectId(data.possessionHandoverCSR),
      possessionStatus: data.possessionStatus || PossessionStatus.REQUESTED,
      possessionIsCollected: false,
      createdBy: userId,
      updatedBy: userId,
    };

    const possession = await Possession.create(possessionData);
    return possession;
  },

  /**
   * Get possession by ID
   */
  async getPossessionById(id: string): Promise<any | null> {
    const possession = await Possession.findById(id)
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('plotId', 'plotNumber plotSize blockName')
      .populate('possessionHandoverCSR', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!possession) return null;
    return possession.toObject();
  },

  /**
   * Get possession by code
   */
  async getPossessionByCode(possessionCode: string): Promise<any | null> {
    const possession = await Possession.findOne({
      possessionCode: possessionCode.toUpperCase(),
      isDeleted: false,
    })
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('plotId', 'plotNumber plotSize blockName')
      .populate('possessionHandoverCSR', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!possession) return null;
    return possession.toObject();
  },

  /**
   * Get all possessions with pagination
   */
  async getPossessions(params: PossessionQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'possessionInitDate',
      sortOrder = 'desc',
      fileId,
      plotId,
      status,
      isCollected,
      csrId,
      startDate,
      endDate,
      minDuration,
      maxDuration,
      projectId,
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search by multiple fields
    if (search) {
      query.$or = [
        { possessionCode: { $regex: search, $options: 'i' } },
        { possessionCollectorName: { $regex: search, $options: 'i' } },
        { possessionCollectorNic: { $regex: search, $options: 'i' } },
        { possessionRemarks: { $regex: search, $options: 'i' } },
        { possessionSurveyRemarks: { $regex: search, $options: 'i' } },
        { possessionHandoverRemarks: { $regex: search, $options: 'i' } },
      ];
    }

    // File filter
    if (fileId) {
      query.fileId = new Types.ObjectId(fileId);
    }

    // Plot filter
    if (plotId) {
      query.plotId = new Types.ObjectId(plotId);
    }

    // Status filter
    if (status && status.length > 0) {
      query.possessionStatus = { $in: status };
    }

    // Collected filter
    if (isCollected !== undefined) {
      query.possessionIsCollected = isCollected;
    }

    // CSR filter
    if (csrId) {
      query.possessionHandoverCSR = new Types.ObjectId(csrId);
    }

    // Date range filter
    if (startDate || endDate) {
      query.possessionInitDate = {};
      if (startDate) query.possessionInitDate.$gte = new Date(startDate);
      if (endDate) query.possessionInitDate.$lte = new Date(endDate);
    }

    // Project filter (through plot population)
    if (projectId) {
      // This would require additional population logic
      // For now, we'll handle it separately if needed
    }

    // Execute queries with population
    const [possessions, total] = await Promise.all([
      Possession.find(query)
        .populate('fileId', 'fileNumber customerName customerCnic')
        .populate('plotId', 'plotNumber plotSize blockName')
        .populate('possessionHandoverCSR', 'firstName lastName email phone')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      Possession.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = {
      totalPossessions: possessions.length,
      byStatus: {} as Record<PossessionStatus, number>,
      collectedCount: possessions.filter(p => p.possessionIsCollected).length,
      pendingCount: possessions.filter(
        p =>
          p.possessionStatus !== PossessionStatus.HANDED_OVER &&
          p.possessionStatus !== PossessionStatus.CANCELLED
      ).length,
      averageDuration: 0,
    };

    // Initialize status counters
    Object.values(PossessionStatus).forEach(status => {
      summary.byStatus[status] = 0;
    });

    // Calculate durations and count statuses
    let totalDuration = 0;
    let durationCount = 0;

    possessions.forEach((possession: any) => {
      const status = possession.possessionStatus as PossessionStatus;
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

      if (possession.possessionDurationDays) {
        totalDuration += possession.possessionDurationDays;
        durationCount++;
      }
    });

    if (durationCount > 0) {
      summary.averageDuration = parseFloat((totalDuration / durationCount).toFixed(1));
    }

    // Apply duration filters after calculation
    if (minDuration !== undefined || maxDuration !== undefined) {
      const filteredPossessions = possessions.filter(possession => {
        const duration = possession.possessionDurationDays || 0;
        if (minDuration !== undefined && duration < minDuration) return false;
        if (maxDuration !== undefined && duration > maxDuration) return false;
        return true;
      });

      return {
        possessions: filteredPossessions,
        summary,
        pagination: {
          page,
          limit,
          total: filteredPossessions.length,
          pages: Math.ceil(filteredPossessions.length / limit),
        },
      };
    }

    return {
      possessions,
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
   * Update possession
   */
  async updatePossession(
    id: string,
    data: UpdatePossessionDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const updateData: any = { ...data, updatedBy: userId };

    // Convert ObjectId fields if provided
    if (data.possessionHandoverCSR) {
      updateData.possessionHandoverCSR = new Types.ObjectId(data.possessionHandoverCSR);
    }

    // Handle status-specific updates
    if (data.possessionStatus) {
      const possession = await Possession.findById(id);
      if (possession) {
        // Validate status transition
        const allowedTransitions = possession.allowedNextStatuses || [];
        if (
          !allowedTransitions.includes(data.possessionStatus) &&
          data.possessionStatus !== possession.possessionStatus
        ) {
          throw new Error(
            `Cannot transition from ${possession.possessionStatus} to ${data.possessionStatus}`
          );
        }

        // Set dates based on status
        if (
          data.possessionStatus === PossessionStatus.HANDED_OVER &&
          !data.possessionHandoverDate
        ) {
          updateData.possessionHandoverDate = new Date();
        }

        if (data.possessionStatus === PossessionStatus.SURVEYED && !data.possessionSurveyDate) {
          updateData.possessionSurveyDate = new Date();
        }
      }
    }

    const possession = await Possession.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('plotId', 'plotNumber plotSize blockName')
      .populate('possessionHandoverCSR', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!possession) return null;
    return possession.toObject();
  },

  /**
   * Delete possession (soft delete)
   */
  async deletePossession(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await Possession.findByIdAndUpdate(
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
   * Update possession status
   */
  async updatePossessionStatus(
    data: StatusTransitionDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const possession = await Possession.findById(data.possessionId);

    if (!possession) {
      throw new Error('Possession not found');
    }

    // Validate status transition
    const allowedTransitions = possession.allowedNextStatuses || [];
    if (
      !allowedTransitions.includes(data.newStatus) &&
      data.newStatus !== possession.possessionStatus
    ) {
      throw new Error(`Cannot transition from ${possession.possessionStatus} to ${data.newStatus}`);
    }

    const updateData: any = {
      possessionStatus: data.newStatus,
      updatedBy: userId,
    };

    // Set dates based on status
    if (data.newStatus === PossessionStatus.HANDED_OVER) {
      updateData.possessionHandoverDate = data.handoverDate || new Date();
      updateData.possessionHandoverRemarks = data.remarks;
    }

    if (data.newStatus === PossessionStatus.SURVEYED) {
      updateData.possessionSurveyDate = data.surveyDate || new Date();
      updateData.possessionSurveyPerson = data.surveyPerson;
      updateData.possessionSurveyRemarks = data.remarks;
    }

    if (data.newStatus === PossessionStatus.READY) {
      updateData.possessionRemarks = data.remarks;
    }

    if (
      data.newStatus === PossessionStatus.CANCELLED ||
      data.newStatus === PossessionStatus.ON_HOLD
    ) {
      updateData.possessionRemarks = data.remarks;
    }

    // Update attachments if provided
    if (data.attachments) {
      if (data.attachments.certificate) {
        updateData.possessionAttachment1 = data.attachments.certificate;
      }
      if (data.attachments.photo) {
        updateData.possessionAttachment2 = data.attachments.photo;
      }
      if (data.attachments.other) {
        updateData.possessionAttachment3 = data.attachments.other;
      }
    }

    const updatedPossession = await Possession.findByIdAndUpdate(
      data.possessionId,
      { $set: updateData },
      { new: true }
    )
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('plotId', 'plotNumber plotSize blockName')
      .populate('possessionHandoverCSR', 'firstName lastName email phone');

    if (!updatedPossession) return null;
    return updatedPossession.toObject();
  },

  /**
   * Update collector information
   */
  async updateCollectorInfo(data: CollectorUpdateDto, userId: Types.ObjectId): Promise<any | null> {
    const updateData = {
      possessionIsCollected: data.isCollected,
      possessionCollectorName: data.collectorName,
      possessionCollectorNic: data.collectorNic,
      possessionCollectionDate: data.collectionDate || new Date(),
      updatedBy: userId,
    };

    const possession = await Possession.findByIdAndUpdate(
      data.possessionId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('plotId', 'plotNumber plotSize blockName')
      .populate('possessionHandoverCSR', 'firstName lastName email phone');

    if (!possession) return null;
    return possession.toObject();
  },

  /**
   * Get possessions by file ID
   */
  async getPossessionsByFile(fileId: string): Promise<any[]> {
    const possessions = await Possession.find({
      fileId: new Types.ObjectId(fileId),
      isDeleted: false,
    })
      .populate('plotId', 'plotNumber plotSize blockName')
      .populate('possessionHandoverCSR', 'firstName lastName email phone')
      .sort({ possessionInitDate: -1 });

    return possessions.map(possession => possession.toObject());
  },

  /**
   * Get possessions by plot ID
   */
  async getPossessionsByPlot(plotId: string): Promise<any[]> {
    const possessions = await Possession.find({
      plotId: new Types.ObjectId(plotId),
      isDeleted: false,
    })
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('possessionHandoverCSR', 'firstName lastName email phone')
      .sort({ possessionInitDate: -1 });

    return possessions.map(possession => possession.toObject());
  },

  /**
   * Get possessions by status
   */
  async getPossessionsByStatus(status: PossessionStatus): Promise<any[]> {
    const possessions = await Possession.find({
      possessionStatus: status,
      isDeleted: false,
    })
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('plotId', 'plotNumber plotSize blockName')
      .populate('possessionHandoverCSR', 'firstName lastName email phone')
      .sort({ possessionInitDate: 1 });

    return possessions.map(possession => possession.toObject());
  },

  /**
   * Get pending possessions (not handed over or cancelled)
   */
  async getPendingPossessions(): Promise<any[]> {
    const possessions = await Possession.find({
      possessionStatus: {
        $nin: [PossessionStatus.HANDED_OVER, PossessionStatus.CANCELLED],
      },
      isDeleted: false,
    })
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('plotId', 'plotNumber plotSize blockName')
      .populate('possessionHandoverCSR', 'firstName lastName email phone')
      .sort({ possessionInitDate: 1 });

    return possessions.map(possession => possession.toObject());
  },

  /**
   * Get possessions by CSR (Customer Service Representative)
   */
  async getPossessionsByCSR(csrId: string): Promise<any[]> {
    const possessions = await Possession.find({
      possessionHandoverCSR: new Types.ObjectId(csrId),
      isDeleted: false,
    })
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('plotId', 'plotNumber plotSize blockName')
      .sort({ possessionInitDate: -1 });

    return possessions.map(possession => possession.toObject());
  },

  /**
   * Get possession statistics
   */
  async getPossessionStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    const stats = await Possession.getPossessionStatistics(startDate, endDate);

    // Get additional statistics
    const [totalCount, collectedCount, pendingCount] = await Promise.all([
      Possession.countDocuments({ isDeleted: false }),
      Possession.countDocuments({
        isDeleted: false,
        possessionIsCollected: true,
      }),
      Possession.countDocuments({
        isDeleted: false,
        possessionStatus: {
          $nin: [PossessionStatus.HANDED_OVER, PossessionStatus.CANCELLED],
        },
      }),
    ]);

    // Calculate average processing time for handed over possessions
    const handedOverStats = await Possession.aggregate([
      {
        $match: {
          isDeleted: false,
          possessionStatus: PossessionStatus.HANDED_OVER,
          possessionHandoverDate: { $exists: true },
          possessionInitDate: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgProcessingDays: {
            $avg: {
              $divide: [
                { $subtract: ['$possessionHandoverDate', '$possessionInitDate'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          minProcessingDays: {
            $min: {
              $divide: [
                { $subtract: ['$possessionHandoverDate', '$possessionInitDate'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          maxProcessingDays: {
            $max: {
              $divide: [
                { $subtract: ['$possessionHandoverDate', '$possessionInitDate'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
      },
    ]);

    const statsByStatus: Record<PossessionStatus, number> = {} as Record<PossessionStatus, number>;
    Object.values(PossessionStatus).forEach(status => {
      statsByStatus[status] = 0;
    });

    stats.forEach((stat: any) => {
      statsByStatus[stat._id as PossessionStatus] = stat.count;
    });

    return {
      totalCount,
      collectedCount,
      pendingCount,
      byStatus: statsByStatus,
      processingTimes: handedOverStats[0] || {
        avgProcessingDays: 0,
        minProcessingDays: 0,
        maxProcessingDays: 0,
      },
      detailedStats: stats,
    };
  },

  /**
   * Generate possession report
   */
  async generatePossessionReport(data: PossessionReportDto): Promise<any[]> {
    const matchStage: any = {
      isDeleted: false,
      possessionInitDate: {
        $gte: new Date(data.startDate),
        $lte: new Date(data.endDate),
      },
    };

    if (data.status) {
      matchStage.possessionStatus = data.status;
    }

    if (data.csrId) {
      matchStage.possessionHandoverCSR = new Types.ObjectId(data.csrId);
    }

    const possessions = await Possession.find(matchStage)
      .populate('fileId', 'fileNumber customerName customerCnic customerPhone')
      .populate('plotId', 'plotNumber plotSize blockName projName')
      .populate('possessionHandoverCSR', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ possessionInitDate: 1 });

    return possessions.map(possession => {
      const obj = possession.toObject() as PopulatedPossession & any;

      return {
        possessionCode: obj.possessionCode,
        fileNumber: obj.fileId?.fileNumber,
        customerName: obj.fileId?.customerName,
        customerCnic: obj.fileId?.customerCnic,
        customerPhone: obj.fileId?.customerPhone,
        plotNumber: obj.plotId?.plotNumber,
        plotSize: obj.plotId?.plotSize,
        blockName: obj.plotId?.blockName,
        projName: obj.plotId?.projName,
        possessionStatus: obj.possessionStatus,
        possessionInitDate: obj.possessionInitDate,
        possessionHandoverDate: obj.possessionHandoverDate,
        possessionSurveyDate: obj.possessionSurveyDate,
        possessionSurveyPerson: obj.possessionSurveyPerson,
        possessionIsCollected: obj.possessionIsCollected,
        possessionCollectorName: obj.possessionCollectorName,
        possessionCollectorNic: obj.possessionCollectorNic,
        possessionCollectionDate: obj.possessionCollectionDate,
        csrName: obj.possessionHandoverCSR
          ? `${obj.possessionHandoverCSR.firstName} ${obj.possessionHandoverCSR.lastName}`
          : '',
        createdBy: obj.createdBy ? `${obj.createdBy.firstName} ${obj.createdBy.lastName}` : '',
        possessionRemarks: obj.possessionRemarks,
        possessionDurationDays: obj.possessionDurationDays,
      };
    });
  },

  /**
   * Bulk update possession statuses
   */
  async bulkUpdatePossessionStatus(
    data: BulkStatusUpdateDto,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number; errors: string[] }> {
    const errors: string[] = [];
    const updates = data.possessionIds.map(async possessionId => {
      try {
        const possession = await Possession.findById(possessionId);
        if (!possession) {
          errors.push(`Possession ${possessionId} not found`);
          return null;
        }

        // Validate status transition
        const allowedTransitions = possession.allowedNextStatuses || [];
        if (
          !allowedTransitions.includes(data.status) &&
          data.status !== possession.possessionStatus
        ) {
          errors.push(
            `Cannot transition ${possession.possessionCode} from ${possession.possessionStatus} to ${data.status}`
          );
          return null;
        }

        const updateData: any = {
          possessionStatus: data.status,
          updatedBy: userId,
        };

        // Set dates based on status
        if (data.status === PossessionStatus.HANDED_OVER) {
          updateData.possessionHandoverDate = new Date();
        }

        if (data.status === PossessionStatus.SURVEYED) {
          updateData.possessionSurveyDate = new Date();
        }

        if (data.remarks) {
          updateData.possessionRemarks = data.remarks;
        }

        return { possessionId, updateData };
      } catch (error: any) {
        errors.push(`Error processing ${possessionId}: ${error.message}`);
        return null;
      }
    });

    const updateResults = await Promise.all(updates);
    const validUpdates = updateResults.filter(result => result !== null);

    if (validUpdates.length === 0) {
      return { matched: 0, modified: 0, errors };
    }

    const bulkOps = validUpdates.map(result => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(result!.possessionId) },
        update: { $set: result!.updateData },
      },
    }));

    const bulkResult = await Possession.bulkWrite(bulkOps);

    return {
      matched: bulkResult.matchedCount,
      modified: bulkResult.modifiedCount,
      errors,
    };
  },

  /**
   * Validate possession handover
   */
  async validateHandover(possessionId: string): Promise<{
    isValid: boolean;
    message?: string;
    missingFields?: string[];
  }> {
    const possession = await Possession.findById(possessionId)
      .populate('plotId', 'plotStatus')
      .populate('fileId', 'paymentStatus');

    if (!possession) {
      return {
        isValid: false,
        message: 'Possession not found',
      };
    }

    const missingFields: string[] = [];

    if ((possession.plotId as unknown as IPlot)?.plotStatus !== 'ready_for_possession') {
      missingFields.push('Plot is not ready for possession');
    }

    if ((possession.fileId as unknown as IFile)?.paymentStatus !== 'completed') {
      missingFields.push('File payments are not completed');
    }

    // Check required fields for handover
    if (!possession.possessionSurveyDate) {
      missingFields.push('Survey date is required');
    }

    if (!possession.possessionSurveyPerson) {
      missingFields.push('Surveyor name is required');
    }

    if (!possession.possessionAttachment1) {
      missingFields.push('Signed certificate is required');
    }

    if (!possession.possessionAttachment2) {
      missingFields.push('Site photo is required');
    }

    return {
      isValid: missingFields.length === 0,
      message: missingFields.length > 0 ? 'Handover validation failed' : 'Handover is valid',
      missingFields: missingFields.length > 0 ? missingFields : undefined,
    };
  },

  /**
   * Get possession timeline
   */
  async getPossessionTimeline(possessionId: string): Promise<any[]> {
    const possession = await Possession.findById(possessionId);

    if (!possession) {
      throw new Error('Possession not found');
    }

    const timeline = [
      {
        event: 'Application Submitted',
        date: possession.possessionInitDate,
        status: 'completed',
        description: 'Possession request submitted',
      },
    ];

    if (possession.possessionSurveyDate) {
      timeline.push({
        event: 'Plot Surveyed',
        date: possession.possessionSurveyDate,
        status: 'completed',
        description: `Surveyed by ${possession.possessionSurveyPerson}`,
      });
    }

    if (possession.possessionStatus === PossessionStatus.READY) {
      timeline.push({
        event: 'Ready for Handover',
        date: possession.updatedAt ?? new Date(),
        status: 'completed',
        description: 'Plot is ready for handover',
      });
    }

    if (possession.possessionHandoverDate) {
      timeline.push({
        event: 'Handed Over',
        date: possession.possessionHandoverDate,
        status: 'completed',
        description: 'Plot possession handed over to customer',
      });
    }

    if (possession.possessionCollectionDate) {
      timeline.push({
        event: 'Letter Collected',
        date: possession.possessionCollectionDate,
        status: 'completed',
        description: `Collected by ${possession.possessionCollectorName}`,
      });
    }

    // Add current status as last event
    timeline.push({
      event: 'Current Status',
      date: new Date(),
      status: 'current',
      description: possession.statusDisplayName ?? 'Current status',
    });

    // Sort by date
    timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

    return timeline;
  },

  /**
   * Search possessions near location
   */
  async searchPossessionsNearLocation(
    latitude: number,
    longitude: number,
    maxDistance: number = 5000 // in meters
  ): Promise<any[]> {
    const possessions = await Possession.find({
      possessionLatitude: { $exists: true },
      possessionLongitude: { $exists: true },
      isDeleted: false,
      possessionStatus: PossessionStatus.HANDED_OVER,
    })
      .populate('fileId', 'fileNumber customerName customerCnic')
      .populate('plotId', 'plotNumber plotSize blockName projName')
      .where('possessionLatitude')
      .near({
        center: [longitude, latitude],
        maxDistance: maxDistance / 111300, // Convert meters to degrees (approx)
        spherical: true,
      })
      .limit(50);

    return possessions.map(possession => possession.toObject());
  },

  /**
   * Get overdue possessions (pending for more than 30 days)
   */
  async getOverduePossessions(daysThreshold: number = 30): Promise<any[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const possessions = await Possession.find({
      possessionInitDate: { $lt: thresholdDate },
      possessionStatus: {
        $nin: [PossessionStatus.HANDED_OVER, PossessionStatus.CANCELLED],
      },
      isDeleted: false,
    })
      .populate('fileId', 'fileNumber customerName customerCnic customerPhone')
      .populate('plotId', 'plotNumber plotSize blockName')
      .populate('possessionHandoverCSR', 'firstName lastName email phone')
      .sort({ possessionInitDate: 1 });

    return possessions.map(possession => {
      const obj = possession.toObject();
      return {
        ...obj,
        overdueDays: Math.ceil(
          (new Date().getTime() - obj.possessionInitDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    });
  },

  /**
   * Generate handover certificate
   */
  async generateHandoverCertificate(data: HandoverCertificateDto): Promise<any> {
    const possession = await Possession.findById(data.possessionId);

    if (!possession) {
      throw new Error('Possession not found');
    }

    if (possession.possessionStatus !== PossessionStatus.HANDED_OVER) {
      throw new Error('Cannot generate certificate for non-handed over possession');
    }

    // Update possession with certificate details
    const updatedPossession = await Possession.findByIdAndUpdate(
      data.possessionId,
      {
        $set: {
          possessionAttachment1: data.certificatePath,
          updatedBy: new Types.ObjectId(data.issuedBy),
        },
      },
      { new: true }
    )
      .populate('fileId', 'fileNumber customerName customerCnic customerFatherName customerAddress')
      .populate('plotId', 'plotNumber plotSize blockName projName dimensions')
      .populate('possessionHandoverCSR', 'firstName lastName designation');

    if (!updatedPossession) {
      throw new Error('Failed to update possession with certificate');
    }

    // Generate certificate data
    const certificateData = {
      certificateNumber: data.certificateNumber,
      certificateDate: data.certificateDate,
      issuedBy: data.issuedBy,
      authorizedSignatory: data.authorizedSignatory,
      possession: updatedPossession.toObject(),
      file: updatedPossession.fileId,
      plot: updatedPossession.plotId,
      csr: updatedPossession.possessionHandoverCSR,
    };

    return certificateData;
  },
};
