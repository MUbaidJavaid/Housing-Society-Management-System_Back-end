import { Types } from 'mongoose';
import Member from '../../Member/models/models-member';
import Plot from '../../Plots/models/models-plot';
import Status from '../../Status/models/models-status';
import Application from '../models/models-application';
import SrApplicationType from '../models/models-applicationtype';
import {
  ApplicationQueryParams,
  ApplicationSummary,
  CreateApplicationDto,
  UpdateApplicationDto,
} from '../types-application';

const basePopulate = (query: any) =>
  query
    .populate('applicationTypeID', 'applicationName applicationFee isActive')
    .populate('memId', 'memName memNic memRegNo memContMob memImg')
    .populate('plotId', 'plotNo plotRegistrationNo plotBlockId plotSizeId')
    .populate('statusId', 'statusName')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

export const applicationService = {
  async createApplication(data: CreateApplicationDto, userId: Types.ObjectId): Promise<any> {
    const applicationType = await SrApplicationType.findById(data.applicationTypeID);
    if (
      !applicationType ||
      (applicationType as any).isDeleted ||
      (applicationType as any).isActive === false
    ) {
      throw new Error('Invalid or inactive application type');
    }

    const member = await Member.findById(data.memId);
    if (!member || (member as any).isDeleted) {
      throw new Error('Member not found');
    }

    const status = await Status.findById(data.statusId);
    if (!status || (status as any).isDeleted) {
      throw new Error('Status not found');
    }

    if (data.plotId) {
      const plot = await Plot.findById(data.plotId);
      if (!plot || (plot as any).isDeleted) {
        throw new Error('Plot not found');
      }
    }

    const application = await Application.create({
      applicationTypeID: new Types.ObjectId(data.applicationTypeID),
      memId: new Types.ObjectId(data.memId),
      plotId: data.plotId ? new Types.ObjectId(data.plotId) : undefined,
      applicationDate: new Date(data.applicationDate),
      statusId: new Types.ObjectId(data.statusId),
      remarks: data.remarks?.trim(),
      attachmentPath: data.attachmentPath,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.getApplicationById(application._id.toString());
  },

  async getApplicationById(id: string): Promise<any | null> {
    const application = await basePopulate(Application.findById(id));

    return application?.toObject() || null;
  },

  async getApplications(params: ApplicationQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      applicationNo,
      applicationTypeID,
      memId,
      plotId,
      statusId,
      startDate,
      endDate,
      sortBy = 'applicationDate',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { applicationNo: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } },
      ];
    }

    if (applicationNo) {
      query.applicationNo = { $regex: applicationNo, $options: 'i' };
    }

    if (applicationTypeID) {
      query.applicationTypeID = new Types.ObjectId(applicationTypeID);
    }

    if (memId) {
      query.memId = new Types.ObjectId(memId);
    }

    if (plotId) {
      query.plotId = new Types.ObjectId(plotId);
    }

    if (statusId) {
      query.statusId = new Types.ObjectId(statusId);
    }

    if (startDate || endDate) {
      query.applicationDate = {};
      if (startDate) query.applicationDate.$gte = new Date(startDate);
      if (endDate) query.applicationDate.$lte = new Date(endDate);
    }

    const [applications, total] = await Promise.all([
      basePopulate(Application.find(query).skip(skip).limit(limit).sort(sort)).then((docs: any[]) =>
        docs.map((doc: any) => doc.toObject())
      ),
      Application.countDocuments(query),
    ]);
    // console.log('applications', applications);
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
      const applicationType = await SrApplicationType.findById(data.applicationTypeID);
      if (
        !applicationType ||
        (applicationType as any).isDeleted ||
        (applicationType as any).isActive === false
      ) {
        throw new Error('Invalid or inactive application type');
      }
      updateData.applicationTypeID = new Types.ObjectId(data.applicationTypeID);
    }

    if (data.memId) {
      const member = await Member.findById(data.memId);
      if (!member || (member as any).isDeleted) {
        throw new Error('Member not found');
      }
      updateData.memId = new Types.ObjectId(data.memId);
    }

    if (data.plotId) {
      const plot = await Plot.findById(data.plotId);
      if (!plot || (plot as any).isDeleted) {
        throw new Error('Plot not found');
      }
      updateData.plotId = new Types.ObjectId(data.plotId);
    }

    if (data.statusId) {
      const status = await Status.findById(data.statusId);
      if (!status || (status as any).isDeleted) {
        throw new Error('Status not found');
      }
      updateData.statusId = new Types.ObjectId(data.statusId);
    }

    if (data.applicationDate) {
      updateData.applicationDate = new Date(data.applicationDate);
    }

    if (data.remarks) {
      updateData.remarks = data.remarks.trim();
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
        applicationDate: { $gte: thirtyDaysAgo },
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
            typeName: { $first: '$applicationType.applicationName' },
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
    const applications = await basePopulate(
      Application.find({
        applicationTypeID: new Types.ObjectId(typeId),
        isDeleted: false,
      }).sort('-applicationDate')
    ).then((docs: any[]) => docs.map((doc: any) => doc.toObject()));

    return applications;
  },

  async getRecentApplications(limit: number = 10): Promise<any[]> {
    const applications = await basePopulate(
      Application.find({ isDeleted: false }).sort('-applicationDate').limit(limit)
    ).then((docs: any[]) => docs.map((doc: any) => doc.toObject()));

    return applications;
  },
};
