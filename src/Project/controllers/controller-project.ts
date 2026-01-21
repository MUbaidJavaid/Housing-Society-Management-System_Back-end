import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { CreateProjectDto, ProjectQueryParams } from '../index-project';
import { projectService } from '../services/service-project';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const projectController = {
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

      // Check if project name already exists
      const exists = await projectService.checkProjectNameExists(createData.projName);
      if (exists) {
        throw new AppError(409, 'Project with this name already exists');
      }

      // Validate dates
      if (createData.projStartDate && createData.projEndDate) {
        const startDate = new Date(createData.projStartDate);
        const endDate = new Date(createData.projEndDate);
        if (endDate <= startDate) {
          throw new AppError(400, 'End date must be after start date');
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

  getProject: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

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

  getProjects: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: ProjectQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        status: req.query.status as 'active' | 'completed' | 'upcoming',
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await projectService.getProjects(queryParams);

      res.json({
        success: true,
        data: {
          projects: result.projects,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getProjectSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await projectService.getProjectSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getProjectsForDropdown: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await projectService.getProjectsForDropdown();

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getProjectStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const stats = await projectService.getProjectStats(id);

      if (!stats) {
        throw new AppError(404, 'Project not found');
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateProject: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;
      const updateData = req.body;

      const existingProject = await projectService.getProjectById(id);
      if (!existingProject || (existingProject as any).isDeleted) {
        throw new AppError(404, 'Project not found');
      }

      // Check if project name is being changed and if it already exists
      if (updateData.projName && updateData.projName !== existingProject.projName) {
        const exists = await projectService.checkProjectNameExists(updateData.projName, id);
        if (exists) {
          throw new AppError(409, 'Project with this name already exists');
        }
      }

      // Validate dates
      if (updateData.projStartDate && updateData.projEndDate) {
        const startDate = new Date(updateData.projStartDate);
        const endDate = new Date(updateData.projEndDate);
        if (endDate <= startDate) {
          throw new AppError(400, 'End date must be after start date');
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

  deleteProject: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;

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
};
