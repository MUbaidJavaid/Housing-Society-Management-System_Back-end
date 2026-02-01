import { Types } from 'mongoose';
import Complaint, { ComplaintPriority } from '../models/models-complaint';
import {
  AssignComplaintDto,
  BulkStatusUpdateDto,
  ComplaintQueryParams,
  ComplaintStatistics,
  ComplaintType,
  CreateComplaintDto,
  DashboardStats,
  EscalateComplaintDto,
  GetComplaintsResult,
  ResolveComplaintDto,
  UpdateComplaintDto,
} from '../types/types-complaint';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): ComplaintType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  if (!plainObj.compDate && doc.compDate) {
    plainObj.compDate = doc.compDate;
  }

  return plainObj as ComplaintType;
};

export const complaintService = {
  /**
   * Create new complaint
   */
  async createComplaint(data: CreateComplaintDto, userId: Types.ObjectId): Promise<ComplaintType> {
    // Validate required fields
    if (!data.memId) {
      throw new Error('Member ID is required');
    }
    if (!data.compCatId) {
      throw new Error('Complaint category is required');
    }
    if (!data.compTitle?.trim()) {
      throw new Error('Complaint title is required');
    }
    if (!data.compDescription?.trim()) {
      throw new Error('Complaint description is required');
    }

    const complaintData = {
      ...data,
      memId: new Types.ObjectId(data.memId),
      fileId: data.fileId ? new Types.ObjectId(data.fileId) : undefined,
      compCatId: new Types.ObjectId(data.compCatId),
      compDate: data.compDate || new Date(),
      compPriority: data.compPriority || ComplaintPriority.MEDIUM,
      statusId: data.statusId ? new Types.ObjectId(data.statusId) : undefined,
      assignedTo: data.assignedTo ? new Types.ObjectId(data.assignedTo) : undefined,
      attachmentPaths: data.attachmentPaths || [],
      tags: data.tags || [],
      slaHours: data.slaHours || 72,
      createdBy: userId,
      updatedBy: userId,
    };

    const complaint = await Complaint.create(complaintData);

    // Populate and return
    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('memId', 'firstName lastName email phone')
      .populate('fileId', 'fileNo plotNo')
      .populate('compCatId', 'categoryName categoryCode priorityLevel')
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    return toPlainObject(populatedComplaint);
  },

  /**
   * Get complaint by ID
   */
  async getComplaintById(id: string): Promise<ComplaintType | null> {
    try {
      const complaint = await Complaint.findById(id)
        .populate('memId', 'firstName lastName email phone address')
        .populate('fileId', 'fileNo plotNo sectorNo blockNo size')
        .populate('compCatId', 'categoryName categoryCode description priorityLevel slaHours')
        .populate('statusId', 'statusName statusCode')
        .populate('assignedTo', 'firstName lastName email phone department')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      if (!complaint || complaint.isDeleted) return null;
      return toPlainObject(complaint);
    } catch (error) {
      throw new Error('Invalid complaint ID');
    }
  },

  /**
   * Get all complaints with pagination and filters
   */
  async getComplaints(params: ComplaintQueryParams): Promise<GetComplaintsResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      memId,
      fileId,
      compCatId,
      statusId,
      assignedTo,
      compPriority,
      fromDate,
      toDate,
      slaBreached,
      isEscalated,
      sortBy = 'compDate',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search by title, description, or tags
    if (search) {
      query.$or = [
        { compTitle: { $regex: search, $options: 'i' } },
        { compDescription: { $regex: search, $options: 'i' } },
        { resolutionNotes: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Filter by member
    if (memId) {
      query.memId = new Types.ObjectId(memId);
    }

    // Filter by file
    if (fileId) {
      query.fileId = new Types.ObjectId(fileId);
    }

    // Filter by category
    if (compCatId) {
      query.compCatId = new Types.ObjectId(compCatId);
    }

    // Filter by status
    if (statusId) {
      query.statusId = new Types.ObjectId(statusId);
    }

    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = new Types.ObjectId(assignedTo);
    }

    // Filter by priority
    if (compPriority) {
      query.compPriority = compPriority;
    }

    // Filter by date range
    if (fromDate || toDate) {
      query.compDate = {};
      if (fromDate) query.compDate.$gte = new Date(fromDate);
      if (toDate) query.compDate.$lte = new Date(toDate);
    }

    // Filter by SLA breach
    if (slaBreached !== undefined) {
      query.slaBreached = slaBreached;
    }

    // Filter by escalation status
    if (isEscalated !== undefined) {
      query.isEscalated = isEscalated;
    }

    // Execute queries
    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('memId', 'firstName lastName')
        .populate('fileId', 'fileNo plotNo')
        .populate('compCatId', 'categoryName categoryCode')
        .populate('statusId', 'statusName')
        .populate('assignedTo', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Complaint.countDocuments(query),
    ]);

    // Get statistics for the filtered results
    const stats = await this.getComplaintStatistics(query);

    return {
      complaints,
      statistics: {
        total: stats.totalComplaints,
        open: stats.openComplaints,
        inProgress: stats.inProgressComplaints,
        resolved: stats.resolvedComplaints,
        overdue: stats.overdueComplaints,
        escalated: stats.escalatedComplaints,
        byPriority: stats.byPriority,
        byCategory: stats.byCategory,
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
   * Update complaint
   */
  async updateComplaint(
    id: string,
    data: UpdateComplaintDto,
    userId: Types.ObjectId
  ): Promise<ComplaintType | null> {
    // Check if complaint exists
    const existingComplaint = await Complaint.findById(id);
    if (!existingComplaint || existingComplaint.isDeleted) {
      throw new Error('Complaint not found');
    }

    const updateObj: any = {
      ...data,
      updatedBy: userId,
    };

    // Convert IDs to ObjectId if provided
    if (data.statusId) {
      updateObj.statusId = new Types.ObjectId(data.statusId);
    }
    if (data.assignedTo) {
      updateObj.assignedTo = new Types.ObjectId(data.assignedTo);
    }

    // If status is being changed to resolved/closed, set resolution date
    if (data.statusId) {
      const status = await this.getStatusById(data.statusId);
      if (
        status?.statusName?.toLowerCase().includes('resolved') ||
        status?.statusName?.toLowerCase().includes('closed')
      ) {
        if (!existingComplaint.resolutionDate) {
          updateObj.resolutionDate = new Date();
        }
      }
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('memId', 'firstName lastName email phone')
      .populate('fileId', 'fileNo plotNo')
      .populate('compCatId', 'categoryName categoryCode')
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return complaint ? toPlainObject(complaint) : null;
  },

  /**
   * Delete complaint (soft delete)
   */
  async deleteComplaint(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingComplaint = await Complaint.findById(id);
    if (!existingComplaint || existingComplaint.isDeleted) {
      throw new Error('Complaint not found');
    }

    // Check if complaint is already resolved/closed
    const status = await this.getStatusById(existingComplaint.statusId.toString());
    if (
      status?.statusName?.toLowerCase().includes('resolved') ||
      status?.statusName?.toLowerCase().includes('closed')
    ) {
      throw new Error('Cannot delete resolved or closed complaints');
    }

    const result = await Complaint.findByIdAndUpdate(
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
   * Get complaints by member
   */
  async getComplaintsByMember(memberId: string, limit = 20): Promise<ComplaintType[]> {
    const complaints = await Complaint.find({
      memId: new Types.ObjectId(memberId),
      isDeleted: false,
    })
      .populate('compCatId', 'categoryName categoryCode')
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ compDate: -1 })
      .limit(limit);

    return complaints.map(cat => toPlainObject(cat));
  },

  /**
   * Get complaints by file
   */
  async getComplaintsByFile(fileId: string): Promise<ComplaintType[]> {
    const complaints = await Complaint.find({
      fileId: new Types.ObjectId(fileId),
      isDeleted: false,
    })
      .populate('memId', 'firstName lastName')
      .populate('compCatId', 'categoryName categoryCode')
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ compDate: -1 });

    return complaints.map(cat => toPlainObject(cat));
  },

  /**
   * Get complaints by category
   */
  async getComplaintsByCategory(categoryId: string): Promise<ComplaintType[]> {
    const complaints = await Complaint.find({
      compCatId: new Types.ObjectId(categoryId),
      isDeleted: false,
    })
      .populate('memId', 'firstName lastName')
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ compDate: -1 })
      .limit(100);

    return complaints.map(cat => toPlainObject(cat));
  },

  /**
   * Assign complaint to staff member
   */
  async assignComplaint(
    id: string,
    data: AssignComplaintDto,
    userId: Types.ObjectId
  ): Promise<ComplaintType | null> {
    const existingComplaint = await Complaint.findById(id);
    if (!existingComplaint || existingComplaint.isDeleted) {
      throw new Error('Complaint not found');
    }

    const updateObj: any = {
      assignedTo: new Types.ObjectId(data.assignedTo),
      updatedBy: userId,
    };

    if (data.estimatedResolutionDate) {
      updateObj.estimatedResolutionDate = new Date(data.estimatedResolutionDate);
    }

    // Update status to "In Progress" if not already
    if (
      !existingComplaint.statusId ||
      (await this.getStatusName(existingComplaint.statusId.toString()))?.toLowerCase() === 'open'
    ) {
      const inProgressStatus = await this.getStatusByName('In Progress');
      if (inProgressStatus) {
        updateObj.statusId = inProgressStatus._id;
      }
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('memId', 'firstName lastName email')
      .populate('compCatId', 'categoryName categoryCode')
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return complaint ? toPlainObject(complaint) : null;
  },

  /**
   * Resolve complaint
   */
  async resolveComplaint(
    id: string,
    data: ResolveComplaintDto,
    userId: Types.ObjectId
  ): Promise<ComplaintType | null> {
    const existingComplaint = await Complaint.findById(id);
    if (!existingComplaint || existingComplaint.isDeleted) {
      throw new Error('Complaint not found');
    }

    // Check if complaint is already resolved
    const currentStatus = await this.getStatusName(existingComplaint.statusId.toString());
    if (
      currentStatus?.toLowerCase().includes('resolved') ||
      currentStatus?.toLowerCase().includes('closed')
    ) {
      throw new Error('Complaint is already resolved or closed');
    }

    const resolvedStatus = await this.getStatusByName('Resolved');
    if (!resolvedStatus) {
      throw new Error('Resolved status not found in system');
    }

    const updateObj: any = {
      statusId: resolvedStatus._id,
      resolutionNotes: data.resolutionNotes,
      resolutionDate: new Date(),
      updatedBy: userId,
    };

    if (data.satisfactionRating !== undefined) {
      updateObj.satisfactionRating = data.satisfactionRating;
    }
    if (data.feedback) {
      updateObj.feedback = data.feedback;
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('memId', 'firstName lastName email')
      .populate('compCatId', 'categoryName categoryCode')
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return complaint ? toPlainObject(complaint) : null;
  },

  /**
   * Escalate complaint
   */
  async escalateComplaint(
    id: string,
    data: EscalateComplaintDto,
    userId: Types.ObjectId
  ): Promise<ComplaintType | null> {
    const existingComplaint = await Complaint.findById(id);
    if (!existingComplaint || existingComplaint.isDeleted) {
      throw new Error('Complaint not found');
    }

    const updateObj: any = {
      escalationLevel: data.escalationLevel,
      lastEscalatedAt: new Date(),
      isEscalated: true,
      updatedBy: userId,
    };

    if (data.assignedTo) {
      updateObj.assignedTo = new Types.ObjectId(data.assignedTo);
    }

    // Add escalation note to resolution notes
    const escalationNote = `[ESCALATION Level ${data.escalationLevel} - ${new Date().toISOString()}]\n${data.notes}\n\n`;
    updateObj.resolutionNotes = existingComplaint.resolutionNotes
      ? `${escalationNote}${existingComplaint.resolutionNotes}`
      : escalationNote;

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('memId', 'firstName lastName email')
      .populate('compCatId', 'categoryName categoryCode')
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return complaint ? toPlainObject(complaint) : null;
  },

  /**
   * Bulk update complaint statuses
   */
  async bulkUpdateComplaintStatus(
    data: BulkStatusUpdateDto,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    if (!data.complaintIds || !Array.isArray(data.complaintIds) || data.complaintIds.length === 0) {
      throw new Error('Complaint IDs must be a non-empty array');
    }

    const objectIds = data.complaintIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid complaint ID: ${id}`);
      }
    });

    const updateObj: any = {
      statusId: new Types.ObjectId(data.statusId),
      updatedBy: userId,
    };

    // Check if status is resolved/closed
    const status = await this.getStatusById(data.statusId);
    if (
      status?.statusName?.toLowerCase().includes('resolved') ||
      status?.statusName?.toLowerCase().includes('closed')
    ) {
      updateObj.resolutionDate = new Date();
    }

    if (data.resolutionNotes) {
      updateObj.resolutionNotes = data.resolutionNotes;
    }

    const result = await Complaint.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
      },
      {
        $set: updateObj,
      }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },

  /**
   * Get complaint statistics
   */
  async getComplaintStatistics(filter: any = {}): Promise<ComplaintStatistics> {
    const baseFilter = { ...filter, isDeleted: false };

    // Get basic counts
    const [
      totalComplaints,
      openComplaints,
      inProgressComplaints,
      resolvedComplaints,
      closedComplaints,
      overdueComplaints,
      escalatedComplaints,
    ] = await Promise.all([
      Complaint.countDocuments(baseFilter),
      Complaint.countDocuments({ ...baseFilter, statusId: await this.getStatusIdByName('Open') }),
      Complaint.countDocuments({
        ...baseFilter,
        statusId: await this.getStatusIdByName('In Progress'),
      }),
      Complaint.countDocuments({
        ...baseFilter,
        statusId: await this.getStatusIdByName('Resolved'),
      }),
      Complaint.countDocuments({ ...baseFilter, statusId: await this.getStatusIdByName('Closed') }),
      Complaint.countDocuments({ ...baseFilter, slaBreached: true }),
      Complaint.countDocuments({ ...baseFilter, isEscalated: true }),
    ]);

    // Get average resolution time
    const resolutionStats = await Complaint.aggregate([
      {
        $match: {
          ...baseFilter,
          resolutionDate: { $exists: true, $ne: null },
          compDate: { $exists: true, $ne: null },
        },
      },
      {
        $addFields: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$resolutionDate', '$compDate'] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: '$resolutionTime' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get satisfaction score
    const satisfactionStats = await Complaint.aggregate([
      {
        $match: {
          ...baseFilter,
          satisfactionRating: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgSatisfaction: { $avg: '$satisfactionRating' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get distribution by priority
    const priorityDistribution = await Complaint.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$compPriority',
          total: { $sum: 1 },
          open: {
            $sum: {
              $cond: [{ $eq: ['$statusId', await this.getStatusIdByName('Open')] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get distribution by category
    const categoryDistribution = await Complaint.aggregate([
      { $match: baseFilter },
      {
        $lookup: {
          from: 'srcomplaintcategories',
          localField: 'compCatId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.categoryName',
          total: { $sum: 1 },
          open: {
            $sum: {
              $cond: [{ $eq: ['$statusId', await this.getStatusIdByName('Open')] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get distribution by status
    const statusDistribution = await Complaint.aggregate([
      { $match: baseFilter },
      {
        $lookup: {
          from: 'statuses',
          localField: 'statusId',
          foreignField: '_id',
          as: 'status',
        },
      },
      { $unwind: '$status' },
      {
        $group: {
          _id: '$status.statusName',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get monthly trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrend = await Complaint.aggregate([
      {
        $match: {
          ...baseFilter,
          compDate: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$compDate' },
            month: { $month: '$compDate' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                },
              },
            },
          },
          count: 1,
        },
      },
    ]);

    // Convert distributions to objects
    const byPriority: Record<string, { total: number; open: number }> = {};
    priorityDistribution.forEach(item => {
      byPriority[item._id] = { total: item.total, open: item.open };
    });

    const byCategory: Record<string, { total: number; open: number }> = {};
    categoryDistribution.forEach(item => {
      byCategory[item._id] = { total: item.total, open: item.open };
    });

    const byStatus: Record<string, number> = {};
    statusDistribution.forEach(item => {
      byStatus[item._id] = item.count;
    });

    return {
      totalComplaints,
      openComplaints,
      inProgressComplaints,
      resolvedComplaints,
      closedComplaints,
      overdueComplaints,
      escalatedComplaints,
      averageResolutionTime: resolutionStats[0]?.avgResolutionTime || 0,
      satisfactionScore: satisfactionStats[0]?.avgSatisfaction || 0,
      byPriority,
      byCategory,
      byStatus,
      monthlyTrend: monthlyTrend.map(item => ({ month: item.month, count: item.count })),
    };
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const stats = await this.getComplaintStatistics();

    // Calculate priority distribution with percentages
    const priorityDistribution = Object.entries(stats.byPriority).map(([priority, data]) => ({
      priority: this.formatPriority(priority),
      count: data.total,
      percentage: stats.totalComplaints > 0 ? (data.total / stats.totalComplaints) * 100 : 0,
    }));

    // Calculate category distribution with percentages
    const categoryDistribution = Object.entries(stats.byCategory)
      .slice(0, 10) // Top 10 categories
      .map(([category, data]) => ({
        category,
        count: data.total,
        percentage: stats.totalComplaints > 0 ? (data.total / stats.totalComplaints) * 100 : 0,
      }));

    // Get top categories by count
    const topCategories = Object.entries(stats.byCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([category, data]) => ({
        category,
        count: data.total,
      }));

    // Get recent activity (last 10 complaints)
    const recentActivity = await Complaint.find({ isDeleted: false })
      .populate('memId', 'firstName lastName')
      .populate('compCatId', 'categoryName')
      .populate('statusId', 'statusName')
      .sort({ updatedAt: -1 })
      .limit(10)
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return {
      overview: {
        total: stats.totalComplaints,
        open: stats.openComplaints,
        inProgress: stats.inProgressComplaints,
        overdue: stats.overdueComplaints,
        escalated: stats.escalatedComplaints,
      },
      priorityDistribution,
      categoryDistribution,
      resolutionRate: {
        resolved: stats.resolvedComplaints,
        total: stats.totalComplaints,
        rate:
          stats.totalComplaints > 0 ? (stats.resolvedComplaints / stats.totalComplaints) * 100 : 0,
      },
      averageResolutionTime: stats.averageResolutionTime,
      topCategories,
      recentActivity,
    };
  },

  /**
   * Get overdue complaints
   */
  async getOverdueComplaints(): Promise<ComplaintType[]> {
    const now = new Date();
    const complaints = await Complaint.find({
      dueDate: { $lt: now },
      statusId: {
        $nin: [await this.getStatusIdByName('Resolved'), await this.getStatusIdByName('Closed')],
      },
      isDeleted: false,
    })
      .populate('memId', 'firstName lastName email')
      .populate('compCatId', 'categoryName')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ dueDate: 1 })
      .limit(50);

    return complaints.map(cat => toPlainObject(cat));
  },

  /**
   * Get complaints needing follow-up
   */
  async getComplaintsNeedingFollowUp(): Promise<ComplaintType[]> {
    const now = new Date();
    const complaints = await Complaint.find({
      followUpDate: { $lte: now },
      statusId: {
        $nin: [await this.getStatusIdByName('Resolved'), await this.getStatusIdByName('Closed')],
      },
      isDeleted: false,
    })
      .populate('memId', 'firstName lastName')
      .populate('compCatId', 'categoryName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ followUpDate: 1 })
      .limit(50);

    return complaints.map(cat => toPlainObject(cat));
  },

  /**
   * Add attachment to complaint
   */
  async addAttachment(
    complaintId: string,
    attachmentPath: string,
    userId: Types.ObjectId
  ): Promise<ComplaintType | null> {
    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        $push: { attachmentPaths: attachmentPath },
        $set: { updatedBy: userId },
      },
      { new: true, runValidators: true }
    )
      .populate('memId', 'firstName lastName')
      .populate('compCatId', 'categoryName')
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'firstName lastName');

    return complaint ? toPlainObject(complaint) : null;
  },

  /**
   * Remove attachment from complaint
   */
  async removeAttachment(
    complaintId: string,
    attachmentPath: string,
    userId: Types.ObjectId
  ): Promise<ComplaintType | null> {
    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        $pull: { attachmentPaths: attachmentPath },
        $set: { updatedBy: userId },
      },
      { new: true, runValidators: true }
    )
      .populate('memId', 'firstName lastName')
      .populate('compCatId', 'categoryName')
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'firstName lastName');

    return complaint ? toPlainObject(complaint) : null;
  },

  /**
   * Get complaints by assigned staff
   */
  async getComplaintsByAssignedStaff(staffId: string): Promise<ComplaintType[]> {
    const complaints = await Complaint.find({
      assignedTo: new Types.ObjectId(staffId),
      isDeleted: false,
    })
      .populate('memId', 'firstName lastName')
      .populate('compCatId', 'categoryName')
      .populate('statusId', 'statusName')
      .sort({ compDate: -1 })
      .limit(100);

    return complaints.map(cat => toPlainObject(cat));
  },

  /**
   * Get complaints summary for a member
   */
  async getMemberComplaintSummary(memberId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    recentComplaints: ComplaintType[];
  }> {
    const [total, open, inProgress, resolved, recentComplaints] = await Promise.all([
      Complaint.countDocuments({ memId: new Types.ObjectId(memberId), isDeleted: false }),
      Complaint.countDocuments({
        memId: new Types.ObjectId(memberId),
        statusId: await this.getStatusIdByName('Open'),
        isDeleted: false,
      }),
      Complaint.countDocuments({
        memId: new Types.ObjectId(memberId),
        statusId: await this.getStatusIdByName('In Progress'),
        isDeleted: false,
      }),
      Complaint.countDocuments({
        memId: new Types.ObjectId(memberId),
        statusId: await this.getStatusIdByName('Resolved'),
        isDeleted: false,
      }),
      Complaint.find({ memId: new Types.ObjectId(memberId), isDeleted: false })
        .populate('compCatId', 'categoryName')
        .populate('statusId', 'statusName')
        .sort({ compDate: -1 })
        .limit(5)
        .then(docs => docs.map(doc => toPlainObject(doc))),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      recentComplaints,
    };
  },

  // Helper methods
  async getStatusById(statusId: string): Promise<any> {
    // This would typically fetch from your Status model
    // For now, return a mock
    const Status = mongoose.model('Status');
    return Status.findById(statusId);
  },

  async getStatusByName(statusName: string): Promise<any> {
    // This would typically fetch from your Status model
    const Status = mongoose.model('Status');
    return Status.findOne({ statusName: new RegExp(`^${statusName}$`, 'i') });
  },

  async getStatusIdByName(statusName: string): Promise<Types.ObjectId | null> {
    const status = await this.getStatusByName(statusName);
    return status ? status._id : null;
  },

  async getStatusName(statusId: string): Promise<string | null> {
    const status = await this.getStatusById(statusId);
    return status ? status.statusName : null;
  },

  formatPriority(priority: string): string {
    const formatted: Record<string, string> = {
      [ComplaintPriority.LOW]: 'Low',
      [ComplaintPriority.MEDIUM]: 'Medium',
      [ComplaintPriority.HIGH]: 'High',
      [ComplaintPriority.EMERGENCY]: 'Emergency',
    };
    return formatted[priority] || priority;
  },
};

// Import mongoose for helper methods
import mongoose from 'mongoose';
