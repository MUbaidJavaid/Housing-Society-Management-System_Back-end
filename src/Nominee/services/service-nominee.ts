import { Types } from 'mongoose';
import File from '../../File/models/models-file';
import Member from '../../Member/models/models-member';
import Nominee from '../models/models-nominee';
import {
  CreateNomineeDto,
  NomineeQueryParams,
  NomineeStatistics,
  NomineeSummary,
  NomineeType,
  ShareDistribution,
  UpdateNomineeDto,
} from '../types/types-nominee';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): NomineeType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as NomineeType;
};

export const nomineeService = {
  /**
   * Create new nominee
   */
  async createNominee(data: CreateNomineeDto, userId: Types.ObjectId): Promise<NomineeType> {
    // Check if member exists
    const member = await Member.findById(data.memId);
    if (!member || (member as any).isDeleted) {
      throw new Error('Member not found');
    }

    // Check if CNIC already exists
    const existingNominee = await Nominee.findOne({
      nomineeCNIC: data.nomineeCNIC,
      isDeleted: false,
    });

    if (existingNominee) {
      throw new Error('Nominee with this CNIC already exists');
    }

    // Validate total share percentage for member
    const existingNominees = await Nominee.find({
      memId: data.memId,
      isDeleted: false,
      isActive: true,
    });

    const totalShare = existingNominees.reduce(
      (sum, nominee) => sum + nominee.nomineeSharePercentage,
      0
    );
    const newTotalShare = totalShare + (data.nomineeSharePercentage || 100);

    if (newTotalShare > 100) {
      throw new Error(`Total share percentage exceeds 100%. Current total: ${newTotalShare}%`);
    }

    const nomineeData = {
      ...data,
      nomineeSharePercentage: data.nomineeSharePercentage || 100,
      isActive: true,
      createdBy: userId,
      isDeleted: false,
    };

    const nominee = await Nominee.create(nomineeData);

    const createdNominee = await Nominee.findById(nominee._id)
      .populate('member', 'fullName cnic mobileNo')
      .populate('createdBy', 'userName fullName designation');

    if (!createdNominee) {
      throw new Error('Failed to create nominee');
    }

    return toPlainObject(createdNominee);
  },

  /**
   * Get nominee by ID
   */
  async getNomineeById(id: string): Promise<NomineeType> {
    try {
      const nominee = await Nominee.findById(id)
        .populate('member', 'fullName cnic fatherName mobileNo email address')
        .populate('createdBy', 'userName fullName designation')
        .populate('modifiedBy', 'userName fullName designation');

      if (!nominee || nominee.isDeleted) {
        throw new Error('Nominee not found');
      }

      return toPlainObject(nominee);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid nominee ID');
    }
  },

  /**
   * Get nominee by CNIC
   */
  async getNomineeByCNIC(cnic: string): Promise<NomineeType | null> {
    const nominee = await Nominee.findOne({
      nomineeCNIC: cnic,
      isDeleted: false,
    })
      .populate('member', 'fullName cnic mobileNo')
      .populate('createdBy', 'userName fullName');

    if (!nominee) return null;
    return toPlainObject(nominee);
  },

  /**
   * Get all nominees with pagination
   */
  async getNominees(params: NomineeQueryParams): Promise<{
    nominees: NomineeType[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      memId,
      search,
      relationWithMember,
      isActive = true,
      sortBy = 'createdAt',
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

    if (memId) {
      query.memId = new Types.ObjectId(memId);
    }

    if (relationWithMember) {
      query.relationWithMember = relationWithMember;
    }

    // Text search
    if (search) {
      query.$or = [
        { nomineeName: { $regex: search, $options: 'i' } },
        { nomineeCNIC: { $regex: search, $options: 'i' } },
        { nomineeContact: { $regex: search, $options: 'i' } },
      ];
    }

    const [nominees, total] = await Promise.all([
      Nominee.find(query)
        .populate('member', 'fullName cnic')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Nominee.countDocuments(query),
    ]);

    return {
      nominees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update nominee
   */
  async updateNominee(
    id: string,
    data: UpdateNomineeDto,
    userId: Types.ObjectId
  ): Promise<NomineeType | null> {
    const existingNominee = await Nominee.findById(id);
    if (!existingNominee || existingNominee.isDeleted) {
      throw new Error('Nominee not found');
    }

    // Check if CNIC is being changed to an existing one
    if (data.nomineeCNIC && data.nomineeCNIC !== existingNominee.nomineeCNIC) {
      const duplicate = await Nominee.findOne({
        nomineeCNIC: data.nomineeCNIC,
        isDeleted: false,
        _id: { $ne: id },
      });

      if (duplicate) {
        throw new Error('Nominee with this CNIC already exists');
      }
    }

    // Validate share percentage if being updated
    if (data.nomineeSharePercentage !== undefined) {
      const existingNominees = await Nominee.find({
        memId: existingNominee.memId,
        isDeleted: false,
        isActive: true,
        _id: { $ne: id },
      });

      const totalShare = existingNominees.reduce(
        (sum, nominee) => sum + nominee.nomineeSharePercentage,
        0
      );
      const newTotalShare = totalShare + data.nomineeSharePercentage;

      if (newTotalShare > 100) {
        throw new Error(`Total share percentage exceeds 100%. New total: ${newTotalShare}%`);
      }
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    const nominee = await Nominee.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('member', 'fullName cnic mobileNo')
      .populate('modifiedBy', 'userName fullName');

    return nominee ? toPlainObject(nominee) : null;
  },

  /**
   * Delete nominee (soft delete)
   */
  async deleteNominee(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingNominee = await Nominee.findById(id);
    if (!existingNominee || existingNominee.isDeleted) {
      throw new Error('Nominee not found');
    }

    // Check if nominee is referenced in any active files

    const fileWithNominee = await File.findOne({
      nomineeId: id,
      isDeleted: false,
      isActive: true,
      status: { $in: ['Active', 'Pending'] },
    });

    if (fileWithNominee) {
      throw new Error('Cannot delete nominee that is referenced in active files');
    }

    const result = await Nominee.findByIdAndUpdate(
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
   * Get nominees by member
   */
  async getNomineesByMember(memId: string, activeOnly: boolean = true): Promise<NomineeType[]> {
    const query: any = {
      memId: new Types.ObjectId(memId),
      isDeleted: false,
    };

    if (activeOnly) {
      query.isActive = true;
    }

    const nominees = await Nominee.find(query)
      .populate('member', 'fullName cnic')
      .sort({ nomineeSharePercentage: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return nominees;
  },

  /**
   * Search nominees
   */
  async searchNominees(searchTerm: string, limit: number = 10): Promise<NomineeType[]> {
    const nominees = await Nominee.find({
      $or: [
        { nomineeName: { $regex: searchTerm, $options: 'i' } },
        { nomineeCNIC: { $regex: searchTerm, $options: 'i' } },
        { nomineeContact: { $regex: searchTerm, $options: 'i' } },
      ],
      isDeleted: false,
      isActive: true,
    })
      .populate('member', 'fullName cnic')
      .limit(limit)
      .sort({ createdAt: -1 })
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return nominees;
  },

  /**
   * Get nominee statistics
   */
  async getNomineeStatistics(): Promise<NomineeStatistics> {
    const [stats, relationStats, shareStats] = await Promise.all([
      Nominee.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $group: {
            _id: null,
            totalNominees: { $sum: 1 },
            activeNominees: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
            },
            totalSharePercentage: { $sum: '$nomineeSharePercentage' },
          },
        },
      ]),
      Nominee.aggregate([
        {
          $match: { isDeleted: false, isActive: true },
        },
        {
          $group: {
            _id: '$relationWithMember',
            count: { $sum: 1 },
            averageShare: { $avg: '$nomineeSharePercentage' },
            totalShare: { $sum: '$nomineeSharePercentage' },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
      Nominee.aggregate([
        {
          $match: { isDeleted: false, isActive: true },
        },
        {
          $group: {
            _id: '$memId',
            nomineeCount: { $sum: 1 },
            totalShare: { $sum: '$nomineeSharePercentage' },
          },
        },
        {
          $match: { nomineeCount: { $gt: 1 } },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const baseStats = stats[0] || {
      totalNominees: 0,
      activeNominees: 0,
      totalSharePercentage: 0,
    };

    const byRelation: Record<string, number> = {};
    relationStats.forEach(stat => {
      byRelation[stat._id] = stat.count;
    });

    const topRelations = relationStats.slice(0, 5).map(stat => ({
      relation: stat._id,
      count: stat.count,
      averageShare: stat.averageShare,
    }));

    const membersWithMultipleNominees = shareStats[0]?.count || 0;

    return {
      totalNominees: baseStats.totalNominees,
      activeNominees: baseStats.activeNominees,
      inactiveNominees: baseStats.totalNominees - baseStats.activeNominees,
      byRelation,
      averageSharePercentage:
        baseStats.totalNominees > 0 ? baseStats.totalSharePercentage / baseStats.totalNominees : 0,
      membersWithMultipleNominees,
      topRelations,
    };
  },

  /**
   * Get nominee summary for dashboard
   */
  async getNomineeSummary(): Promise<NomineeSummary> {
    const [totalNominees, primaryNominees, recentlyAdded] = await Promise.all([
      Nominee.countDocuments({ isDeleted: false, isActive: true }),
      Nominee.countDocuments({
        isDeleted: false,
        isActive: true,
        nomineeSharePercentage: 100,
      }),
      Nominee.find({
        isDeleted: false,
        isActive: true,
      })
        .populate('member', 'fullName')
        .sort({ createdAt: -1 })
        .limit(5)
        .then(docs => docs.map(doc => toPlainObject(doc))),
    ]);

    // Calculate total share coverage
    const shareStats = await Nominee.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $group: {
          _id: '$memId',
          totalShare: { $sum: '$nomineeSharePercentage' },
        },
      },
      {
        $match: { totalShare: 100 },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    const totalShareCoverage = shareStats[0]?.count || 0;

    return {
      totalNominees,
      primaryNominees,
      totalShareCoverage,
      recentlyAdded,
    };
  },

  /**
   * Get share distribution by member
   */
  async getShareDistribution(): Promise<ShareDistribution[]> {
    const distribution = await Nominee.aggregate([
      {
        $match: {
          isDeleted: false,
          isActive: true,
        },
      },
      {
        $lookup: {
          from: 'members',
          localField: 'memId',
          foreignField: '_id',
          as: 'member',
        },
      },
      {
        $unwind: '$member',
      },
      {
        $group: {
          _id: '$memId',
          memberName: { $first: '$member.fullName' },
          totalNominees: { $sum: 1 },
          totalSharePercentage: { $sum: '$nomineeSharePercentage' },
          nominees: {
            $push: {
              name: '$nomineeName',
              relation: '$relationWithMember',
              share: '$nomineeSharePercentage',
              cnic: '$nomineeCNIC',
              contact: '$nomineeContact',
            },
          },
        },
      },
      {
        $sort: { totalNominees: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    return distribution.map(item => ({
      memberId: item._id,
      memberName: item.memberName,
      totalNominees: item.totalNominees,
      totalSharePercentage: item.totalSharePercentage,
      nominees: item.nominees,
    }));
  },

  /**
   * Bulk update nominee status
   */
  async bulkUpdateStatus(
    nomineeIds: string[],
    isActive: boolean,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    const objectIds = nomineeIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid nominee ID: ${id}`);
      }
    });

    const result = await Nominee.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
      },
      {
        $set: {
          isActive,
          modifiedBy: userId,
        },
      }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },

  /**
   * Get member's total share coverage
   */
  async getMemberShareCoverage(memId: string): Promise<{
    totalShare: number;
    coveragePercentage: number;
    isFullyCovered: boolean;
    nominees: NomineeType[];
  }> {
    const nominees = await Nominee.find({
      memId: new Types.ObjectId(memId),
      isDeleted: false,
      isActive: true,
    })
      .populate('member', 'fullName cnic')
      .sort({ nomineeSharePercentage: -1 });

    const totalShare = nominees.reduce((sum, nominee) => sum + nominee.nomineeSharePercentage, 0);
    const coveragePercentage = totalShare;
    const isFullyCovered = totalShare === 100;

    return {
      totalShare,
      coveragePercentage,
      isFullyCovered,
      nominees: nominees.map(nominee => toPlainObject(nominee)),
    };
  },

  /**
   * Validate nominee data
   */
  async validateNomineeData(data: CreateNomineeDto | UpdateNomineeDto): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate CNIC format
    if (data.nomineeCNIC) {
      const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
      if (!cnicRegex.test(data.nomineeCNIC)) {
        errors.push('Invalid CNIC format. Should be XXXXX-XXXXXXX-X');
      }
    }

    // Validate contact number
    if (data.nomineeContact) {
      const contactRegex = /^[0-9]{11,15}$/;
      if (!contactRegex.test(data.nomineeContact)) {
        errors.push('Invalid contact number. Should be 11-15 digits');
      }
    }

    // Validate email
    if (data.nomineeEmail) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(data.nomineeEmail)) {
        warnings.push('Email format appears to be invalid');
      }
    }

    // Validate share percentage
    if (data.nomineeSharePercentage !== undefined) {
      if (data.nomineeSharePercentage < 0 || data.nomineeSharePercentage > 100) {
        errors.push('Share percentage must be between 0 and 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Get nominees without 100% coverage
   */
  async getMembersWithoutFullCoverage(): Promise<
    Array<{
      memberId: Types.ObjectId;
      memberName: string;
      totalShare: number;
      nomineesCount: number;
    }>
  > {
    const members = await Nominee.aggregate([
      {
        $match: {
          isDeleted: false,
          isActive: true,
        },
      },
      {
        $lookup: {
          from: 'members',
          localField: 'memId',
          foreignField: '_id',
          as: 'member',
        },
      },
      {
        $unwind: '$member',
      },
      {
        $group: {
          _id: '$memId',
          memberName: { $first: '$member.fullName' },
          totalShare: { $sum: '$nomineeSharePercentage' },
          nomineesCount: { $sum: 1 },
        },
      },
      {
        $match: {
          totalShare: { $lt: 100 },
        },
      },
      {
        $sort: { totalShare: 1 },
      },
      {
        $limit: 50,
      },
    ]);

    return members.map(member => ({
      memberId: member._id,
      memberName: member.memberName,
      totalShare: member.totalShare,
      nomineesCount: member.nomineesCount,
    }));
  },
};
