import { Types } from 'mongoose';
import { CreateMemberDto, MemberQueryParams, UpdateMemberDto } from '../index-member';
import Member from '../models/models-member';

export const memberService = {
  async createMember(data: CreateMemberDto, userId: Types.ObjectId): Promise<any> {
    // Generate registration number if not provided
    if (!data.memRegNo) {
      const year = new Date().getFullYear();
      const count = await Member.countDocuments();
      data.memRegNo = `MEM${year}${String(count + 1).padStart(5, '0')}`;
    }

    const member = await Member.create({
      ...data,
      statusId: data.statusId ? new Types.ObjectId(data.statusId) : undefined,
      cityId: data.cityId ? new Types.ObjectId(data.cityId) : undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      memIsOverseas: data.memIsOverseas || false,
      createdBy: userId,
      updatedBy: userId,
    });

    return member;
  },

  async getMemberById(id: string): Promise<any | null> {
    const member = await Member.findById(id)
      .populate('statusId', 'statusName')
      .populate('cityId', 'cityName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return member?.toObject() || null;
  },

  async getMemberByNic(nic: string): Promise<any | null> {
    const member = await Member.findOne({
      memNic: nic.toUpperCase(),
      isDeleted: false,
    })
      .populate('statusId', 'statusName')
      .populate('cityId', 'cityName');

    return member?.toObject() || null;
  },

  async getMembers(params: MemberQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      statusId,
      cityId,
      memIsOverseas,
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
        { memName: { $regex: search, $options: 'i' } },
        { memNic: { $regex: search, $options: 'i' } },
        { memContMob: { $regex: search, $options: 'i' } },
        { memContEmail: { $regex: search, $options: 'i' } },
        { memRegNo: { $regex: search, $options: 'i' } },
      ];
    }

    if (statusId) query.statusId = new Types.ObjectId(statusId);
    if (cityId) query.cityId = new Types.ObjectId(cityId);
    if (memIsOverseas !== undefined) query.memIsOverseas = memIsOverseas;

    const [members, total] = await Promise.all([
      Member.find(query)
        .populate('statusId', 'statusName')
        .populate('cityId', 'cityName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      Member.countDocuments(query),
    ]);

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updateMember(
    id: string,
    data: UpdateMemberDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const updateData: any = { ...data };

    // Convert string IDs to ObjectId if provided
    if (data.statusId) updateData.statusId = new Types.ObjectId(data.statusId);
    if (data.cityId) updateData.cityId = new Types.ObjectId(data.cityId);
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);

    updateData.updatedBy = userId;

    const member = await Member.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('statusId', 'statusName')
      .populate('cityId', 'cityName')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return member?.toObject() || null;
  },

  async deleteMember(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await Member.findByIdAndUpdate(
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

  async checkNicExists(nic: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      memNic: nic.toUpperCase(),
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await Member.countDocuments(query);
    return count > 0;
  },

  async checkMobileExists(mobile: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      memContMob: mobile,
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await Member.countDocuments(query);
    return count > 0;
  },

  async getMemberSummary(): Promise<any> {
    const [totalMembers, overseasMembers, activeMembers, byGender] = await Promise.all([
      Member.countDocuments({ isDeleted: false }),
      Member.countDocuments({ isDeleted: false, memIsOverseas: true }),
      Member.countDocuments({ isDeleted: false, statusId: { $exists: true } }),
      Member.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      totalMembers,
      overseasMembers,
      activeMembers,
      genderDistribution: byGender.reduce(
        (acc, item) => {
          acc[item._id || 'not_specified'] = item.count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  },

  async searchMembers(query: string): Promise<any[]> {
    const members = await Member.find({
      $or: [
        { memName: { $regex: query, $options: 'i' } },
        { memNic: { $regex: query, $options: 'i' } },
        { memRegNo: { $regex: query, $options: 'i' } },
        { memContMob: { $regex: query, $options: 'i' } },
      ],
      isDeleted: false,
    })
      .select('memName memNic memRegNo memContMob memImg')
      .limit(20)
      .then(docs => docs.map(doc => doc.toObject()));

    return members;
  },
};
