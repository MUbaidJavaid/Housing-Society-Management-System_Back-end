// src/database/File/services/service-file.ts
import { Types } from 'mongoose';
import Application from '../../Application/models/models-application';
import InstallmentPlan from '../../Installment/models/models-installment-plan';
import Member from '../../Member/models/models-member';
import Nominee from '../../Nominee/models/models-nominee';
import Plot from '../../Plots/models/models-plot';
import Project from '../../Project/models/models-project';
import File, { FileStatus } from '../models/models-file';
import {
  AdjustFileDto,
  CreateFileDto,
  FileDashboardSummary,
  FileQueryParams,
  FileStatistics,
  FileType,
  TransferFileDto,
  UpdateFileDto,
} from '../types/types-file';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): FileType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as FileType;
};

export const fileService = {
  /**
   * Create new file
   */
  async createFile(data: CreateFileDto, userId: Types.ObjectId): Promise<FileType> {
    // Check if file registration number already exists
    if (data.fileRegNo) {
      const existingFile = await File.findOne({
        fileRegNo: data.fileRegNo.toUpperCase(),
        isDeleted: false,
      });
      if (existingFile) {
        throw new Error('File registration number already exists');
      }
    }

    // Plan is REQUIRED
    if (!data.planId) {
      throw new Error('Installment plan is required');
    }

    // Plot is REQUIRED
    if (!data.plotId) {
      throw new Error('Plot ID is required - file must be associated with a plot');
    }

    // Check if plan exists and is active
    const plan = await InstallmentPlan.findById(data.planId);
    if (!plan || (plan as any).isDeleted || !(plan as any).isActive) {
      throw new Error('Installment plan not found or inactive');
    }

    // Check if plot exists
    const plot = await Plot.findById(data.plotId);
    if (!plot || (plot as any).isDeleted) {
      throw new Error('Plot not found');
    }

    // Validate plan belongs to plot's project
    const plotProjId = (plot.projectId as Types.ObjectId).toString();
    const planProjId = (plan.projId as Types.ObjectId).toString();
    if (plotProjId !== planProjId) {
      throw new Error('Installment plan must belong to the same project as the selected plot');
    }

    // Check if member exists
    const member = await Member.findById(data.memId);
    if (!member || (member as any).isDeleted) {
      throw new Error('Member not found');
    }

    // Check if nominee exists (if provided)
    if (data.nomineeId) {
      const nominee = await Nominee.findById(data.nomineeId);
      if (!nominee || (nominee as any).isDeleted) {
        throw new Error('Nominee not found');
      }
    }

    // Check if application exists (if provided)
    if (data.applicationId) {
      const application = await Application.findById(data.applicationId);
      if (!application || (application as any).isDeleted) {
        throw new Error('Application not found');
      }
    }

    // Check if plot is already allocated
    const existingFileWithPlot = await File.findOne({
      plotId: data.plotId,
      isDeleted: false,
      status: { $in: [FileStatus.ACTIVE, FileStatus.PENDING] },
    });

    if (existingFileWithPlot) {
      throw new Error('Plot is already allocated to another file');
    }

    // Validate down payment
    if (data.downPayment > data.totalAmount) {
      throw new Error('Down payment cannot exceed total amount');
    }

    // Generate file registration number if not provided
    let fileRegNo = data.fileRegNo;
    if (!fileRegNo) {
      // Get project from plot
      const project = await Project.findById(plot.projectId);
      const projectCode = project?.projCode || 'PROJ';
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      fileRegNo = `${projectCode}-${timestamp}-${random}`;
    } else {
      fileRegNo = fileRegNo.toUpperCase();
    }

    const fileData: any = {
      ...data,
      fileRegNo,
      status: FileStatus.PENDING,
      isActive: true,
      createdBy: userId,
      isDeleted: false,
    };

    const file = await File.create(fileData);

    // Populate with detailed plot information
    const createdFile = await File.findById(file._id)
      .populate('plan', 'planName totalMonths totalAmount projId')
      .populate('member', 'memName memNic mobileNo')
      .populate('nominee', 'nomineeName relationWithMember nomineeCNIC nomineeContact')
      .populate('application', 'applicationNo')
      .populate({
        path: 'plot',
        select:
          'plotNo plotRegistrationNo plotDimensions plotArea plotAreaUnit plotBasePrice plotTotalAmount surchargeAmount discountAmount plotFacing isPossessionReady plotStreet plotRemarks plotType',
        populate: [
          {
            path: 'projectId',
            select: 'projName projCode projPrefix projLocation',
          },
          {
            path: 'plotBlockId',
            select: 'plotBlockName plotBlockDesc',
          },
          {
            path: 'plotSizeId',
            select: 'plotSizeName totalArea areaUnit ratePerUnit',
          },
          {
            path: 'plotCategoryId',
            select: 'categoryName surchargePercentage surchargeFixedAmount',
          },
          {
            path: 'salesStatusId',
            select: 'statusName statusCode colorCode',
          },
        ],
      })
      .populate('createdBy', 'firstName lastName email designation');

    if (!createdFile) {
      throw new Error('Failed to create file');
    }

    return toPlainObject(createdFile);
  },

  /**
   * Get file by ID
   */
  async getFileById(id: string): Promise<FileType> {
    try {
      const file = await File.findById(id)
        .populate('plan', 'planName totalMonths totalAmount projId')
        .populate('member', 'memName memNic fatherName mobileNo email address')
        .populate('nominee', 'nomineeName relationWithMember nomineeCNIC nomineeContact')
        .populate('application', 'applicationNo applicationDate statusId')
        .populate({
          path: 'plot',
          select:
            'plotNo plotRegistrationNo plotDimensions plotArea plotAreaUnit plotBasePrice plotTotalAmount surchargeAmount discountAmount plotFacing isPossessionReady plotStreet plotRemarks plotType',
          populate: [
            {
              path: 'projectId',
              select: 'projName projCode projPrefix projLocation projDescription',
            },
            {
              path: 'plotBlockId',
              select: 'plotBlockName plotBlockDesc',
            },
            {
              path: 'plotSizeId',
              select: 'plotSizeName totalArea areaUnit ratePerUnit',
            },
            {
              path: 'plotCategoryId',
              select: 'categoryName surchargePercentage surchargeFixedAmount',
            },
            {
              path: 'salesStatusId',
              select: 'statusName statusCode colorCode',
            },
            {
              path: 'srDevStatId',
              select: 'srDevStatName devCategory devPhase percentageComplete',
            },
          ],
        })
        .populate('createdBy', 'firstName lastName email designation')
        .populate('modifiedBy', 'firstName lastName email designation');

      if (!file || file.isDeleted) {
        throw new Error('File not found');
      }

      return toPlainObject(file);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid file ID');
    }
  },

  /**
   * Get file by registration number
   */
  async getFileByRegNo(fileRegNo: string): Promise<FileType | null> {
    const file = await File.findOne({
      fileRegNo: fileRegNo.toUpperCase(),
      isDeleted: false,
    })
      .populate('plan', 'planName totalMonths totalAmount projId')
      .populate('member', 'memName memNic mobileNo')
      .populate({
        path: 'plot',
        select: 'plotNo plotRegistrationNo plotArea plotTotalAmount',
        populate: [
          {
            path: 'projectId',
            select: 'projName projCode',
          },
          {
            path: 'plotBlockId',
            select: 'plotBlockName',
          },
        ],
      })
      .populate('createdBy', 'firstName lastName email');

    if (!file) return null;
    return toPlainObject(file);
  },

  /**
   * Get file by barcode
   */
  async getFileByBarcode(fileBarCode: string): Promise<FileType | null> {
    const file = await File.findOne({
      fileBarCode,
      isDeleted: false,
    })
      .populate('plan', 'planName totalMonths totalAmount projId')
      .populate('member', 'memName memNic mobileNo')
      .populate({
        path: 'plot',
        select: 'plotNo plotRegistrationNo',
        populate: {
          path: 'projectId',
          select: 'projName projCode',
        },
      });

    if (!file) return null;
    return toPlainObject(file);
  },

  /**
   * Get all files with pagination
   */
  async getFiles(params: FileQueryParams): Promise<{
    files: FileType[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      projId,
      projectId,
      planId,
      memId,
      nomineeId,
      plotId,
      status,
      isAdjusted,
      isActive = true,
      minAmount,
      maxAmount,
      fromDate,
      toDate,
      search,
      sortBy = 'bookingDate',
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

    // Filter by project through plot (support both projId and projectId)
    const projectIdToUse = projId || projectId;
    if (projectIdToUse) {
      // Find all plots in this project
      const plotsInProject = await Plot.find({
        projectId: new Types.ObjectId(projectIdToUse),
        isDeleted: false,
      }).select('_id');

      const plotIds = plotsInProject.map(plot => plot._id);
      query.plotId = { $in: plotIds };
    }

    if (memId) {
      query.memId = new Types.ObjectId(memId);
    }

    if (nomineeId) {
      query.nomineeId = new Types.ObjectId(nomineeId);
    }

    if (plotId) {
      query.plotId = new Types.ObjectId(plotId);
    }

    if (planId) {
      query.planId = new Types.ObjectId(planId);
    }

    if (status) {
      query.status = status;
    }

    if (isAdjusted !== undefined) {
      query.isAdjusted = isAdjusted;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      query.totalAmount = {};
      if (minAmount !== undefined) query.totalAmount.$gte = minAmount;
      if (maxAmount !== undefined) query.totalAmount.$lte = maxAmount;
    }

    if (fromDate || toDate) {
      query.bookingDate = {};
      if (fromDate) query.bookingDate.$gte = new Date(fromDate);
      if (toDate) query.bookingDate.$lte = new Date(toDate);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const [files, total] = await Promise.all([
      File.find(query)
        .populate('plan', 'planName totalMonths totalAmount projId')
        .populate('member', 'memName memNic mobileNo')
        .populate('nominee', 'nomineeName relationWithMember nomineeCNIC')
        .populate('application', 'applicationNo applicationDate')
        .populate({
          path: 'plot',
          select:
            'plotNo plotRegistrationNo plotDimensions plotArea plotAreaUnit plotTotalAmount plotFacing plotType',
          populate: [
            {
              path: 'projectId',
              select: 'projName projCode projPrefix',
            },
            {
              path: 'plotBlockId',
              select: 'plotBlockName plotBlockDesc',
            },
            {
              path: 'plotSizeId',
              select: 'plotSizeName totalArea areaUnit ratePerUnit',
            },
            {
              path: 'plotCategoryId',
              select: 'categoryName surchargePercentage surchargeFixedAmount',
            },
            {
              path: 'salesStatusId',
              select: 'statusName statusCode colorCode',
            },
          ],
        })
        .populate('createdBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      File.countDocuments(query),
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update file
   */
  async updateFile(
    id: string,
    data: UpdateFileDto,
    userId: Types.ObjectId
  ): Promise<FileType | null> {
    const existingFile = await File.findById(id);
    if (!existingFile || existingFile.isDeleted) {
      throw new Error('File not found');
    }

    // Check if planId is being changed
    const newPlanId = data.planId;
    if (newPlanId && newPlanId !== existingFile.planId?.toString()) {
      const plan = await InstallmentPlan.findById(newPlanId);
      if (!plan || (plan as any).isDeleted || !(plan as any).isActive) {
        throw new Error('Installment plan not found or inactive');
      }
      const plotForProject = await Plot.findById(
        data.plotId || existingFile.plotId
      );
      if (plotForProject) {
        const plotProjId = (plotForProject.projectId as Types.ObjectId).toString();
        const planProjId = (plan.projId as Types.ObjectId).toString();
        if (plotProjId !== planProjId) {
          throw new Error(
            'Installment plan must belong to the same project as the file plot'
          );
        }
      }
    }

    // Check if plot is being changed
    if (data.plotId && data.plotId !== existingFile.plotId?.toString()) {
      const plot = await Plot.findById(data.plotId);
      if (!plot || (plot as any).isDeleted) {
        throw new Error('Plot not found');
      }

      // If planId is also being updated, validate; otherwise ensure existing plan matches new plot's project
      const planToCheck = newPlanId
        ? await InstallmentPlan.findById(newPlanId)
        : await InstallmentPlan.findById(existingFile.planId);
      if (planToCheck && plot) {
        const plotProjId = (plot.projectId as Types.ObjectId).toString();
        const planProjId = (planToCheck.projId as Types.ObjectId).toString();
        if (plotProjId !== planProjId) {
          throw new Error(
            'Installment plan must belong to the same project as the selected plot'
          );
        }
      }

      // Check if new plot is already allocated
      const existingFileWithPlot = await File.findOne({
        plotId: data.plotId,
        isDeleted: false,
        status: { $in: [FileStatus.ACTIVE, FileStatus.PENDING] },
        _id: { $ne: id },
      });

      if (existingFileWithPlot) {
        throw new Error('Plot is already allocated to another file');
      }
    }

    // Check if nominee exists (if being updated)
    if (data.nomineeId) {
      const nominee = await Nominee.findById(data.nomineeId);
      if (!nominee || (nominee as any).isDeleted) {
        throw new Error('Nominee not found');
      }
    }

    // Validate down payment
    if (data.downPayment !== undefined) {
      const totalAmount =
        data.totalAmount !== undefined ? data.totalAmount : existingFile.totalAmount;
      if (data.downPayment > totalAmount) {
        throw new Error('Down payment cannot exceed total amount');
      }
    }

    // Handle status changes
    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    if (data.status === FileStatus.CANCELLED && existingFile.status !== FileStatus.CANCELLED) {
      updateObj.cancellationDate = new Date();
    }

    if (data.status === FileStatus.CLOSED && existingFile.status !== FileStatus.CLOSED) {
      updateObj.actualCompletionDate = new Date();
    }

    const file = await File.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('plan', 'planName totalMonths totalAmount projId')
      .populate('member', 'memName memNic mobileNo')
      .populate({
        path: 'plot',
        select: 'plotNo plotRegistrationNo',
        populate: {
          path: 'projectId',
          select: 'projName projCode',
        },
      })
      .populate('modifiedBy', 'firstName lastName email');

    return file ? toPlainObject(file) : null;
  },

  /**
   * Delete file (soft delete)
   */
  async deleteFile(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingFile = await File.findById(id);
    if (!existingFile || existingFile.isDeleted) {
      throw new Error('File not found');
    }

    // Don't allow deletion of active files
    if (existingFile.status === FileStatus.ACTIVE) {
      throw new Error('Cannot delete an active file');
    }

    const result = await File.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          status: FileStatus.CANCELLED,
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Get files by member
   */
  async getFilesByMember(memId: string, activeOnly: boolean = true): Promise<FileType[]> {
    const query: any = {
      memId: new Types.ObjectId(memId),
      isDeleted: false,
    };

    if (activeOnly) {
      query.isActive = true;
      query.status = { $nin: [FileStatus.CANCELLED, FileStatus.CLOSED] };
    }

    const files = await File.find(query)
      .populate('plan', 'planName totalMonths totalAmount projId')
      .populate({
        path: 'plot',
        select: 'plotNo plotRegistrationNo plotArea plotTotalAmount',
        populate: [
          {
            path: 'projectId',
            select: 'projName projCode',
          },
          {
            path: 'plotBlockId',
            select: 'plotBlockName',
          },
          {
            path: 'plotSizeId',
            select: 'plotSizeName totalArea',
          },
        ],
      })
      .sort({ bookingDate: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return files;
  },

  /**
   * Get files by project
   */
  async getFilesByProject(
    projId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ files: FileType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    // Find all plots in this project
    const plotsInProject = await Plot.find({
      projectId: new Types.ObjectId(projId),
      isDeleted: false,
    }).select('_id');

    const plotIds = plotsInProject.map(plot => plot._id);

    const query = {
      plotId: { $in: plotIds },
      isDeleted: false,
      isActive: true,
    };

    const [files, total] = await Promise.all([
      File.find(query)
        .populate('plan', 'planName totalMonths totalAmount projId')
        .populate('member', 'memName memNic mobileNo')
        .populate({
          path: 'plot',
          select: 'plotNo plotRegistrationNo plotArea',
          populate: [
            {
              path: 'projectId',
              select: 'projName projCode',
            },
            {
              path: 'plotBlockId',
              select: 'plotBlockName',
            },
            {
              path: 'plotSizeId',
              select: 'plotSizeName totalArea',
            },
          ],
        })
        .sort({ bookingDate: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      File.countDocuments(query),
    ]);

    return {
      files,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get files by installment plan
   */
  async getFilesByPlan(
    planId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ files: FileType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const query = {
      planId: new Types.ObjectId(planId),
      isDeleted: false,
    };

    const [files, total] = await Promise.all([
      File.find(query)
        .populate('plan', 'planName totalMonths totalAmount projId')
        .populate('member', 'memName memNic mobileNo')
        .populate({
          path: 'plot',
          select: 'plotNo plotRegistrationNo plotArea plotTotalAmount',
          populate: [
            {
              path: 'projectId',
              select: 'projName projCode',
            },
            {
              path: 'plotBlockId',
              select: 'plotBlockName',
            },
            {
              path: 'plotSizeId',
              select: 'plotSizeName totalArea',
            },
          ],
        })
        .sort({ bookingDate: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      File.countDocuments(query),
    ]);

    return {
      files,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Transfer file to another member
   */
  async transferFile(
    id: string,
    data: TransferFileDto,
    userId: Types.ObjectId
  ): Promise<FileType | null> {
    const file = await File.findById(id);
    if (!file || file.isDeleted) {
      throw new Error('File not found');
    }

    if (file.status !== FileStatus.ACTIVE) {
      throw new Error('Only active files can be transferred');
    }

    // Check if new member exists
    const newMember = await Member.findById(data.newMemberId);
    if (!newMember || (newMember as any).isDeleted) {
      throw new Error('New member not found');
    }

    const updateObj: any = {
      memId: data.newMemberId,
      status: FileStatus.TRANSFERRED,
      modifiedBy: userId,
      fileRemarks: file.fileRemarks
        ? `${file.fileRemarks}\nTransferred to ${newMember.memName} on ${data.transferDate}. Reason: ${data.transferReason}`
        : `Transferred to ${newMember.memName} on ${data.transferDate}. Reason: ${data.transferReason}`,
    };

    const updatedFile = await File.findByIdAndUpdate(id, { $set: updateObj }, { new: true })
      .populate('member', 'memName memNic mobileNo')
      .populate({
        path: 'plot',
        select: 'plotNo',
        populate: {
          path: 'projectId',
          select: 'projName projCode',
        },
      });

    return updatedFile ? toPlainObject(updatedFile) : null;
  },

  /**
   * Adjust file (refund, credit, transfer)
   */
  async adjustFile(
    id: string,
    data: AdjustFileDto,
    userId: Types.ObjectId
  ): Promise<FileType | null> {
    const file = await File.findById(id);
    if (!file || file.isDeleted) {
      throw new Error('File not found');
    }

    if (file.status === FileStatus.CANCELLED || file.status === FileStatus.CLOSED) {
      throw new Error('Cannot adjust a cancelled or closed file');
    }

    const updateObj: any = {
      isAdjusted: true,
      adjustmentRef: data.referenceFileId || `ADJ-${Date.now()}`,
      modifiedBy: userId,
      fileRemarks: file.fileRemarks
        ? `${file.fileRemarks}\nAdjusted on ${data.adjustmentDate}. Type: ${data.adjustmentType}, Amount: ${data.adjustmentAmount}, Reason: ${data.adjustmentReason}`
        : `Adjusted on ${data.adjustmentDate}. Type: ${data.adjustmentType}, Amount: ${data.adjustmentAmount}, Reason: ${data.adjustmentReason}`,
    };

    // Handle different adjustment types
    switch (data.adjustmentType) {
      case 'REFUND':
        updateObj.totalAmount = Math.max(0, file.totalAmount - data.adjustmentAmount);
        updateObj.downPayment = Math.max(0, file.downPayment - data.adjustmentAmount);
        break;

      case 'CREDIT':
        updateObj.totalAmount = file.totalAmount + data.adjustmentAmount;
        break;

      case 'TRANSFER':
        if (data.referenceFileId) {
          const referenceFile = await File.findById(data.referenceFileId);
          if (referenceFile && !referenceFile.isDeleted) {
            updateObj.adjustmentRef = referenceFile.fileRegNo;
          }
        }
        break;
    }

    const adjustedFile = await File.findByIdAndUpdate(id, { $set: updateObj }, { new: true })
      .populate('member', 'memName memNic')
      .populate({
        path: 'plot',
        select: 'plotNo',
        populate: {
          path: 'projectId',
          select: 'projName',
        },
      });

    return adjustedFile ? toPlainObject(adjustedFile) : null;
  },

  /**
   * Get file statistics
   */
  async getFileStatistics(year?: number): Promise<FileStatistics> {
    const matchStage: any = {
      isDeleted: false,
      isActive: true,
    };

    if (year) {
      matchStage.$expr = {
        $eq: [{ $year: '$bookingDate' }, year],
      };
    }

    const [stats, statusStats, monthlyStats] = await Promise.all([
      File.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: null,
            totalFiles: { $sum: 1 },
            activeFiles: {
              $sum: { $cond: [{ $eq: ['$status', FileStatus.ACTIVE] }, 1, 0] },
            },
            pendingFiles: {
              $sum: { $cond: [{ $eq: ['$status', FileStatus.PENDING] }, 1, 0] },
            },
            cancelledFiles: {
              $sum: { $cond: [{ $eq: ['$status', FileStatus.CANCELLED] }, 1, 0] },
            },
            closedFiles: {
              $sum: { $cond: [{ $eq: ['$status', FileStatus.CLOSED] }, 1, 0] },
            },
            totalAmount: { $sum: '$totalAmount' },
            totalDownPayment: { $sum: '$downPayment' },
            averageAmount: { $avg: '$totalAmount' },
            averageDownPayment: { $avg: '$downPayment' },
          },
        },
      ]),
      File.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]),
      File.aggregate([
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: {
              year: { $year: '$bookingDate' },
              month: { $month: '$bookingDate' },
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
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

    // Get project stats through plots
    const projectStats = await File.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'plots',
          localField: 'plotId',
          foreignField: '_id',
          as: 'plot',
        },
      },
      {
        $unwind: '$plot',
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'plot.projectId',
          foreignField: '_id',
          as: 'project',
        },
      },
      {
        $unwind: '$project',
      },
      {
        $group: {
          _id: '$project.projName',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const baseStats = stats[0] || {
      totalFiles: 0,
      activeFiles: 0,
      pendingFiles: 0,
      cancelledFiles: 0,
      closedFiles: 0,
      totalAmount: 0,
      totalDownPayment: 0,
      averageAmount: 0,
      averageDownPayment: 0,
    };

    const byStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      byStatus[stat._id] = stat.count;
    });

    const byProject: Record<string, number> = {};
    projectStats.forEach(stat => {
      byProject[stat._id] = stat.count;
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
      byStatus,
      byProject,
      byMonth,
    };
  },

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<FileDashboardSummary> {
    const [totalFiles, activeFiles, pendingFiles, totalRevenue, recentFiles] = await Promise.all([
      File.countDocuments({ isDeleted: false, isActive: true }),
      File.countDocuments({
        isDeleted: false,
        isActive: true,
        status: FileStatus.ACTIVE,
      }),
      File.countDocuments({
        isDeleted: false,
        isActive: true,
        status: FileStatus.PENDING,
      }),
      File.aggregate([
        {
          $match: {
            isDeleted: false,
            isActive: true,
            status: { $in: [FileStatus.ACTIVE, FileStatus.PENDING] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
          },
        },
      ]),
      File.find({
        isDeleted: false,
        isActive: true,
      })
        .populate('plan', 'planName totalMonths totalAmount')
        .populate({
          path: 'plot',
          select: 'plotNo',
          populate: {
            path: 'projectId',
            select: 'projName',
          },
        })
        .populate('member', 'memName')
        .sort({ createdAt: -1 })
        .limit(10)
        .then(docs => docs.map(doc => toPlainObject(doc))),
    ]);

    // Get top projects through plots
    const topProjects = await File.aggregate([
      {
        $match: {
          isDeleted: false,
          isActive: true,
        },
      },
      {
        $lookup: {
          from: 'plots',
          localField: 'plotId',
          foreignField: '_id',
          as: 'plot',
        },
      },
      {
        $unwind: '$plot',
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'plot.projectId',
          foreignField: '_id',
          as: 'project',
        },
      },
      {
        $unwind: '$project',
      },
      {
        $group: {
          _id: '$plot.projectId',
          projectName: { $first: '$project.projName' },
          fileCount: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
      {
        $sort: { fileCount: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    return {
      totalFiles,
      activeFiles,
      pendingFiles,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentFiles,
      topProjects: topProjects.map(project => ({
        projectId: project._id,
        projectName: project.projectName,
        fileCount: project.fileCount,
        totalAmount: project.totalAmount,
      })),
    };
  },

  /**
   * Search files
   */
  async searchFiles(searchTerm: string, limit: number = 10): Promise<FileType[]> {
    const files = await File.find({
      $text: { $search: searchTerm },
      isDeleted: false,
      isActive: true,
    })
      .populate('plan', 'planName totalMonths totalAmount')
      .populate({
        path: 'plot',
        select: 'plotNo plotRegistrationNo',
        populate: {
          path: 'projectId',
          select: 'projName',
        },
      })
      .populate('member', 'memName memNic')
      .limit(limit)
      .sort({ score: { $meta: 'textScore' } })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return files;
  },

  /**
   * Get files without plots (unballoted) - This should now return empty as plot is required
   */
  async getUnballotedFiles(
    page: number = 1,
    limit: number = 20
  ): Promise<{ files: FileType[]; total: number; pages: number }> {
    // Since plot is now required, this should return files with invalid plots
    const skip = (page - 1) * limit;

    const query = {
      plotId: { $exists: false }, // Files without plot (shouldn't exist now)
      isDeleted: false,
      isActive: true,
      status: { $in: [FileStatus.ACTIVE, FileStatus.PENDING] },
    };

    const [files, total] = await Promise.all([
      File.find(query)
        .populate('member', 'memName memNic mobileNo')
        .sort({ bookingDate: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      File.countDocuments(query),
    ]);

    return {
      files,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Assign plot to file - Now plot is required on creation, this might be for updating
   */
  async assignPlot(
    fileId: string,
    plotId: string,
    userId: Types.ObjectId
  ): Promise<FileType | null> {
    const file = await File.findById(fileId);
    if (!file || file.isDeleted) {
      throw new Error('File not found');
    }

    if (file.status !== FileStatus.ACTIVE && file.status !== FileStatus.PENDING) {
      throw new Error('Only active or pending files can be assigned plots');
    }

    const plot = await Plot.findById(plotId);
    if (!plot || (plot as any).isDeleted) {
      throw new Error('Plot not found');
    }

    // Check if plot is already allocated
    const existingFileWithPlot = await File.findOne({
      plotId,
      isDeleted: false,
      status: { $in: [FileStatus.ACTIVE, FileStatus.PENDING] },
      _id: { $ne: fileId },
    });

    if (existingFileWithPlot) {
      throw new Error('Plot is already allocated to another file');
    }

    const updateObj: any = {
      plotId,
      modifiedBy: userId,
      fileRemarks: file.fileRemarks
        ? `${file.fileRemarks}\nPlot assigned: ${plot.plotNo} on ${new Date().toLocaleDateString()}`
        : `Plot assigned: ${plot.plotNo} on ${new Date().toLocaleDateString()}`,
    };

    // Update plot status
    await Plot.findByIdAndUpdate(plotId, {
      $set: {
        fileId: fileId,
        updatedBy: userId,
      },
    });

    const updatedFile = await File.findByIdAndUpdate(fileId, { $set: updateObj }, { new: true })
      .populate({
        path: 'plot',
        select: 'plotNo',
        populate: [
          {
            path: 'projectId',
            select: 'projName',
          },
          {
            path: 'plotBlockId',
            select: 'plotBlockName',
          },
        ],
      })
      .populate('member', 'memName memNic');

    return updatedFile ? toPlainObject(updatedFile) : null;
  },

  /**
   * Bulk update file status
   */
  async bulkUpdateStatus(
    fileIds: string[],
    status: FileStatus,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    const objectIds = fileIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid file ID: ${id}`);
      }
    });

    const updateObj: any = {
      status,
      modifiedBy: userId,
    };

    // Set cancellation date if status is CANCELLED
    if (status === FileStatus.CANCELLED) {
      updateObj.cancellationDate = new Date();
    }

    // Set completion date if status is CLOSED
    if (status === FileStatus.CLOSED) {
      updateObj.actualCompletionDate = new Date();
    }

    const result = await File.updateMany(
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
   * Get files summary by status
   */
  async getFilesByStatusSummary(): Promise<
    {
      status: string;
      count: number;
      totalAmount: number;
      averageAmount: number;
    }[]
  > {
    const summary = await File.aggregate([
      {
        $match: {
          isDeleted: false,
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          averageAmount: { $avg: '$totalAmount' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return summary.map(item => ({
      status: item._id,
      count: item.count,
      totalAmount: item.totalAmount,
      averageAmount: item.averageAmount,
    }));
  },
};
