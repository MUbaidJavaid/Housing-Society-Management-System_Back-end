import { Types } from 'mongoose';
import Project from '../../Project/models/models-project';
import InstallmentPlan from '../models/models-installment-plan';
import {
  CreateInstallmentPlanDto,
  InstallmentPlanDashboardSummary,
  InstallmentPlanQueryParams,
  InstallmentPlanType,
  UpdateInstallmentPlanDto,
} from '../types/types-installment-plan';

const toPlainObject = (doc: any): InstallmentPlanType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) plainObj.createdAt = doc.createdAt;
  if (!plainObj.updatedAt && doc.updatedAt) plainObj.updatedAt = doc.updatedAt;
  return plainObj as InstallmentPlanType;
};

export const installmentPlanService = {
  async createInstallmentPlan(
    data: CreateInstallmentPlanDto,
    userId: Types.ObjectId
  ): Promise<InstallmentPlanType> {
    // Check project exists
    const project = await Project.findById(data.projId);
    if (!project || (project as any).isDeleted) {
      throw new Error('Project not found');
    }

    // Unique planName per project
    const existing = await InstallmentPlan.findOne({
      projId: data.projId,
      planName: { $regex: new RegExp(`^${data.planName.trim()}$`, 'i') },
      isDeleted: false,
    });
    if (existing) {
      throw new Error(`Plan name "${data.planName}" already exists for this project`);
    }

    const planData = {
      ...data,
      projId: new Types.ObjectId(data.projId),
      isActive: data.isActive !== undefined ? data.isActive : true,
      isDeleted: false,
      createdBy: userId,
    };

    const plan = await InstallmentPlan.create(planData);
    const created = await InstallmentPlan.findById(plan._id)
      .populate('projId', 'projName projCode')
      .populate('createdBy', 'userName fullName designation');

    if (!created) throw new Error('Failed to create installment plan');
    return toPlainObject(created);
  },

  async getInstallmentPlanById(id: string): Promise<InstallmentPlanType> {
    const plan = await InstallmentPlan.findOne({ _id: id, isDeleted: false })
      .populate('projId', 'projName projCode')
      .populate('createdBy', 'userName fullName designation')
      .populate('updatedBy', 'userName fullName designation');

    if (!plan) throw new Error('Installment plan not found');
    return toPlainObject(plan);
  },

  async getInstallmentPlans(params: InstallmentPlanQueryParams): Promise<{
    plans: InstallmentPlanType[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const { page = 1, limit = 20, projectId, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const query: any = { isDeleted: false };
    if (projectId) query.projId = new Types.ObjectId(projectId);
    if (isActive !== undefined) query.isActive = isActive;
    if (search) {
      query.$or = [
        { planName: { $regex: search, $options: 'i' } },
      ];
    }

    const [plans, total] = await Promise.all([
      InstallmentPlan.find(query)
        .populate('projId', 'projName projCode')
        .populate('createdBy', 'userName fullName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      InstallmentPlan.countDocuments(query),
    ]);

    return {
      plans,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async updateInstallmentPlan(
    id: string,
    data: UpdateInstallmentPlanDto,
    userId: Types.ObjectId
  ): Promise<InstallmentPlanType | null> {
    const existing = await InstallmentPlan.findOne({ _id: id, isDeleted: false });
    if (!existing) throw new Error('Installment plan not found');

    if (data.planName && data.planName.trim() !== existing.planName) {
      const duplicate = await InstallmentPlan.findOne({
        _id: { $ne: id },
        projId: existing.projId,
        planName: { $regex: new RegExp(`^${data.planName.trim()}$`, 'i') },
        isDeleted: false,
      });
      if (duplicate) throw new Error(`Plan name "${data.planName}" already exists for this project`);
    }

    const updateObj = { ...data, updatedBy: userId, updatedAt: new Date() };
    const updated = await InstallmentPlan.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('projId', 'projName projCode')
      .populate('updatedBy', 'userName fullName')
      .populate('createdBy', 'userName fullName');

    return updated ? toPlainObject(updated) : null;
  },

  async deleteInstallmentPlan(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existing = await InstallmentPlan.findOne({ _id: id, isDeleted: false });
    if (!existing) throw new Error('Installment plan not found');

    const result = await InstallmentPlan.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId, updatedAt: new Date() } },
      { new: true }
    );
    return !!result;
  },

  async getDashboardSummary(): Promise<InstallmentPlanDashboardSummary> {
    const [totalStats, activeStats] = await Promise.all([
      InstallmentPlan.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalPlans: { $sum: 1 },
            avgTotalMonths: { $avg: '$totalMonths' },
            totalAmountAllPlans: { $sum: '$totalAmount' },
          },
        },
      ]),
      InstallmentPlan.aggregate([
        { $match: { isDeleted: false, isActive: true } },
        { $group: { _id: null, activePlans: { $sum: 1 } } },
      ]),
    ]);

    const total = totalStats[0] || {
      totalPlans: 0,
      avgTotalMonths: 0,
      totalAmountAllPlans: 0,
    };
    const active = activeStats[0]?.activePlans ?? 0;

    return {
      totalPlans: total.totalPlans,
      activePlans: active,
      inactivePlans: total.totalPlans - active,
      avgTotalMonths: Math.round(total.avgTotalMonths * 10) / 10,
      totalAmountAllPlans: total.totalAmountAllPlans,
    };
  },

  async searchInstallmentPlans(
    searchTerm: string,
    limit: number = 10
  ): Promise<InstallmentPlanType[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    const plans = await InstallmentPlan.find({
      isDeleted: false,
      planName: { $regex: searchTerm.trim(), $options: 'i' },
    })
      .populate('projId', 'projName projCode')
      .limit(limit)
      .sort({ planName: 1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return plans;
  },

  async getInstallmentPlansByProject(projId: string): Promise<InstallmentPlanType[]> {
    const plans = await InstallmentPlan.find({
      projId: new Types.ObjectId(projId),
      isDeleted: false,
    })
      .populate('projId', 'projName projCode')
      .populate('createdBy', 'userName fullName')
      .sort({ planName: 1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return plans;
  },
};
