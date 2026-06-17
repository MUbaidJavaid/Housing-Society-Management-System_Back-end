import { Types } from 'mongoose';
import {
  CreateSocietyDto,
  GetSocietiesResult,
  SocietyQueryParams,
  SocietyStats,
  SocietyType,
  UpdateSocietyDto,
} from '../types/types-society';
import Society from '../models/models-society';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): SocietyType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  return plainObj as SocietyType;
};

export const societyService = {
  /**
   * Create a new society
   */
  async createSociety(data: CreateSocietyDto, userId: Types.ObjectId): Promise<SocietyType> {
    // Generate society code if not provided
    let societyCode = data.societyCode;
    if (!societyCode) {
      societyCode = await Society.generateSocietyCode(data.societyName);
    }

    // Check for duplicate code
    const existing = await Society.findOne({ societyCode, isDeleted: false });
    if (existing) {
      throw new Error('Society code already exists');
    }

    const societyData = {
      ...data,
      societyCode,
      createdBy: userId,
      modifiedBy: userId,
    };

    const society = await Society.create(societyData);

    const createdSociety = await Society.findById(society._id)
      .populate('cityId', 'cityName')
      .populate('stateId', 'stateName')
      .populate('subscriptionPlanId', 'packageName packageCode')
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    if (!createdSociety) {
      throw new Error('Failed to create society');
    }

    return toPlainObject(createdSociety);
  },

  /**
   * Get society by ID
   */
  async getSocietyById(id: string): Promise<SocietyType> {
    try {
      const society = await Society.findById(id)
        .populate('cityId', 'cityName')
        .populate('stateId', 'stateName')
        .populate('subscriptionPlanId', 'packageName packageCode monthlyPrice yearlyPrice features')
        .populate('createdBy', 'firstName lastName email')
        .populate('modifiedBy', 'firstName lastName email');

      if (!society || society.isDeleted) {
        throw new Error('Society not found');
      }

      return toPlainObject(society);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid society ID');
    }
  },

  /**
   * Get all societies with pagination
   */
  async getSocieties(params: SocietyQueryParams): Promise<GetSocietiesResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      subscriptionStatus,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { societyName: { $regex: search, $options: 'i' } },
        { societyCode: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
      ];
    }

    if (subscriptionStatus) {
      query.subscriptionStatus = subscriptionStatus;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const [societies, total] = await Promise.all([
      Society.find(query)
        .populate('cityId', 'cityName')
        .populate('stateId', 'stateName')
        .populate('subscriptionPlanId', 'packageName packageCode')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Society.countDocuments(query),
    ]);

    return {
      societies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update society
   */
  async updateSociety(
    id: string,
    data: UpdateSocietyDto,
    userId: Types.ObjectId
  ): Promise<SocietyType | null> {
    const existing = await Society.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Society not found');
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    // Merge settings if provided
    if (data.settings) {
      updateObj.settings = {
        ...existing.settings,
        ...data.settings,
      };
    }

    const society = await Society.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('cityId', 'cityName')
      .populate('stateId', 'stateName')
      .populate('subscriptionPlanId', 'packageName packageCode')
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    return society ? toPlainObject(society) : null;
  },

  /**
   * Soft delete society
   */
  async deleteSociety(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existing = await Society.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Society not found');
    }

    const result = await Society.findByIdAndUpdate(
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
   * Toggle society active status
   */
  async toggleSocietyStatus(id: string, userId: Types.ObjectId): Promise<SocietyType | null> {
    const existing = await Society.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Society not found');
    }

    const society = await Society.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !existing.isActive,
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('cityId', 'cityName')
      .populate('stateId', 'stateName')
      .populate('subscriptionPlanId', 'packageName packageCode');

    return society ? toPlainObject(society) : null;
  },

  /**
   * Get society statistics
   */
  async getSocietyStats(id: string): Promise<SocietyStats> {
    const society = await Society.findById(id);
    if (!society || society.isDeleted) {
      throw new Error('Society not found');
    }

    // Calculate subscription days remaining
    let subscriptionDaysRemaining: number | null = null;
    if (society.subscriptionStatus === 'trial' && society.trialEndsAt) {
      const diffTime = society.trialEndsAt.getTime() - Date.now();
      subscriptionDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (society.subscriptionEndDate) {
      const diffTime = society.subscriptionEndDate.getTime() - Date.now();
      subscriptionDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // These counts would ideally query actual Member, Project, UserStaff collections
    // filtered by societyId. For now, return placeholder counts.
    return {
      totalMembers: 0,
      totalPlots: 0,
      totalProjects: 0,
      totalStaff: 0,
      subscriptionStatus: society.subscriptionStatus,
      subscriptionDaysRemaining,
      limits: {
        maxMembers: society.maxMembers,
        maxProjects: society.maxProjects,
        maxStaff: society.maxStaff,
        membersUsed: 0,
        projectsUsed: 0,
        staffUsed: 0,
      },
    };
  },

  /**
   * Update subscription details on a society
   */
  async updateSubscription(
    id: string,
    subscriptionData: {
      subscriptionPlanId: string;
      subscriptionStatus: 'trial' | 'active' | 'expired' | 'suspended';
      subscriptionStartDate: Date;
      subscriptionEndDate: Date;
      maxMembers?: number;
      maxProjects?: number;
      maxStaff?: number;
      enabledModules?: string[];
    },
    userId: Types.ObjectId
  ): Promise<SocietyType | null> {
    const existing = await Society.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Society not found');
    }

    const updateObj: any = {
      ...subscriptionData,
      modifiedBy: userId,
    };

    const society = await Society.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('subscriptionPlanId', 'packageName packageCode monthlyPrice yearlyPrice features');

    return society ? toPlainObject(society) : null;
  },

  /**
   * Check if society has reached its limits
   */
  async checkLimits(
    id: string
  ): Promise<{ withinLimits: boolean; details: Record<string, { used: number; max: number }> }> {
    const society = await Society.findById(id);
    if (!society || society.isDeleted) {
      throw new Error('Society not found');
    }

    // Placeholder - would query actual collections
    const membersUsed = 0;
    const projectsUsed = 0;
    const staffUsed = 0;

    const details: Record<string, { used: number; max: number }> = {
      members: { used: membersUsed, max: society.maxMembers },
      projects: { used: projectsUsed, max: society.maxProjects },
      staff: { used: staffUsed, max: society.maxStaff },
    };

    const withinLimits =
      membersUsed < society.maxMembers &&
      projectsUsed < society.maxProjects &&
      staffUsed < society.maxStaff;

    return { withinLimits, details };
  },
};
