import { Types } from 'mongoose';
import Application from '../models/models-application';
import SrApplicationType from '../models/models-applicationtype';
import {
  ApplicationQueryParams,
  ApplicationSummary,
  CreateApplicationDto,
  UpdateApplicationDto,
} from '../types-application';

export const applicationService = {
  async createApplication(data: CreateApplicationDto, userId: Types.ObjectId): Promise<any> {
    // Validate that application type exists and is active
    const applicationType = await SrApplicationType.findById(data.applicationTypeID);
    if (
      !applicationType ||
      (applicationType as any).isDeleted ||
      !(applicationType as any).isActive
    ) {
      throw new Error('Invalid or inactive application type');
    }

    const application = await Application.create({
      applicationDesc: data.applicationDesc,
      applicationTypeID: new Types.ObjectId(data.applicationTypeID),
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.getApplicationById(application._id.toString());
  },

  async getApplicationById(id: string): Promise<any | null> {
    const application = await Application.findById(id)
      .populate('applicationTypeID', 'typeName typeCode description isActive')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return application?.toObject() || null;
  },

  async getApplications(params: ApplicationQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      applicationTypeID,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [{ applicationDesc: { $regex: search, $options: 'i' } }];
    }

    if (applicationTypeID) {
      query.applicationTypeID = new Types.ObjectId(applicationTypeID);
    }

    // Date range filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('applicationTypeID', 'typeName typeCode')
        .populate('createdBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      Application.countDocuments(query),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updateApplication(
    id: string,
    data: UpdateApplicationDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const updateData: any = { ...data };

    if (data.applicationTypeID) {
      // Validate new application type
      const applicationType = await SrApplicationType.findById(data.applicationTypeID);
      if (
        !applicationType ||
        (applicationType as any).isDeleted ||
        !(applicationType as any).isActive
      ) {
        throw new Error('Invalid or inactive application type');
      }
      updateData.applicationTypeID = new Types.ObjectId(data.applicationTypeID);
    }

    updateData.updatedBy = userId;

    const application = await Application.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!application) return null;

    return await this.getApplicationById(application._id.toString());
  },

  async deleteApplication(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await Application.findByIdAndUpdate(
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

  async getApplicationSummary(): Promise<ApplicationSummary> {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [totalApplications, recentApplications, applicationsByType] = await Promise.all([
      Application.countDocuments({ isDeleted: false }),
      Application.countDocuments({
        isDeleted: false,
        createdAt: { $gte: thirtyDaysAgo },
      }),
      Application.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $lookup: {
            from: 'applicationtypes',
            localField: 'applicationTypeID',
            foreignField: '_id',
            as: 'applicationType',
          },
        },
        {
          $unwind: '$applicationType',
        },
        {
          $group: {
            _id: '$applicationTypeID',
            typeName: { $first: '$applicationType.typeName' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            typeName: 1,
            count: 1,
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
    ]);

    return {
      totalApplications,
      activeApplications: totalApplications,
      recentApplications,
      applicationsByType,
    };
  },

  async getApplicationsByType(typeId: string): Promise<any[]> {
    const applications = await Application.find({
      applicationTypeID: new Types.ObjectId(typeId),
      isDeleted: false,
    })
      .populate('applicationTypeID', 'typeName typeCode')
      .populate('createdBy', 'firstName lastName')
      .sort('-createdAt')
      .then(docs => docs.map(doc => doc.toObject()));

    return applications;
  },

  async getRecentApplications(limit: number = 10): Promise<any[]> {
    const applications = await Application.find({ isDeleted: false })
      .populate('applicationTypeID', 'typeName typeCode')
      .populate('createdBy', 'firstName lastName')
      .sort('-createdAt')
      .limit(limit)
      .then(docs => docs.map(doc => doc.toObject()));

    return applications;
  },

  async checkApplicationExists(applicationDesc: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      applicationDesc: { $regex: new RegExp(`^${applicationDesc}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await Application.countDocuments(query);
    return count > 0;
  },
};
