import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { installmentPlanDetailService } from '../services/service-installment-plan-detail';
import {
  BulkCreateInstallmentPlanDetailDto,
  CreateInstallmentPlanDetailDto,
  InstallmentPlanDetailQueryParams,
  UpdateInstallmentPlanDetailDto,
} from '../types/types-installment-plan-detail';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const installmentPlanDetailController = {
  createInstallmentPlanDetail: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');

      const createData: CreateInstallmentPlanDetailDto = req.body;
      if (!createData.planId) throw new AppError(400, 'Plan is required');
      if (!createData.instCatId) throw new AppError(400, 'Installment category is required');
      if (createData.occurrence == null || createData.occurrence < 1) {
        throw new AppError(400, 'Valid occurrence is required');
      }

      const pct = createData.percentageAmount ?? 0;
      const fixed = createData.fixedAmount ?? 0;
      if (pct <= 0 && fixed <= 0) {
        throw new AppError(
          400,
          'At least one of percentage amount or fixed amount must be greater than 0'
        );
      }

      const detail = await installmentPlanDetailService.createInstallmentPlanDetail(
        createData,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: detail,
        message: 'Installment plan detail created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  createBulkInstallmentPlanDetails: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');

      const bulkData: BulkCreateInstallmentPlanDetailDto = req.body;
      if (!bulkData.planId) throw new AppError(400, 'Plan ID is required');
      if (!bulkData.details || !Array.isArray(bulkData.details) || bulkData.details.length === 0) {
        throw new AppError(400, 'Details array is required and must not be empty');
      }

      const details =
        await installmentPlanDetailService.createBulkInstallmentPlanDetails(
          bulkData,
          req.user.userId
        );

      res.status(201).json({
        success: true,
        data: details,
        message: `Successfully created ${details.length} plan details`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentPlanDetails: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const queryParams: InstallmentPlanDetailQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        planId: req.query.planId as string,
        instCatId: req.query.instCatId as string,
        occurrence: req.query.occurrence
          ? parseInt(req.query.occurrence as string)
          : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result =
        await installmentPlanDetailService.getInstallmentPlanDetails(queryParams);

      res.json({
        success: true,
        data: {
          details: result.details,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentPlanDetailById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id as string;
      const detail = await installmentPlanDetailService.getInstallmentPlanDetailById(id);

      res.json({
        success: true,
        data: detail,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateInstallmentPlanDetail: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');

      const id = req.params.id as string;
      const updateData: UpdateInstallmentPlanDetailDto = req.body;

      const updated =
        await installmentPlanDetailService.updateInstallmentPlanDetail(
          id,
          updateData,
          req.user.userId
        );

      if (!updated) throw new AppError(404, 'Installment plan detail not found');

      res.json({
        success: true,
        data: updated,
        message: 'Installment plan detail updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteInstallmentPlanDetail: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');

      const id = req.params.id as string;
      const deleted =
        await installmentPlanDetailService.deleteInstallmentPlanDetail(
          id,
          req.user.userId
        );

      if (!deleted) throw new AppError(404, 'Installment plan detail not found');

      res.json({
        success: true,
        message: 'Installment plan detail deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentPlanDetailsByPlan: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const planId = req.params.planId as string;
      const details =
        await installmentPlanDetailService.getInstallmentPlanDetailsByPlan(planId);

      res.json({
        success: true,
        data: details,
        total: details.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentPlanDetailsByCategory: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const instCatId = req.params.instCatId as string;
      const details =
        await installmentPlanDetailService.getInstallmentPlanDetailsByCategory(
          instCatId
        );

      res.json({
        success: true,
        data: details,
        total: details.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  searchInstallmentPlanDetails: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const searchTerm = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm || searchTerm.trim().length < 1) {
        throw new AppError(400, 'Search term is required');
      }

      const details =
        await installmentPlanDetailService.searchInstallmentPlanDetails(
          searchTerm.trim(),
          limit
        );

      res.json({
        success: true,
        data: details,
        total: details.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentPlanDetailSummary: async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const summary =
        await installmentPlanDetailService.getInstallmentPlanDetailSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
