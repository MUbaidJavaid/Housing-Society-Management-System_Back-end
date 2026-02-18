import { Types } from 'mongoose';
import { CreateMemberDto, MemberQueryParams, UpdateMemberDto } from '../index-member';
import Member from '../models/models-member';

export const memberService = {
  async createMember(data: CreateMemberDto, userId: Types.ObjectId): Promise<any> {
    // Generate registration number if not provided
    if (!data.memRegNo) {
      const year = new Date().getFullYear();

      // Find the highest registration number for the current year to prevent race conditions
      const lastMember = await Member.findOne({
        memRegNo: { $regex: `^MEM${year}` },
      })
        .sort({ memRegNo: -1 })
        .select('memRegNo')
        .lean();

      let nextNumber = 1;
      if (lastMember?.memRegNo) {
        // Extract the numeric part from the registration number
        const match = lastMember.memRegNo.match(/\d+$/);
        if (match) {
          nextNumber = parseInt(match[0], 10) + 1;
        }
      }

      data.memRegNo = `MEM${year}${String(nextNumber).padStart(5, '0')}`;
    }

    // Try to create the member with retry logic for duplicate key errors
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
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
      } catch (error: any) {
        // If it's a duplicate key error on memRegNo, regenerate and retry
        if (error.code === 11000 && error.message?.includes('memRegNo')) {
          attempts++;
          if (attempts < maxAttempts) {
            // Regenerate the registration number
            const year = new Date().getFullYear();
            const lastMember = await Member.findOne({
              memRegNo: { $regex: `^MEM${year}` },
            })
              .sort({ memRegNo: -1 })
              .select('memRegNo')
              .lean();

            let nextNumber = 1;
            if (lastMember?.memRegNo) {
              const match = lastMember.memRegNo.match(/\d+$/);
              if (match) {
                nextNumber = parseInt(match[0], 10) + 1;
              }
            }

            data.memRegNo = `MEM${year}${String(nextNumber).padStart(5, '0')}`;
            continue;
          }
        }

        // If it's not a duplicate memRegNo error, or we've exceeded max attempts, throw the error
        throw error;
      }
    }

    throw new Error('Failed to create member after multiple attempts');
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
      memNIC: nic.toUpperCase(),
      isDeleted: false,
    })
      .populate('statusId', 'statusName')
      .populate('cityId', 'cityName');

    return member?.toObject() || null;
  },

  // async getMembers(params: MemberQueryParams): Promise<any> {
  //   const {
  //     page = 1,
  //     limit = 10,
  //     search = '',
  //     statusId,
  //     cityId,
  //     memIsOverseas,
  //     sortBy = 'createdAt',
  //     sortOrder = 'desc',
  //   } = params;

  //   const skip = (page - 1) * limit;
  //   const sort: Record<string, 1 | -1> = {
  //     [sortBy]: sortOrder === 'asc' ? 1 : -1,
  //   };

  //   const query: any = { isDeleted: false };

  //   if (search) {
  //     query.$or = [
  //       { memName: { $regex: search, $options: 'i' } },
  //       { memNIC: { $regex: search, $options: 'i' } },
  //       { memContMob: { $regex: search, $options: 'i' } },
  //       { memContEmail: { $regex: search, $options: 'i' } },
  //       { memRegNo: { $regex: search, $options: 'i' } },
  //     ];
  //   }

  //   if (statusId) query.statusId = new Types.ObjectId(statusId);
  //   if (cityId) query.cityId = new Types.ObjectId(cityId);
  //   if (memIsOverseas !== undefined) query.memIsOverseas = memIsOverseas;
  //   console.log('=== DEBUG: Query Details ===');
  //   console.log('Query:', JSON.stringify(query, null, 2));
  //   console.log('Collection count:', await Member.countDocuments({}));
  //   console.log('Active members count:', await Member.countDocuments({ isDeleted: false }));
  //   console.log('=== END DEBUG ===');

  //   const [members, total] = await Promise.all([
  //     Member.find(query)
  //       .populate('statusId', 'statusName')
  //       .populate('cityId', 'cityName')
  //       .skip(skip)
  //       .limit(limit)
  //       .sort(sort)
  //       .then(docs => docs.map(doc => doc.toObject())),
  //     Member.countDocuments(query),
  //   ]);
  //   console.log('Returning members:', members.length);
  //   console.log('Total in query:', total);
  //   return {
  //     members,
  //     pagination: {
  //       page,
  //       limit,
  //       total,
  //       pages: Math.ceil(total / limit),
  //     },
  //   };
  // },
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

    console.log('=== DEBUG: Full Document Structure ===');

    // Check one document to see all fields
    const sampleDoc = await Member.findOne({});
    if (sampleDoc) {
      const docObject = sampleDoc.toObject();
      console.log('Sample document fields:', Object.keys(docObject));
      console.log('Sample document values:', docObject);
    }

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { memName: { $regex: search, $options: 'i' } },
        { memNIC: { $regex: search, $options: 'i' } }, // Changed from memNic to memNIC
        { memContMob: { $regex: search, $options: 'i' } },
        { memContEmail: { $regex: search, $options: 'i' } },
        { memRegNo: { $regex: search, $options: 'i' } },
      ];
    }

    if (statusId) query.statusId = new Types.ObjectId(statusId);
    if (cityId) query.cityId = new Types.ObjectId(cityId);

    // memIsOverseas handling change
    if (memIsOverseas !== undefined) {
      // Always add to query
      query.memIsOverseas = memIsOverseas;
      console.log('memIsOverseas filter applied:', memIsOverseas);

      if (memIsOverseas === false) {
        query.$or = [{ memIsOverseas: false }, { memIsOverseas: { $exists: false } }];
      } else {
        query.memIsOverseas = true;
      }
    }

    console.log('=== Query being executed ===');
    console.log('Query:', JSON.stringify(query, null, 2));
    console.log('Sort:', sort);
    console.log('Skip:', skip, 'Limit:', limit);

    const [members, total] = await Promise.all([
      Member.find(query)
        .populate('statusId', 'statusName')
        .populate('cityId', 'cityName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => {
          console.log('Raw documents found:', docs.length);
          docs.forEach((doc, index) => {
            console.log(`Document ${index + 1}:`, doc.toObject());
          });
          return docs.map(doc => doc.toObject());
        }),
      Member.countDocuments(query),
    ]);

    console.log('=== Final Result ===');
    console.log('Members returned:', members.length);
    console.log('Total count:', total);

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

  async unlockMember(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await Member.findByIdAndUpdate(
      id,
      {
        $set: {
          loginAttempts: 0,
          lockUntil: undefined,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    return !!result;
  },

  async checkNicExists(nic: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      memNIC: nic.toUpperCase(),
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
        { memNIC: { $regex: query, $options: 'i' } },
        { memRegNo: { $regex: query, $options: 'i' } },
        { memContMob: { $regex: query, $options: 'i' } },
      ],
      isDeleted: false,
    })
      .select('memName memNIC memRegNo memContMob memImg')
      .limit(20)
      .then(docs => docs.map(doc => doc.toObject()));

    return members;
  },
};
