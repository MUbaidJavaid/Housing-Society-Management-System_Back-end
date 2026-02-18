import { Types } from 'mongoose';
import City from '../../CityState/models/models-city';
import Plot from '../../Plots/models/models-plot';
import SalesStatus from '../../Sales/models/models-salesstatus';
import { SalesStatusType } from '../../Sales/models/models-salesstatus';
import Project, { IProject, ProjectStatus, ProjectType } from '../models/models-project';
import {
  getProjectPlotCounts,
  getProjectPlotCountsBatch,
} from '../helpers/getProjectPlotCounts';
import {
  CreateProjectDto,
  ProjectQueryParams,
  ProjectStats,
  UpdateProjectDto,
} from '../types/types-project';

export const projectService = {
  /**
   * Create new project
   */
  async createProject(data: CreateProjectDto, userId: Types.ObjectId): Promise<any> {
    // Generate project code if not provided
    let projCode = data.projCode;

    if (!projCode) {
      projCode = await Project.generateProjectCode(data.projName);
    }

    // Check if project code already exists
    const existingCode = await Project.findOne({
      projCode,
      isDeleted: false,
    });

    if (existingCode) {
      throw new Error(`Project with code ${projCode} already exists`);
    }

    // Check if project name already exists
    const existingName = await Project.findOne({
      projName: { $regex: new RegExp(`^${data.projName}$`, 'i') },
      isDeleted: false,
    });

    if (existingName) {
      throw new Error(`Project with name ${data.projName} already exists`);
    }

    // Validate cityId exists
    if (!data.cityId) {
      throw new Error('City ID is required');
    }

    const cityExists = await City.findById(data.cityId);
    if (!cityExists) {
      throw new Error('City not found');
    }

    const { totalPlots: _t, plotsAvailable: _a, plotsSold: _s, plotsReserved: _r, ...rest } =
      data as CreateProjectDto & {
        totalPlots?: number;
        plotsAvailable?: number;
        plotsSold?: number;
        plotsReserved?: number;
      };
    const projectData = {
      ...rest,
      projCode,
      cityId: new Types.ObjectId(data.cityId),
      projStatus: data.projStatus || ProjectStatus.PLANNING,
      projType: data.projType || ProjectType.RESIDENTIAL,
      isActive: data.isActive !== undefined ? data.isActive : true,
      country: data.country || 'Pakistan',
      createdBy: userId,
      updatedBy: userId,
    };
    const project = await Project.create(projectData);
    return project;
  },

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<any | null> {
    const project = await Project.findById(id)
      .populate('cityId', 'cityName stateId')
      .populate({
        path: 'cityId',
        populate: {
          path: 'stateId',
          select: 'stateName',
        },
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!project) return null;

    const projectObj = project.toObject() as any;
    if (projectObj.cityId) {
      projectObj.cityName = (projectObj.cityId as any).cityName;
      if ((projectObj.cityId as any).stateId) {
        projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
      }
    }

    const counts = await getProjectPlotCounts(project._id);
    Object.assign(projectObj, counts);
    projectObj.progressPercentage =
      counts.totalPlots > 0
        ? Math.round(((counts.plotsSold + counts.plotsReserved) / counts.totalPlots) * 100)
        : 0;

    return projectObj;
  },

  /**
   * Get project by code
   */
  async getProjectByCode(projCode: string): Promise<any | null> {
    const project = await Project.findOne({
      projCode: projCode.toUpperCase(),
      isDeleted: false,
    })
      .populate('cityId', 'cityName stateId')
      .populate({
        path: 'cityId',
        populate: {
          path: 'stateId',
          select: 'stateName',
        },
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!project) return null;

    const projectObj = project.toObject() as any;
    if (projectObj.cityId) {
      projectObj.cityName = (projectObj.cityId as any).cityName;
      if ((projectObj.cityId as any).stateId) {
        projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
      }
    }

    const counts = await getProjectPlotCounts(project._id);
    Object.assign(projectObj, counts);
    projectObj.progressPercentage =
      counts.totalPlots > 0
        ? Math.round(((counts.plotsSold + counts.plotsReserved) / counts.totalPlots) * 100)
        : 0;

    return projectObj;
  },

  /**
   * Get all projects with pagination and filtering
   */
  async getProjects(params: ProjectQueryParams): Promise<any> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      type,
      isActive,
      cityId,
      country,
      minArea,
      maxArea,
      launchedAfter,
      launchedBefore,
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search by multiple fields
    if (search) {
      query.$or = [
        { projName: { $regex: search, $options: 'i' } },
        { projCode: { $regex: search, $options: 'i' } },
        { projLocation: { $regex: search, $options: 'i' } },
        { projDescription: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status && status.length > 0) {
      query.projStatus = { $in: status };
    }

    // Type filter
    if (type && type.length > 0) {
      query.projType = { $in: type };
    }

    // City filter
    if (cityId) {
      query.cityId = new Types.ObjectId(cityId);
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Country filter
    if (country) {
      query.country = { $regex: country, $options: 'i' };
    }

    // Note: minPlots/maxPlots filter removed - totalPlots now calculated from Plot count

    // Area range filter
    if (minArea !== undefined || maxArea !== undefined) {
      query.totalArea = {};
      if (minArea !== undefined) query.totalArea.$gte = minArea;
      if (maxArea !== undefined) query.totalArea.$lte = maxArea;
    }

    // Launch date range filter
    if (launchedAfter || launchedBefore) {
      query.launchDate = {};
      if (launchedAfter) query.launchDate.$gte = new Date(launchedAfter);
      if (launchedBefore) query.launchDate.$lte = new Date(launchedBefore);
    }

    // Execute queries
    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('cityId', 'cityName stateId')
        .populate({
          path: 'cityId',
          populate: {
            path: 'stateId',
            select: 'stateName',
          },
        })
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Project.countDocuments(query),
    ]);

    // Batch fetch plot counts for all projects
    const countsMap = await getProjectPlotCountsBatch(projects.map(p => p._id));

    const projectsWithCityInfo = projects.map(project => {
      const projectObj = project.toObject({ virtuals: true }) as unknown as IProject & {
        progressPercentage?: number;
        cityName?: string;
        stateName?: string;
        totalPlots?: number;
        plotsAvailable?: number;
        plotsSold?: number;
        plotsReserved?: number;
      };

      if (projectObj.cityId && typeof projectObj.cityId === 'object') {
        projectObj.cityName = (projectObj.cityId as any).cityName;
        if ((projectObj.cityId as any).stateId) {
          projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
        }
      }

      const counts = countsMap.get(project._id.toString()) || {
        totalPlots: 0,
        plotsAvailable: 0,
        plotsSold: 0,
        plotsReserved: 0,
      };
      Object.assign(projectObj, counts);
      projectObj.progressPercentage =
        counts.totalPlots > 0
          ? Math.round(((counts.plotsSold + counts.plotsReserved) / counts.totalPlots) * 100)
          : 0;

      return projectObj;
    });

    const summary = {
      totalProjects: projectsWithCityInfo.length,
      totalPlots: projectsWithCityInfo.reduce((sum, proj) => sum + (proj.totalPlots ?? 0), 0),
      totalArea: projectsWithCityInfo.reduce((sum, proj) => sum + proj.totalArea, 0),
      averageProgress:
        projectsWithCityInfo.length > 0
          ? Math.round(
              projectsWithCityInfo.reduce((sum, proj) => sum + (proj.progressPercentage || 0), 0) /
                projectsWithCityInfo.length
            )
          : 0,
      byStatus: {} as Record<ProjectStatus, number>,
      byType: {} as Record<ProjectType, number>,
    };

    // Initialize status and type counters
    Object.values(ProjectStatus).forEach(status => {
      summary.byStatus[status] = 0;
    });

    Object.values(ProjectType).forEach(type => {
      summary.byType[type] = 0;
    });

    projectsWithCityInfo.forEach(proj => {
      summary.byStatus[proj.projStatus] = (summary.byStatus[proj.projStatus] || 0) + 1;

      if (proj.projType) {
        summary.byType[proj.projType] = (summary.byType[proj.projType] || 0) + 1;
      }
    });

    return {
      projects: projectsWithCityInfo,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update project
   */
  async updateProject(
    id: string,
    data: UpdateProjectDto,
    userId: Types.ObjectId
  ): Promise<any | null> {
    // Validate project exists and not deleted
    const existingProject = await Project.findById(id);
    if (!existingProject || existingProject.isDeleted) {
      throw new Error('Project not found');
    }

    // Check if projCode is being updated and if it already exists
    if (data.projCode) {
      const existingCode = await Project.findOne({
        projCode: data.projCode.toUpperCase(),
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingCode) {
        throw new Error(`Project with code ${data.projCode} already exists`);
      }
    }

    // Check if projName is being updated and if it already exists
    if (data.projName) {
      const existingName = await Project.findOne({
        projName: { $regex: new RegExp(`^${data.projName}$`, 'i') },
        _id: { $ne: id },
        isDeleted: false,
      });

      if (existingName) {
        throw new Error(`Project with name ${data.projName} already exists`);
      }
    }

    // Validate cityId if being updated
    if (data.cityId) {
      if (!Types.ObjectId.isValid(data.cityId)) {
        throw new Error('Invalid city ID');
      }

      // Check if city exists
      const cityExists = await City.findById(data.cityId);
      if (!cityExists) {
        throw new Error('City not found');
      }
    }

    // Validate dates if being updated
    if (data.launchDate) {
      const launchDate = new Date(data.launchDate);
      if (launchDate > new Date()) {
        throw new Error('Launch Date cannot be in the future');
      }
    }

    if (data.completionDate) {
      const completionDate = new Date(data.completionDate);
      const launchDate = data.launchDate
        ? new Date(data.launchDate)
        : new Date(existingProject.launchDate);

      if (completionDate < launchDate) {
        throw new Error('Completion Date must be after Launch Date');
      }
    }

    // Exclude plot count fields (now calculated from Plot)
    const {
      totalPlots: _t,
      plotsAvailable: _a,
      plotsSold: _s,
      plotsReserved: _r,
      ...updateFields
    } = data as UpdateProjectDto & {
      totalPlots?: number;
      plotsAvailable?: number;
      plotsSold?: number;
      plotsReserved?: number;
    };

    const updateData: any = {
      ...updateFields,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // Convert cityId to ObjectId if provided
    if (data.cityId) {
      updateData.cityId = new Types.ObjectId(data.cityId);
    }

    // Handle uppercase for codes if provided
    if (data.projCode) {
      updateData.projCode = data.projCode.toUpperCase();
    }

    if (data.projPrefix) {
      updateData.projPrefix = data.projPrefix.toUpperCase();
    }

    // Update project
    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        context: 'query',
      }
    )
      .populate('cityId', 'cityName stateId')
      .populate({
        path: 'cityId',
        populate: {
          path: 'stateId',
          select: 'stateName',
        },
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!project) {
      throw new Error('Failed to update project');
    }
    const projectObj = project.toObject() as any;
    if (projectObj.cityId) {
      projectObj.cityName = (projectObj.cityId as any).cityName;
      if ((projectObj.cityId as any).stateId) {
        projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
      }
    }

    const counts = await getProjectPlotCounts(project._id);
    Object.assign(projectObj, counts);
    projectObj.progressPercentage =
      counts.totalPlots > 0
        ? Math.round(((counts.plotsSold + counts.plotsReserved) / counts.totalPlots) * 100)
        : 0;

    return projectObj;
  },

  /**
   * Delete project (soft delete)
   */
  async deleteProject(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await Project.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          updatedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Check if project exists
   */
  async checkProjectExists(
    projName: string,
    projCode: string,
    excludeId?: string
  ): Promise<{ nameExists: boolean; codeExists: boolean }> {
    const query: any = {
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const [nameCount, codeCount] = await Promise.all([
      Project.countDocuments({
        ...query,
        projName: { $regex: new RegExp(`^${projName}$`, 'i') },
      }),
      Project.countDocuments({
        ...query,
        projCode: projCode.toUpperCase(),
      }),
    ]);

    return {
      nameExists: nameCount > 0,
      codeExists: codeCount > 0,
    };
  },

  /**
   * Get active projects
   */
  async getActiveProjects(): Promise<any[]> {
    const projects = await Project.find({
      isActive: true,
      isDeleted: false,
    })
      .populate('cityId', 'cityName stateId')
      .populate({
        path: 'cityId',
        populate: {
          path: 'stateId',
          select: 'stateName',
        },
      })
      .populate('createdBy', 'firstName lastName email')
      .sort({ projName: 1 });

    const countsMap = await getProjectPlotCountsBatch(projects.map(p => p._id));
    return projects.map(project => {
      const projectObj = project.toObject() as any;
      if (projectObj.cityId) {
        projectObj.cityName = (projectObj.cityId as any).cityName;
        if ((projectObj.cityId as any).stateId) {
          projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
        }
      }
      const counts = countsMap.get(project._id.toString()) || {
        totalPlots: 0,
        plotsAvailable: 0,
        plotsSold: 0,
        plotsReserved: 0,
      };
      Object.assign(projectObj, counts);
      projectObj.progressPercentage =
        counts.totalPlots > 0
          ? Math.round(((counts.plotsSold + counts.plotsReserved) / counts.totalPlots) * 100)
          : 0;
      return projectObj;
    });
  },

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: ProjectStatus): Promise<any[]> {
    const projects = await Project.find({
      projStatus: status,
      isDeleted: false,
      isActive: true,
    })
      .populate('cityId', 'cityName stateId')
      .populate({
        path: 'cityId',
        populate: {
          path: 'stateId',
          select: 'stateName',
        },
      })
      .populate('createdBy', 'firstName lastName email')
      .sort({ projName: 1 });

    const countsMap = await getProjectPlotCountsBatch(projects.map(p => p._id));
    return projects.map(project => {
      const projectObj = project.toObject() as any;
      if (projectObj.cityId) {
        projectObj.cityName = (projectObj.cityId as any).cityName;
        if ((projectObj.cityId as any).stateId) {
          projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
        }
      }
      const counts = countsMap.get(project._id.toString()) || {
        totalPlots: 0,
        plotsAvailable: 0,
        plotsSold: 0,
        plotsReserved: 0,
      };
      Object.assign(projectObj, counts);
      projectObj.progressPercentage =
        counts.totalPlots > 0
          ? Math.round(((counts.plotsSold + counts.plotsReserved) / counts.totalPlots) * 100)
          : 0;
      return projectObj;
    });
  },

  /**
   * Get projects by city ID
   */
  async getProjectsByCityId(cityId: string): Promise<any[]> {
    try {
      if (!Types.ObjectId.isValid(cityId)) {
        throw new Error('Invalid city ID');
      }

      // Check if city exists
      const city = await City.findById(cityId);
      if (!city) {
        throw new Error('City not found');
      }

      // Get projects by cityId
      const projects = await Project.find({
        cityId: new Types.ObjectId(cityId),
        isDeleted: false,
        isActive: true,
      })
        .populate('cityId', 'cityName stateId')
        .populate({
          path: 'cityId',
          populate: {
            path: 'stateId',
            select: 'stateName',
          },
        })
        .populate('createdBy', 'firstName lastName email')
        .sort({ projName: 1 });

      const countsMap = await getProjectPlotCountsBatch(projects.map(p => p._id));
      return projects.map(project => {
        const projectObj = project.toObject() as any;
        if (projectObj.cityId) {
          projectObj.cityName = (projectObj.cityId as any).cityName;
          if ((projectObj.cityId as any).stateId) {
            projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
          }
        }
        const counts = countsMap.get(project._id.toString()) || {
          totalPlots: 0,
          plotsAvailable: 0,
          plotsSold: 0,
          plotsReserved: 0,
        };
        Object.assign(projectObj, counts);
        projectObj.progressPercentage =
          counts.totalPlots > 0
            ? Math.round(((counts.plotsSold + counts.plotsReserved) / counts.totalPlots) * 100)
            : 0;
        return projectObj;
      });
    } catch (error) {
      console.error('Error fetching projects by city ID:', error);
      throw error;
    }
  },

  /**
   * Get projects by city name
   */
  async getProjectsByCityName(cityName: string): Promise<any[]> {
    try {
      // First find the city by name
      const city = await City.findOne({
        cityName: { $regex: new RegExp(`^${cityName}$`, 'i') },
        isActive: true,
      });

      if (!city) {
        return []; // Return empty array if city not found
      }

      // Get projects by cityId
      const projects = await Project.find({
        cityId: city._id,
        isDeleted: false,
        isActive: true,
      })
        .populate('cityId', 'cityName stateId')
        .populate({
          path: 'cityId',
          populate: {
            path: 'stateId',
            select: 'stateName',
          },
        })
        .populate('createdBy', 'firstName lastName email')
        .sort({ projName: 1 });

      const countsMap = await getProjectPlotCountsBatch(projects.map(p => p._id));
      return projects.map(project => {
        const projectObj = project.toObject() as any;
        if (projectObj.cityId) {
          projectObj.cityName = (projectObj.cityId as any).cityName;
          if ((projectObj.cityId as any).stateId) {
            projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
          }
        }
        const counts = countsMap.get(project._id.toString()) || {
          totalPlots: 0,
          plotsAvailable: 0,
          plotsSold: 0,
          plotsReserved: 0,
        };
        Object.assign(projectObj, counts);
        projectObj.progressPercentage =
          counts.totalPlots > 0
            ? Math.round(((counts.plotsSold + counts.plotsReserved) / counts.totalPlots) * 100)
            : 0;
        return projectObj;
      });
    } catch (error) {
      console.error('Error fetching projects by city name:', error);
      throw error;
    }
  },

  /**
   * Update project status
   */
  async updateProjectStatus(
    id: string,
    status: ProjectStatus,
    userId: Types.ObjectId
  ): Promise<any | null> {
    const updateData: any = {
      projStatus: status,
      updatedBy: userId,
    };

    // Set completion date if status is COMPLETED
    if (status === ProjectStatus.COMPLETED) {
      updateData.completionDate = new Date();
    }

    const project = await Project.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('cityId', 'cityName stateId')
      .populate({
        path: 'cityId',
        populate: {
          path: 'stateId',
          select: 'stateName',
        },
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!project) return null;

    const projectObj = project.toObject() as any;
    if (projectObj.cityId) {
      projectObj.cityName = (projectObj.cityId as any).cityName;
      if ((projectObj.cityId as any).stateId) {
        projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
      }
    }
    const counts = await getProjectPlotCounts(project._id);
    Object.assign(projectObj, counts);
    projectObj.progressPercentage =
      counts.totalPlots > 0
        ? Math.round(((counts.plotsSold + counts.plotsReserved) / counts.totalPlots) * 100)
        : 0;
    return projectObj;
  },

  /**
   * Toggle project active status
   */
  async toggleProjectStatus(id: string, userId: Types.ObjectId): Promise<any | null> {
    const project = await Project.findById(id);

    if (!project) return null;

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: !project.isActive,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('cityId', 'cityName stateId')
      .populate({
        path: 'cityId',
        populate: {
          path: 'stateId',
          select: 'stateName',
        },
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!updatedProject) return null;

    const projectObj = updatedProject.toObject() as any;
    if (projectObj.cityId) {
      projectObj.cityName = (projectObj.cityId as any).cityName;
      if ((projectObj.cityId as any).stateId) {
        projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
      }
    }
    const counts = await getProjectPlotCounts(updatedProject._id);
    Object.assign(projectObj, counts);
    projectObj.progressPercentage =
      counts.totalPlots > 0
        ? Math.round(((counts.plotsSold + counts.plotsReserved) / counts.totalPlots) * 100)
        : 0;
    return projectObj;
  },

  /**
   * Get project statistics
   */
  async getProjectStatistics(): Promise<ProjectStats> {
    const [projectStats, plotStats] = await Promise.all([
      Project.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            totalArea: { $sum: '$totalArea' },
          },
        },
      ]),
      (async () => {
        const reservedIds = await SalesStatus.find(
          { statusType: SalesStatusType.RESERVED, isDeleted: false },
          { _id: 1 }
        ).lean();
        const reservedObjIds = reservedIds.map((s: { _id: Types.ObjectId }) => s._id);
        const r = await Plot.aggregate([
          { $match: { isDeleted: false } },
          {
            $group: {
              _id: null,
              totalPlots: { $sum: 1 },
              plotsSold: {
                $sum: {
                  $cond: [{ $ne: [{ $ifNull: ['$fileId', null] }, null] }, 1, 0],
                },
              },
              plotsReserved: {
                $sum: {
                  $cond: [{ $in: ['$salesStatusId', reservedObjIds] }, 1, 0],
                },
              },
            },
          },
        ]);
        const p = r[0] || {
          totalPlots: 0,
          plotsSold: 0,
          plotsReserved: 0,
        };
        const plotsAvailable = Math.max(
          0,
          p.totalPlots - p.plotsSold - p.plotsReserved
        );
        return {
          totalPlots: p.totalPlots,
          plotsSold: p.plotsSold,
          plotsReserved: p.plotsReserved,
          plotsAvailable,
        };
      })(),
    ]);

    const proj = projectStats[0] || { totalProjects: 0, totalArea: 0 };
    const baseStats = {
      totalProjects: proj.totalProjects,
      totalArea: proj.totalArea,
      ...plotStats,
    };

    const statusStats = await Project.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: '$projStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const typeStats = await Project.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: '$projType',
          count: { $sum: 1 },
        },
      },
    ]);

    const cityStats = await Project.aggregate([
      {
        $match: { isDeleted: false, isActive: true },
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'cityId',
          foreignField: '_id',
          as: 'city',
        },
      },
      {
        $unwind: {
          path: '$city',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$city.cityName',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const recentProjectsDocs = await Project.find({ isDeleted: false, isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('cityId', 'cityName stateId')
      .populate({
        path: 'cityId',
        populate: {
          path: 'stateId',
          select: 'stateName',
        },
      });
    const recentCountsMap = await getProjectPlotCountsBatch(recentProjectsDocs.map(p => p._id));
    const recentProjects = recentProjectsDocs.map(doc => {
      const projectObj = doc.toObject() as any;
      if (projectObj.cityId) {
        projectObj.cityName = (projectObj.cityId as any).cityName;
        if ((projectObj.cityId as any).stateId) {
          projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
        }
      }
      const counts = recentCountsMap.get(doc._id.toString()) || {
        totalPlots: 0,
        plotsAvailable: 0,
        plotsSold: 0,
        plotsReserved: 0,
      };
      Object.assign(projectObj, counts);
      return projectObj;
    });

    // Calculate average progress from Plot counts
    const allProjects = await Project.find({ isDeleted: false });
    const allCountsMap = await getProjectPlotCountsBatch(allProjects.map(p => p._id));
    let progressSum = 0;
    let progressCount = 0;
    for (const proj of allProjects) {
      const c = allCountsMap.get(proj._id.toString());
      if (c && c.totalPlots > 0) {
        progressSum += ((c.plotsSold + c.plotsReserved) / c.totalPlots) * 100;
        progressCount++;
      }
    }
    const averageProgress =
      progressCount > 0 ? Math.round(progressSum / progressCount) : 0;

    const byStatus: Record<ProjectStatus, number> = {} as Record<ProjectStatus, number>;
    statusStats.forEach(stat => {
      const key = stat._id as ProjectStatus;
      if (Object.values(ProjectStatus).includes(key)) {
        byStatus[key] = stat.count;
      }
    });

    const byType: Record<ProjectType, number> = {} as Record<ProjectType, number>;
    typeStats.forEach(stat => {
      const key = stat._id as ProjectType;
      if (Object.values(ProjectType).includes(key)) {
        byType[key] = stat.count;
      }
    });

    const byCity = {} as Record<string, number>;
    cityStats.forEach(stat => {
      byCity[stat._id] = stat.count;
    });

    return {
      ...baseStats,
      averageProgress,
      byStatus,
      byType,
      byCity,
      recentProjects,
    };
  },

  /**
   * Generate next plot registration number
   */
  async generateNextPlotNumber(projectId: string): Promise<string> {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const counts = await getProjectPlotCounts(project._id);
    const nextNumber = counts.plotsSold + counts.plotsReserved + 1;
    return `${project.projPrefix}-${nextNumber.toString().padStart(4, '0')}`;
  },

  /**
   * Increment plot counts - DEPRECATED. Counts now calculated from Plot.
   * Kept for API compatibility; returns project with current counts.
   */
  async incrementPlotCount(
    projectId: string,
    _type: 'sold' | 'reserved',
    _count: number = 1,
    _userId: Types.ObjectId
  ): Promise<any | null> {
    return this.getProjectById(projectId);
  },

  /**
   * Decrement plot counts - DEPRECATED. Counts now calculated from Plot.
   * Kept for API compatibility; returns project with current counts.
   */
  async decrementPlotCount(
    projectId: string,
    _type: 'sold' | 'reserved',
    _count: number = 1,
    _userId: Types.ObjectId
  ): Promise<any | null> {
    return this.getProjectById(projectId);
  },

  /**
   * Search projects by location (geospatial)
   */
  async searchProjectsNearLocation(
    latitude: number,
    longitude: number,
    maxDistance: number = 10000
  ): Promise<any[]> {
    const projects = await Project.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
      isDeleted: false,
      isActive: true,
    })
      .populate('cityId', 'cityName stateId')
      .populate({
        path: 'cityId',
        populate: {
          path: 'stateId',
          select: 'stateName',
        },
      })
      .populate('createdBy', 'firstName lastName email')
      .limit(50);

    const countsMap = await getProjectPlotCountsBatch(projects.map(p => p._id));
    return projects.map(project => {
      const projectObj = project.toObject() as any;
      if (projectObj.cityId) {
        projectObj.cityName = (projectObj.cityId as any).cityName;
        if ((projectObj.cityId as any).stateId) {
          projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
        }
      }
      const counts = countsMap.get(project._id.toString()) || {
        totalPlots: 0,
        plotsAvailable: 0,
        plotsSold: 0,
        plotsReserved: 0,
      };
      Object.assign(projectObj, counts);
      return projectObj;
    });
  },

  /**
   * Get projects with low availability (less than 10% plots available)
   */
  async getProjectsWithLowAvailability(threshold: number = 10): Promise<any[]> {
    const projects = await Project.find({
      isDeleted: false,
      isActive: true,
    })
      .populate('cityId', 'cityName stateId')
      .populate({
        path: 'cityId',
        populate: { path: 'stateId', select: 'stateName' },
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    const countsMap = await getProjectPlotCountsBatch(projects.map(p => p._id));
    const withCounts = projects.map(project => {
      const projectObj = project.toObject() as any;
      const counts = countsMap.get(project._id.toString()) || {
        totalPlots: 0,
        plotsAvailable: 0,
        plotsSold: 0,
        plotsReserved: 0,
      };
      Object.assign(projectObj, counts);
      projectObj.availabilityPercentage =
        counts.totalPlots > 0
          ? Math.round((counts.plotsAvailable / counts.totalPlots) * 100)
          : 0;
      return projectObj;
    });

    const filtered = withCounts
      .filter(p => p.availabilityPercentage <= threshold)
      .sort((a, b) => a.availabilityPercentage - b.availabilityPercentage);

    return filtered.map((projectObj: any) => {
      if (projectObj.cityId && typeof projectObj.cityId === 'object') {
        projectObj.cityName = (projectObj.cityId as any).cityName;
        if ((projectObj.cityId as any).stateId) {
          projectObj.stateName = (projectObj.cityId as any).stateId.stateName;
        }
      }
      return projectObj;
    });
  },

  /**
   * Get project timeline (upcoming events based on status)
   */
  async getProjectTimeline(projectId: string): Promise<any[]> {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    const timeline = [
      {
        event: 'Project Created',
        date: project.createdAt,
        status: 'completed',
      },
      {
        event: 'Project Launched',
        date: project.launchDate,
        status: project.launchDate <= new Date() ? 'completed' : 'upcoming',
      },
    ];

    // Add completion event if applicable
    if (project.completionDate) {
      timeline.push({
        event: 'Project Completed',
        date: project.completionDate,
        status: project.completionDate <= new Date() ? 'completed' : 'upcoming',
      });
    }

    timeline.sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));

    return timeline;
  },

  /**
   * Bulk update project statuses
   */
  async bulkUpdateProjectStatus(
    projectIds: string[],
    status: ProjectStatus,
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    const updateData: any = {
      projStatus: status,
      updatedBy: userId,
    };

    // Set completion date if status is COMPLETED
    if (status === ProjectStatus.COMPLETED) {
      updateData.completionDate = new Date();
    }

    const result = await Project.updateMany(
      {
        _id: { $in: projectIds.map(id => new Types.ObjectId(id)) },
        isDeleted: false,
      },
      { $set: updateData }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },
};
