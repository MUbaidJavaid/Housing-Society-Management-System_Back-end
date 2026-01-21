import { AuthRequest } from '@/auth';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import {
  CreatePaymentModeDto,
  PaymentModeName,
  PaymentModeQueryParams,
} from '../index-paymentmodule';
import { paymentModeService } from '../services/service-paymentmodule';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const paymentModeController = {
  createPaymentMode: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreatePaymentModeDto = req.body;

      // Validate required fields
      if (!createData.paymentModeName) {
        throw new AppError(400, 'Payment Mode Name is required');
      }

      // Validate enum value
      if (!Object.values(PaymentModeName).includes(createData.paymentModeName)) {
        throw new AppError(400, 'Invalid Payment Mode');
      }

      // Check if payment mode already exists
      const exists = await paymentModeService.checkPaymentModeNameExists(
        createData.paymentModeName
      );
      if (exists) {
        throw new AppError(409, 'Payment Mode with this name already exists');
      }

      const paymentMode = await paymentModeService.createPaymentMode(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: paymentMode,
        message: 'Payment Mode created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPaymentMode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const paymentMode = await paymentModeService.getPaymentModeById(id);

      if (!paymentMode || (paymentMode as any).isDeleted) {
        throw new AppError(404, 'Payment Mode not found');
      }

      res.json({
        success: true,
        data: paymentMode,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPaymentModes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: PaymentModeQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await paymentModeService.getPaymentModes(queryParams);

      res.json({
        success: true,
        data: {
          paymentModes: result.paymentModes,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPaymentModeSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await paymentModeService.getPaymentModeSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPaymentModesForDropdown: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const paymentModes = await paymentModeService.getPaymentModesForDropdown();

      res.json({
        success: true,
        data: paymentModes,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getDefaultPaymentModes: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const defaultModes = await paymentModeService.getDefaultPaymentModes();

      res.json({
        success: true,
        data: defaultModes,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updatePaymentMode: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;
      const updateData = req.body;

      const existingPaymentMode = await paymentModeService.getPaymentModeById(id);
      if (!existingPaymentMode || (existingPaymentMode as any).isDeleted) {
        throw new AppError(404, 'Payment Mode not found');
      }

      // Check if payment mode name is being changed and if it already exists
      if (
        updateData.paymentModeName &&
        updateData.paymentModeName !== existingPaymentMode.paymentModeName
      ) {
        // Validate enum value
        if (!Object.values(PaymentModeName).includes(updateData.paymentModeName)) {
          throw new AppError(400, 'Invalid Payment Mode');
        }

        const exists = await paymentModeService.checkPaymentModeNameExists(
          updateData.paymentModeName,
          id
        );
        if (exists) {
          throw new AppError(409, 'Payment Mode with this name already exists');
        }
      }

      const updatedPaymentMode = await paymentModeService.updatePaymentMode(
        id,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedPaymentMode,
        message: 'Payment Mode updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  togglePaymentModeStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;

      const existingPaymentMode = await paymentModeService.getPaymentModeById(id);
      if (!existingPaymentMode || (existingPaymentMode as any).isDeleted) {
        throw new AppError(404, 'Payment Mode not found');
      }

      const toggledPaymentMode = await paymentModeService.togglePaymentModeStatus(
        id,
        req.user.userId
      );

      if (!toggledPaymentMode) {
        throw new AppError(500, 'Failed to toggle Payment Mode status');
      }

      const status = toggledPaymentMode.isActive ? 'activated' : 'deactivated';

      res.json({
        success: true,
        data: toggledPaymentMode,
        message: `Payment Mode ${status} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deletePaymentMode: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;

      const existingPaymentMode = await paymentModeService.getPaymentModeById(id);
      if (!existingPaymentMode || (existingPaymentMode as any).isDeleted) {
        throw new AppError(404, 'Payment Mode not found');
      }

      const deleted = await paymentModeService.deletePaymentMode(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Payment Mode');
      }

      res.json({
        success: true,
        message: 'Payment Mode deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
