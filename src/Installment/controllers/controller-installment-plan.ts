import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { installmentPlanService } from '../services/service-installment-plan';
import {
  CreateInstallmentPlanDto,
  InstallmentPlanQueryParams,
  UpdateInstallmentPlanDto,
} from '../types/types-installment-plan';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const installmentPlanController = {
  createInstallmentPlan: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');

      const createData: CreateInstallmentPlanDto = req.body;
      if (!createData.projId) throw new AppError(400, 'Project is required');
      if (!createData.planName?.trim()) throw new AppError(400, 'Plan name is required');
      if (createData.totalMonths == null || createData.totalMonths < 1)
        throw new AppError(400, 'Valid total months is required');
      if (createData.totalAmount == null || createData.totalAmount < 0)
        throw new AppError(400, 'Valid total amount is required');

      const plan = await installmentPlanService.createInstallmentPlan(
        createData,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: plan,
        message: 'Installment plan created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentPlans: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: InstallmentPlanQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        projectId: req.query.projectId as string,
        search: req.query.search as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await installmentPlanService.getInstallmentPlans(queryParams);

      res.json({
        success: true,
        data: {
          plans: result.plans,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentPlanById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const plan = await installmentPlanService.getInstallmentPlanById(id);

      res.json({
        success: true,
        data: plan,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateInstallmentPlan: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');

      const id = req.params.id as string;
      const updateData: UpdateInstallmentPlanDto = req.body;

      const updated = await installmentPlanService.updateInstallmentPlan(
        id,
        updateData,
        req.user.userId
      );

      if (!updated) throw new AppError(404, 'Installment plan not found');

      res.json({
        success: true,
        data: updated,
        message: 'Installment plan updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteInstallmentPlan: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');

      const id = req.params.id as string;
      const deleted = await installmentPlanService.deleteInstallmentPlan(id, req.user.userId);

      if (!deleted) throw new AppError(404, 'Installment plan not found');

      res.json({
        success: true,
        message: 'Installment plan deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getDashboardSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await installmentPlanService.getDashboardSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  searchInstallmentPlans: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError(400, 'Search term must be at least 2 characters');
      }

      const plans = await installmentPlanService.searchInstallmentPlans(
        searchTerm.trim(),
        limit
      );

      res.json({
        success: true,
        data: plans,
        total: plans.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentPlansByProject: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projId = req.params.projId as string;

      const plans = await installmentPlanService.getInstallmentPlansByProject(projId);

      res.json({
        success: true,
        data: plans,
        total: plans.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
