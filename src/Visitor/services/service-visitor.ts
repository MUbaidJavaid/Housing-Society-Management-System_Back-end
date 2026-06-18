import { Types } from 'mongoose';
import { logger } from '../../logger';
import Visitor, { VisitorStatus } from '../models/models-visitor';
import {
  CreateVisitorDto,
  GetVisitorsResult,
  PreApproveDto,
  UpdateVisitorDto,
  VisitorQueryParams,
  VisitorStats,
  VisitorType,
} from '../types/types-visitor';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): VisitorType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as VisitorType;
};

const populateFields = [
  { path: 'hostMemberId', select: 'memName memContEmail memContMob memAddr1' },
  { path: 'hostPlotId', select: 'plotNo sectorNo blockNo size' },
  { path: 'preApprovedBy', select: 'memName memContEmail memContMob' },
  { path: 'checkedInBy', select: 'firstName lastName' },
  { path: 'checkedOutBy', select: 'firstName lastName' },
  { path: 'createdBy', select: 'firstName lastName email' },
  { path: 'modifiedBy', select: 'firstName lastName email' },
];

export const visitorService = {
  /**
   * Create a new visitor entry
   */
  async create(data: CreateVisitorDto, userId: Types.ObjectId): Promise<VisitorType> {
    const visitorData: any = {
      ...data,
      hostMemberId: new Types.ObjectId(data.hostMemberId),
      hostPlotId: data.hostPlotId ? new Types.ObjectId(data.hostPlotId) : undefined,
      expectedDate: new Date(data.expectedDate),
      societyId: data.societyId ? new Types.ObjectId(data.societyId) : undefined,
      createdBy: userId,
      modifiedBy: userId,
    };

    const visitor = await Visitor.create(visitorData);

    const populated = await Visitor.findById(visitor._id).populate(populateFields);

    if (!populated) {
      throw new Error('Failed to create visitor');
    }

    return toPlainObject(populated);
  },

  /**
   * Get paginated list of visitors with filters
   */
  async getVisitors(params: VisitorQueryParams): Promise<GetVisitorsResult> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      purpose,
      hostMemberId,
      hostPlotId,
      fromDate,
      toDate,
      preApproved,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { visitorName: { $regex: search, $options: 'i' } },
        { visitorPhone: { $regex: search, $options: 'i' } },
        { visitorCompany: { $regex: search, $options: 'i' } },
        { passCode: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;
    if (purpose) query.purpose = purpose;
    if (hostMemberId) query.hostMemberId = new Types.ObjectId(hostMemberId);
    if (hostPlotId) query.hostPlotId = new Types.ObjectId(hostPlotId);
    if (preApproved !== undefined) query.preApproved = preApproved;

    if (fromDate || toDate) {
      query.expectedDate = {};
      if (fromDate) query.expectedDate.$gte = new Date(fromDate);
      if (toDate) query.expectedDate.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;
    const sortObj: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [visitors, total] = await Promise.all([
      Visitor.find(query)
        .populate(populateFields)
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Visitor.countDocuments(query),
    ]);

    return {
      items: visitors.map(toPlainObject),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a single visitor by ID
   */
  async getVisitorById(id: string): Promise<VisitorType | null> {
    const visitor = await Visitor.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    }).populate(populateFields);

    if (!visitor) return null;

    return toPlainObject(visitor);
  },

  /**
   * Update a visitor
   */
  async updateVisitor(
    id: string,
    data: UpdateVisitorDto,
    userId: Types.ObjectId
  ): Promise<VisitorType | null> {
    const updateData: any = { ...data, modifiedBy: userId };

    if (data.hostMemberId) {
      updateData.hostMemberId = new Types.ObjectId(data.hostMemberId);
    }
    if (data.hostPlotId) {
      updateData.hostPlotId = new Types.ObjectId(data.hostPlotId);
    }
    if (data.expectedDate) {
      updateData.expectedDate = new Date(data.expectedDate);
    }

    const visitor = await Visitor.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(populateFields);

    if (!visitor) return null;

    return toPlainObject(visitor);
  },

  /**
   * Soft delete a visitor
   */
  async deleteVisitor(id: string, userId: Types.ObjectId): Promise<VisitorType | null> {
    const visitor = await Visitor.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    if (!visitor) return null;

    return toPlainObject(visitor);
  },

  /**
   * Check in a visitor
   */
  async checkIn(
    id: string,
    staffUserId: Types.ObjectId,
    gateNumber?: string
  ): Promise<VisitorType | null> {
    const visitor = await Visitor.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!visitor) return null;

    if (visitor.status !== VisitorStatus.PENDING && visitor.status !== VisitorStatus.APPROVED) {
      throw new Error(
        `Cannot check in visitor with status "${visitor.status}". Visitor must be in Pending or Approved status.`
      );
    }

    visitor.actualTimeIn = new Date();
    visitor.status = VisitorStatus.CHECKED_IN;
    visitor.checkedInBy = staffUserId;
    visitor.modifiedBy = staffUserId;
    if (gateNumber) visitor.gateNumber = gateNumber;

    await visitor.save();

    const populated = await Visitor.findById(visitor._id).populate(populateFields);

    return populated ? toPlainObject(populated) : null;
  },

  /**
   * Check out a visitor
   */
  async checkOut(id: string, staffUserId: Types.ObjectId): Promise<VisitorType | null> {
    const visitor = await Visitor.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!visitor) return null;

    if (visitor.status !== VisitorStatus.CHECKED_IN) {
      throw new Error(
        `Cannot check out visitor with status "${visitor.status}". Visitor must be in CheckedIn status.`
      );
    }

    visitor.actualTimeOut = new Date();
    visitor.status = VisitorStatus.CHECKED_OUT;
    visitor.checkedOutBy = staffUserId;
    visitor.modifiedBy = staffUserId;

    await visitor.save();

    const populated = await Visitor.findById(visitor._id).populate(populateFields);

    return populated ? toPlainObject(populated) : null;
  },

  /**
   * Pre-approve a visitor pass (by a member)
   */
  async preApprove(data: PreApproveDto, memberId: Types.ObjectId): Promise<VisitorType> {
    const visitorData: any = {
      ...data,
      hostMemberId: memberId,
      hostPlotId: data.hostPlotId ? new Types.ObjectId(data.hostPlotId) : undefined,
      expectedDate: new Date(data.expectedDate),
      preApproved: true,
      preApprovedBy: memberId,
      preApprovedAt: new Date(),
      status: VisitorStatus.APPROVED,
      createdBy: memberId,
      modifiedBy: memberId,
    };

    const visitor = await Visitor.create(visitorData);

    const populated = await Visitor.findById(visitor._id).populate(populateFields);

    if (!populated) {
      throw new Error('Failed to create pre-approved visitor');
    }

    return toPlainObject(populated);
  },

  /**
   * Verify a pass code and return visitor info
   */
  async verifyPassCode(code: string): Promise<VisitorType | null> {
    const visitor = await (Visitor as any).findByPassCode(code);

    if (!visitor) return null;

    // Only return active/valid passes
    const validStatuses = [
      VisitorStatus.PENDING,
      VisitorStatus.APPROVED,
      VisitorStatus.CHECKED_IN,
    ];

    if (!validStatuses.includes(visitor.status)) {
      return null;
    }

    return toPlainObject(visitor);
  },

  /**
   * Get currently checked-in (active) visitors
   */
  async getActiveVisitors(filters?: {
    societyId?: string;
    gateNumber?: string;
    hostMemberId?: string;
  }): Promise<VisitorType[]> {
    const query: any = {
      isDeleted: false,
      status: VisitorStatus.CHECKED_IN,
    };

    if (filters?.societyId) query.societyId = new Types.ObjectId(filters.societyId);
    if (filters?.gateNumber) query.gateNumber = filters.gateNumber;
    if (filters?.hostMemberId) query.hostMemberId = new Types.ObjectId(filters.hostMemberId);

    const visitors = await Visitor.find(query)
      .populate(populateFields)
      .sort({ actualTimeIn: -1 });

    return visitors.map(toPlainObject);
  },

  /**
   * Get visitor statistics
   */
  async getVisitorStats(filters?: {
    societyId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<VisitorStats> {
    const statsFilters: any = {};
    if (filters?.societyId) statsFilters.societyId = new Types.ObjectId(filters.societyId);
    if (filters?.fromDate) statsFilters.fromDate = filters.fromDate;
    if (filters?.toDate) statsFilters.toDate = filters.toDate;

    return (Visitor as any).getVisitorStats(statsFilters);
  },

  /**
   * Cancel a visit
   */
  async cancelVisit(id: string, userId: Types.ObjectId): Promise<VisitorType | null> {
    const visitor = await Visitor.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!visitor) return null;

    const cancellableStatuses = [VisitorStatus.PENDING, VisitorStatus.APPROVED];
    if (!cancellableStatuses.includes(visitor.status as VisitorStatus)) {
      throw new Error(
        `Cannot cancel visitor with status "${visitor.status}". Only Pending or Approved visits can be cancelled.`
      );
    }

    visitor.status = VisitorStatus.CANCELLED;
    visitor.modifiedBy = userId;

    await visitor.save();

    const populated = await Visitor.findById(visitor._id).populate(populateFields);

    return populated ? toPlainObject(populated) : null;
  },

  /**
   * Expire stale visitors (past-date pending/approved visitors)
   */
  async expireStaleVisitors(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Visitor.updateMany(
      {
        isDeleted: false,
        status: { $in: [VisitorStatus.PENDING, VisitorStatus.APPROVED] },
        expectedDate: { $lt: today },
      },
      {
        $set: {
          status: VisitorStatus.EXPIRED,
        },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Expired ${result.modifiedCount} stale visitor passes`);
    }

    return result.modifiedCount;
  },
};
