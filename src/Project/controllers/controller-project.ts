import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { projectService } from '../services/service-project';
import {
  CreateProjectDto,
  ProjectQueryParams,
  ProjectStatus,
  ProjectType,
} from '../types/types-project';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const projectController = {
  /**
   * Create new project
   */
  createProject: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateProjectDto = req.body;

      // Validate required fields
      if (!createData.projName?.trim()) {
        throw new AppError(400, 'Project Name is required');
      }

      if (!createData.projLocation?.trim()) {
        throw new AppError(400, 'Project Location is required');
      }

      if (!createData.projPrefix?.trim()) {
        throw new AppError(400, 'Project Prefix is required');
      }

      if (!createData.totalArea || createData.totalArea <= 0) {
        throw new AppError(400, 'Valid Total Area is required');
      }

      if (!createData.totalPlots || createData.totalPlots <= 0) {
        throw new AppError(400, 'Valid Total Plots is required');
      }

      if (!createData.launchDate) {
        throw new AppError(400, 'Launch Date is required');
      }

      if (!createData.cityId) {
        throw new AppError(400, 'City ID is required');
      }

      // Validate launch date is not in future
      const launchDate = new Date(createData.launchDate);
      if (launchDate > new Date()) {
        throw new AppError(400, 'Launch Date cannot be in the future');
      }

      // Validate completion date if provided
      if (createData.completionDate) {
        const completionDate = new Date(createData.completionDate);
        if (completionDate < launchDate) {
          throw new AppError(400, 'Completion Date must be after Launch Date');
        }
      }

      const project = await projectService.createProject(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get project by ID
   */
  getProject: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const project = await projectService.getProjectById(id);

      if (!project || (project as any).isDeleted) {
        throw new AppError(404, 'Project not found');
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get project by code
   */
  getProjectByCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;

      const project = await projectService.getProjectByCode(code);

      if (!project) {
        throw new AppError(404, 'Project not found');
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all projects
   */
  getProjects: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: ProjectQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        status: req.query.status
          ? ((req.query.status as string).split(',') as ProjectStatus[])
          : undefined,
        type: req.query.type ? ((req.query.type as string).split(',') as ProjectType[]) : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        cityId: req.query.cityId as string,
        country: req.query.country as string,
        minPlots: req.query.minPlots ? parseInt(req.query.minPlots as string) : undefined,
        maxPlots: req.query.maxPlots ? parseInt(req.query.maxPlots as string) : undefined,
        minArea: req.query.minArea ? parseFloat(req.query.minArea as string) : undefined,
        maxArea: req.query.maxArea ? parseFloat(req.query.maxArea as string) : undefined,
        launchedAfter: req.query.launchedAfter
          ? new Date(req.query.launchedAfter as string)
          : undefined,
        launchedBefore: req.query.launchedBefore
          ? new Date(req.query.launchedBefore as string)
          : undefined,
      };

      const result = await projectService.getProjects(queryParams);

      res.json({
        success: true,
        data: {
          projects: result.projects,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update project
   */
  updateProject: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      // Check if project exists
      const existingProject = await projectService.getProjectById(id);
      if (!existingProject || (existingProject as any).isDeleted) {
        throw new AppError(404, 'Project not found');
      }

      // Validate dates if provided
      if (updateData.launchDate) {
        const launchDate = new Date(updateData.launchDate);
        if (launchDate > new Date()) {
          throw new AppError(400, 'Launch Date cannot be in the future');
        }
      }

      if (updateData.completionDate) {
        const completionDate = new Date(updateData.completionDate);
        const launchDate = updateData.launchDate
          ? new Date(updateData.launchDate)
          : new Date(existingProject.launchDate);

        if (completionDate < launchDate) {
          throw new AppError(400, 'Completion Date must be after Launch Date');
        }
      }

      const updatedProject = await projectService.updateProject(id, updateData, req.user.userId);

      res.json({
        success: true,
        data: updatedProject,
        message: 'Project updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete project
   */
  deleteProject: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      // Check if project exists
      const existingProject = await projectService.getProjectById(id);
      if (!existingProject || (existingProject as any).isDeleted) {
        throw new AppError(404, 'Project not found');
      }

      const deleted = await projectService.deleteProject(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Project');
      }

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Toggle project active status
   */
  toggleProjectStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const updatedProject = await projectService.toggleProjectStatus(id, req.user.userId);

      if (!updatedProject) {
        throw new AppError(404, 'Project not found');
      }

      res.json({
        success: true,
        data: updatedProject,
        message: `Project ${updatedProject.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update project status
   */
  updateProjectStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { status } = req.body;

      if (!status || !Object.values(ProjectStatus).includes(status as ProjectStatus)) {
        throw new AppError(400, 'Valid project status is required');
      }

      const updatedProject = await projectService.updateProjectStatus(
        id,
        status as ProjectStatus,
        req.user.userId
      );

      if (!updatedProject) {
        throw new AppError(404, 'Project not found');
      }

      res.json({
        success: true,
        data: updatedProject,
        message: `Project status updated to ${status}`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active projects
   */
  getActiveProjects: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await projectService.getActiveProjects();

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get projects by status
   */
  getProjectsByStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.params.status as ProjectStatus;

      if (!Object.values(ProjectStatus).includes(status)) {
        throw new AppError(400, 'Invalid project status');
      }

      const projects = await projectService.getProjectsByStatus(status);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get projects by city ID
   */
  getProjectsByCityId: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cityId = req.params.cityId as string;

      if (!cityId?.trim()) {
        throw new AppError(400, 'City ID is required');
      }

      const projects = await projectService.getProjectsByCityId(cityId);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get projects by city name
   */
  getProjectsByCityName: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cityName = req.params.cityName as string;

      if (!cityName?.trim()) {
        throw new AppError(400, 'City name is required');
      }

      const projects = await projectService.getProjectsByCityName(cityName);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get project statistics
   */
  getProjectStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await projectService.getProjectStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Generate next plot number
   */
  generateNextPlotNumber: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.id as string;

      const nextPlotNumber = await projectService.generateNextPlotNumber(projectId);

      res.json({
        success: true,
        data: {
          nextPlotNumber,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search projects near location
   */
  searchProjectsNearLocation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { latitude, longitude, maxDistance } = req.query;

      if (!latitude || !longitude) {
        throw new AppError(400, 'Latitude and Longitude are required');
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const distance = maxDistance ? parseInt(maxDistance as string) : 10000;

      if (isNaN(lat) || isNaN(lng)) {
        throw new AppError(400, 'Invalid coordinates');
      }

      const projects = await projectService.searchProjectsNearLocation(lat, lng, distance);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get projects with low availability
   */
  getProjectsWithLowAvailability: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;

      const projects = await projectService.getProjectsWithLowAvailability(threshold);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get project timeline
   */
  getProjectTimeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.id as string;

      const timeline = await projectService.getProjectTimeline(projectId);

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update project statuses
   */
  bulkUpdateProjectStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { projectIds, status } = req.body;

      if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
        throw new AppError(400, 'At least one project ID is required');
      }

      if (!status || !Object.values(ProjectStatus).includes(status as ProjectStatus)) {
        throw new AppError(400, 'Valid project status is required');
      }

      const result = await projectService.bulkUpdateProjectStatus(
        projectIds,
        status as ProjectStatus,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: `Status updated for ${result.modified} projects`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Increment plot count
   */
  incrementPlotCount: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const projectId = req.params.id as string;
      const { type, count = 1 } = req.body;

      if (!type || !['sold', 'reserved'].includes(type)) {
        throw new AppError(400, 'Valid type (sold or reserved) is required');
      }

      if (count <= 0) {
        throw new AppError(400, 'Count must be greater than 0');
      }

      const updatedProject = await projectService.incrementPlotCount(
        projectId,
        type as 'sold' | 'reserved',
        count,
        req.user.userId
      );

      if (!updatedProject) {
        throw new AppError(404, 'Project not found');
      }

      res.json({
        success: true,
        data: updatedProject,
        message: `${count} plot(s) marked as ${type}`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Decrement plot count
   */
  decrementPlotCount: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const projectId = req.params.id as string;
      const { type, count = 1 } = req.body;

      if (!type || !['sold', 'reserved'].includes(type)) {
        throw new AppError(400, 'Valid type (sold or reserved) is required');
      }

      if (count <= 0) {
        throw new AppError(400, 'Count must be greater than 0');
      }

      const updatedProject = await projectService.decrementPlotCount(
        projectId,
        type as 'sold' | 'reserved',
        count,
        req.user.userId
      );

      if (!updatedProject) {
        throw new AppError(404, 'Project not found');
      }

      res.json({
        success: true,
        data: updatedProject,
        message: `${count} plot(s) removed from ${type}`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
