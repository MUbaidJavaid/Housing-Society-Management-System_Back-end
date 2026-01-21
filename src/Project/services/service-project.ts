import { Types } from 'mongoose';
import Project from '../models/models-project';
import { CreateProjectDto, ProjectQueryParams, UpdateProjectDto } from '../index-project';

export const projectService = {
  async createProject(data: CreateProjectDto, userId: Types.ObjectId): Promise<any> {
    const project = await Project.create({
      ...data,
      projStartDate: data.projStartDate ? new Date(data.projStartDate) : undefined,
      projEndDate: data.projEndDate ? new Date(data.projEndDate) : undefined,
      createdBy: userId,
      updatedBy: userId,
    });

    return project;
  },

  async getProjectById(id: string): Promise<any | null> {
    const project = await Project.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return project?.toObject() || null;
  },

  async getProjects(params: ProjectQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
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
        { projName: { $regex: search, $options: 'i' } },
        { projSiteName: { $regex: search, $options: 'i' } },
        { projLocation: { $regex: search, $options: 'i' } },
        { projRemarks: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter based on dates
    if (status) {
      const now = new Date();
      if (status === 'active') {
        query.projStartDate = { $lte: now };
        query.$or = [{ projEndDate: { $exists: false } }, { projEndDate: { $gte: now } }];
      } else if (status === 'completed') {
        query.projEndDate = { $lt: now };
      } else if (status === 'upcoming') {
        query.$or = [{ projStartDate: { $gt: now } }, { projStartDate: { $exists: false } }];
      }
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => doc.toObject())),
      Project.countDocuments(query),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updateProject(
    id: string,
    data: UpdateProjectDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const updateData: any = { ...data };

    if (data.projStartDate) updateData.projStartDate = new Date(data.projStartDate);
    if (data.projEndDate) updateData.projEndDate = new Date(data.projEndDate);

    updateData.updatedBy = userId;

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return project?.toObject() || null;
  },

  async deleteProject(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await Project.findByIdAndUpdate(
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

  async checkProjectNameExists(projName: string, excludeId?: string): Promise<boolean> {
    const query: any = {
      projName: { $regex: new RegExp(`^${projName}$`, 'i') },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await Project.countDocuments(query);
    return count > 0;
  },

  async getProjectSummary(): Promise<any> {
    const now = new Date();

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      upcomingProjects,
      projectsWithoutDates,
    ] = await Promise.all([
      Project.countDocuments({ isDeleted: false }),
      Project.countDocuments({
        isDeleted: false,
        projStartDate: { $lte: now },
        $or: [{ projEndDate: { $exists: false } }, { projEndDate: { $gte: now } }],
      }),
      Project.countDocuments({
        isDeleted: false,
        projEndDate: { $lt: now },
      }),
      Project.countDocuments({
        isDeleted: false,
        $or: [{ projStartDate: { $gt: now } }, { projStartDate: { $exists: false } }],
      }),
      Project.countDocuments({
        isDeleted: false,
        projStartDate: { $exists: false },
      }),
    ]);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      upcomingProjects,
      projectsWithoutDates,
    };
  },

  async getProjectsForDropdown(): Promise<any[]> {
    const projects = await Project.find({ isDeleted: false })
      .select('projName projLocation projStartDate projEndDate')
      .sort('projName')
      .then(docs =>
        docs.map(doc => {
          const project = doc.toObject();
          return {
            id: project._id,
            name: project.projName,
            location: project.projLocation,
            startDate: project.projStartDate,
            endDate: project.projEndDate,
            status: (project as any).status,
          };
        })
      );

    return projects;
  },

  async getProjectStats(projectId: string): Promise<any> {
    // You can add stats related to plots in this project
    // For now, return basic project info
    const project = await Project.findById(projectId)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!project || (project as any).isDeleted) return null;

    return project.toObject();
  },
};
