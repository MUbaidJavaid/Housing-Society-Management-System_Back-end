import { Types } from 'mongoose';

import {
  CreatePaymentModeDto,
  PaymentModeQueryParams,
  UpdatePaymentModeDto,
} from '../index-paymentmodule';
import PaymentMode from '../models/models-paymentmodule';

export const paymentModeService = {
  async createPaymentMode(data: CreatePaymentModeDto, userId: Types.ObjectId): Promise<any> {
    const paymentMode = await PaymentMode.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    return paymentMode;
  },

  async getPaymentModeById(id: string): Promise<any | null> {
    const paymentMode = await PaymentMode.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return paymentMode?.toObject() || null;
  },

  async getPaymentModes(params: PaymentModeQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive,
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
        { paymentModeName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const [paymentModes, total] = await Promise.all([
      PaymentMode.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      PaymentMode.countDocuments(query),
    ]);

    return {
      paymentModes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updatePaymentMode(
    id: string,
    data: UpdatePaymentModeDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const updateData: any = { ...data };
    updateData.updatedBy = userId;

    const paymentMode = await PaymentMode.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return paymentMode?.toObject() || null;
  },

  async deletePaymentMode(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await PaymentMode.findByIdAndUpdate(
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

  async checkPaymentModeNameExists(
    paymentModeName: string,
    excludeId?: string
  ): Promise<boolean> {
    const escaped = paymentModeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query: any = {
      paymentModeName: { $regex: new RegExp(`^${escaped}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await PaymentMode.countDocuments(query);
    return count > 0;
  },

  async getPaymentModeSummary(): Promise<any> {
    const [totalPaymentModes, activePaymentModes, inactivePaymentModes] = await Promise.all([
      PaymentMode.countDocuments({ isDeleted: false }),
      PaymentMode.countDocuments({ isDeleted: false, isActive: true }),
      PaymentMode.countDocuments({ isDeleted: false, isActive: false }),
    ]);

    return {
      totalPaymentModes,
      activePaymentModes,
      inactivePaymentModes,
    };
  },

  async getPaymentModesForDropdown(): Promise<any[]> {
    const paymentModes = await PaymentMode.find({
      isDeleted: false,
      isActive: true,
    })
      .select('paymentModeName description')
      .sort('paymentModeName')
      .then(docs =>
        docs.map(doc => {
          const mode = doc.toObject();
          return {
            id: mode._id,
            name: mode.paymentModeName,
            description: mode.description,
          };
        })
      );

    return paymentModes;
  },

  async togglePaymentModeStatus(id: string, userId: Types.ObjectId): Promise<any | null> {
    const paymentMode = await PaymentMode.findById(id);

    if (!paymentMode || paymentMode.isDeleted) {
      return null;
    }

    paymentMode.isActive = !paymentMode.isActive;
    paymentMode.updatedBy = userId;
    paymentMode.modifiedOn = new Date();

    await paymentMode.save();

    const updated = await PaymentMode.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return updated?.toObject() || null;
  },

  async getDefaultPaymentModes(): Promise<any[]> {
    // Return existing payment modes (users add their own custom names)
    const existingModes = await PaymentMode.find({ isDeleted: false });
    return existingModes.map(mode => mode.toObject());
  },
};
