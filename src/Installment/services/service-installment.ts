import { Types } from 'mongoose';
import {
  CreateInstallmentDto,
  InstallmentQueryParams,
  InstallmentStatus,
  InstallmentSummary,
  InstallmentType,
  MemberInstallmentSummary,
  UpdateInstallmentDto,
} from '../index-installment';
import Installment from '../models/models-installment';

export const installmentService = {
  async createInstallment(data: CreateInstallmentDto, userId: Types.ObjectId): Promise<any> {
    const installment = await Installment.create({
      memID: new Types.ObjectId(data.memID),
      plotID: new Types.ObjectId(data.plotID),
      installmentNo: data.installmentNo,
      installmentType: data.installmentType,
      dueDate: new Date(data.dueDate),
      amountDue: data.amountDue,
      amountPaid: data.amountPaid || 0,
      lateFeeSurcharge: data.lateFeeSurcharge || 0,
      discountApplied: data.discountApplied || 0,
      paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
      paymentModeID: data.paymentModeID ? new Types.ObjectId(data.paymentModeID) : undefined,
      status: data.status || InstallmentStatus.PENDING,
      installmentRemarks: data.installmentRemarks,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.getInstallmentById(installment._id.toString());
  },

  async getInstallmentById(id: string): Promise<any | null> {
    const installment = await Installment.findById(id)
      .populate('memID', 'firstName lastName email phone cnic')
      .populate('plotID', 'plotNo plotSize plotPrice projectID')
      .populate('paymentModeID', 'paymentModeName description')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return installment?.toObject() || null;
  },

  async getInstallments(params: InstallmentQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      installmentType,
      memID,
      plotID,
      paymentModeID,
      startDate,
      endDate,
      dueDateStart,
      dueDateEnd,
      isOverdue,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [{ installmentRemarks: { $regex: search, $options: 'i' } }];
    }

    if (status) {
      query.status = status;
    }

    if (installmentType) {
      query.installmentType = installmentType;
    }

    if (memID) {
      query.memID = new Types.ObjectId(memID);
    }

    if (plotID) {
      query.plotID = new Types.ObjectId(plotID);
    }

    if (paymentModeID) {
      query.paymentModeID = new Types.ObjectId(paymentModeID);
    }

    // Date range filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (dueDateStart || dueDateEnd) {
      query.dueDate = {};
      if (dueDateStart) query.dueDate.$gte = new Date(dueDateStart);
      if (dueDateEnd) query.dueDate.$lte = new Date(dueDateEnd);
    }

    // Overdue filter
    if (isOverdue !== undefined) {
      if (isOverdue) {
        query.dueDate = { $lt: new Date() };
        query.status = { $in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] };
        query.$expr = { $gt: ['$amountDue', '$amountPaid'] };
      }
    }

    const [installments, total] = await Promise.all([
      Installment.find(query)
        .populate('memID', 'firstName lastName email phone')
        .populate('plotID', 'plotNo plotSize plotPrice')
        .populate('paymentModeID', 'paymentModeName')
        .populate('createdBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
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

  async updateInstallment(
    id: string,
    data: UpdateInstallmentDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const updateData: any = { ...data };

    if (data.paidDate) updateData.paidDate = new Date(data.paidDate);
    if (data.paymentModeID) updateData.paymentModeID = new Types.ObjectId(data.paymentModeID);

    updateData.updatedBy = userId;

    const installment = await Installment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!installment) return null;

    return await this.getInstallmentById(installment._id.toString());
  },

  async makePayment(
    id: string,
    paymentData: {
      amountPaid: number;
      lateFeeSurcharge?: number;
      discountApplied?: number;
      paymentModeID: string;
      paidDate: string;
      remarks?: string;
    },
    userId: Types.ObjectId
  ): Promise<any | null> {
    const installment = await Installment.findById(id);

    if (!installment || installment.isDeleted) {
      return null;
    }

    const updateData = {
      amountPaid: installment.amountPaid + paymentData.amountPaid,
      lateFeeSurcharge: paymentData.lateFeeSurcharge || installment.lateFeeSurcharge,
      discountApplied: paymentData.discountApplied || installment.discountApplied,
      paymentModeID: new Types.ObjectId(paymentData.paymentModeID),
      paidDate: new Date(paymentData.paidDate),
      installmentRemarks: paymentData.remarks || installment.installmentRemarks,
      updatedBy: userId,
    };

    const updated = await Installment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) return null;

    return await this.getInstallmentById(updated._id.toString());
  },

  async deleteInstallment(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await Installment.findByIdAndUpdate(
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

  async getInstallmentSummary(): Promise<InstallmentSummary> {
    // const now = new Date();

    const [
      totalInstallments,
      paidInstallments,
      pendingInstallments,
      overdueInstallments,
      totalAmountDue,
      totalAmountPaid,
      totalLateFees,
      totalDiscounts,
    ] = await Promise.all([
      Installment.countDocuments({ isDeleted: false }),
      Installment.countDocuments({
        isDeleted: false,
        status: InstallmentStatus.PAID,
      }),
      Installment.countDocuments({
        isDeleted: false,
        status: { $in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] },
      }),
      Installment.countDocuments({
        isDeleted: false,
        status: InstallmentStatus.OVERDUE,
      }),
      Installment.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amountDue' } } },
      ]),
      Installment.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      Installment.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$lateFeeSurcharge' } } },
      ]),
      Installment.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$discountApplied' } } },
      ]),
    ]);

    const totalPending = totalAmountDue[0]?.total || 0 - (totalAmountPaid[0]?.total || 0);
    const totalOverdue = await Installment.aggregate([
      {
        $match: {
          isDeleted: false,
          status: InstallmentStatus.OVERDUE,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $subtract: [
                { $add: ['$amountDue', '$lateFeeSurcharge'] },
                { $add: ['$amountPaid', '$discountApplied'] },
              ],
            },
          },
        },
      },
    ]);

    return {
      totalInstallments,
      totalAmountDue: totalAmountDue[0]?.total || 0,
      totalAmountPaid: totalAmountPaid[0]?.total || 0,
      totalPending,
      totalOverdue: totalOverdue[0]?.total || 0,
      totalLateFees: totalLateFees[0]?.total || 0,
      totalDiscounts: totalDiscounts[0]?.total || 0,
      pendingInstallments,
      paidInstallments,
      overdueInstallments,
    };
  },

  async getMemberInstallmentSummary(memberId: string): Promise<MemberInstallmentSummary | null> {
    const member = await this.getMemberById(memberId);
    if (!member) return null;

    const result = await Installment.aggregate([
      {
        $match: {
          memID: new Types.ObjectId(memberId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$memID',
          totalAmountDue: { $sum: '$amountDue' },
          totalAmountPaid: { $sum: '$amountPaid' },
          totalLateFees: { $sum: '$lateFeeSurcharge' },
          totalDiscounts: { $sum: '$discountApplied' },
          totalInstallments: { $sum: 1 },
          pendingAmount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$status', InstallmentStatus.PENDING] },
                    { $eq: ['$status', InstallmentStatus.PARTIALLY_PAID] },
                  ],
                },
                {
                  $subtract: [
                    { $add: ['$amountDue', '$lateFeeSurcharge'] },
                    { $add: ['$amountPaid', '$discountApplied'] },
                  ],
                },
                0,
              ],
            },
          },
          overdueAmount: {
            $sum: {
              $cond: [
                { $eq: ['$status', InstallmentStatus.OVERDUE] },
                {
                  $subtract: [
                    { $add: ['$amountDue', '$lateFeeSurcharge'] },
                    { $add: ['$amountPaid', '$discountApplied'] },
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        memberId,
        memberName: `${member.firstName} ${member.lastName}`,
        totalAmountDue: 0,
        totalAmountPaid: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        totalInstallments: 0,
      };
    }

    return {
      memberId,
      memberName: `${member.firstName} ${member.lastName}`,
      totalAmountDue: result[0].totalAmountDue,
      totalAmountPaid: result[0].totalAmountPaid,
      pendingAmount: result[0].pendingAmount,
      overdueAmount: result[0].overdueAmount,
      totalInstallments: result[0].totalInstallments,
    };
  },

  async getUpcomingInstallments(days: number = 30): Promise<any[]> {
    const today = new Date();
    const upcomingDate = new Date();
    upcomingDate.setDate(today.getDate() + days);

    const installments = await Installment.find({
      isDeleted: false,
      status: { $in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] },
      dueDate: { $gte: today, $lte: upcomingDate },
    })
      .populate('memID', 'firstName lastName email phone')
      .populate('plotID', 'plotNo plotSize')
      .populate('paymentModeID', 'paymentModeName')
      .sort('dueDate')
      .then(docs => docs.map(doc => doc.toObject()));

    return installments;
  },

  async getOverdueInstallments(): Promise<any[]> {
    const now = new Date();

    const installments = await Installment.find({
      isDeleted: false,
      status: { $in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] },
      dueDate: { $lt: now },
      $expr: { $gt: ['$amountDue', '$amountPaid'] },
    })
      .populate('memID', 'firstName lastName email phone')
      .populate('plotID', 'plotNo plotSize')
      .populate('paymentModeID', 'paymentModeName')
      .sort('dueDate')
      .then(docs => docs.map(doc => doc.toObject()));

    return installments;
  },

  async generateInstallments(
    memberId: string,
    plotId: string,
    totalAmount: number,
    numberOfInstallments: number,
    installmentType: InstallmentType,
    startDate: Date,
    userId: Types.ObjectId
  ): Promise<any[]> {
    const installmentAmount = parseFloat((totalAmount / numberOfInstallments).toFixed(2));
    const installments = [];
    const dueDate = new Date(startDate);

    for (let i = 1; i <= numberOfInstallments; i++) {
      const installmentData = {
        memID: new Types.ObjectId(memberId),
        plotID: new Types.ObjectId(plotId),
        installmentNo: i,
        installmentType,
        dueDate: new Date(dueDate),
        amountDue: installmentAmount,
        amountPaid: 0,
        status: InstallmentStatus.PENDING,
        createdBy: userId,
        updatedBy: userId,
      };

      if (installmentType === InstallmentType.MONTHLY) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      } else if (installmentType === InstallmentType.QUARTERLY) {
        dueDate.setMonth(dueDate.getMonth() + 3);
      }

      const installment = await Installment.create(installmentData);
      const populated = await this.getInstallmentById(installment._id.toString());
      installments.push(populated);
    }

    return installments;
  },

  async getInstallmentsByMember(memberId: string): Promise<any[]> {
    const installments = await Installment.find({
      memID: new Types.ObjectId(memberId),
      isDeleted: false,
    })
      .populate('memID', 'firstName lastName email phone')
      .populate('plotID', 'plotNo plotSize plotPrice projectID')
      .populate('paymentModeID', 'paymentModeName')
      .sort('installmentNo')
      .then(docs => docs.map(doc => doc.toObject()));

    return installments;
  },

  async getInstallmentsByPlot(plotId: string): Promise<any[]> {
    const installments = await Installment.find({
      plotID: new Types.ObjectId(plotId),
      isDeleted: false,
    })
      .populate('memID', 'firstName lastName email phone')
      .populate('plotID', 'plotNo plotSize plotPrice')
      .populate('paymentModeID', 'paymentModeName')
      .sort('installmentNo')
      .then(docs => docs.map(doc => doc.toObject()));

    return installments;
  },

  // Helper method to get member details
  async getMemberById(_memberId: string): Promise<any | null> {
    // This should be imported from Member service
    // For now, using a placeholder
    return null;
  },
};
