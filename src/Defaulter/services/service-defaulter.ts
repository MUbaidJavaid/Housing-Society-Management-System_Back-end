import { Types } from 'mongoose';
import File from '../../File/models/models-file';
import Member from '../../Member/models/models-member';
import Plot from '../../Plots/models/models-plot';
import Defaulter, { DefaulterStatus } from '../models/models-defaulter';
import {
  CreateDefaulterDto,
  DefaulterQueryParams,
  DefaulterStatistics,
  DefaulterType,
  ResolveDefaulterDto,
  SendNoticeDto,
  UpdateDefaulterDto,
} from '../types/types-defaulter';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): DefaulterType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as DefaulterType;
};

export const defaulterService = {
  /**
   * Create new defaulter record
   */
  async createDefaulter(data: CreateDefaulterDto, userId: Types.ObjectId): Promise<DefaulterType> {
    // Check if member exists
    const member = await Member.findById(data.memId);
    if (!member || (member as any).isDeleted) {
      throw new Error('Member not found');
    }

    // Check if plot exists
    const plot = await Plot.findById(data.plotId);
    if (!plot || (plot as any).isDeleted) {
      throw new Error('Plot not found');
    }

    // Check if file exists
    const file = await File.findById(data.fileId);
    if (!file || (file as any).isDeleted) {
      throw new Error('File not found');
    }

    // Check if defaulter already exists for this combination
    const existingDefaulter = await Defaulter.findOne({
      memId: data.memId,
      plotId: data.plotId,
      fileId: data.fileId,
      isActive: true,
    });

    if (existingDefaulter) {
      throw new Error(
        'Defaulter record already exists for this member, plot, and file combination'
      );
    }

    const defaulterData = {
      ...data,
      daysOverdue: data.lastPaymentDate
        ? Math.ceil(
            (new Date().getTime() - new Date(data.lastPaymentDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
      noticeSentCount: data.noticeSentCount || 0,
      createdBy: userId,
      isActive: true,
    };

    const defaulter = await Defaulter.create(defaulterData);

    const createdDefaulter = await Defaulter.findById(defaulter._id)
      .populate('member', 'fullName memNic mobileNo email')
      .populate('plot', 'plotNo sector block')
      .populate('file', 'fileNo fileType')
      .populate('createdBy', 'userName fullName designation');

    if (!createdDefaulter) {
      throw new Error('Failed to create defaulter record');
    }

    return toPlainObject(createdDefaulter);
  },

  /**
   * Get defaulter by ID
   */
  async getDefaulterById(id: string): Promise<DefaulterType> {
    try {
      const defaulter = await Defaulter.findById(id)
        .populate('member', 'fullName memNic fatherName mobileNo email address')
        .populate('plot', 'plotNo sector block area plotType')
        .populate('file', 'fileNo fileType bookingDate totalAmount')
        .populate('createdBy', 'userName fullName designation')
        .populate('modifiedBy', 'userName fullName designation');

      if (!defaulter || !defaulter.isActive) {
        throw new Error('Defaulter not found');
      }

      return toPlainObject(defaulter);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid defaulter ID');
    }
  },

  /**
   * Get all defaulters with pagination
   */
  async getDefaulters(params: DefaulterQueryParams): Promise<{
    defaulters: DefaulterType[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      memId,
      plotId,
      fileId,
      status,
      minAmount,
      maxAmount,
      minDays,
      maxDays,
      isActive = true,
      sortBy = 'daysOverdue',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isActive };

    if (memId) {
      query.memId = new Types.ObjectId(memId);
    }

    if (plotId) {
      query.plotId = new Types.ObjectId(plotId);
    }

    if (fileId) {
      query.fileId = new Types.ObjectId(fileId);
    }

    if (status) {
      query.status = status;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      query.totalOverdueAmount = {};
      if (minAmount !== undefined) query.totalOverdueAmount.$gte = minAmount;
      if (maxAmount !== undefined) query.totalOverdueAmount.$lte = maxAmount;
    }

    if (minDays !== undefined || maxDays !== undefined) {
      query.daysOverdue = {};
      if (minDays !== undefined) query.daysOverdue.$gte = minDays;
      if (maxDays !== undefined) query.daysOverdue.$lte = maxDays;
    }

    const [defaulters, total] = await Promise.all([
      Defaulter.find(query)
        .populate('member', 'fullName memNic mobileNo')
        .populate('plot', 'plotNo sector block')
        .populate('file', 'fileNo')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Defaulter.countDocuments(query),
    ]);

    return {
      defaulters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update defaulter
   */
  async updateDefaulter(
    id: string,
    data: UpdateDefaulterDto,
    userId: Types.ObjectId
  ): Promise<DefaulterType | null> {
    const existingDefaulter = await Defaulter.findById(id);
    if (!existingDefaulter || !existingDefaulter.isActive) {
      throw new Error('Defaulter not found');
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    // If marking as resolved, set resolvedAt
    if (
      data.status === DefaulterStatus.RESOLVED &&
      existingDefaulter.status !== DefaulterStatus.RESOLVED
    ) {
      updateObj.resolvedAt = new Date();
    }

    const defaulter = await Defaulter.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('member', 'fullName memNic mobileNo')
      .populate('plot', 'plotNo sector block')
      .populate('file', 'fileNo')
      .populate('modifiedBy', 'userName fullName');

    return defaulter ? toPlainObject(defaulter) : null;
  },

  /**
   * Delete defaulter (soft delete)
   */
  async deleteDefaulter(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingDefaulter = await Defaulter.findById(id);
    if (!existingDefaulter || !existingDefaulter.isActive) {
      throw new Error('Defaulter not found');
    }

    const result = await Defaulter.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: false,
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Get defaulters by member
   */
  async getDefaultersByMember(memId: string, activeOnly: boolean = true): Promise<DefaulterType[]> {
    const defaulters = await Defaulter.find({
      memId: new Types.ObjectId(memId),
      ...(activeOnly && { isActive: true }),
    })
      .populate('plot', 'plotNo sector block')
      .populate('file', 'fileNo fileType')
      .sort({ daysOverdue: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return defaulters;
  },

  /**
   * Get defaulters by plot
   */
  async getDefaultersByPlot(plotId: string, activeOnly: boolean = true): Promise<DefaulterType[]> {
    const defaulters = await Defaulter.find({
      plotId: new Types.ObjectId(plotId),
      ...(activeOnly && { isActive: true }),
    })
      .populate('member', 'fullName memNic mobileNo')
      .populate('file', 'fileNo')
      .sort({ totalOverdueAmount: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return defaulters;
  },

  /**
   * Send notice to defaulter
   */
  async sendNotice(
    id: string,
    data: SendNoticeDto,
    userId: Types.ObjectId
  ): Promise<DefaulterType | null> {
    const defaulter = await Defaulter.findById(id);
    if (!defaulter || !defaulter.isActive) {
      throw new Error('Defaulter not found');
    }

    // Increment notice count
    const updateObj = {
      $inc: { noticeSentCount: 1 },
      modifiedBy: userId,
    };

    // Update status based on notice type
    if (data.noticeType === 'FINAL' && defaulter.noticeSentCount >= 2) {
      (updateObj as any).status = DefaulterStatus.SUSPENDED;
    } else if (data.noticeType === 'LEGAL') {
      (updateObj as any).status = DefaulterStatus.LEGAL_ACTION;
    }

    const updatedDefaulter = await Defaulter.findByIdAndUpdate(id, updateObj, { new: true })
      .populate('member', 'fullName memNic mobileNo email')
      .populate('plot', 'plotNo sector block');

    return updatedDefaulter ? toPlainObject(updatedDefaulter) : null;
  },

  /**
   * Resolve defaulter (record payment)
   */
  async resolveDefaulter(
    id: string,
    data: ResolveDefaulterDto,
    userId: Types.ObjectId
  ): Promise<DefaulterType | null> {
    const defaulter = await Defaulter.findById(id);
    if (!defaulter || !defaulter.isActive) {
      throw new Error('Defaulter not found');
    }

    const updateObj: any = {
      totalOverdueAmount: Math.max(0, defaulter.totalOverdueAmount - data.paymentAmount),
      lastPaymentDate: data.paymentDate,
      modifiedBy: userId,
      remarks: data.remarks || defaulter.remarks,
    };

    // If fully paid, mark as resolved
    if (updateObj.totalOverdueAmount === 0) {
      updateObj.status = DefaulterStatus.RESOLVED;
      updateObj.resolvedAt = new Date();
    }

    const updatedDefaulter = await Defaulter.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    )
      .populate('member', 'fullName memNic mobileNo')
      .populate('plot', 'plotNo sector block')
      .populate('file', 'fileNo');

    return updatedDefaulter ? toPlainObject(updatedDefaulter) : null;
  },

  /**
   * Get defaulter statistics
   */
  async getDefaulterStatistics(): Promise<DefaulterStatistics> {
    const [statusStats, totalStats, topDefaulters] = await Promise.all([
      Defaulter.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalOverdueAmount' },
            avgDays: { $avg: '$daysOverdue' },
          },
        },
      ]),
      Defaulter.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $group: {
            _id: null,
            totalDefaulters: { $sum: 1 },
            totalOverdueAmount: { $sum: '$totalOverdueAmount' },
            averageOverdueAmount: { $avg: '$totalOverdueAmount' },
            averageDaysOverdue: { $avg: '$daysOverdue' },
          },
        },
      ]),
      Defaulter.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $lookup: {
            from: 'members',
            localField: 'memId',
            foreignField: '_id',
            as: 'member',
          },
        },
        {
          $unwind: '$member',
        },
        {
          $group: {
            _id: '$memId',
            fullName: { $first: '$member.fullName' },
            totalAmount: { $sum: '$totalOverdueAmount' },
            maxDaysOverdue: { $max: '$daysOverdue' },
            defaulterCount: { $sum: 1 },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
        {
          $limit: 10,
        },
      ]),
    ]);

    const noticeStats = await Defaulter.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: '$noticeSentCount',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalOverdueAmount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const byStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      byStatus[stat._id] = stat.count;
    });

    const byNoticeCount: Record<string, number> = {};
    noticeStats.forEach(stat => {
      byNoticeCount[`${stat._id} notices`] = stat.count;
    });

    const totalData = totalStats[0] || {
      totalDefaulters: 0,
      totalOverdueAmount: 0,
      averageOverdueAmount: 0,
      averageDaysOverdue: 0,
    };

    const activeDefaulters = await Defaulter.countDocuments({ isActive: true });

    return {
      totalDefaulters: totalData.totalDefaulters,
      activeDefaulters,
      byStatus,
      totalOverdueAmount: totalData.totalOverdueAmount,
      averageOverdueAmount: totalData.averageOverdueAmount,
      averageDaysOverdue: totalData.averageDaysOverdue,
      topDefaulters: topDefaulters.map(item => ({
        memId: item._id,
        memName: item.memName,
        totalAmount: item.totalAmount,
        daysOverdue: item.maxDaysOverdue,
        defaulterCount: item.defaulterCount,
      })),
      byNoticeCount,
    };
  },

  /**
   * Bulk update defaulter status
   */
  async bulkUpdateStatus(
    defaulterIds: string[],
    status: DefaulterStatus,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    const objectIds = defaulterIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid defaulter ID: ${id}`);
      }
    });

    const updateObj: any = {
      status,
      modifiedBy: userId,
    };

    // If resolving, set resolvedAt
    if (status === DefaulterStatus.RESOLVED) {
      updateObj.resolvedAt = new Date();
    }

    const result = await Defaulter.updateMany(
      {
        _id: { $in: objectIds },
        isActive: true,
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
   * Get overdue summary (for dashboard)
   */
  async getOverdueSummary(): Promise<{
    totalAmount: number;
    byStatus: Array<{ status: string; amount: number; count: number }>;
    byDaysRange: Array<{ range: string; amount: number; count: number }>;
  }> {
    const [statusSummary, daysSummary] = await Promise.all([
      Defaulter.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$totalOverdueAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Defaulter.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $bucket: {
            groupBy: '$daysOverdue',
            boundaries: [0, 30, 60, 90, 180, 365],
            default: '365+',
            output: {
              totalAmount: { $sum: '$totalOverdueAmount' },
              count: { $sum: 1 },
            },
          },
        },
      ]),
    ]);

    const totalAmount = statusSummary.reduce((sum, item) => sum + item.totalAmount, 0);

    return {
      totalAmount,
      byStatus: statusSummary.map(item => ({
        status: item._id,
        amount: item.totalAmount,
        count: item.count,
      })),
      byDaysRange: daysSummary.map(item => ({
        range: `${item._id} days`,
        amount: item.totalAmount,
        count: item.count,
      })),
    };
  },
};
