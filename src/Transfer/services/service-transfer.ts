import { Types } from 'mongoose';
import Application from '../../Application/models/models-application';
import File from '../../File/models/models-file';
import Member from '../../Member/models/models-member';

import Nominee from '../../Nominee/models/models-nominee';
import { uploadService } from '../../imageUpload/services/upload.service';
import { EntityType } from '../../imageUpload/types/upload.types';
import { SrTransferType } from '../index-transfer-type';
import SrTransfer, { TransferStatus } from '../models/models-transfer';
import {
  CreateSrTransferDto,
  ExecuteTransferDto,
  RecordFeePaymentDto,
  TransferDashboardSummary,
  TransferQueryParams,
  TransferStatistics,
  TransferTimelineItem,
  SrTransferType as TransferType,
  UpdateSrTransferDto,
} from '../types/types-transfer';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): TransferType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as TransferType;
};

export const srTransferService = {
  /**
   * Create new transfer
   */
  async createTransfer(data: CreateSrTransferDto, userId: Types.ObjectId): Promise<TransferType> {
    // Check if file exists
    const file = await File.findById(data.fileId);
    if (!file || file.isDeleted) {
      throw new Error('File not found');
    }

    // Check if transfer type exists
    const transferType = await SrTransferType.findById(data.transferTypeId);
    if (!transferType || transferType.isDeleted || !transferType.isActive) {
      throw new Error('Transfer type not found or inactive');
    }

    // Check if seller exists
    const seller = await Member.findById(data.sellerMemId);
    if (!seller || (seller as any).isDeleted) {
      throw new Error('Seller not found');
    }

    // Check if buyer exists
    const buyer = await Member.findById(data.buyerMemId);
    if (!buyer || (buyer as any).isDeleted) {
      throw new Error('Buyer not found');
    }

    // Check if seller and buyer are different
    if (data.sellerMemId === data.buyerMemId) {
      throw new Error('Seller and buyer cannot be the same person');
    }

    // Check if file belongs to seller
    if (file.memId.toString() !== data.sellerMemId) {
      throw new Error('File does not belong to the specified seller');
    }

    // Check if application exists (if provided)
    if (data.applicationId) {
      const application = await Application.findById(data.applicationId);
      if (!application || (application as any).isDeleted) {
        throw new Error('Application not found');
      }
    }

    // Check if nominee exists (if provided)
    if (data.nomineeId) {
      const nominee = await Nominee.findById(data.nomineeId);
      if (!nominee || nominee.isDeleted) {
        throw new Error('Nominee not found');
      }
      // Verify nominee belongs to buyer
      if (nominee.memId.toString() !== data.buyerMemId) {
        throw new Error('Nominee does not belong to the buyer');
      }
    }

    // Check for pending transfers on the same file
    const existingTransfer = await SrTransfer.findOne({
      fileId: data.fileId,
      isDeleted: false,
      status: {
        $in: [TransferStatus.PENDING, TransferStatus.UNDER_REVIEW, TransferStatus.APPROVED],
      },
    });

    if (existingTransfer) {
      throw new Error('File already has a pending transfer');
    }

    const transferData: any = {
      ...data,
      transferFeePaid: false,
      transfIsAtt: data.transfIsAtt || false,
      status: TransferStatus.PENDING,
      isActive: true,
      createdBy: userId,
      isDeleted: false,
    };

    // Calculate transfer fee if not provided
    if (!transferData.transferFeeAmount) {
      transferData.transferFeeAmount = transferType.transferFee;
    }

    const transfer = await SrTransfer.create(transferData);

    const createdTransfer = await SrTransfer.findById(transfer._id)
      .populate('file', 'fileRegNo plotId')
      .populate('transferType', 'typeName transferFee')
      .populate('seller', 'fullName cnic mobileNo')
      .populate('buyer', 'fullName cnic mobileNo')
      .populate('createdBy', 'userName fullName designation');

    if (!createdTransfer) {
      throw new Error('Failed to create transfer');
    }

    return toPlainObject(createdTransfer);
  },

  /**
   * Get transfer by ID
   */
  async getTransferById(id: string): Promise<TransferType> {
    try {
      const transfer = await SrTransfer.findById(id)
        .populate('file', 'fileRegNo fileBarCode projId plotId totalAmount')
        .populate('transferType', 'typeName transferFee description')
        .populate('seller', 'fullName cnic fatherName mobileNo email address')
        .populate('buyer', 'fullName cnic fatherName mobileNo email address')
        .populate('application', 'applicationNo applicationDate')

        .populate('nominee', 'nomineeName nomineeCNIC relationWithMember')
        .populate('createdBy', 'userName fullName designation')
        .populate('modifiedBy', 'userName fullName designation');

      if (!transfer || transfer.isDeleted) {
        throw new Error('Transfer not found');
      }

      return toPlainObject(transfer);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid transfer ID');
    }
  },

  /**
   * Get all transfers with pagination
   */
  async getTransfers(params: TransferQueryParams): Promise<{
    transfers: TransferType[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      fileId,
      sellerMemId,
      buyerMemId,
      transferTypeId,
      status,
      transferFeePaid,
      transfIsAtt,
      isActive = true,
      fromDate,
      toDate,
      search,
      sortBy = 'transferInitDate',
      sortOrder = 'desc',
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

    if (fileId) {
      query.fileId = new Types.ObjectId(fileId);
    }

    if (sellerMemId) {
      query.sellerMemId = new Types.ObjectId(sellerMemId);
    }

    if (buyerMemId) {
      query.buyerMemId = new Types.ObjectId(buyerMemId);
    }

    if (transferTypeId) {
      query.transferTypeId = new Types.ObjectId(transferTypeId);
    }

    if (status) {
      query.status = status;
    }

    if (transferFeePaid !== undefined) {
      query.transferFeePaid = transferFeePaid;
    }

    if (transfIsAtt !== undefined) {
      query.transfIsAtt = transfIsAtt;
    }

    if (fromDate || toDate) {
      query.transferInitDate = {};
      if (fromDate) query.transferInitDate.$gte = new Date(fromDate);
      if (toDate) query.transferInitDate.$lte = new Date(toDate);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const [transfers, total] = await Promise.all([
      SrTransfer.find(query)
        .populate('file', 'fileRegNo')
        .populate('transferType', 'typeName')
        .populate('seller', 'fullName cnic')
        .populate('buyer', 'fullName cnic')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      SrTransfer.countDocuments(query),
    ]);

    return {
      transfers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update transfer
   */
  async updateTransfer(
    id: string,
    data: UpdateSrTransferDto,
    userId: Types.ObjectId
  ): Promise<TransferType | null> {
    const existingTransfer = await SrTransfer.findById(id);
    if (!existingTransfer || existingTransfer.isDeleted) {
      throw new Error('Transfer not found');
    }

    // Prevent certain updates based on status
    if (existingTransfer.status === TransferStatus.COMPLETED) {
      const allowedUpdates = ['remarks', 'isActive', 'ndcDocPath'];
      const updateKeys = Object.keys(data);
      const invalidUpdates = updateKeys.filter(key => !allowedUpdates.includes(key));

      if (invalidUpdates.length > 0) {
        throw new Error(`Cannot update ${invalidUpdates.join(', ')} for a completed transfer`);
      }
    }

    // Check if nominee exists (if being updated)
    if (data.nomineeId) {
      const nominee = await Nominee.findById(data.nomineeId);
      if (!nominee || nominee.isDeleted) {
        throw new Error('Nominee not found');
      }
      // Verify nominee belongs to buyer
      if (nominee.memId.toString() !== existingTransfer.buyerMemId.toString()) {
        throw new Error('Nominee does not belong to the buyer');
      }
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    // Handle status changes
    if (
      data.status === TransferStatus.COMPLETED &&
      existingTransfer.status !== TransferStatus.COMPLETED
    ) {
      // Update file ownership
      await File.findByIdAndUpdate(existingTransfer.fileId, {
        $set: {
          memId: existingTransfer.buyerMemId,
          nomineeId: existingTransfer.nomineeId,
          modifiedBy: userId,
        },
      });

      // Set execution date if not provided
      if (!updateObj.transferExecutionDate) {
        updateObj.transferExecutionDate = new Date();
      }

      // Set officer designation if not provided
      if (!updateObj.officerDesignation && updateObj.officerName) {
        updateObj.officerDesignation = 'Society Officer';
      }
    }

    // Update fee paid date if fee status changes
    if (data.transferFeePaid === true && existingTransfer.transferFeePaid === false) {
      updateObj.transferFeePaidDate = new Date();
    }

    const transfer = await SrTransfer.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('file', 'fileRegNo')
      .populate('transferType', 'typeName')
      .populate('seller', 'fullName cnic')
      .populate('buyer', 'fullName cnic')
      .populate('modifiedBy', 'userName fullName');

    return transfer ? toPlainObject(transfer) : null;
  },

  /**
   * Delete transfer (soft delete)
   */
  async deleteTransfer(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingTransfer = await SrTransfer.findById(id);
    if (!existingTransfer || existingTransfer.isDeleted) {
      throw new Error('Transfer not found');
    }

    // Don't allow deletion of completed transfers
    if (existingTransfer.status === TransferStatus.COMPLETED) {
      throw new Error('Cannot delete a completed transfer');
    }

    const result = await SrTransfer.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          status: TransferStatus.CANCELLED,
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Record fee payment
   */
  async recordFeePayment(
    id: string,
    data: RecordFeePaymentDto,
    userId: Types.ObjectId
  ): Promise<TransferType | null> {
    const transfer = await SrTransfer.findById(id);
    if (!transfer || transfer.isDeleted) {
      throw new Error('Transfer not found');
    }

    if (transfer.transferFeePaid) {
      throw new Error('Transfer fee already paid');
    }

    const updateObj: any = {
      transferFeePaid: true,
      transferFeePaidDate: data.paymentDate,
      transferFeeAmount: data.amount,
      modifiedBy: userId,
      status:
        transfer.status === TransferStatus.FEE_PENDING ? TransferStatus.PENDING : transfer.status,
    };

    // Add remarks about payment
    const paymentRemark = `Fee paid: Rs. ${data.amount} via ${data.paymentMethod} on ${data.paymentDate.toLocaleDateString()}`;
    updateObj.remarks = transfer.remarks ? `${transfer.remarks}\n${paymentRemark}` : paymentRemark;

    const updatedTransfer = await SrTransfer.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    )
      .populate('file', 'fileRegNo')
      .populate('transferType', 'typeName')
      .populate('seller', 'fullName')
      .populate('buyer', 'fullName');

    return updatedTransfer ? toPlainObject(updatedTransfer) : null;
  },

  /**
   * Execute transfer (finalize with witnesses and officer)
   */
  async executeTransfer(
    id: string,
    data: ExecuteTransferDto,
    userId: Types.ObjectId
  ): Promise<TransferType | null> {
    const transfer = await SrTransfer.findById(id);
    if (!transfer || transfer.isDeleted) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== TransferStatus.APPROVED) {
      throw new Error('Only approved transfers can be executed');
    }

    if (!transfer.transferFeePaid) {
      throw new Error('Transfer fee must be paid before execution');
    }

    if (!transfer.transfIsAtt) {
      throw new Error('Clearance certificates must be attached before execution');
    }

    const updateObj: any = {
      status: TransferStatus.COMPLETED,
      transferExecutionDate: data.executionDate,
      witness1Name: data.witness1Name,
      witness1CNIC: data.witness1CNIC,
      witness2Name: data.witness2Name,
      witness2CNIC: data.witness2CNIC,
      officerName: data.officerName,
      officerDesignation: data.officerDesignation,
      modifiedBy: userId,
    };

    // Add execution remarks
    const executionRemark = `Executed on ${data.executionDate.toLocaleDateString()} by ${data.officerName} (${data.officerDesignation}). Witnesses: ${data.witness1Name}${data.witness2Name ? `, ${data.witness2Name}` : ''}`;
    updateObj.remarks = transfer.remarks
      ? `${transfer.remarks}\n${executionRemark}`
      : executionRemark;

    // Update file ownership
    await File.findByIdAndUpdate(transfer.fileId, {
      $set: {
        memId: transfer.buyerMemId,
        nomineeId: transfer.nomineeId,
        modifiedBy: userId,
        fileRemarks: transfer.file?.fileRemarks
          ? `${transfer.file.fileRemarks}\nTransferred to ${transfer.buyer?.fullName} on ${data.executionDate.toLocaleDateString()}`
          : `Transferred to ${transfer.buyer?.fullName} on ${data.executionDate.toLocaleDateString()}`,
      },
    });

    const executedTransfer = await SrTransfer.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    )
      .populate('file', 'fileRegNo plotId')
      .populate('transferType', 'typeName')
      .populate('seller', 'fullName cnic')
      .populate('buyer', 'fullName cnic')
      .populate('nominee', 'nomineeName');

    return executedTransfer ? toPlainObject(executedTransfer) : null;
  },

  /**
   * Upload NDC document
   */
  async uploadNDCDocument(
    transferId: string,
    file: Express.Multer.File,
    userId: Types.ObjectId
  ): Promise<TransferType | null> {
    const transfer = await SrTransfer.findById(transferId);
    if (!transfer || transfer.isDeleted) {
      throw new Error('Transfer not found');
    }

    const existingFiles = await uploadService.getFilesByEntity(EntityType.TRANSFER, transferId);
    if (existingFiles.length > 0) {
      await uploadService.deleteFromCloudinary(existingFiles[0].publicId);
    }

    const uploadedFile = await uploadService.uploadFile({
      file,
      entityType: EntityType.TRANSFER,
      entityId: transferId,
      uploadedBy: userId.toString(),
      metadata: {
        field: 'ndcDocPath',
        originalName: file.originalname,
      },
    });

    // Add remarks about NDC upload
    const updateObj: any = {
      ndcDocPath: uploadedFile.secureUrl,
      modifiedBy: userId,
      updatedAt: new Date(),
    };

    // Add remarks about NDC upload
    const ndcRemark = `NDC document uploaded: ${file.originalname} on ${new Date().toLocaleDateString()}`;
    updateObj.remarks = transfer.remarks ? `${transfer.remarks}\n${ndcRemark}` : ndcRemark;

    const updatedTransfer = await SrTransfer.findByIdAndUpdate(
      transferId,
      { $set: updateObj },
      { new: true }
    )
      .populate('file', 'fileRegNo')
      .populate('transferType', 'typeName')
      .populate('seller', 'fullName')
      .populate('buyer', 'fullName');

    return updatedTransfer ? toPlainObject(updatedTransfer) : null;
  },

  /**
   * Get transfers by file
   */
  async getTransfersByFile(fileId: string): Promise<TransferType[]> {
    const transfers = await SrTransfer.find({
      fileId: new Types.ObjectId(fileId),
      isDeleted: false,
    })
      .populate('transferType', 'typeName transferFee')
      .populate('seller', 'fullName cnic')
      .populate('buyer', 'fullName cnic')
      .sort({ transferInitDate: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return transfers;
  },

  /**
   * Get transfers by member
   */
  async getTransfersByMember(memId: string): Promise<TransferType[]> {
    const transfers = await SrTransfer.find({
      $or: [{ sellerMemId: new Types.ObjectId(memId) }, { buyerMemId: new Types.ObjectId(memId) }],
      isDeleted: false,
      isActive: true,
    })
      .populate('file', 'fileRegNo plotId')
      .populate('transferType', 'typeName')
      .populate('seller', 'fullName cnic')
      .populate('buyer', 'fullName cnic')
      .sort({ transferInitDate: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return transfers;
  },

  /**
   * Get pending transfers
   */
  async getPendingTransfers(
    page: number = 1,
    limit: number = 20
  ): Promise<{ transfers: TransferType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const query = {
      status: { $in: [TransferStatus.PENDING, TransferStatus.FEE_PENDING] },
      isDeleted: false,
      isActive: true,
    };

    const [transfers, total] = await Promise.all([
      SrTransfer.find(query)
        .populate('file', 'fileRegNo plotId')
        .populate('transferType', 'typeName')
        .populate('seller', 'fullName cnic')
        .populate('buyer', 'fullName cnic')
        .sort({ transferInitDate: 1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      SrTransfer.countDocuments(query),
    ]);

    return {
      transfers,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get transfer statistics
   */
  async getTransferStatistics(): Promise<TransferStatistics> {
    const [stats, statusStats, typeStats, monthlyStats] = await Promise.all([
      SrTransfer.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $group: {
            _id: null,
            totalTransfers: { $sum: 1 },
            pendingTransfers: {
              $sum: { $cond: [{ $eq: ['$status', TransferStatus.PENDING] }, 1, 0] },
            },
            underReviewTransfers: {
              $sum: { $cond: [{ $eq: ['$status', TransferStatus.UNDER_REVIEW] }, 1, 0] },
            },
            completedTransfers: {
              $sum: { $cond: [{ $eq: ['$status', TransferStatus.COMPLETED] }, 1, 0] },
            },
            cancelledTransfers: {
              $sum: { $cond: [{ $eq: ['$status', TransferStatus.CANCELLED] }, 1, 0] },
            },
            feePendingTransfers: {
              $sum: { $cond: [{ $eq: ['$status', TransferStatus.FEE_PENDING] }, 1, 0] },
            },
            totalFeeCollected: { $sum: '$transferFeeAmount' },
          },
        },
      ]),
      SrTransfer.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalFee: { $sum: '$transferFeeAmount' },
          },
        },
      ]),
      SrTransfer.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $lookup: {
            from: 'srtransfertypes',
            localField: 'transferTypeId',
            foreignField: '_id',
            as: 'transferType',
          },
        },
        {
          $unwind: '$transferType',
        },
        {
          $group: {
            _id: '$transferType.typeName',
            count: { $sum: 1 },
            totalFee: { $sum: '$transferFeeAmount' },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
      SrTransfer.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $group: {
            _id: {
              year: { $year: '$transferInitDate' },
              month: { $month: '$transferInitDate' },
            },
            count: { $sum: 1 },
            totalFee: { $sum: '$transferFeeAmount' },
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

    const baseStats = stats[0] || {
      totalTransfers: 0,
      pendingTransfers: 0,
      underReviewTransfers: 0,
      completedTransfers: 0,
      cancelledTransfers: 0,
      feePendingTransfers: 0,
      totalFeeCollected: 0,
    };

    // Calculate average processing time for completed transfers
    const processingTimes = await SrTransfer.aggregate([
      {
        $match: {
          isDeleted: false,
          status: TransferStatus.COMPLETED,
          transferInitDate: { $exists: true },
          transferExecutionDate: { $exists: true },
        },
      },
      {
        $project: {
          processingTime: {
            $divide: [
              { $subtract: ['$transferExecutionDate', '$transferInitDate'] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          averageProcessingTime: { $avg: '$processingTime' },
        },
      },
    ]);

    const byStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      byStatus[stat._id] = stat.count;
    });

    const byType: Record<string, number> = {};
    typeStats.forEach(stat => {
      byType[stat._id] = stat.count;
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
      byMonth[key] = stat.count;
    });

    return {
      ...baseStats,
      averageProcessingTime: processingTimes[0]?.averageProcessingTime || 0,
      byStatus,
      byType,
      byMonth,
    };
  },

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<TransferDashboardSummary> {
    const [totalTransfers, pendingTransfers, feePendingTransfers, recentTransfers] =
      await Promise.all([
        SrTransfer.countDocuments({ isDeleted: false, isActive: true }),
        SrTransfer.countDocuments({
          isDeleted: false,
          isActive: true,
          status: { $in: [TransferStatus.PENDING, TransferStatus.UNDER_REVIEW] },
        }),
        SrTransfer.countDocuments({
          isDeleted: false,
          isActive: true,
          status: TransferStatus.FEE_PENDING,
        }),
        SrTransfer.find({
          isDeleted: false,
          isActive: true,
        })
          .populate('file', 'fileRegNo')
          .populate('transferType', 'typeName')
          .populate('seller', 'fullName')
          .populate('buyer', 'fullName')
          .sort({ createdAt: -1 })
          .limit(10)
          .then(docs => docs.map(doc => toPlainObject(doc))),
      ]);

    // Calculate revenue and top transfer types
    const revenueStats = await SrTransfer.aggregate([
      {
        $match: {
          isDeleted: false,
          isActive: true,
          transferFeePaid: true,
        },
      },
      {
        $lookup: {
          from: 'srtransfertypes',
          localField: 'transferTypeId',
          foreignField: '_id',
          as: 'transferType',
        },
      },
      {
        $unwind: '$transferType',
      },
      {
        $group: {
          _id: '$transferTypeId',
          typeName: { $first: '$transferType.typeName' },
          count: { $sum: 1 },
          revenue: { $sum: '$transferFeeAmount' },
        },
      },
      {
        $sort: { revenue: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const revenueGenerated = revenueStats.reduce((sum, stat) => sum + stat.revenue, 0);

    return {
      totalTransfers,
      pendingTransfers,
      feePendingTransfers,
      revenueGenerated,
      recentTransfers,
      topTransferTypes: revenueStats.map(stat => ({
        typeId: stat._id,
        typeName: stat.typeName,
        count: stat.count,
        revenue: stat.revenue,
      })),
    };
  },

  /**
   * Get overdue transfers (> 30 days pending)
   */
  async getOverdueTransfers(): Promise<TransferType[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transfers = await SrTransfer.find({
      status: { $in: [TransferStatus.PENDING, TransferStatus.FEE_PENDING] },
      transferInitDate: { $lt: thirtyDaysAgo },
      isDeleted: false,
      isActive: true,
    })
      .populate('file', 'fileRegNo plotId')
      .populate('transferType', 'typeName')
      .populate('seller', 'fullName cnic mobileNo')
      .populate('buyer', 'fullName cnic mobileNo')
      .sort({ transferInitDate: 1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return transfers;
  },

  /**
   * Search transfers
   */
  async searchTransfers(searchTerm: string, limit: number = 10): Promise<TransferType[]> {
    const transfers = await SrTransfer.find({
      $text: { $search: searchTerm },
      isDeleted: false,
      isActive: true,
    })
      .populate('file', 'fileRegNo')
      .populate('transferType', 'typeName')
      .populate('seller', 'fullName cnic')
      .populate('buyer', 'fullName cnic')
      .limit(limit)
      .sort({ score: { $meta: 'textScore' } })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return transfers;
  },

  /**
   * Bulk update transfer status
   */
  async bulkUpdateStatus(
    transferIds: string[],
    status: TransferStatus,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    const objectIds = transferIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid transfer ID: ${id}`);
      }
    });

    const updateObj: any = {
      status,
      modifiedBy: userId,
    };

    // Set cancellation reason if status is CANCELLED
    if (status === TransferStatus.CANCELLED) {
      updateObj.cancellationReason = 'Bulk cancelled by admin';
    }

    // Set execution date if status is COMPLETED
    if (status === TransferStatus.COMPLETED) {
      updateObj.transferExecutionDate = new Date();
      updateObj.officerDesignation = 'Bulk Processing';
      updateObj.officerName = 'System Administrator';
    }

    const result = await SrTransfer.updateMany(
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
   * Get transfer timeline
   */
  async getTransferTimeline(transferId: string): Promise<TransferTimelineItem[]> {
    const transfer = await SrTransfer.findById(transferId)
      .populate('createdByUser', 'userName fullName')
      .populate('modifiedByUser', 'userName fullName');

    if (!transfer || transfer.isDeleted) {
      throw new Error('Transfer not found');
    }

    const timeline: TransferTimelineItem[] = [];

    // Initial creation
    timeline.push({
      date: transfer.createdAt,
      action: 'Transfer Created',
      status: TransferStatus.PENDING,
      performedBy: transfer.createdByUser?.fullName || 'System',
      notes: 'Transfer application submitted',
    });

    // Status changes
    if (transfer.transferInitDate) {
      timeline.push({
        date: transfer.transferInitDate,
        action: 'Transfer Initiated',
        status: transfer.status,
        performedBy: 'System',
        notes: 'Transfer process officially started',
      });
    }

    // Fee payment
    if (transfer.transferFeePaid && transfer.transferFeePaidDate) {
      timeline.push({
        date: transfer.transferFeePaidDate,
        action: 'Fee Paid',
        status: transfer.status,
        performedBy: 'Finance Department',
        notes: `Transfer fee of Rs. ${transfer.transferFeeAmount} paid`,
      });
    }

    // NDC upload
    if (transfer.ndcDocPath) {
      // Find when NDC was uploaded (approximate from updatedAt)
      timeline.push({
        date: transfer.updatedAt,
        action: 'NDC Uploaded',
        status: transfer.status,
        performedBy: 'Legal Department',
        notes: 'No Demand Certificate uploaded',
      });
    }

    // Clearance certificates attached
    if (transfer.transfIsAtt) {
      timeline.push({
        date: transfer.updatedAt,
        action: 'Clearance Certificates Attached',
        status: transfer.status,
        performedBy: 'Legal Department',
        notes: 'All required clearance certificates uploaded',
      });
    }

    // Execution
    if (transfer.transferExecutionDate) {
      timeline.push({
        date: transfer.transferExecutionDate,
        action: 'Transfer Executed',
        status: TransferStatus.COMPLETED,
        performedBy: transfer.officerName || 'Society Officer',
        notes: `Transfer executed with witnesses${transfer.witness2Name ? ' (2 witnesses)' : ' (1 witness)'}`,
      });
    }

    // Updated at
    if (transfer.updatedAt && transfer.updatedAt.getTime() !== transfer.createdAt.getTime()) {
      timeline.push({
        date: transfer.updatedAt,
        action: 'Transfer Updated',
        status: transfer.status,
        performedBy: transfer.modifiedByUser?.fullName || 'System',
        notes: 'Transfer details updated',
      });
    }

    // Sort by date
    timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

    return timeline;
  },

  /**
   * Validate transfer for completion
   */
  async validateTransferForCompletion(transferId: string): Promise<{
    isValid: boolean;
    requirements: string[];
    missing: string[];
  }> {
    const transfer = await SrTransfer.findById(transferId);
    if (!transfer || transfer.isDeleted) {
      throw new Error('Transfer not found');
    }

    const requirements: string[] = [
      'Transfer must be in APPROVED status',
      'Transfer fee must be paid',
      'Clearance certificates must be attached',
      'NDC document must be uploaded (if required)',
      'Primary witness information must be provided',
      'Officer information must be provided for execution',
    ];

    const missing: string[] = [];

    if (transfer.status !== TransferStatus.APPROVED) {
      missing.push('Transfer is not approved');
    }

    if (!transfer.transferFeePaid) {
      missing.push('Transfer fee not paid');
    }

    if (!transfer.transfIsAtt) {
      missing.push('Clearance certificates not attached');
    }

    // Check if NDC is required based on transfer type
    const transferType = await SrTransferType.findById(transfer.transferTypeId);
    if (transferType && transferType.typeName.toLowerCase().includes('sale')) {
      requirements.push('NDC required for sale transfers');
      if (!transfer.ndcDocPath) {
        missing.push('NDC document not uploaded (required for sale transfers)');
      }
    }

    if (!transfer.witness1Name || !transfer.witness1CNIC) {
      missing.push('Primary witness information incomplete');
    }

    if (!transfer.officerName) {
      missing.push('Officer name not provided');
    }

    return {
      isValid: missing.length === 0,
      requirements,
      missing,
    };
  },

  /**
   * Get transfers requiring action
   */
  async getTransfersRequiringAction(): Promise<{
    feePending: TransferType[];
    documentsPending: TransferType[];
    reviewPending: TransferType[];
    ndcPending: TransferType[];
  }> {
    const [feePending, documentsPending, reviewPending, ndcPending] = await Promise.all([
      SrTransfer.find({
        status: TransferStatus.FEE_PENDING,
        isDeleted: false,
        isActive: true,
      })
        .populate('file', 'fileRegNo')
        .populate('seller', 'fullName')
        .populate('buyer', 'fullName')
        .limit(10)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      SrTransfer.find({
        status: TransferStatus.DOCUMENTS_REQUIRED,
        isDeleted: false,
        isActive: true,
      })
        .populate('file', 'fileRegNo')
        .populate('seller', 'fullName')
        .populate('buyer', 'fullName')
        .limit(10)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      SrTransfer.find({
        status: TransferStatus.UNDER_REVIEW,
        isDeleted: false,
        isActive: true,
      })
        .populate('file', 'fileRegNo')
        .populate('seller', 'fullName')
        .populate('buyer', 'fullName')
        .limit(10)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      SrTransfer.find({
        ndcDocPath: { $exists: false },
        status: TransferStatus.APPROVED,
        isDeleted: false,
        isActive: true,
      })
        .populate('file', 'fileRegNo')
        .populate('seller', 'fullName')
        .populate('buyer', 'fullName')
        .limit(10)
        .then(docs => docs.map(doc => toPlainObject(doc))),
    ]);

    return {
      feePending,
      documentsPending,
      reviewPending,
      ndcPending,
    };
  },
};
