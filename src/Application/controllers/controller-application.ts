import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { uploadService } from '../../imageUpload/services/upload.service';
import { EntityType } from '../../imageUpload/types/upload.types';
import { AppError } from '../../middleware/error.middleware';
import { applicationService } from '../index-application';
import { ApplicationQueryParams, CreateApplicationDto } from '../types/types-application';

const handleError = (error: any, next: NextFunction) => {
  if (error.message.includes('already exists')) {
    next(new AppError(409, error.message));
  } else if (error.message.includes('Invalid') || error.message.includes('inactive')) {
    next(new AppError(400, error.message));
  } else {
    next(error);
  }
};

export const applicationController = {
  createApplication: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateApplicationDto = req.body;

      // Validate required fields
      if (!createData.applicationTypeID) {
        throw new AppError(400, 'Application Type is required');
      }
      if (!createData.memId) {
        throw new AppError(400, 'Member is required');
      }
      if (!createData.statusId) {
        throw new AppError(400, 'Status is required');
      }
      if (!createData.applicationDate) {
        throw new AppError(400, 'Application Date is required');
      }

      if (createData.attachmentPath && !createData.attachmentPath.includes('cloudinary.com')) {
        delete createData.attachmentPath;
      }

      const application = await applicationService.createApplication(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: application,
        message: 'Application created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getApplication: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const application = await applicationService.getApplicationById(id);

      if (!application || (application as any).isDeleted) {
        throw new AppError(404, 'Application not found');
      }

      res.json({
        success: true,
        data: application,
      });
    } catch (error) {
      next(error);
    }
  },

  getApplications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: ApplicationQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        applicationNo: req.query.applicationNo as string,
        applicationTypeID: req.query.applicationTypeID as string,
        memId: req.query.memId as string,
        plotId: req.query.plotId as string,
        statusId: req.query.statusId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await applicationService.getApplications(queryParams);

      res.json({
        success: true,
        data: {
          applications: result.applications,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getApplicationSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await applicationService.getApplicationSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },

  getApplicationsByType: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const typeId = req.params.typeId as string;

      const applications = await applicationService.getApplicationsByType(typeId);

      res.json({
        success: true,
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  },

  getRecentApplications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const applications = await applicationService.getRecentApplications(limit);

      res.json({
        success: true,
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  },

  updateApplication: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      const existingApplication = await applicationService.getApplicationById(id);
      if (!existingApplication || (existingApplication as any).isDeleted) {
        throw new AppError(404, 'Application not found');
      }

      if (updateData.attachmentPath !== undefined) {
        if (updateData.attachmentPath === '') {
          if (existingApplication.attachmentPath) {
            const files = await uploadService.getFilesByEntity(EntityType.APPLICATION, id);
            if (files.length > 0) {
              await uploadService.deleteFromCloudinary(files[0].publicId);
            }
          }
        } else if (!updateData.attachmentPath.includes('cloudinary.com')) {
          delete updateData.attachmentPath;
        } else if (
          existingApplication.attachmentPath &&
          updateData.attachmentPath !== existingApplication.attachmentPath
        ) {
          const files = await uploadService.getFilesByEntity(EntityType.APPLICATION, id);
          if (files.length > 0) {
            await uploadService.deleteFromCloudinary(files[0].publicId);
          }
        }
      }

      const updatedApplication = await applicationService.updateApplication(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedApplication) {
        throw new AppError(500, 'Failed to update Application');
      }

      res.json({
        success: true,
        data: updatedApplication,
        message: 'Application updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteApplication: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const existingApplication = await applicationService.getApplicationById(id);
      if (!existingApplication || (existingApplication as any).isDeleted) {
        throw new AppError(404, 'Application not found');
      }

      if (existingApplication.attachmentPath) {
        const files = await uploadService.getFilesByEntity(EntityType.APPLICATION, id);
        if (files.length > 0) {
          await uploadService.deleteFromCloudinary(files[0].publicId);
        }
      }

      const deleted = await applicationService.deleteApplication(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Application');
      }

      res.json({
        success: true,
        message: 'Application deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
