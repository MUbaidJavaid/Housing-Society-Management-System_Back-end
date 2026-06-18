import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { customFormService } from '../services/service-custom-form';
import {
  CreateCustomFormDto,
  CustomFormQueryParams,
  UpdateCustomFormDto,
} from '../types/types-custom-form';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const customFormController = {
  /**
   * Create new custom form field
   */
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateCustomFormDto = req.body;

      const customForm = await customFormService.create(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: customForm,
        message: 'Custom form field created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all custom form fields
   */
  getAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const queryParams: CustomFormQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        entityType: req.query.entityType as string,
        fieldType: req.query.fieldType as any,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        societyId: req.query.societyId as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await customFormService.getAll(queryParams);

      res.json({
        success: true,
        data: {
          customForms: result.customForms,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get custom form field by ID
   */
  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const customForm = await customFormService.getById(id);

      res.json({
        success: true,
        data: customForm,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all fields for an entity type
   */
  getByEntity: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const entityType = req.params.entityType as string;
      const societyId = req.query.societyId as string;

      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const fields = await customFormService.getByEntity(societyId, entityType);

      res.json({
        success: true,
        data: fields,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update custom form field
   */
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateCustomFormDto = req.body;

      const customForm = await customFormService.update(id, updateData, req.user.userId);

      if (!customForm) {
        throw new AppError(404, 'Custom form field not found');
      }

      res.json({
        success: true,
        data: customForm,
        message: 'Custom form field updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete custom form field (soft delete)
   */
  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await customFormService.delete(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Custom form field not found');
      }

      res.json({
        success: true,
        message: 'Custom form field deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Reorder custom form fields
   */
  reorder: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { items } = req.body;

      await customFormService.reorder(items);

      res.json({
        success: true,
        message: 'Custom form fields reordered successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get supported entity types
   */
  getEntityTypes: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const entityTypes = customFormService.getEntityTypes();

      res.json({
        success: true,
        data: entityTypes,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Validate metadata against custom form definitions
   */
  validateMetadata: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { entityType, societyId, metadata } = req.body;

      const result = await customFormService.validateMetadata(entityType, societyId, metadata);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
