import { Types } from 'mongoose';
import DomesticStaff from '../models/models-domestic-staff';
import {
  CreateDomesticStaffDto,
  UpdateDomesticStaffDto,
  StaffQueryParams,
  AddEmploymentDto,
} from '../types/types-staff-registry';

export const staffRegistryService = {
  async registerStaff(data: CreateDomesticStaffDto, userId: Types.ObjectId) {
    const existing = await DomesticStaff.findOne({ cnic: data.cnic, isDeleted: false });
    if (existing) {
      throw new Error('A staff member with this CNIC already exists');
    }

    const staffData = {
      ...data,
      createdBy: userId,
    };

    const staff = await DomesticStaff.create(staffData);

    const created = await DomesticStaff.findById(staff._id)
      .populate('createdBy', 'firstName lastName email');

    if (!created) {
      throw new Error('Failed to register staff member');
    }

    return created.toObject();
  },

  async getStaffMembers(params: StaffQueryParams) {
    const {
      page = 1,
      limit = 20,
      search = '',
      staffType,
      isVerified,
      minRating,
      blacklisted,
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
        { $text: { $search: search } },
        { cnic: { $regex: search, $options: 'i' } },
      ];
    }

    if (staffType) {
      query.staffType = staffType;
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    if (minRating !== undefined) {
      query.averageRating = { $gte: Number(minRating) };
    }

    if (blacklisted !== undefined) {
      query.blacklisted = blacklisted === 'true';
    }

    const [staffMembers, total] = await Promise.all([
      DomesticStaff.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('verifiedBy', 'firstName lastName')
        .populate('blacklistedBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      DomesticStaff.countDocuments(query),
    ]);

    return {
      staffMembers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getStaffById(id: string) {
    const staff = await DomesticStaff.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName')
      .populate('blacklistedBy', 'firstName lastName')
      .populate('employmentHistory.societyId', 'name')
      .populate('employmentHistory.memberId', 'firstName lastName');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff.toObject();
  },

  async updateStaff(id: string, data: UpdateDomesticStaffDto, _userId: Types.ObjectId) {
    const staff = await DomesticStaff.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...data },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff.toObject();
  },

  async deleteStaff(id: string, _userId: Types.ObjectId) {
    const staff = await DomesticStaff.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff.toObject();
  },

  async verifyStaff(id: string, method: string, userId: Types.ObjectId) {
    const staff = await DomesticStaff.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        isVerified: true,
        verificationDate: new Date(),
        verifiedBy: userId,
        verificationMethod: method,
      },
      { new: true }
    )
      .populate('verifiedBy', 'firstName lastName');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff.toObject();
  },

  async addEmployment(staffId: string, data: AddEmploymentDto) {
    const staff = await DomesticStaff.findOne({ _id: staffId, isDeleted: false });

    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Check if already employed at this society
    const existingEmployment = staff.employmentHistory.find(
      (e) => e.societyId.toString() === data.societyId && e.isCurrentlyEmployed
    );

    if (existingEmployment) {
      throw new Error('Staff member is already employed at this society');
    }

    staff.employmentHistory.push({
      societyId: new Types.ObjectId(data.societyId),
      memberId: new Types.ObjectId(data.memberId),
      startDate: new Date(),
      role: data.role,
      isCurrentlyEmployed: true,
    });

    await staff.save();

    const updated = await DomesticStaff.findById(staffId)
      .populate('employmentHistory.societyId', 'name')
      .populate('employmentHistory.memberId', 'firstName lastName');

    return updated!.toObject();
  },

  async endEmployment(staffId: string, societyId: string, rating?: number, review?: string) {
    const staff = await DomesticStaff.findOne({ _id: staffId, isDeleted: false });

    if (!staff) {
      throw new Error('Staff member not found');
    }

    const employment = staff.employmentHistory.find(
      (e) => e.societyId.toString() === societyId && e.isCurrentlyEmployed
    );

    if (!employment) {
      throw new Error('No active employment found at this society');
    }

    employment.isCurrentlyEmployed = false;
    employment.endDate = new Date();

    if (rating !== undefined) {
      employment.rating = rating;
      employment.review = review || '';

      // Recalculate average rating
      const ratedEmployments = staff.employmentHistory.filter((e) => e.rating !== undefined);
      const totalRating = ratedEmployments.reduce((sum, e) => sum + (e.rating || 0), 0);
      staff.totalRatings = ratedEmployments.length;
      staff.averageRating = staff.totalRatings > 0
        ? Math.round((totalRating / staff.totalRatings) * 10) / 10
        : 0;
    }

    await staff.save();

    const updated = await DomesticStaff.findById(staffId)
      .populate('employmentHistory.societyId', 'name')
      .populate('employmentHistory.memberId', 'firstName lastName');

    return updated!.toObject();
  },

  async rateStaff(staffId: string, societyId: string, memberId: string, rating: number, review?: string) {
    const staff = await DomesticStaff.findOne({ _id: staffId, isDeleted: false });

    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Find the employment record for this society and member
    const employment = staff.employmentHistory.find(
      (e) =>
        e.societyId.toString() === societyId &&
        e.memberId.toString() === memberId
    );

    if (!employment) {
      throw new Error('No employment record found for this society and member');
    }

    employment.rating = rating;
    employment.review = review || '';

    // Recalculate average rating
    const ratedEmployments = staff.employmentHistory.filter((e) => e.rating !== undefined);
    const totalRating = ratedEmployments.reduce((sum, e) => sum + (e.rating || 0), 0);
    staff.totalRatings = ratedEmployments.length;
    staff.averageRating = staff.totalRatings > 0
      ? Math.round((totalRating / staff.totalRatings) * 10) / 10
      : 0;

    await staff.save();

    return staff.toObject();
  },

  async blacklistStaff(staffId: string, reason: string, userId: Types.ObjectId) {
    const staff = await DomesticStaff.findOneAndUpdate(
      { _id: staffId, isDeleted: false },
      {
        blacklisted: true,
        blacklistReason: reason,
        blacklistedBy: userId,
        blacklistedAt: new Date(),
      },
      { new: true }
    )
      .populate('blacklistedBy', 'firstName lastName');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff.toObject();
  },

  async searchByCNIC(cnic: string) {
    const staff = await DomesticStaff.findOne({ cnic, isDeleted: false })
      .populate('createdBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName')
      .populate('employmentHistory.societyId', 'name')
      .populate('employmentHistory.memberId', 'firstName lastName');

    return staff ? staff.toObject() : null;
  },

  async getStaffBySociety(societyId: string) {
    const staffMembers = await DomesticStaff.find({
      isDeleted: false,
      'employmentHistory': {
        $elemMatch: {
          societyId: new Types.ObjectId(societyId),
          isCurrentlyEmployed: true,
        },
      },
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName')
      .populate('employmentHistory.societyId', 'name')
      .populate('employmentHistory.memberId', 'firstName lastName')
      .lean();

    return staffMembers;
  },

  async getStaffHistory(staffId: string) {
    const staff = await DomesticStaff.findOne({ _id: staffId, isDeleted: false })
      .select('fullName cnic staffType employmentHistory averageRating totalRatings')
      .populate('employmentHistory.societyId', 'name')
      .populate('employmentHistory.memberId', 'firstName lastName');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff.toObject();
  },
};
