import { Types } from 'mongoose';
import SubscriptionPackage from '../models/models-subscription-package';
import SubscriptionHistory from '../models/models-subscription-history';
import Society from '../../Society/models/models-society';
import {
  CreateSubscriptionPackageDto,
  GetSubscriptionHistoryResult,
  GetSubscriptionPackagesResult,
  SubscribeDto,
  SubscriptionHistoryType,
  SubscriptionPackageQueryParams,
  SubscriptionPackageType,
  UpdateSubscriptionPackageDto,
} from '../types/types-subscription';

// Helper function to convert Mongoose document to plain object
const toPlainPackage = (doc: any): SubscriptionPackageType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  return plainObj as SubscriptionPackageType;
};

const toPlainHistory = (doc: any): SubscriptionHistoryType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  return plainObj as SubscriptionHistoryType;
};

export const subscriptionService = {
  // ========================
  // PACKAGE CRUD
  // ========================

  /**
   * Create a new subscription package
   */
  async createPackage(
    data: CreateSubscriptionPackageDto,
    userId: Types.ObjectId
  ): Promise<SubscriptionPackageType> {
    // Check for duplicate package code
    const existing = await SubscriptionPackage.findOne({
      packageCode: data.packageCode,
      isDeleted: false,
    });
    if (existing) {
      throw new Error('Package code already exists');
    }

    // Check for duplicate package name
    const existingName = await SubscriptionPackage.findOne({
      packageName: data.packageName,
      isDeleted: false,
    });
    if (existingName) {
      throw new Error('Package name already exists');
    }

    const packageData = {
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    };

    const pkg = await SubscriptionPackage.create(packageData);

    const createdPackage = await SubscriptionPackage.findById(pkg._id)
      .populate('createdBy', 'firstName lastName email');

    if (!createdPackage) {
      throw new Error('Failed to create subscription package');
    }

    return toPlainPackage(createdPackage);
  },

  /**
   * Get package by ID
   */
  async getPackageById(id: string): Promise<SubscriptionPackageType> {
    try {
      const pkg = await SubscriptionPackage.findById(id)
        .populate('createdBy', 'firstName lastName email')
        .populate('modifiedBy', 'firstName lastName email');

      if (!pkg || pkg.isDeleted) {
        throw new Error('Subscription package not found');
      }

      return toPlainPackage(pkg);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid package ID');
    }
  },

  /**
   * Get all packages with pagination
   */
  async getPackages(params: SubscriptionPackageQueryParams): Promise<GetSubscriptionPackagesResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      isActive,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { packageName: { $regex: search, $options: 'i' } },
        { packageCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const [packages, total] = await Promise.all([
      SubscriptionPackage.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainPackage(doc))),
      SubscriptionPackage.countDocuments(query),
    ]);

    return {
      packages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get active packages for public display
   */
  async getActivePackages(): Promise<SubscriptionPackageType[]> {
    const packages = await SubscriptionPackage.find({
      isActive: true,
      isDeleted: false,
    })
      .sort({ sortOrder: 1 })
      .then(docs => docs.map(doc => toPlainPackage(doc)));

    return packages;
  },

  /**
   * Update package
   */
  async updatePackage(
    id: string,
    data: UpdateSubscriptionPackageDto,
    userId: Types.ObjectId
  ): Promise<SubscriptionPackageType | null> {
    const existing = await SubscriptionPackage.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Subscription package not found');
    }

    // Check for duplicate name if being updated
    if (data.packageName && data.packageName !== existing.packageName) {
      const dupName = await SubscriptionPackage.findOne({
        packageName: data.packageName,
        _id: { $ne: id },
        isDeleted: false,
      });
      if (dupName) {
        throw new Error('Package name already exists');
      }
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    // Merge features if provided
    if (data.features) {
      updateObj.features = {
        ...existing.features,
        ...data.features,
      };
    }

    const pkg = await SubscriptionPackage.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    return pkg ? toPlainPackage(pkg) : null;
  },

  /**
   * Soft delete package
   */
  async deletePackage(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existing = await SubscriptionPackage.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Subscription package not found');
    }

    const result = await SubscriptionPackage.findByIdAndUpdate(
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

  // ========================
  // SUBSCRIPTION MANAGEMENT
  // ========================

  /**
   * Subscribe a society to a package
   */
  async subscribeSociety(
    data: SubscribeDto,
    userId: Types.ObjectId
  ): Promise<SubscriptionHistoryType> {
    // Validate society
    const society = await Society.findById(data.societyId);
    if (!society || society.isDeleted) {
      throw new Error('Society not found');
    }

    // Validate package
    const pkg = await SubscriptionPackage.findById(data.packageId);
    if (!pkg || pkg.isDeleted || !pkg.isActive) {
      throw new Error('Subscription package not found or inactive');
    }

    // Determine action
    let action: 'subscribe' | 'upgrade' | 'downgrade' | 'renew' = 'subscribe';
    let previousPackageId: Types.ObjectId | undefined;

    if (society.subscriptionPlanId) {
      previousPackageId = society.subscriptionPlanId;
      const previousPkg = await SubscriptionPackage.findById(society.subscriptionPlanId);
      if (previousPkg) {
        if (pkg.monthlyPrice > previousPkg.monthlyPrice) {
          action = 'upgrade';
        } else if (pkg.monthlyPrice < previousPkg.monthlyPrice) {
          action = 'downgrade';
        } else {
          action = 'renew';
        }
      }
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (data.billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Calculate amount
    const amount = data.billingCycle === 'monthly' ? pkg.monthlyPrice : pkg.yearlyPrice;

    // Create history record
    const historyData: any = {
      societyId: data.societyId,
      packageId: data.packageId,
      action,
      previousPackageId,
      startDate,
      endDate,
      amount,
      billingCycle: data.billingCycle,
      paymentStatus: 'pending',
      paymentReference: data.paymentReference,
      remarks: data.remarks,
      createdBy: userId,
    };

    const history = await SubscriptionHistory.create(historyData);

    // Update society subscription details
    await Society.findByIdAndUpdate(data.societyId, {
      $set: {
        subscriptionPlanId: data.packageId,
        subscriptionStatus: 'active',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        maxMembers: pkg.features.maxMembers,
        maxProjects: pkg.features.maxProjects,
        maxStaff: pkg.features.maxStaff,
        enabledModules: pkg.features.modules,
        modifiedBy: userId,
      },
    });

    const createdHistory = await SubscriptionHistory.findById(history._id)
      .populate('societyId', 'societyName societyCode')
      .populate('packageId', 'packageName packageCode monthlyPrice yearlyPrice')
      .populate('previousPackageId', 'packageName packageCode')
      .populate('createdBy', 'firstName lastName email');

    if (!createdHistory) {
      throw new Error('Failed to create subscription history');
    }

    return toPlainHistory(createdHistory);
  },

  /**
   * Cancel society subscription
   */
  async cancelSubscription(
    societyId: string,
    remarks: string | undefined,
    userId: Types.ObjectId
  ): Promise<SubscriptionHistoryType> {
    const society = await Society.findById(societyId);
    if (!society || society.isDeleted) {
      throw new Error('Society not found');
    }

    if (!society.subscriptionPlanId || society.subscriptionStatus !== 'active') {
      throw new Error('Society does not have an active subscription');
    }

    const pkg = await SubscriptionPackage.findById(society.subscriptionPlanId);
    if (!pkg) {
      throw new Error('Subscription package not found');
    }

    // Create cancellation history record
    const historyData: any = {
      societyId,
      packageId: society.subscriptionPlanId,
      action: 'cancel',
      startDate: society.subscriptionStartDate || new Date(),
      endDate: new Date(),
      amount: 0,
      billingCycle: 'monthly',
      paymentStatus: 'paid',
      remarks: remarks || 'Subscription cancelled',
      createdBy: userId,
    };

    const history = await SubscriptionHistory.create(historyData);

    // Update society
    await Society.findByIdAndUpdate(societyId, {
      $set: {
        subscriptionStatus: 'expired',
        subscriptionEndDate: new Date(),
        modifiedBy: userId,
      },
    });

    const createdHistory = await SubscriptionHistory.findById(history._id)
      .populate('societyId', 'societyName societyCode')
      .populate('packageId', 'packageName packageCode')
      .populate('createdBy', 'firstName lastName email');

    if (!createdHistory) {
      throw new Error('Failed to create cancellation record');
    }

    return toPlainHistory(createdHistory);
  },

  /**
   * Get subscription history for a society
   */
  async getSubscriptionHistory(
    societyId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetSubscriptionHistoryResult> {
    const skip = (page - 1) * limit;

    const query: any = {
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
    };

    const [history, total] = await Promise.all([
      SubscriptionHistory.find(query)
        .populate('societyId', 'societyName societyCode')
        .populate('packageId', 'packageName packageCode monthlyPrice yearlyPrice')
        .populate('previousPackageId', 'packageName packageCode')
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainHistory(doc))),
      SubscriptionHistory.countDocuments(query),
    ]);

    return {
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },
};
