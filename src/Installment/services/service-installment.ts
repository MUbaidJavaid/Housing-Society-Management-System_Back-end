import { Types } from 'mongoose';
import File from '../../File/models/models-file';
import Member from '../../Member/models/models-member';

import Plot from '../../Plots/models/models-plot';
import { InstallmentCategory } from '../index-installment-category';
import Installment, { InstallmentStatus } from '../models/models-installment';
import {
  BulkInstallmentCreationDto,
  CreateInstallmentDto,
  InstallmentDashboardSummary,
  InstallmentType as InstallmentInterface,
  InstallmentQueryParams,
  InstallmentReport,
  InstallmentReportParams,
  InstallmentSummary,
  RecordPaymentDto,
  UpdateInstallmentDto,
} from '../types/types-installment';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): InstallmentInterface => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as InstallmentInterface;
};

// Helper function to calculate next due date
const calculateNextDueDate = (
  startDate: Date,
  frequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly',
  installmentNo: number
): Date => {
  const date = new Date(startDate);

  switch (frequency) {
    case 'monthly':
      date.setMonth(date.getMonth() + (installmentNo - 1));
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + (installmentNo - 1) * 3);
      break;
    case 'half-yearly':
      date.setMonth(date.getMonth() + (installmentNo - 1) * 6);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + (installmentNo - 1));
      break;
  }

  return date;
};

