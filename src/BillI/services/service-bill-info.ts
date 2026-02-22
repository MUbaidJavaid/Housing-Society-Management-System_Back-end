import { Types } from 'mongoose';
import File from '../../File/models/models-file';
import Member from '../../Member/models/models-member';
import BillType from '../models/models-bill-type';
import BillInfo, { BillStatus } from '../models/models-bill-info';
import {
  BillInfoType,
  BillQueryParams,
  BillStatistics,
  CreateBillInfoDto,
  GenerateBillsDto,
  RecordPaymentDto,
  UpdateBillInfoDto,
} from '../types/types-bill-info';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): BillInfoType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  // Map populated billTypeId to billType for API consumers
  if (plainObj.billTypeId && typeof plainObj.billTypeId === 'object') {
    plainObj.billType = plainObj.billTypeId;
  }

  return plainObj as BillInfoType;
};

export const billInfoService = {
  /**
   * Create new bill
   */
  async createBill(data: CreateBillInfoDto, userId: Types.ObjectId): Promise<BillInfoType> {
    // Check if bill number already exists
    if (data.billNo) {
      const existingBill = await BillInfo.findOne({
        billNo: data.billNo.toUpperCase(),
        isDeleted: false,
      });

      if (existingBill) {
        throw new Error('Bill number already exists');
      }
    }

    // Check if member exists
    const member = await Member.findById(data.memId);
    if (!member || (member as any).isDeleted) {
      throw new Error('Member not found');
    }

    // Check if file exists
    const file = await File.findById(data.fileId);
    if (!file || (file as any).isDeleted) {
      throw new Error('File not found');
    }

    // Check if bill type exists and optionally use defaultAmount
    const billTypeDoc = await BillType.findById(data.billTypeId);
    if (!billTypeDoc || (billTypeDoc as any).isDeleted) {
      throw new Error('Bill type not found');
    }

    let billAmount = data.billAmount;
    if (billAmount === undefined || billAmount === null) {
      billAmount = billTypeDoc.defaultAmount ?? 0;
    }

    // Calculate total payable
    const totalPayable = billAmount + (data.fineAmount || 0) + (data.arrears || 0);

    // Calculate units consumed if readings are provided
    let unitsConsumed: number | undefined;
    if (data.currentReading !== undefined && data.previousReading !== undefined) {
      unitsConsumed = data.currentReading - data.previousReading;
      if (unitsConsumed < 0) unitsConsumed = 0;
    }

    const billData: any = {
      ...data,
      billTypeId: data.billTypeId,
      billAmount,
      unitsConsumed,
      totalPayable,
      fineAmount: data.fineAmount || 0,
      arrears: data.arrears || 0,
      gracePeriodDays: data.gracePeriodDays || 7,
      createdBy: userId,
      isActive: true,
      isDeleted: false,
    };

    // Auto-generate bill number if not provided
    if (!billData.billNo) {
      const prefix = (billTypeDoc.billTypeName || 'BL ').substring(0, 3).toUpperCase().replace(/\s/g, 'X');
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      billData.billNo = `${prefix}-${timestamp}-${random}`;
    } else {
      billData.billNo = billData.billNo.toUpperCase();
    }

    const bill = await BillInfo.create(billData);

    const createdBill = await BillInfo.findById(bill._id)
      .populate('billTypeId', 'billTypeName billTypeCategory defaultAmount isRecurring')
      .populate('memId', 'memName fullName memNic mobileNo email')
      .populate('fileId', 'fileRegNo')
      .populate('createdBy', 'userName fullName designation');

    if (!createdBill) {
      throw new Error('Failed to create bill');
    }

    return toPlainObject(createdBill);
  },

  /**
   * Get bill by ID
   */
  async getBillById(id: string): Promise<BillInfoType> {
    try {
      const bill = await BillInfo.findById(id)
        .populate('billTypeId', 'billTypeName billTypeCategory defaultAmount isRecurring')
        .populate('memId', 'memName fullName memNic fatherName mobileNo email address')
        .populate('fileId', 'fileRegNo bookingDate totalAmount')
        .populate('createdBy', 'userName fullName designation')
        .populate('modifiedBy', 'userName fullName designation');

      if (!bill || bill.isDeleted) {
        throw new Error('Bill not found');
      }

      return toPlainObject(bill);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid bill ID');
    }
  },

  /**
   * Get bill by bill number
   */
  async getBillByNumber(billNo: string): Promise<BillInfoType | null> {
    const bill = await BillInfo.findOne({
      billNo: billNo.toUpperCase(),
      isDeleted: false,
    })
      .populate('billTypeId', 'billTypeName billTypeCategory')
      .populate('memId', 'memName fullName memNic mobileNo')
      .populate('fileId', 'fileRegNo')
      .populate('createdBy', 'userName fullName');

    if (!bill) return null;
    return toPlainObject(bill);
  },

  /**
   * Get all bills with pagination
   */
  async getBills(params: BillQueryParams): Promise<{
    bills: BillInfoType[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      memId,
      fileId,
      status,
      billMonth,
      year,
      isOverdue,
      minAmount,
      maxAmount,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false, isActive: true };

    if (memId) {
      query.memId = new Types.ObjectId(memId);
    }

    if (fileId) {
      query.fileId = new Types.ObjectId(fileId);
    }

    if (params.billTypeId) {
      query.billTypeId = new Types.ObjectId(params.billTypeId);
    }

    if (status) {
      query.status = status;
    }

    if (billMonth) {
      query.billMonth = billMonth;
    }

    if (year) {
      query.$expr = {
        $eq: [{ $year: '$createdAt' }, year],
      };
    }

    if (isOverdue !== undefined) {
      const now = new Date();
      query.$or = [
        { status: BillStatus.OVERDUE },
        {
          status: BillStatus.PENDING,
          dueDate: { $lt: new Date(now.setDate(now.getDate() - 7)) }, // 7 days grace period
        },
      ];
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      query.totalPayable = {};
      if (minAmount !== undefined) query.totalPayable.$gte = minAmount;
      if (maxAmount !== undefined) query.totalPayable.$lte = maxAmount;
    }

    const [bills, total] = await Promise.all([
      BillInfo.find(query)
        .populate('billTypeId', 'billTypeName billTypeCategory')
        .populate('memId', 'memName fullName memNic mobileNo')
        .populate('fileId', 'fileRegNo')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      BillInfo.countDocuments(query),
    ]);

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update bill
   */
  async updateBill(
    id: string,
    data: UpdateBillInfoDto,
    userId: Types.ObjectId
  ): Promise<BillInfoType | null> {
    const existingBill = await BillInfo.findById(id);
    if (!existingBill || existingBill.isDeleted) {
      throw new Error('Bill not found');
    }

    // If bill is already paid, only allow certain updates
    if (existingBill.status === BillStatus.PAID) {
      const allowedUpdates = ['notes', 'isActive'];
      const updateKeys = Object.keys(data);
      const invalidUpdates = updateKeys.filter(key => !allowedUpdates.includes(key));

      if (invalidUpdates.length > 0) {
        throw new Error(`Cannot update ${invalidUpdates.join(', ')} for a paid bill`);
      }
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    // Calculate total payable if amount fields are updated
    if (
      data.billAmount !== undefined ||
      data.fineAmount !== undefined ||
      data.arrears !== undefined
    ) {
      const billAmount = data.billAmount !== undefined ? data.billAmount : existingBill.billAmount;
      const fineAmount = data.fineAmount !== undefined ? data.fineAmount : existingBill.fineAmount;
      const arrears = data.arrears !== undefined ? data.arrears : existingBill.arrears;
      updateObj.totalPayable = billAmount + fineAmount + arrears;
    }

    // Calculate units consumed if readings are updated
    if (data.currentReading !== undefined || data.previousReading !== undefined) {
      const currentReading =
        data.currentReading !== undefined ? data.currentReading : existingBill.currentReading;
      const previousReading =
        data.previousReading !== undefined ? data.previousReading : existingBill.previousReading;

      if (currentReading !== undefined && previousReading !== undefined) {
        updateObj.unitsConsumed = currentReading - previousReading;
        if (updateObj.unitsConsumed < 0) {
          updateObj.unitsConsumed = 0;
        }
      }
    }

    const bill = await BillInfo.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('billTypeId', 'billTypeName billTypeCategory')
      .populate('memId', 'memName fullName memNic mobileNo')
      .populate('fileId', 'fileRegNo')
      .populate('modifiedBy', 'userName fullName');

    return bill ? toPlainObject(bill) : null;
  },

  /**
   * Delete bill (soft delete)
   */
  async deleteBill(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingBill = await BillInfo.findById(id);
    if (!existingBill || existingBill.isDeleted) {
      throw new Error('Bill not found');
    }

    // Don't allow deletion of paid bills
    if (existingBill.status === BillStatus.PAID) {
      throw new Error('Cannot delete a paid bill');
    }

    const result = await BillInfo.findByIdAndUpdate(
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
   * Record payment for a bill
   */
  async recordPayment(
    id: string,
    data: RecordPaymentDto,
    userId: Types.ObjectId
  ): Promise<BillInfoType | null> {
    const bill = await BillInfo.findById(id);
    if (!bill || bill.isDeleted) {
      throw new Error('Bill not found');
    }

    if (bill.status === BillStatus.PAID) {
      throw new Error('Bill is already paid');
    }

    if (bill.status === BillStatus.CANCELLED) {
      throw new Error('Cannot record payment for a cancelled bill');
    }

    if (data.paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (data.paymentAmount > bill.totalPayable) {
      throw new Error('Payment amount cannot exceed total payable amount');
    }

    let newStatus = BillStatus.PARTIALLY_PAID;
    let updateArrears = bill.arrears;

    if (data.paymentAmount >= bill.totalPayable) {
      newStatus = BillStatus.PAID;
      updateArrears = 0;
    } else if (data.paymentAmount < bill.totalPayable) {
      // Calculate remaining amount
      const remainingAmount = bill.totalPayable - data.paymentAmount;
      updateArrears = remainingAmount;
    }

    const updateObj: any = {
      status: newStatus,
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod,
      arrears: updateArrears,
      totalPayable: bill.totalPayable, // Keep original total for record
      modifiedBy: userId,
    };

    if (data.transactionId) {
      updateObj.transactionId = data.transactionId;
    }

    if (data.notes) {
      updateObj.notes = bill.notes ? `${bill.notes}\n${data.notes}` : data.notes;
    }

    const updatedBill = await BillInfo.findByIdAndUpdate(id, { $set: updateObj }, { new: true })
      .populate('billTypeId', 'billTypeName billTypeCategory')
      .populate('memId', 'memName fullName memNic mobileNo')
      .populate('fileId', 'fileRegNo');

    return updatedBill ? toPlainObject(updatedBill) : null;
  },

  /**
   * Get bills by member
   */
  async getBillsByMember(memId: string, activeOnly: boolean = true): Promise<BillInfoType[]> {
    const query: any = {
      memId: new Types.ObjectId(memId),
      isDeleted: false,
    };

    if (activeOnly) {
      query.isActive = true;
    }

    const bills = await BillInfo.find(query)
      .populate('billTypeId', 'billTypeName billTypeCategory')
      .populate('fileId', 'fileRegNo')
      .sort({ dueDate: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return bills;
  },

  /**
   * Get bills by file
   */
  async getBillsByFile(fileId: string, activeOnly: boolean = true): Promise<BillInfoType[]> {
    const query: any = {
      fileId: new Types.ObjectId(fileId),
      isDeleted: false,
    };

    if (activeOnly) {
      query.isActive = true;
    }

    const bills = await BillInfo.find(query)
      .populate('billTypeId', 'billTypeName billTypeCategory')
      .populate('memId', 'memName fullName memNic')
      .sort({ dueDate: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return bills;
  },

  /**
   * Get overdue bills
   */
  async getOverdueBills(
    page: number = 1,
    limit: number = 20
  ): Promise<{ bills: BillInfoType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const query = {
      status: BillStatus.OVERDUE,
      isDeleted: false,
      isActive: true,
    };

    const [bills, total] = await Promise.all([
      BillInfo.find(query)
        .populate('billTypeId', 'billTypeName billTypeCategory')
        .populate('memId', 'memName fullName memNic mobileNo')
        .populate('fileId', 'fileRegNo')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      BillInfo.countDocuments(query),
    ]);

    return {
      bills,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get bills summary by member
   */
  async getMemberBillsSummary(memId: string): Promise<{
    totalBills: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    overdueBills: number;
  }> {
    const bills = await BillInfo.find({
      memId: new Types.ObjectId(memId),
      isDeleted: false,
      isActive: true,
    });

    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let overdueBills = 0;

    bills.forEach(bill => {
      totalAmount += bill.totalPayable;

      switch (bill.status) {
        case BillStatus.PAID:
          paidAmount += bill.totalPayable;
          break;
        case BillStatus.PARTIALLY_PAID:
          pendingAmount += bill.totalPayable;
          break;
        case BillStatus.PENDING:
          pendingAmount += bill.totalPayable;
          break;
        case BillStatus.OVERDUE:
          overdueAmount += bill.totalPayable;
          overdueBills++;
          break;
      }
    });

    return {
      totalBills: bills.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      overdueBills,
    };
  },

  /**
   * Get bill statistics
   */
  async getBillStatistics(year?: number): Promise<BillStatistics> {
    const matchStage: any = {
      isDeleted: false,
      isActive: true,
    };

    if (year) {
      matchStage.$expr = {
        $eq: [{ $year: '$createdAt' }, year],
      };
    }

    const [stats, monthlyStats, statusStats] = await Promise.all([
      BillInfo.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: null,
            totalBills: { $sum: 1 },
            totalAmount: { $sum: '$totalPayable' },
            totalPaid: {
              $sum: {
                $cond: [{ $eq: ['$status', BillStatus.PAID] }, '$totalPayable', 0],
              },
            },
            totalPending: {
              $sum: {
                $cond: [
                  { $in: ['$status', [BillStatus.PENDING, BillStatus.PARTIALLY_PAID]] },
                  '$totalPayable',
                  0,
                ],
              },
            },
            totalOverdue: {
              $sum: {
                $cond: [{ $eq: ['$status', BillStatus.OVERDUE] }, '$totalPayable', 0],
              },
            },
          },
        },
      ]),
      BillInfo.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: '$billMonth',
            amount: { $sum: '$totalPayable' },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: -1 },
        },
        {
          $limit: 12,
        },
      ]),
      BillInfo.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: '$status',
            amount: { $sum: '$totalPayable' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const typeStats = await BillInfo.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: '$billType',
          amount: { $sum: '$totalPayable' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);

    const baseStats = stats[0] || {
      totalBills: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
    };

    const byMonth: Record<string, number> = {};
    monthlyStats.forEach(stat => {
      byMonth[stat._id] = stat.amount;
    });

    const byStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      byStatus[stat._id] = stat.count;
    });

    const byType: Record<string, number> = {};
    typeStats.forEach(stat => {
      byType[stat._id] = stat.amount;
    });

    return {
      ...baseStats,
      byMonth,
      byStatus,
      byType,
    };
  },

  /**
   * Generate bills for multiple members
   */
  async generateBills(
    data: GenerateBillsDto,
    userId: Types.ObjectId
  ): Promise<{ success: number; failed: number; bills: BillInfoType[] }> {
    const { memberIds, billTypeId, billMonth, dueDate, gracePeriodDays = 7, templateData } = data;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      throw new Error('Member IDs are required');
    }

    const billTypeDoc = await BillType.findById(billTypeId);
    if (!billTypeDoc || (billTypeDoc as any).isDeleted) {
      throw new Error('Bill type not found');
    }

    const validMembers = await Member.find({
      _id: { $in: memberIds.map(id => new Types.ObjectId(id)) },
      isDeleted: false,
      isActive: true,
    });

    if (validMembers.length === 0) {
      throw new Error('No valid members found');
    }

    const generatedBills: BillInfoType[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const member of validMembers) {
      try {
        // Get member's files
        const files = await File.find({
          memId: member._id,
          isDeleted: false,
          isActive: true,
        }).limit(1); // Assuming one file per member for billing

        if (files.length === 0) {
          failedCount++;
          continue;
        }

        const file = files[0];

        // Calculate bill amount based on template or BillType default
        const billAmount = templateData?.baseAmount ?? billTypeDoc.defaultAmount ?? 1000;

        // Check for previous arrears
        const previousBills = await BillInfo.find({
          memId: member._id,
          status: { $in: [BillStatus.PENDING, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE] },
          isDeleted: false,
        });

        const arrears = previousBills.reduce((sum, bill) => sum + (bill.remainingBalance ?? 0), 0);

        // Generate bill number
        const prefix = (billTypeDoc.billTypeName || 'BL ').substring(0, 3).toUpperCase().replace(/\s/g, 'X');
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0');
        const billNo = `${prefix}-${timestamp}-${random}`;

        const billData: any = {
          billNo,
          billTypeId,
          fileId: file._id,
          memId: member._id,
          billMonth,
          billAmount,
          fineAmount: 0,
          arrears,
          totalPayable: billAmount + arrears,
          dueDate,
          gracePeriodDays,
          createdBy: userId,
          isActive: true,
          isDeleted: false,
        };

        if (templateData?.readings) {
          billData.previousReading = templateData.readings.previous;
          billData.currentReading = templateData.readings.current;
        }

        const bill = await BillInfo.create(billData);

        const populatedBill = await BillInfo.findById(bill._id)
          .populate('billTypeId', 'billTypeName billTypeCategory')
          .populate('memId', 'memName fullName memNic mobileNo')
          .populate('fileId', 'fileRegNo');

        if (populatedBill) {
          generatedBills.push(toPlainObject(populatedBill));
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        console.error(`Failed to generate bill for member ${member._id}:`, error);
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      bills: generatedBills,
    };
  },

  /**
   * Apply fine for overdue bills
   */
  async applyFineForOverdue(): Promise<{ updated: number; totalFine: number }> {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const overdueBills = await BillInfo.find({
      status: BillStatus.OVERDUE,
      dueDate: { $lt: oneMonthAgo },
      isDeleted: false,
      isActive: true,
    });

    let updatedCount = 0;
    let totalFine = 0;

    for (const bill of overdueBills) {
      // Calculate fine (e.g., 5% of bill amount per month)
      const monthsOverdue = Math.ceil(
        (now.getTime() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const fineAmount = bill.billAmount * 0.05 * monthsOverdue;

      if (fineAmount > 0) {
        await BillInfo.findByIdAndUpdate(bill._id, {
          $inc: { fineAmount: fineAmount, totalPayable: fineAmount },
          modifiedBy: bill.createdBy, // Use original creator or system user
        });

        updatedCount++;
        totalFine += fineAmount;
      }
    }

    return {
      updated: updatedCount,
      totalFine,
    };
  },
};
