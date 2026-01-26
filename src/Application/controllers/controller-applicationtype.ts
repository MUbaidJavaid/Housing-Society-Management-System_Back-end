import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateSrApplicationTypeDto,
  SrApplicationTypeQueryParams,
  srApplicationTypeService,
} from '../index-applicationtype';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const srApplicationTypeController = {
  createSrApplicationType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateSrApplicationTypeDto = req.body;

      if (!createData.applicationName?.trim()) {
        throw new AppError(400, 'Application Name is required');
      }
      if (createData.applicationFee === undefined || createData.applicationFee < 0) {
        throw new AppError(400, 'Valid Application Fee is required');
      }

      const exists = await srApplicationTypeService.checkSrApplicationTypeExists(
        createData.applicationName
      );
      if (exists) {
        throw new AppError(409, 'Application Type with this name already exists');
      }

      const srApplicationType = await srApplicationTypeService.createSrApplicationType(
        createData,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: srApplicationType,
        message: 'Application Type created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getSrApplicationType: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const srApplicationType = await srApplicationTypeService.getSrApplicationTypeById(id);

      if (!srApplicationType || (srApplicationType as any).isDeleted) {
        throw new AppError(404, 'Application Type not found');
      }

      res.json({
        success: true,
        data: srApplicationType,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getSrApplicationTypes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: SrApplicationTypeQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await srApplicationTypeService.getSrApplicationTypes(queryParams);

      res.json({
        success: true,
        data: {
          srApplicationTypes: result.srApplicationTypes,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllSrApplicationTypes: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const srApplicationTypes = await srApplicationTypeService.getAllSrApplicationTypes();

      res.json({
        success: true,
        data: srApplicationTypes,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateSrApplicationType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      const existingSrApplicationType = await srApplicationTypeService.getSrApplicationTypeById(id);
      if (!existingSrApplicationType || (existingSrApplicationType as any).isDeleted) {
        throw new AppError(404, 'Application Type not found');
      }

      if (
        updateData.applicationName &&
        updateData.applicationName !== existingSrApplicationType.applicationName
      ) {
        const exists = await srApplicationTypeService.checkSrApplicationTypeExists(
          updateData.applicationName,
          id
        );
        if (exists) {
          throw new AppError(409, 'Application Type with this name already exists');
        }
      }

      const updatedSrApplicationType = await srApplicationTypeService.updateSrApplicationType(
        id,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedSrApplicationType,
        message: 'Application Type updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteSrApplicationType: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const existingSrApplicationType = await srApplicationTypeService.getSrApplicationTypeById(id);
      if (!existingSrApplicationType || (existingSrApplicationType as any).isDeleted) {
        throw new AppError(404, 'Application Type not found');
      }

      const deleted = await srApplicationTypeService.deleteSrApplicationType(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Application Type');
      }

      res.json({
        success: true,
        message: 'Application Type deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
