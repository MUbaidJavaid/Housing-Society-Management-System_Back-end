import { Types } from 'mongoose';
import GatePass from '../models/models-gate-pass';
import {
  CreateGatePassDto,
  UpdateGatePassDto,
  GatePassQueryParams,
} from '../types/types-gate-pass';

export const gatePassService = {
  async create(data: CreateGatePassDto, userId: Types.ObjectId) {
    const passData = {
      ...data,
      createdBy: userId,
    };

    const pass = await GatePass.create(passData);

    const created = await GatePass.findById(pass._id)
      .populate('societyId', 'name')
      .populate('requestedBy', 'firstName lastName')
      .populate('plotId', 'plotNumber')
      .populate('createdBy', 'firstName lastName email');

    if (!created) {
      throw new Error('Failed to create gate pass');
    }

    return created.toObject();
  },

  async getAll(params: GatePassQueryParams) {
    const {
      page = 1,
      limit = 20,
      search = '',
      societyId,
      status,
      passType,
      requestedBy,
      expectedDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { passNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (status) query.status = status;
    if (passType) query.passType = passType;
    if (requestedBy) query.requestedBy = new Types.ObjectId(requestedBy);
    if (expectedDate) {
      const date = new Date(expectedDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.expectedDate = { $gte: date, $lt: nextDay };
    }

    const [passes, total] = await Promise.all([
      GatePass.find(query)
        .populate('societyId', 'name')
        .populate('requestedBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('checkedInBy', 'firstName lastName')
        .populate('checkedOutBy', 'firstName lastName')
        .populate('createdBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      GatePass.countDocuments(query),
    ]);

    return {
      passes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    const pass = await GatePass.findOne({ _id: id, isDeleted: false })
      .populate('societyId', 'name')
      .populate('requestedBy', 'firstName lastName')
      .populate('plotId', 'plotNumber')
      .populate('approvedBy', 'firstName lastName')
      .populate('checkedInBy', 'firstName lastName')
      .populate('checkedOutBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName email');

    if (!pass) {
      throw new Error('Gate pass not found');
    }

    return pass.toObject();
  },

  async update(id: string, data: UpdateGatePassDto, _userId: Types.ObjectId) {
    const pass = await GatePass.findOneAndUpdate(
      { _id: id, isDeleted: false, status: 'requested' },
      { ...data },
      { new: true, runValidators: true }
    )
      .populate('societyId', 'name')
      .populate('requestedBy', 'firstName lastName');

    if (!pass) {
      throw new Error('Gate pass not found or cannot be updated in current status');
    }

    return pass.toObject();
  },

  async delete(id: string, _userId: Types.ObjectId) {
    const pass = await GatePass.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!pass) {
      throw new Error('Gate pass not found');
    }

    return pass.toObject();
  },

  async approvePass(id: string, userId: Types.ObjectId) {
    const pass = await GatePass.findOneAndUpdate(
      { _id: id, isDeleted: false, status: 'requested' },
      {
        status: 'approved',
        approvedBy: userId,
        approvalDate: new Date(),
      },
      { new: true }
    )
      .populate('approvedBy', 'firstName lastName')
      .populate('requestedBy', 'firstName lastName');

    if (!pass) {
      throw new Error('Gate pass not found or not in requested status');
    }

    return pass.toObject();
  },

  async rejectPass(id: string, reason: string, userId: Types.ObjectId) {
    const pass = await GatePass.findOneAndUpdate(
      { _id: id, isDeleted: false, status: 'requested' },
      {
        status: 'rejected',
        rejectionReason: reason,
        approvedBy: userId,
      },
      { new: true }
    );

    if (!pass) {
      throw new Error('Gate pass not found or not in requested status');
    }

    return pass.toObject();
  },

  async checkIn(id: string, userId: Types.ObjectId, notes?: string) {
    const pass = await GatePass.findOneAndUpdate(
      { _id: id, isDeleted: false, status: 'approved' },
      {
        status: 'checked_in',
        checkedInBy: userId,
        actualEntryTime: new Date(),
        ...(notes && { securityNotes: notes }),
      },
      { new: true }
    )
      .populate('checkedInBy', 'firstName lastName');

    if (!pass) {
      throw new Error('Gate pass not found or not in approved status');
    }

    return pass.toObject();
  },

  async checkOut(id: string, userId: Types.ObjectId, notes?: string, photos?: Array<{ url: string; description?: string }>) {
    const updateData: any = {
      status: 'checked_out',
      checkedOutBy: userId,
      actualExitTime: new Date(),
    };

    if (notes) {
      updateData.securityNotes = updateData.securityNotes
        ? `${updateData.securityNotes}\nCheckout: ${notes}`
        : `Checkout: ${notes}`;
    }

    const pass = await GatePass.findOne({ _id: id, isDeleted: false, status: 'checked_in' });

    if (!pass) {
      throw new Error('Gate pass not found or not in checked-in status');
    }

    pass.status = 'checked_out';
    pass.checkedOutBy = userId;
    pass.actualExitTime = new Date();

    if (notes) {
      pass.securityNotes = pass.securityNotes
        ? `${pass.securityNotes}\nCheckout: ${notes}`
        : `Checkout: ${notes}`;
    }

    if (photos && photos.length > 0) {
      for (const photo of photos) {
        pass.photos.push({
          url: photo.url,
          description: photo.description,
          capturedAt: new Date(),
        });
      }
    }

    await pass.save();

    const updated = await GatePass.findById(id)
      .populate('checkedOutBy', 'firstName lastName');

    return updated!.toObject();
  },

  async verifyPassCode(code: string) {
    const pass = await GatePass.findOne({
      passCode: code,
      isDeleted: false,
      status: { $in: ['approved', 'checked_in'] },
    })
      .populate('societyId', 'name')
      .populate('requestedBy', 'firstName lastName')
      .populate('plotId', 'plotNumber');

    if (!pass) {
      return null;
    }

    return pass.toObject();
  },

  async cancelPass(id: string, _userId: Types.ObjectId) {
    const pass = await GatePass.findOneAndUpdate(
      { _id: id, isDeleted: false, status: { $in: ['requested', 'approved'] } },
      {
        status: 'cancelled',
      },
      { new: true }
    );

    if (!pass) {
      throw new Error('Gate pass not found or cannot be cancelled in current status');
    }

    return pass.toObject();
  },

  async getMyPasses(memberId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query: any = {
      requestedBy: new Types.ObjectId(memberId),
      isDeleted: false,
    };

    const [passes, total] = await Promise.all([
      GatePass.find(query)
        .populate('societyId', 'name')
        .populate('approvedBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      GatePass.countDocuments(query),
    ]);

    return {
      passes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getTodaysPasses(societyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const passes = await GatePass.find({
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
      expectedDate: { $gte: today, $lt: tomorrow },
    })
      .populate('requestedBy', 'firstName lastName')
      .populate('plotId', 'plotNumber')
      .populate('approvedBy', 'firstName lastName')
      .populate('checkedInBy', 'firstName lastName')
      .populate('checkedOutBy', 'firstName lastName')
      .sort({ expectedDate: 1 })
      .lean();

    return passes;
  },

  async getPassStats(societyId: string) {
    const matchStage: any = {
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [statusCounts, typeCounts, todayCount, totalPasses] = await Promise.all([
      GatePass.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      GatePass.aggregate([
        { $match: matchStage },
        { $group: { _id: '$passType', count: { $sum: 1 } } },
      ]),
      GatePass.countDocuments({
        ...matchStage,
        expectedDate: { $gte: today, $lt: tomorrow },
      }),
      GatePass.countDocuments(matchStage),
    ]);

    return {
      totalPasses,
      todaysPasses: todayCount,
      byStatus: statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byType: typeCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  },
};
