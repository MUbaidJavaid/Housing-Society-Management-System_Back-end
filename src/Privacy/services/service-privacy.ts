import { Types } from 'mongoose';
import PrivacyAccessLog from '../models/models-privacy-access-log';
import PrivacySettings from '../models/models-privacy-settings';
import {
  CreateAccessLogDto,
  DataDeletionRequest,
  DataExportRequest,
  PrivacyAccessLogQueryParams,
  PrivacyScoreResult,
  UpdatePrivacySettingsDto,
} from '../types/types-privacy';

export const privacyService = {
  async getSettings(memberId: string): Promise<any | null> {
    const settings = await PrivacySettings.findOne({
      memberId: new Types.ObjectId(memberId),
      isDeleted: false,
    })
      .populate('memberId', 'memName memNic')
      .populate('userId', 'firstName lastName email')
      .populate('societyId', 'name');

    return settings?.toObject() || null;
  },

  async getSettingsByUserId(userId: string): Promise<any | null> {
    const settings = await PrivacySettings.findOne({
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    })
      .populate('memberId', 'memName memNic')
      .populate('userId', 'firstName lastName email')
      .populate('societyId', 'name');

    return settings?.toObject() || null;
  },

  async upsertSettings(
    memberId: string,
    userId: string,
    societyId: string,
    data: UpdatePrivacySettingsDto
  ): Promise<any> {
    const settings = await PrivacySettings.findOneAndUpdate(
      {
        memberId: new Types.ObjectId(memberId),
        isDeleted: false,
      },
      {
        $set: {
          ...data,
          memberId: new Types.ObjectId(memberId),
          userId: new Types.ObjectId(userId),
          societyId: new Types.ObjectId(societyId),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )
      .populate('memberId', 'memName memNic')
      .populate('userId', 'firstName lastName email')
      .populate('societyId', 'name');

    return settings.toObject();
  },

  async updateSettings(
    memberId: string,
    data: UpdatePrivacySettingsDto,
    _userId: string
  ): Promise<any | null> {
    const settings = await PrivacySettings.findOneAndUpdate(
      {
        memberId: new Types.ObjectId(memberId),
        isDeleted: false,
      },
      {
        $set: {
          ...data,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('memberId', 'memName memNic')
      .populate('userId', 'firstName lastName email')
      .populate('societyId', 'name');

    return settings?.toObject() || null;
  },

  async deleteSettings(memberId: string): Promise<boolean> {
    const result = await PrivacySettings.findOneAndUpdate(
      {
        memberId: new Types.ObjectId(memberId),
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    return !!result;
  },

  async getAccessLog(memberId: string, params: PrivacyAccessLogQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      accessType,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { memberId: new Types.ObjectId(memberId) };

    if (accessType) {
      query.accessType = accessType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      PrivacyAccessLog.find(query)
        .populate('accessorId', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      PrivacyAccessLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async logAccess(data: CreateAccessLogDto): Promise<any> {
    const log = await PrivacyAccessLog.create({
      memberId: new Types.ObjectId(data.memberId),
      accessorId: new Types.ObjectId(data.accessorId),
      accessorRole: data.accessorRole,
      accessType: data.accessType,
      fieldsAccessed: data.fieldsAccessed || [],
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      societyId: new Types.ObjectId(data.societyId),
    });

    return log.toObject();
  },

  async requestDataExport(memberId: string, userId: string): Promise<DataExportRequest> {
    // Log the export request as an access log entry
    await PrivacyAccessLog.create({
      memberId: new Types.ObjectId(memberId),
      accessorId: new Types.ObjectId(userId),
      accessorRole: 'self',
      accessType: 'export-data',
      fieldsAccessed: ['all'],
      societyId: (
        await PrivacySettings.findOne({
          memberId: new Types.ObjectId(memberId),
          isDeleted: false,
        }).select('societyId')
      )?.societyId,
    });

    return {
      memberId,
      userId,
      status: 'pending',
      requestedAt: new Date(),
    };
  },

  async requestDataDeletion(memberId: string, userId: string): Promise<DataDeletionRequest> {
    // Log the deletion request as an access log entry
    const settings = await PrivacySettings.findOne({
      memberId: new Types.ObjectId(memberId),
      isDeleted: false,
    }).select('societyId');

    if (settings) {
      await PrivacyAccessLog.create({
        memberId: new Types.ObjectId(memberId),
        accessorId: new Types.ObjectId(userId),
        accessorRole: 'self',
        accessType: 'export-data',
        fieldsAccessed: ['deletion-request'],
        societyId: settings.societyId,
      });
    }

    return {
      memberId,
      userId,
      status: 'pending',
      requestedAt: new Date(),
    };
  },

  async getConsents(memberId: string): Promise<any> {
    const settings = await PrivacySettings.findOne({
      memberId: new Types.ObjectId(memberId),
      isDeleted: false,
    }).select('consentHistory dataRetentionConsent marketingConsent thirdPartySharing allowAnonymousComplaints');

    if (!settings) {
      return null;
    }

    return {
      currentConsents: {
        dataRetentionConsent: settings.dataRetentionConsent,
        marketingConsent: settings.marketingConsent,
        thirdPartySharing: settings.thirdPartySharing,
        allowAnonymousComplaints: settings.allowAnonymousComplaints,
      },
      history: settings.consentHistory,
    };
  },

  async updateConsent(
    memberId: string,
    consentType: string,
    granted: boolean,
    ipAddress: string
  ): Promise<any | null> {
    const updateData: any = {
      $set: {
        [consentType]: granted,
      },
      $push: {
        consentHistory: {
          consentType,
          granted,
          timestamp: new Date(),
          ipAddress,
        },
      },
    };

    const settings = await PrivacySettings.findOneAndUpdate(
      {
        memberId: new Types.ObjectId(memberId),
        isDeleted: false,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    return settings?.toObject() || null;
  },

  async getSocietyPrivacyScore(societyId: string): Promise<PrivacyScoreResult> {
    const query = {
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
    };

    const [
      totalMembers,
      profileHiddenCount,
      emailHiddenCount,
      phoneHiddenCount,
      directoryOptOutCount,
      thirdPartySharingDisabledCount,
      dataRetentionConsentCount,
      marketingConsentCount,
    ] = await Promise.all([
      PrivacySettings.countDocuments(query),
      PrivacySettings.countDocuments({ ...query, profileVisibility: 'hidden' }),
      PrivacySettings.countDocuments({ ...query, showEmail: false }),
      PrivacySettings.countDocuments({ ...query, showPhone: false }),
      PrivacySettings.countDocuments({ ...query, directoryOptOut: true }),
      PrivacySettings.countDocuments({ ...query, thirdPartySharing: false }),
      PrivacySettings.countDocuments({ ...query, dataRetentionConsent: true }),
      PrivacySettings.countDocuments({ ...query, marketingConsent: false }),
    ]);

    // Calculate privacy score (0-100)
    // Higher score = better privacy posture for the society
    let score = 0;
    if (totalMembers > 0) {
      const privacyAwareRatio =
        (emailHiddenCount +
          phoneHiddenCount +
          directoryOptOutCount +
          thirdPartySharingDisabledCount +
          dataRetentionConsentCount) /
        (totalMembers * 5);
      score = Math.round(privacyAwareRatio * 100);
    }

    return {
      societyId,
      score,
      totalMembers,
      metrics: {
        profileHiddenCount,
        emailHiddenCount,
        phoneHiddenCount,
        directoryOptOutCount,
        thirdPartySharingDisabledCount,
        dataRetentionConsentCount,
        marketingConsentCount,
      },
    };
  },

  filterMemberData(
    memberData: any,
    requestorRole: string,
    privacySettings: any
  ): any {
    if (!privacySettings || !memberData) {
      return memberData;
    }

    // Admins and super admins see everything
    if (requestorRole === 'admin' || requestorRole === 'super_admin') {
      return memberData;
    }

    const filtered = { ...memberData };

    // Apply profile visibility
    if (privacySettings.profileVisibility === 'hidden') {
      return {
        _id: filtered._id,
        memName: filtered.memName,
        profileHidden: true,
      };
    }

    if (
      privacySettings.profileVisibility === 'committee-only' &&
      requestorRole !== 'moderator' &&
      requestorRole !== 'admin' &&
      requestorRole !== 'super_admin'
    ) {
      return {
        _id: filtered._id,
        memName: filtered.memName,
        profileRestricted: true,
      };
    }

    // Filter individual fields
    if (!privacySettings.showEmail) {
      delete filtered.memContEmail;
    }

    if (!privacySettings.showPhone) {
      delete filtered.memContMob;
      delete filtered.memContRes;
      delete filtered.memContWork;
    }

    if (!privacySettings.showAddress) {
      delete filtered.memAddr1;
      delete filtered.memAddr2;
      delete filtered.memAddr3;
      delete filtered.memPermAdd;
      delete filtered.memPermAddress1;
      delete filtered.memPermCity;
      delete filtered.memPermState;
      delete filtered.memPermCountry;
      delete filtered.memZipPost;
    }

    return filtered;
  },
};
