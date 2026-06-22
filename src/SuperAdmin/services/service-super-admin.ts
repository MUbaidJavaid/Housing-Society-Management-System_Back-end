import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import User, { UserRole, UserStatus } from '../../database/models/User';
import Society from '../../Society/models/models-society';
import SubscriptionPackage from '../../Subscription/models/models-subscription-package';
import Member from '../../Member/models/models-member';
import { AppError } from '../../middleware/error.middleware';
import { jwtService } from '../../auth/jwt';
import AuditLog from '../../AuditLog/models/models-auditLog';
import {
  CreateSocietyDto,
  UpdateSocietyDto,
  PlatformStats,
  SocietyHealth,
  ImpersonateDto,
  SocietyListQuery,
  UserListQuery,
  CreateSubscriptionPlanDto,
} from '../types/types-super-admin';

// ═══════════════════════════════════════════════════════════════════
// SOCIETY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a new society (tenant) with its admin user.
 * This is the primary onboarding flow — Super Admin only.
 */
export async function createSociety(
  dto: CreateSocietyDto,
  superAdminId: Types.ObjectId,
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate subscription plan exists
    const plan = await SubscriptionPackage.findOne({
      _id: dto.subscriptionPlanId,
      isActive: true,
      isDeleted: false,
    });
    if (!plan) {
      throw new AppError(404, 'Subscription plan not found');
    }

    // 2. Check admin email doesn't already exist
    const existingUser = await User.findOne({ email: dto.adminEmail.toLowerCase(), isDeleted: false });
    if (existingUser) {
      throw new AppError(409, `User with email ${dto.adminEmail} already exists`);
    }

    // 3. Generate society code if not provided
    let societyCode: string = dto.societyCode || '';
    if (!societyCode) {
      societyCode = await (Society as any).generateSocietyCode(dto.societyName);
    }

    // 4. Check society code uniqueness
    const existingSociety = await Society.findOne({ societyCode: societyCode.toUpperCase(), isDeleted: false });
    if (existingSociety) {
      throw new AppError(409, `Society code ${societyCode} already exists`);
    }

    // 5. Calculate subscription dates
    const now = new Date();
    const subscriptionEndDate = new Date(now);
    if (dto.billingCycle === 'yearly') {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    // 6. Create society
    const [society] = await Society.create(
      [
        {
          societyName: dto.societyName,
          societyCode: societyCode.toUpperCase(),
          address: dto.address,
          cityId: dto.cityId || undefined,
          stateId: dto.stateId || undefined,
          country: dto.country || 'Pakistan',
          zipCode: dto.zipCode,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          website: dto.website,
          subscriptionPlanId: plan._id,
          subscriptionStatus: 'active',
          subscriptionStartDate: now,
          subscriptionEndDate,
          trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          maxMembers: plan.features.maxMembers,
          maxProjects: plan.features.maxProjects,
          maxStaff: plan.features.maxStaff,
          enabledModules: plan.features.modules,
          isActive: true,
          createdBy: superAdminId,
        },
      ],
      { session },
    );

    // 7. Create admin user for this society
    // NOTE: Do NOT pre-hash password — the User model's pre('save') hook handles hashing.
    // Pre-hashing would cause double-hashing, making login impossible.
    const password = dto.adminPassword || crypto.randomBytes(12).toString('base64url');

    const [adminUser] = await User.create(
      [
        {
          email: dto.adminEmail.toLowerCase(),
          password: password,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          role: UserRole.ADMIN,
          societyId: society._id, // Tenant isolation
          status: UserStatus.ACTIVE,
          phone: dto.adminPhone,
          emailVerified: true,
          authMethod: 'email',
          metadata: {
            onboardedBy: superAdminId.toString(),
          },
        },
      ],
      { session },
    );

    // 8. Log the action
    await AuditLog.create(
      [
        {
          userId: superAdminId,
          action: 'SOCIETY_CREATED',
    
          entityType: 'SOCIETY',
          entityId: society._id,
          description: `Society "${dto.societyName}" (${societyCode}) created with admin ${dto.adminEmail}`,
          ipAddress: '',
          metadata: {
            societyId: society._id,
            adminUserId: adminUser._id,
            subscriptionPlan: plan.packageName,
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return {
      society,
      adminUser: {
        id: adminUser._id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        temporaryPassword: dto.adminPassword ? undefined : password,
      },
      subscription: {
        plan: plan.packageName,
        billingCycle: dto.billingCycle,
        startDate: now,
        endDate: subscriptionEndDate,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * List all societies with pagination, search, and health metrics
 */
export async function listSocieties(query: SocietyListQuery) {
  const { page = 1, limit = 20, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const filter: Record<string, any> = { isDeleted: false };
  if (status) filter.subscriptionStatus = status;
  if (search) {
    filter.$or = [
      { societyName: { $regex: search, $options: 'i' } },
      { societyCode: { $regex: search, $options: 'i' } },
      { contactEmail: { $regex: search, $options: 'i' } },
    ];
  }

  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [societies, total] = await Promise.all([
    Society.find(filter)
      .populate('subscriptionPlanId', 'packageName packageCode monthlyPrice')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Society.countDocuments(filter),
  ]);

  return {
    data: societies,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get detailed society info with stats
 */
export async function getSocietyDetail(societyId: string): Promise<any> {
  const society = await Society.findOne({ _id: societyId, isDeleted: false })
    .populate('subscriptionPlanId')
    .populate('createdBy', 'firstName lastName email')
    .lean();

  if (!society) throw new AppError(404, 'Society not found');

  // Gather stats
  const [memberCount, userCount, plotCount] = await Promise.all([
    Member.countDocuments({ societyId, isDeleted: false }),
    User.countDocuments({
      'societyId': societyId,
      isDeleted: false,
    }),
    mongoose.model('Plot').countDocuments({ societyId, isDeleted: false }).catch(() => 0),
  ]);

  return {
    ...society,
    stats: {
      totalMembers: memberCount,
      totalUsers: userCount,
      totalPlots: plotCount,
    },
  };
}

/**
 * Update a society's settings, subscription, or status
 */
export async function updateSociety(
  societyId: string,
  dto: UpdateSocietyDto,
  superAdminId: Types.ObjectId,
) {
  const society = await Society.findOne({ _id: societyId, isDeleted: false });
  if (!society) throw new AppError(404, 'Society not found');

  // If changing subscription plan, update limits from the new plan
  if (dto.subscriptionPlanId) {
    const plan = await SubscriptionPackage.findOne({
      _id: dto.subscriptionPlanId,
      isActive: true,
      isDeleted: false,
    });
    if (!plan) throw new AppError(404, 'Subscription plan not found');

    dto.maxMembers = dto.maxMembers ?? plan.features.maxMembers;
    dto.maxProjects = dto.maxProjects ?? plan.features.maxProjects;
    dto.maxStaff = dto.maxStaff ?? plan.features.maxStaff;
    dto.enabledModules = dto.enabledModules ?? plan.features.modules;
  }

  const updated = await Society.findByIdAndUpdate(
    societyId,
    { ...dto, modifiedBy: superAdminId },
    { new: true, runValidators: true },
  );

  await AuditLog.create({
    userId: superAdminId,
    action: 'SOCIETY_UPDATED',

    entityType: 'SOCIETY',
    entityId: societyId,
    description: `Society "${society.societyName}" updated`,
    metadata: { changes: dto },
  });

  return updated;
}

/**
 * Soft-delete (deactivate) a society
 */
export async function deleteSociety(societyId: string, superAdminId: Types.ObjectId) {
  const society = await Society.findOne({ _id: societyId, isDeleted: false });
  if (!society) throw new AppError(404, 'Society not found');

  await Society.findByIdAndUpdate(societyId, {
    isActive: false,
    isDeleted: true,
    deletedAt: new Date(),
    modifiedBy: superAdminId,
  });

  await AuditLog.create({
    userId: superAdminId,
    action: 'SOCIETY_DELETED',

    entityType: 'SOCIETY',
    entityId: societyId,
    description: `Society "${society.societyName}" deactivated`,
  });

  return { message: `Society "${society.societyName}" has been deactivated` };
}

// ═══════════════════════════════════════════════════════════════════
// GLOBAL USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * List all users across all tenants
 */
export async function listAllUsers(query: UserListQuery) {
  const { page = 1, limit = 20, search, role, societyId, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const filter: Record<string, any> = { isDeleted: false };
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (societyId) filter['societyId'] = societyId;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -twoFactorSecret -twoFactorBackupCodes')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ═══════════════════════════════════════════════════════════════════
// PLATFORM ANALYTICS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get global platform statistics
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    totalSocieties,
    activeSocieties,
    trialSocieties,
    expiredSocieties,
    totalUsers,
    totalMembers,
    totalPlots,
  ] = await Promise.all([
    Society.countDocuments({ isDeleted: false }),
    Society.countDocuments({ isDeleted: false, subscriptionStatus: 'active' }),
    Society.countDocuments({ isDeleted: false, subscriptionStatus: 'trial' }),
    Society.countDocuments({ isDeleted: false, subscriptionStatus: 'expired' }),
    User.countDocuments({ isDeleted: false }),
    Member.countDocuments({ isDeleted: false }),
    mongoose.model('Plot').countDocuments({ isDeleted: false }).catch(() => 0),
  ]);

  // Calculate MRR from active subscriptions
  const activeWithPlans = await Society.find({
    isDeleted: false,
    subscriptionStatus: 'active',
    subscriptionPlanId: { $exists: true },
  })
    .select('subscriptionPlanId')
    .populate('subscriptionPlanId', 'monthlyPrice')
    .lean();

  const mrr = activeWithPlans.reduce((sum, s) => {
    const plan = s.subscriptionPlanId as any;
    return sum + (plan?.monthlyPrice || 0);
  }, 0);

  return {
    totalSocieties,
    activeSocieties,
    trialSocieties,
    expiredSocieties,
    totalUsers,
    totalMembers,
    totalPlots,
    monthlyRevenue: mrr,
    mrr,
    storageUsedGB: 0, // Would integrate with Cloudinary API
  };
}

/**
 * Get health overview for all societies
 */
export async function getSocietiesHealth(): Promise<SocietyHealth[]> {
  const societies = await Society.find({ isDeleted: false })
    .populate('subscriptionPlanId', 'packageName monthlyPrice')
    .lean();

  if (societies.length === 0) return [];

  const societyIds = societies.map(s => s._id);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Batch all counts in 3 aggregate queries instead of N*3 queries
  const [userCounts, memberCounts, plotCounts] = await Promise.all([
    User.aggregate([
      { $match: { societyId: { $in: societyIds }, isDeleted: false, status: 'active', lastLogin: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$societyId', count: { $sum: 1 } } },
    ]),
    Member.aggregate([
      { $match: { societyId: { $in: societyIds }, isDeleted: false } },
      { $group: { _id: '$societyId', count: { $sum: 1 } } },
    ]),
    mongoose.model('Plot').aggregate([
      { $match: { societyId: { $in: societyIds }, isDeleted: false } },
      { $group: { _id: '$societyId', count: { $sum: 1 } } },
    ]).catch(() => []),
  ]);

  // Build lookup maps for O(1) access
  const userMap = new Map(userCounts.map((r: any) => [r._id.toString(), r.count]));
  const memberMap = new Map(memberCounts.map((r: any) => [r._id.toString(), r.count]));
  const plotMap = new Map(plotCounts.map((r: any) => [r._id.toString(), r.count]));

  const healthData: SocietyHealth[] = societies.map(society => {
    const sid = society._id.toString();
    const activeUsers = userMap.get(sid) || 0;
    const totalMembers = memberMap.get(sid) || 0;
    const totalPlots = plotMap.get(sid) || 0;

    let healthScore = 50;
    if (society.subscriptionStatus === 'active') healthScore += 20;
    if (activeUsers > 0) healthScore += 15;
    if (totalMembers > 0) healthScore += 10;
    if (society.subscriptionStatus === 'expired') healthScore -= 30;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const plan = society.subscriptionPlanId as any;
    return {
      societyId: sid,
      societyName: society.societyName,
      societyCode: society.societyCode,
      subscriptionStatus: society.subscriptionStatus,
      subscriptionPlanName: plan?.packageName || 'No Plan',
      activeUsers,
      totalMembers,
      totalPlots,
      mrr: plan?.monthlyPrice || 0,
      lastActivityAt: society.updatedAt,
      healthScore,
    };
  });

  return healthData.sort((a, b) => b.healthScore - a.healthScore);
}

// ═══════════════════════════════════════════════════════════════════
// IMPERSONATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a temporary JWT to impersonate another user.
 * Creates an audit trail entry.
 */
export async function impersonateUser(
  dto: ImpersonateDto,
  superAdmin: { userId: Types.ObjectId; email: string },
) {
  const targetUser = await User.findOne({
    _id: dto.targetUserId,
    isDeleted: false,
  });
  if (!targetUser) throw new AppError(404, 'Target user not found');

  // Cannot impersonate another super admin
  if (targetUser.role === UserRole.SUPER_ADMIN) {
    throw new AppError(403, 'Cannot impersonate another Super Admin');
  }

  // Generate impersonation token pair with unique sessionId
  const impersonationSessionId = `imp_${crypto.randomUUID()}`;
  const tokenPair = await jwtService.generateTokenPair(
    targetUser._id as Types.ObjectId,
    targetUser.email,
    targetUser.role as any,
    targetUser.roleId?.toString(),
    targetUser.societyId?.toString(),
  );
  const token = tokenPair.accessToken;

  // Log impersonation
  await AuditLog.create({
    userId: superAdmin.userId,
    action: 'USER_IMPERSONATED',

    entityType: 'User',
    entityId: targetUser._id,
    description: `Super Admin ${superAdmin.email} impersonated ${targetUser.email}. Reason: ${dto.reason}`,
    metadata: {
      superAdminId: superAdmin.userId,
      targetUserId: targetUser._id,
      targetSocietyId: targetUser.societyId,
      reason: dto.reason,
      impersonationSessionId,
    },
  });

  return {
    token,
    user: {
      id: targetUser._id,
      email: targetUser.email,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      role: targetUser.role,
      societyId: targetUser.societyId?.toString(),
    },
    expiresIn: '1h',
    warning: 'This is an impersonation session. All actions are logged.',
  };
}

// ═══════════════════════════════════════════════════════════════════
// SUBSCRIPTION PLAN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a new subscription plan
 */
export async function createSubscriptionPlan(
  dto: CreateSubscriptionPlanDto,
  superAdminId: Types.ObjectId,
) {
  const existing = await SubscriptionPackage.findOne({
    packageCode: dto.packageCode.toLowerCase(),
    isDeleted: false,
  });
  if (existing) throw new AppError(409, `Package code "${dto.packageCode}" already exists`);

  const plan = await SubscriptionPackage.create({
    ...dto,
    packageCode: dto.packageCode.toLowerCase(),
    createdBy: superAdminId,
  });

  return plan;
}

/**
 * List all subscription plans
 */
export async function listSubscriptionPlans() {
  return SubscriptionPackage.find({ isDeleted: false })
    .sort({ sortOrder: 1, monthlyPrice: 1 })
    .lean();
}

/**
 * Update a subscription plan
 */
export async function updateSubscriptionPlan(
  planId: string,
  dto: Partial<CreateSubscriptionPlanDto>,
  superAdminId: Types.ObjectId,
) {
  const plan = await SubscriptionPackage.findOne({ _id: planId, isDeleted: false });
  if (!plan) throw new AppError(404, 'Plan not found');

  const updated = await SubscriptionPackage.findByIdAndUpdate(
    planId,
    { ...dto, modifiedBy: superAdminId },
    { new: true, runValidators: true },
  );

  return updated;
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get global audit logs across all tenants
 */
export async function getGlobalAuditLogs(query: {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  societyId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, limit = 50, module: mod, action, societyId, userId, startDate, endDate } = query;
  const filter: Record<string, any> = {};

  if (mod) filter.module = mod;
  if (action) filter.action = action;
  if (societyId) filter['societyId'] = societyId;
  if (userId) filter.userId = userId;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    data: logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
