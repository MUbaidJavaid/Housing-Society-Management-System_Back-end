import { Types } from 'mongoose';
import Facility from '../models/models-facility';
import {
  CreateFacilityDto,
  FacilityPlainType,
  FacilityQueryParams,
  GetFacilitiesResult,
  UpdateFacilityDto,
} from '../types/types-facility';

const toPlainObject = (doc: any): FacilityPlainType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  return plainObj as FacilityPlainType;
};

export const facilityService = {
  /**
   * Create a new facility
   */
  async createFacility(
    data: CreateFacilityDto,
    userId: Types.ObjectId
  ): Promise<FacilityPlainType> {
    const facilityData = {
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    };

    const facility = await Facility.create(facilityData);

    const created = await Facility.findById(facility._id)
      .populate('createdBy', 'userName fullName')
      .populate('modifiedBy', 'userName fullName');

    if (!created) {
      throw new Error('Failed to create facility');
    }

    return toPlainObject(created);
  },

  /**
   * Get facility by ID
   */
  async getFacilityById(id: string): Promise<FacilityPlainType> {
    const facility = await Facility.findById(id)
      .populate('createdBy', 'userName fullName')
      .populate('modifiedBy', 'userName fullName');

    if (!facility || facility.isDeleted) {
      throw new Error('Facility not found');
    }

    return toPlainObject(facility);
  },

  /**
   * Get all facilities with pagination
   */
  async getFacilities(params: FacilityQueryParams): Promise<GetFacilitiesResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      facilityType,
      isActive,
      societyId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$text = { $search: search };
    }

    if (facilityType) {
      query.facilityType = facilityType;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (societyId) {
      query.societyId = new Types.ObjectId(societyId);
    }

    const [facilities, total] = await Promise.all([
      Facility.find(query)
        .populate('createdBy', 'userName fullName')
        .populate('modifiedBy', 'userName fullName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Facility.countDocuments(query),
    ]);

    return {
      facilities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update facility
   */
  async updateFacility(
    id: string,
    data: UpdateFacilityDto,
    userId: Types.ObjectId
  ): Promise<FacilityPlainType | null> {
    const existing = await Facility.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Facility not found');
    }

    const updateObj: any = {
      ...data,
      modifiedBy: userId,
    };

    const facility = await Facility.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'userName fullName')
      .populate('modifiedBy', 'userName fullName');

    return facility ? toPlainObject(facility) : null;
  },

  /**
   * Delete facility (soft delete)
   */
  async deleteFacility(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existing = await Facility.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Facility not found');
    }

    const result = await Facility.findByIdAndUpdate(
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
   * Toggle facility active status
   */
  async toggleFacilityStatus(
    id: string,
    userId: Types.ObjectId
  ): Promise<FacilityPlainType | null> {
    const existing = await Facility.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Facility not found');
    }

    const facility = await Facility.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !existing.isActive,
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('createdBy', 'userName fullName')
      .populate('modifiedBy', 'userName fullName');

    return facility ? toPlainObject(facility) : null;
  },
};