export const installmentService = {
  /**
   * Create new installment
   */
  /**
   * Create new installment
   */
  async createInstallment(
    data: CreateInstallmentDto,
    userId: Types.ObjectId
  ): Promise<InstallmentInterface> {
    // Check if file exists
    const file = await File.findById(data.fileId);
    if (!file || file.isDeleted) {
      throw new Error('File not found');
    }

    // Check if member exists
    const member = await Member.findById(data.memId);
    if (!member || (member as any).isDeleted) {
      throw new Error('Member not found');
    }

    // Check if plot exists
    const plot = await Plot.findById(data.plotId);
    if (!plot || plot.isDeleted) {
      throw new Error('Plot not found');
    }

    // Check if file's plotId matches the selected plot (File.plotId is source of truth)
    if (file.plotId.toString() !== data.plotId) {
      throw new Error('Plot does not belong to the specified file');
    }

    // Check if installment category exists
    const installmentCategory = await InstallmentCategory.findById(data.installmentCategoryId);
    if (!installmentCategory || !installmentCategory.isActive) {
      throw new Error('Installment category not found');
    }

    // Check if file belongs to member
    if (file.memId.toString() !== data.memId) {
      throw new Error('File does not belong to the specified member');
    }

    // Check for duplicate installment number for same file and category
    const existingInstallment = await Installment.findOne({
      fileId: data.fileId,
      installmentCategoryId: data.installmentCategoryId,
      installmentNo: data.installmentNo,
      isDeleted: false,
    });

    if (existingInstallment) {
      throw new Error(
        `Installment number ${data.installmentNo} already exists for this file and category`
      );
    }

    const installmentData: any = {
      ...data,
      totalPayable: data.amountDue + (data.lateFeeSurcharge || 0),
      amountPaid: 0,
      balanceAmount: data.amountDue + (data.lateFeeSurcharge || 0),
      status: InstallmentStatus.UNPAID,
      isDeleted: false,
      createdBy: userId,
    };

    const installment = await Installment.create(installmentData);

    const createdInstallment = await Installment.findById(installment._id)
      .populate('file', 'fileRegNo')
      .populate('member', 'memName memNic')
      .populate('plot', 'plotNo plotSize')
      .populate('installmentCategory', 'instCatName instCatDescription')
      .populate('createdBy', 'userName fullName designation');

    if (!createdInstallment) {
      throw new Error('Failed to create installment');
    }

    return toPlainObject(createdInstallment);
  },

  /**
   * Create multiple installments (bulk creation)
   */
  /**
   * Create multiple installments (bulk creation)
   */
  async createBulkInstallments(
    data: BulkInstallmentCreationDto,
    userId: Types.ObjectId
  ): Promise<InstallmentInterface[]> {
    // Check if file exists
    const file = await File.findById(data.fileId);
    if (!file || file.isDeleted) {
      throw new Error('File not found');
    }

    // Check if member exists
    const member = await Member.findById(data.memId);
    if (!member || (member as any).isDeleted) {
      throw new Error('Member not found');
    }

    // Check if plot exists
    const plot = await Plot.findById(data.plotId);
    if (!plot || plot.isDeleted) {
      throw new Error('Plot not found');
    }

    // Check if file's plotId matches the selected plot (File.plotId is source of truth)
    if (file.plotId.toString() !== data.plotId) {
      throw new Error('Plot does not belong to the specified file');
    }

    // Check if installment category exists
    const installmentCategory = await InstallmentCategory.findById(data.installmentCategoryId);
    if (!installmentCategory || !installmentCategory.isActive) {
      throw new Error('Installment category not found');
    }

    // Check if file belongs to member
    if (file.memId.toString() !== data.memId) {
      throw new Error('File does not belong to the specified member');
    }

    const installments: any[] = [];

    for (let i = 1; i <= data.totalInstallments; i++) {
      const dueDate = calculateNextDueDate(data.startDate, data.frequency, i);

      installments.push({
        fileId: data.fileId,
        memId: data.memId,
        plotId: data.plotId,
        installmentCategoryId: data.installmentCategoryId,
        installmentNo: i,
        installmentTitle:
          data.installmentTitle || `${installmentCategory.instCatName} - Installment ${i}`,
        installmentType: data.installmentType,
        dueDate,
        amountDue: data.amountPerInstallment,
        lateFeeSurcharge: 0,
        totalPayable: data.amountPerInstallment,
        amountPaid: 0,
        balanceAmount: data.amountPerInstallment,
        status: InstallmentStatus.UNPAID,
        isDeleted: false,
        createdBy: userId,
      });
    }

    const createdInstallments = await Installment.insertMany(installments);

    // Fetch created installments with populated data
    const installmentIds = createdInstallments.map(inst => inst._id);
    const populatedInstallments = await Installment.find({ _id: { $in: installmentIds } })
      .populate('file', 'fileRegNo')
      .populate('member', 'memName memNic')
      .populate('plot', 'plotNo plotSize')
      .populate('installmentCategory', 'instCatName instCatDescription')
      .populate('createdBy', 'userName fullName designation');

    return populatedInstallments.map(doc => toPlainObject(doc));
  },

  /**
   * Get installment by ID
   */
  async getInstallmentById(id: string): Promise<InstallmentInterface> {
    try {
      const installment = await Installment.findById(id)
        .populate('file', 'fileRegNo fileBarCode projId plotId totalAmount')
        .populate('member', 'memName memNic fatherName mobileNo email address')
        .populate('plot', 'plotNo plotSize blockNo sectorNo')
        .populate('installmentCategory', 'instCatName instCatDescription isRefundable')
        .populate('createdBy', 'userName fullName designation')
        .populate('modifiedBy', 'userName fullName designation');

      if (!installment || installment.isDeleted) {
        throw new Error('Installment not found');
      }

      return toPlainObject(installment);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid installment ID');
    }
  },

  /**
   * Get all installments with pagination
   */
  async getInstallments(params: InstallmentQueryParams): Promise<{
    installments: InstallmentInterface[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      fileId,
      memId,
      plotId,
      installmentCategoryId,
      status,
      installmentType,
      paymentMode,
      fromDate,
      toDate,
      overdue,
      search,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    if (fileId) {
      query.fileId = new Types.ObjectId(fileId);
    }

    if (memId) {
      query.memId = new Types.ObjectId(memId);
    }

    if (plotId) {
      query.plotId = new Types.ObjectId(plotId);
    }

    if (installmentCategoryId) {
      query.installmentCategoryId = new Types.ObjectId(installmentCategoryId);
    }

    if (status) {
      query.status = status;
    }

    if (installmentType) {
      query.installmentType = installmentType;
    }

    if (paymentMode) {
      query.paymentMode = paymentMode;
    }

    if (fromDate || toDate) {
      query.dueDate = {};
      if (fromDate) query.dueDate.$gte = new Date(fromDate);
      if (toDate) query.dueDate.$lte = new Date(toDate);
    }

    if (overdue === true) {
      query.dueDate = { $lt: new Date() };
      query.status = { $in: [InstallmentStatus.UNPAID, InstallmentStatus.PARTIALLY_PAID] };
    } else if (overdue === false) {
      query.$or = [
        { dueDate: { $gte: new Date() } },
        { status: { $in: [InstallmentStatus.PAID, InstallmentStatus.CANCELLED] } },
      ];
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const [installments, total] = await Promise.all([
      Installment.find(query)
        .populate('file', 'fileRegNo')
        .populate('member', 'memName memNic')
        .populate('plot', 'plotNo')
        .populate('installmentCategory', 'instCatName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Installment.countDocuments(query),
    ]);

    return {
      installments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update installment
   */
  async updateInstallment(
    id: string,
    data: UpdateInstallmentDto,
    userId: Types.ObjectId
  ): Promise<InstallmentInterface | null> {
    const existingInstallment = await Installment.findById(id);
    if (!existingInstallment || existingInstallment.isDeleted) {
      throw new Error('Installment not found');
    }

    // Prevent updates for paid installments
    if (existingInstallment.status === InstallmentStatus.PAID) {
      const allowedUpdates = ['installmentRemarks', 'transactionRefNo'];
      const updateKeys = Object.keys(data);
      const invalidUpdates = updateKeys.filter(key => !allowedUpdates.includes(key));

      if (invalidUpdates.length > 0) {
        throw new Error(`Cannot update ${invalidUpdates.join(', ')} for a paid installment`);
      }
    }

    // Check for duplicate installment number if being updated
    if (data.installmentNo && data.installmentNo !== existingInstallment.installmentNo) {
      const duplicateInstallment = await Installment.findOne({
        _id: { $ne: id },
        fileId: existingInstallment.fileId,
        installmentCategoryId: existingInstallment.installmentCategoryId,
        installmentNo: data.installmentNo,
        isDeleted: false,
      });

      if (duplicateInstallment) {
        throw new Error(
          `Installment number ${data.installmentNo} already exists for this file and category`
        );
      }
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    // Recalculate totals if amount due or late fee is updated
    if (data.amountDue !== undefined || data.lateFeeSurcharge !== undefined) {
      const amountDue =
        data.amountDue !== undefined ? data.amountDue : existingInstallment.amountDue;
      const lateFeeSurcharge =
        data.lateFeeSurcharge !== undefined
          ? data.lateFeeSurcharge
          : existingInstallment.lateFeeSurcharge || 0;

      updateObj.totalPayable = amountDue + lateFeeSurcharge;
      updateObj.balanceAmount = updateObj.totalPayable - existingInstallment.amountPaid;
    }

    // Update status if amount paid is being updated
    if (data.amountPaid !== undefined) {
      const totalPayable = updateObj.totalPayable || existingInstallment.totalPayable;
      if (data.amountPaid >= totalPayable) {
        updateObj.status = InstallmentStatus.PAID;
        updateObj.balanceAmount = 0;
        if (!updateObj.paidDate) {
          updateObj.paidDate = new Date();
        }
      } else if (data.amountPaid > 0) {
        updateObj.status = InstallmentStatus.PARTIALLY_PAID;
        updateObj.balanceAmount = totalPayable - data.amountPaid;
      } else {
        updateObj.status = InstallmentStatus.UNPAID;
        updateObj.balanceAmount = totalPayable;
      }
    }

    // Set paid date if status changes to PAID
    if (data.status === InstallmentStatus.PAID && !updateObj.paidDate) {
      updateObj.paidDate = new Date();
      updateObj.balanceAmount = 0;
      updateObj.amountPaid = updateObj.totalPayable || existingInstallment.totalPayable;
    }

    const installment = await Installment.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('installmentCategory', 'instCatName')
      .populate('member', 'memName')
      .populate('file', 'fileRegNo')
      .populate('modifiedBy', 'userName fullName');

    return installment ? toPlainObject(installment) : null;
  },

  /**
   * Delete installment (soft delete)
   */
  async deleteInstallment(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingInstallment = await Installment.findById(id);
    if (!existingInstallment || existingInstallment.isDeleted) {
      throw new Error('Installment not found');
    }

    // Don't allow deletion of paid installments
    if (existingInstallment.status === InstallmentStatus.PAID) {
      throw new Error('Cannot delete a paid installment');
    }

    const result = await Installment.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          status: InstallmentStatus.CANCELLED,
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Record payment for installment
   */
  async recordPayment(
    id: string,
    data: RecordPaymentDto,
    userId: Types.ObjectId
  ): Promise<InstallmentInterface | null> {
    const installment = await Installment.findById(id);
    if (!installment || installment.isDeleted) {
      throw new Error('Installment not found');
    }

    if (installment.status === InstallmentStatus.PAID) {
      throw new Error('Installment is already fully paid');
    }

    if (installment.status === InstallmentStatus.CANCELLED) {
      throw new Error('Cannot record payment for a cancelled installment');
    }

    const newAmountPaid = installment.amountPaid + data.amountPaid;
    const totalPayable = installment.totalPayable;

    if (newAmountPaid > totalPayable) {
      throw new Error(
        `Payment amount exceeds total payable. Maximum payment allowed: ${totalPayable - installment.amountPaid}`
      );
    }

    const updateObj: any = {
      amountPaid: newAmountPaid,
      balanceAmount: totalPayable - newAmountPaid,
      paidDate: data.paidDate,
      paymentMode: data.paymentMode,
      transactionRefNo: data.transactionRefNo,
      modifiedBy: userId,
    };

    // Update status based on payment
    if (newAmountPaid >= totalPayable) {
      updateObj.status = InstallmentStatus.PAID;
      updateObj.balanceAmount = 0;
    } else if (newAmountPaid > 0) {
      updateObj.status = InstallmentStatus.PARTIALLY_PAID;
    }

    // Add payment remarks
    const paymentRemark = `Payment of Rs. ${data.amountPaid} recorded via ${data.paymentMode} on ${data.paidDate.toLocaleDateString()}${data.transactionRefNo ? ` (Ref: ${data.transactionRefNo})` : ''}${data.remarks ? ` - ${data.remarks}` : ''}`;
    updateObj.installmentRemarks = installment.installmentRemarks
      ? `${installment.installmentRemarks}\n${paymentRemark}`
      : paymentRemark;

    const updatedInstallment = await Installment.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    )
      .populate('installmentCategory', 'instCatName')
      .populate('member', 'memName')
      .populate('file', 'fileRegNo')
      .populate('plot', 'plotNo');

    return updatedInstallment ? toPlainObject(updatedInstallment) : null;
  },

  /**
   * Get installments by file
   */
  async getInstallmentsByFile(fileId: string): Promise<InstallmentInterface[]> {
    const installments = await Installment.findByFile(fileId);
    return installments.map(doc => toPlainObject(doc));
  },

  /**
   * Get installments by member
   */
  async getInstallmentsByMember(memId: string): Promise<InstallmentInterface[]> {
    const installments = await Installment.findByMember(memId);
    return installments.map(doc => toPlainObject(doc));
  },

  /**
   * Get installments by plot
   */
  async getInstallmentsByPlot(plotId: string): Promise<InstallmentInterface[]> {
    const installments = await Installment.findByPlot(plotId);
    return installments.map(doc => toPlainObject(doc));
  },

  /**
   * Get overdue installments
   */
  async getOverdueInstallments(): Promise<InstallmentInterface[]> {
    const installments = await Installment.findOverdue();
    return installments.map(doc => toPlainObject(doc));
  },

  /**
   * Get installments due today
   */
  async getDueTodayInstallments(): Promise<InstallmentInterface[]> {
    const installments = await Installment.findDueToday();
    return installments.map(doc => toPlainObject(doc));
  },

  /**
   * Get installment summary for member
   */
  async getInstallmentSummary(memId: string): Promise<InstallmentSummary> {
    const [summaryStats, statusStats, categoryStats, monthlyStats] = await Promise.all([
      Installment.aggregate([
        {
          $match: {
            memId: new Types.ObjectId(memId),
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            totalInstallments: { $sum: 1 },
            totalAmountDue: { $sum: '$amountDue' },
            totalAmountPaid: { $sum: '$amountPaid' },
            totalBalance: { $sum: '$balanceAmount' },
            totalLateFee: { $sum: '$lateFeeSurcharge' },
            paidInstallments: {
              $sum: { $cond: [{ $eq: ['$status', InstallmentStatus.PAID] }, 1, 0] },
            },
            unpaidInstallments: {
              $sum: { $cond: [{ $eq: ['$status', InstallmentStatus.UNPAID] }, 1, 0] },
            },
            overdueInstallments: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ['$dueDate', new Date()] },
                      { $ne: ['$status', InstallmentStatus.PAID] },
                      { $ne: ['$status', InstallmentStatus.CANCELLED] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            partiallyPaidInstallments: {
              $sum: { $cond: [{ $eq: ['$status', InstallmentStatus.PARTIALLY_PAID] }, 1, 0] },
            },
          },
        },
      ]),
      Installment.aggregate([
        {
          $match: {
            memId: new Types.ObjectId(memId),
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amountDue' },
            paid: { $sum: '$amountPaid' },
            balance: { $sum: '$balanceAmount' },
          },
        },
      ]),
      Installment.aggregate([
        {
          $match: {
            memId: new Types.ObjectId(memId),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: 'installmentcategories',
            localField: 'installmentCategoryId',
            foreignField: '_id',
            as: 'installmentCategory',
          },
        },
        {
          $unwind: '$installmentCategory',
        },
        {
          $group: {
            _id: '$installmentCategory.instCatName',
            count: { $sum: 1 },
            amount: { $sum: '$amountDue' },
            paid: { $sum: '$amountPaid' },
          },
        },
      ]),
      Installment.aggregate([
        {
          $match: {
            memId: new Types.ObjectId(memId),
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$dueDate' },
              month: { $month: '$dueDate' },
            },
            count: { $sum: 1 },
            amount: { $sum: '$amountDue' },
          },
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 },
        },
        {
          $limit: 12,
        },
      ]),
    ]);

    const baseStats = summaryStats[0] || {
      totalInstallments: 0,
      totalAmountDue: 0,
      totalAmountPaid: 0,
      totalBalance: 0,
      totalLateFee: 0,
      paidInstallments: 0,
      unpaidInstallments: 0,
      overdueInstallments: 0,
      partiallyPaidInstallments: 0,
    };

    const byStatus: Record<
      string,
      { count: number; amount: number; paid: number; balance: number }
    > = {};
    statusStats.forEach(stat => {
      byStatus[stat._id] = {
        count: stat.count,
        amount: stat.amount,
        paid: stat.paid,
        balance: stat.balance,
      };
    });

    const byCategory: Record<string, { count: number; amount: number; paid: number }> = {};
    categoryStats.forEach(stat => {
      byCategory[stat._id] = {
        count: stat.count,
        amount: stat.amount,
        paid: stat.paid,
      };
    });

    const byMonth: Record<string, number> = {};
    monthlyStats.forEach(stat => {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const key = `${monthNames[stat._id.month - 1]} ${stat._id.year}`;
      byMonth[key] = stat.amount;
    });

    return {
      ...baseStats,
      byStatus,
      byCategory,
      byMonth,
    };
  },

  /**
   * Get installment dashboard summary
   */
  async getDashboardSummary(): Promise<InstallmentDashboardSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      outstandingStats,
      paidTodayStats,
      dueTodayStats,
      overdueStats,
      recentPayments,
      upcomingDue,
    ] = await Promise.all([
      Installment.aggregate([
        {
          $match: {
            isDeleted: false,
            status: {
              $in: [
                InstallmentStatus.UNPAID,
                InstallmentStatus.PARTIALLY_PAID,
                InstallmentStatus.OVERDUE,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalOutstanding: { $sum: '$balanceAmount' },
          },
        },
      ]),
      Installment.aggregate([
        {
          $match: {
            isDeleted: false,
            status: InstallmentStatus.PAID,
            paidDate: { $gte: today, $lt: tomorrow },
          },
        },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: '$amountPaid' },
          },
        },
      ]),
      Installment.aggregate([
        {
          $match: {
            isDeleted: false,
            dueDate: { $gte: today, $lt: tomorrow },
            status: { $in: [InstallmentStatus.UNPAID, InstallmentStatus.PARTIALLY_PAID] },
          },
        },
        {
          $group: {
            _id: null,
            totalDue: { $sum: '$totalPayable' },
          },
        },
      ]),
      Installment.aggregate([
        {
          $match: {
            isDeleted: false,
            dueDate: { $lt: today },
            status: { $in: [InstallmentStatus.UNPAID, InstallmentStatus.PARTIALLY_PAID] },
          },
        },
        {
          $group: {
            _id: null,
            totalOverdue: { $sum: '$balanceAmount' },
          },
        },
      ]),
      Installment.find({
        isDeleted: false,
        status: InstallmentStatus.PAID,
      })
        .populate('member', 'memName')
        .populate('installmentCategory', 'instCatName')
        .populate('file', 'fileRegNo')
        .sort({ paidDate: -1 })
        .limit(10)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Installment.find({
        isDeleted: false,
        dueDate: { $gte: today },
        status: { $in: [InstallmentStatus.UNPAID, InstallmentStatus.PARTIALLY_PAID] },
      })
        .populate('member', 'memName')
        .populate('installmentCategory', 'instCatName')
        .populate('file', 'fileRegNo')
        .sort({ dueDate: 1 })
        .limit(10)
        .then(docs => docs.map(doc => toPlainObject(doc))),
    ]);

    // Get top payers
    const topPayers = await Installment.aggregate([
      {
        $match: {
          isDeleted: false,
          status: InstallmentStatus.PAID,
        },
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
          memberName: { $first: '$member.memName' },
          totalPaid: { $sum: '$amountPaid' },
          totalDue: { $sum: '$amountDue' },
        },
      },
      {
        $sort: { totalPaid: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    return {
      totalOutstanding: outstandingStats[0]?.totalOutstanding || 0,
      totalPaidToday: paidTodayStats[0]?.totalPaid || 0,
      totalDueToday: dueTodayStats[0]?.totalDue || 0,
      totalOverdue: overdueStats[0]?.totalOverdue || 0,
      recentPayments,
      upcomingDue,
      topPayers: topPayers.map(payer => ({
        memId: payer._id,
        memberName: payer.memberName,
        totalPaid: payer.totalPaid,
        totalDue: payer.totalDue,
      })),
    };
  },

  /**
   * Generate installment report
   */
  async generateReport(params: InstallmentReportParams): Promise<InstallmentReport> {
    const {
      startDate,
      endDate,
      fileId,
      memId,
      plotId,
      installmentCategoryId,
      status,
      installmentType,
    } = params;

    // Build query
    const matchQuery: any = {
      isDeleted: false,
      dueDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };

    if (fileId) matchQuery.fileId = new Types.ObjectId(fileId);
    if (memId) matchQuery.memId = new Types.ObjectId(memId);
    if (plotId) matchQuery.plotId = new Types.ObjectId(plotId);
    if (installmentCategoryId)
      matchQuery.installmentCategoryId = new Types.ObjectId(installmentCategoryId);
    if (status) matchQuery.status = status;
    if (installmentType) matchQuery.installmentType = installmentType;

    const [summary, data, byDate, byCategory, byStatus] = await Promise.all([
      Installment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            totalAmountDue: { $sum: '$amountDue' },
            totalAmountPaid: { $sum: '$amountPaid' },
            totalBalance: { $sum: '$balanceAmount' },
            totalLateFee: { $sum: '$lateFeeSurcharge' },
          },
        },
      ]),
      Installment.find(matchQuery)
        .populate('file', 'fileRegNo')
        .populate('member', 'memName memNic')
        .populate('plot', 'plotNo')
        .populate('installmentCategory', 'instCatName')
        .sort({ dueDate: 1 })
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Installment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$dueDate' } },
            amount: { $sum: '$amountDue' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Installment.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'installmentcategories',
            localField: 'installmentCategoryId',
            foreignField: '_id',
            as: 'installmentCategory',
          },
        },
        { $unwind: '$installmentCategory' },
        {
          $group: {
            _id: '$installmentCategory.instCatName',
            amount: { $sum: '$amountDue' },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ]),
      Installment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            amount: { $sum: '$amountDue' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const summaryData = summary[0] || {
      totalRecords: 0,
      totalAmountDue: 0,
      totalAmountPaid: 0,
      totalBalance: 0,
      totalLateFee: 0,
    };

    return {
      summary: summaryData,
      data,
      byDate: byDate.map(item => ({
        date: item._id,
        amount: item.amount,
        count: item.count,
      })),
      byCategory: byCategory.map(item => ({
        category: item._id,
        amount: item.amount,
        count: item.count,
      })),
      byStatus: byStatus.map(item => ({
        status: item._id,
        amount: item.amount,
        count: item.count,
      })),
    };
  },

  /**
   * Get next due installment for member
   */
  async getNextDueInstallment(memId: string): Promise<InstallmentInterface | null> {
    const installment = await Installment.findNextDue(memId);
    return installment ? toPlainObject(installment) : null;
  },

  /**
   * Search installments
   */
  async searchInstallments(
    searchTerm: string,
    limit: number = 10
  ): Promise<InstallmentInterface[]> {
    const installments = await Installment.find({
      $text: { $search: searchTerm },
      isDeleted: false,
    })
      .populate('file', 'fileRegNo')
      .populate('member', 'memName memNic')
      .populate('installmentCategory', 'instCatName')
      .limit(limit)
      .sort({ score: { $meta: 'textScore' } })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return installments;
  },

  /**
   * Bulk update installment status
   */
  async bulkUpdateStatus(
    installmentIds: string[],
    status: InstallmentStatus,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    const objectIds = installmentIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid installment ID: ${id}`);
      }
    });

    const updateObj: any = {
      status,
      modifiedBy: userId,
    };

    // Set paid date if status is PAID
    if (status === InstallmentStatus.PAID) {
      updateObj.paidDate = new Date();
      updateObj.balanceAmount = 0;
    }

    // Set cancellation reason if status is CANCELLED
    if (status === InstallmentStatus.CANCELLED) {
      updateObj.installmentRemarks = 'Bulk cancelled by admin';
    }

    const result = await Installment.updateMany(
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
   * Validate installment payment
   */
  async validatePayment(
    installmentId: string,
    paymentAmount: number
  ): Promise<{
    isValid: boolean;
    message?: string;
    installment?: InstallmentInterface;
    maxPaymentAllowed?: number;
  }> {
    const installment = await Installment.findById(installmentId);
    if (!installment || installment.isDeleted) {
      throw new Error('Installment not found');
    }

    if (installment.status === InstallmentStatus.PAID) {
      return {
        isValid: false,
        message: 'Installment is already fully paid',
        installment: toPlainObject(installment),
      };
    }

    if (installment.status === InstallmentStatus.CANCELLED) {
      return {
        isValid: false,
        message: 'Cannot process payment for cancelled installment',
        installment: toPlainObject(installment),
      };
    }

    const maxPaymentAllowed = installment.totalPayable - installment.amountPaid;

    if (paymentAmount > maxPaymentAllowed) {
      return {
        isValid: false,
        message: `Payment amount exceeds maximum allowed. Maximum: Rs. ${maxPaymentAllowed}`,
        installment: toPlainObject(installment),
        maxPaymentAllowed,
      };
    }

    return {
      isValid: true,
      installment: toPlainObject(installment),
      maxPaymentAllowed,
    };
  },
};
