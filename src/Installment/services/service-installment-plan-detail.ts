import { Types } from 'mongoose';
import InstallmentPlanDetail from '../models/models-installment-plan-detail';
import InstallmentPlan from '../models/models-installment-plan';
import InstallmentCategory from '../models/models-installment-category';
import {
  BulkCreateInstallmentPlanDetailDto,
  CreateInstallmentPlanDetailDto,
  InstallmentPlanDetailQueryParams,
  InstallmentPlanDetailSummary,
  InstallmentPlanDetailType,
  UpdateInstallmentPlanDetailDto,
} from '../types/types-installment-plan-detail';

const toPlainObject = (doc: any): InstallmentPlanDetailType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) plainObj.createdAt = doc.createdAt;
  if (!plainObj.updatedAt && doc.updatedAt) plainObj.updatedAt = doc.updatedAt;
  return plainObj as InstallmentPlanDetailType;
};

export const installmentPlanDetailService = {
  async createInstallmentPlanDetail(
    data: CreateInstallmentPlanDetailDto,
    userId: Types.ObjectId
  ): Promise<InstallmentPlanDetailType> {
    const plan = await InstallmentPlan.findOne({ _id: data.planId, isDeleted: false });
    if (!plan) throw new Error('Installment plan not found');

    const category = await InstallmentCategory.findById(data.instCatId);
    if (!category || !category.isActive) throw new Error('Installment category not found');

    const existing = await InstallmentPlanDetail.findOne({
      planId: data.planId,
      occurrence: data.occurrence,
      isDeleted: false,
    });
    if (existing) {
      throw new Error(
        `Occurrence ${data.occurrence} already exists for this plan`
      );
    }

    const percentageAmount = data.percentageAmount ?? 0;
    const fixedAmount = data.fixedAmount ?? 0;
    if (percentageAmount <= 0 && fixedAmount <= 0) {
      throw new Error('At least one of percentage amount or fixed amount must be greater than 0');
    }

    const detailData = {
      ...data,
      planId: new Types.ObjectId(data.planId),
      instCatId: new Types.ObjectId(data.instCatId),
      percentageAmount,
      fixedAmount,
      isDeleted: false,
      createdBy: userId,
    };

    const detail = await InstallmentPlanDetail.create(detailData);
    const created = await InstallmentPlanDetail.findById(detail._id)
      .populate('planId', 'planName projId')
      .populate('instCatId', 'instCatName instCatDescription')
      .populate('createdBy', 'userName fullName designation');

    if (!created) throw new Error('Failed to create plan detail');
    return toPlainObject(created);
  },

  async createBulkInstallmentPlanDetails(
    data: BulkCreateInstallmentPlanDetailDto,
    userId: Types.ObjectId
  ): Promise<InstallmentPlanDetailType[]> {
    const plan = await InstallmentPlan.findOne({
      _id: data.planId,
      isDeleted: false,
    });
    if (!plan) throw new Error('Installment plan not found');

    const created: InstallmentPlanDetailType[] = [];

    for (const item of data.details) {
      const category = await InstallmentCategory.findById(item.instCatId);
      if (!category || !category.isActive) {
        throw new Error(`Installment category ${item.instCatId} not found`);
      }

      const percentageAmount = item.percentageAmount ?? 0;
      const fixedAmount = item.fixedAmount ?? 0;
      if (percentageAmount <= 0 && fixedAmount <= 0) {
        throw new Error(
          `At least one of percentage or fixed amount required for occurrence ${item.occurrence}`
        );
      }

      const existing = await InstallmentPlanDetail.findOne({
        planId: data.planId,
        occurrence: item.occurrence,
        isDeleted: false,
      });
      if (existing) continue;

      const detail = await InstallmentPlanDetail.create({
        planId: new Types.ObjectId(data.planId),
        instCatId: new Types.ObjectId(item.instCatId),
        occurrence: item.occurrence,
        percentageAmount,
        fixedAmount,
        isDeleted: false,
        createdBy: userId,
      });

      const populated = await InstallmentPlanDetail.findById(detail._id)
        .populate('planId', 'planName projId')
        .populate('instCatId', 'instCatName instCatDescription')
        .populate('createdBy', 'userName fullName');

      if (populated) created.push(toPlainObject(populated));
    }

    return created;
  },

  async getInstallmentPlanDetailById(
    id: string
  ): Promise<InstallmentPlanDetailType> {
    const detail = await InstallmentPlanDetail.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate('planId', 'planName projId totalMonths totalAmount')
      .populate('instCatId', 'instCatName instCatDescription')
      .populate('createdBy', 'userName fullName designation')
      .populate('updatedBy', 'userName fullName designation');

    if (!detail) throw new Error('Installment plan detail not found');
    return toPlainObject(detail);
  },

  async getInstallmentPlanDetails(params: InstallmentPlanDetailQueryParams): Promise<{
    details: InstallmentPlanDetailType[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      planId,
      instCatId,
      occurrence,
      search,
      sortBy = 'occurrence',
      sortOrder = 'asc',
    } = params;
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const query: any = { isDeleted: false };
    if (planId) query.planId = new Types.ObjectId(planId);
    if (instCatId) query.instCatId = new Types.ObjectId(instCatId);
    if (occurrence != null) query.occurrence = occurrence;
    if (search) {
      const num = parseInt(search, 10);
      if (!isNaN(num)) {
        query.$or = [
          { occurrence: num },
          { percentageAmount: num },
          { fixedAmount: num },
        ];
      }
    }

    const [details, total] = await Promise.all([
      InstallmentPlanDetail.find(query)
        .populate('planId', 'planName projId')
        .populate('instCatId', 'instCatName instCatDescription')
        .populate('createdBy', 'userName fullName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then((docs) => docs.map((doc) => toPlainObject(doc))),
      InstallmentPlanDetail.countDocuments(query),
    ]);

    return {
      details,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async getInstallmentPlanDetailsByPlan(
    planId: string
  ): Promise<InstallmentPlanDetailType[]> {
    const details = await InstallmentPlanDetail.find({
      planId: new Types.ObjectId(planId),
      isDeleted: false,
    })
      .populate('planId', 'planName projId totalMonths totalAmount')
      .populate('instCatId', 'instCatName instCatDescription')
      .populate('createdBy', 'userName fullName')
      .sort({ occurrence: 1 })
      .then((docs) => docs.map((doc) => toPlainObject(doc)));

    return details;
  },

  async getInstallmentPlanDetailsByCategory(
    instCatId: string
  ): Promise<InstallmentPlanDetailType[]> {
    const details = await InstallmentPlanDetail.find({
      instCatId: new Types.ObjectId(instCatId),
      isDeleted: false,
    })
      .populate('planId', 'planName projId')
      .populate('instCatId', 'instCatName instCatDescription')
      .populate('createdBy', 'userName fullName')
      .sort({ occurrence: 1 })
      .then((docs) => docs.map((doc) => toPlainObject(doc)));

    return details;
  },

  async searchInstallmentPlanDetails(
    searchTerm: string,
    limit: number = 10
  ): Promise<InstallmentPlanDetailType[]> {
    if (!searchTerm || searchTerm.trim().length < 1) return [];

    const num = parseInt(searchTerm.trim(), 10);
    let query: any = { isDeleted: false };

    if (!isNaN(num)) {
      query.$or = [
        { occurrence: num },
        { percentageAmount: num },
        { fixedAmount: num },
      ];
    } else {
      return [];
    }

    const details = await InstallmentPlanDetail.find(query)
      .populate('planId', 'planName projId')
      .populate('instCatId', 'instCatName instCatDescription')
      .limit(limit)
      .sort({ occurrence: 1 })
      .then((docs) => docs.map((doc) => toPlainObject(doc)));

    return details;
  },

  async getInstallmentPlanDetailSummary(): Promise<InstallmentPlanDetailSummary> {
    const [totalStats, byPlan] = await Promise.all([
      InstallmentPlanDetail.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalDetails: { $sum: 1 },
            totalPercentageSum: { $sum: '$percentageAmount' },
            totalFixedSum: { $sum: '$fixedAmount' },
          },
        },
      ]),
      InstallmentPlanDetail.aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: 'installmentplans',
            localField: 'planId',
            foreignField: '_id',
            as: 'plan',
          },
        },
        { $unwind: '$plan' },
        {
          $group: {
            _id: '$planId',
            planName: { $first: '$plan.planName' },
            count: { $sum: 1 },
            totalPercentage: { $sum: '$percentageAmount' },
            totalFixed: { $sum: '$fixedAmount' },
          },
        },
      ]),
    ]);

    const total = totalStats[0] || {
      totalDetails: 0,
      totalPercentageSum: 0,
      totalFixedSum: 0,
    };

    return {
      totalDetails: total.totalDetails,
      totalPercentageSum: total.totalPercentageSum,
      totalFixedSum: total.totalFixedSum,
      byPlan: byPlan.map((p) => ({
        planId: p._id.toString(),
        planName: p.planName || '',
        count: p.count,
        totalPercentage: p.totalPercentage,
        totalFixed: p.totalFixed,
      })),
    };
  },

  async updateInstallmentPlanDetail(
    id: string,
    data: UpdateInstallmentPlanDetailDto,
    userId: Types.ObjectId
  ): Promise<InstallmentPlanDetailType | null> {
    const existing = await InstallmentPlanDetail.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!existing) throw new Error('Installment plan detail not found');

    if (data.occurrence != null && data.occurrence !== existing.occurrence) {
      const duplicate = await InstallmentPlanDetail.findOne({
        _id: { $ne: id },
        planId: existing.planId,
        occurrence: data.occurrence,
        isDeleted: false,
      });
      if (duplicate) {
        throw new Error(`Occurrence ${data.occurrence} already exists for this plan`);
      }
    }

    const percentageAmount =
      data.percentageAmount !== undefined ? data.percentageAmount : existing.percentageAmount;
    const fixedAmount =
      data.fixedAmount !== undefined ? data.fixedAmount : existing.fixedAmount;
    if (percentageAmount <= 0 && fixedAmount <= 0) {
      throw new Error('At least one of percentage or fixed amount must be greater than 0');
    }

    const updateObj = {
      ...data,
      percentageAmount,
      fixedAmount,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    const updated = await InstallmentPlanDetail.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('planId', 'planName projId')
      .populate('instCatId', 'instCatName instCatDescription')
      .populate('updatedBy', 'userName fullName')
      .populate('createdBy', 'userName fullName');

    return updated ? toPlainObject(updated) : null;
  },

  async deleteInstallmentPlanDetail(
    id: string,
    userId: Types.ObjectId
  ): Promise<boolean> {
    const existing = await InstallmentPlanDetail.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!existing) throw new Error('Installment plan detail not found');

    const result = await InstallmentPlanDetail.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedBy: userId,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );
    return !!result;
  },
};
