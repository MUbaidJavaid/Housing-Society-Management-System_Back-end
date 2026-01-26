import { AuthRequest } from '../../auth/types';

import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateInstallmentDto,
  InstallmentQueryParams,
  InstallmentStatus,
  InstallmentType,
} from '../index-installment';
import { installmentService } from '../services/service-installment';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const installmentController = {
  createInstallment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateInstallmentDto = req.body;

      // Validate required fields
      if (!createData.memID) {
        throw new AppError(400, 'Member ID is required');
      }
      if (!createData.plotID) {
        throw new AppError(400, 'Plot ID is required');
      }
      if (!createData.installmentNo) {
        throw new AppError(400, 'Installment Number is required');
      }
      if (!createData.installmentType) {
        throw new AppError(400, 'Installment Type is required');
      }
      if (!createData.dueDate) {
        throw new AppError(400, 'Due Date is required');
      }
      if (!createData.amountDue || createData.amountDue <= 0) {
        throw new AppError(400, 'Valid Amount Due is required');
      }

      // Check if installment number already exists for this plot
      const existingInstallment = await installmentService.getInstallmentsByPlot(createData.plotID);
      const duplicate = existingInstallment.find(
        (inst: any) => inst.installmentNo === createData.installmentNo
      );
      if (duplicate) {
        throw new AppError(
          409,
          `Installment number ${createData.installmentNo} already exists for this plot`
        );
      }

      const installment = await installmentService.createInstallment(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: installment,
        message: 'Installment created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const installment = await installmentService.getInstallmentById(id);

      if (!installment || (installment as any).isDeleted) {
        throw new AppError(404, 'Installment not found');
      }

      res.json({
        success: true,
        data: installment,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: InstallmentQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        status: req.query.status as InstallmentStatus,
        installmentType: req.query.installmentType as InstallmentType,
        memID: req.query.memID as string,
        plotID: req.query.plotID as string,
        paymentModeID: req.query.paymentModeID as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        dueDateStart: req.query.dueDateStart as string,
        dueDateEnd: req.query.dueDateEnd as string,
        isOverdue: req.query.isOverdue ? req.query.isOverdue === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await installmentService.getInstallments(queryParams);

      res.json({
        success: true,
        data: {
          installments: result.installments,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await installmentService.getInstallmentSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMemberInstallmentSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { memberId } = req.params;

      const summary = await installmentService.getMemberInstallmentSummary(memberId);

      if (!summary) {
        throw new AppError(404, 'Member not found');
      }

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getUpcomingInstallments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      const installments = await installmentService.getUpcomingInstallments(days);

      res.json({
        success: true,
        data: installments,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getOverdueInstallments: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const installments = await installmentService.getOverdueInstallments();

      res.json({
        success: true,
        data: installments,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentsByMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { memberId } = req.params;

      const installments = await installmentService.getInstallmentsByMember(memberId);

      res.json({
        success: true,
        data: installments,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getInstallmentsByPlot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { plotId } = req.params;

      const installments = await installmentService.getInstallmentsByPlot(plotId);

      res.json({
        success: true,
        data: installments,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  generateInstallments: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { memberId, plotId, totalAmount, numberOfInstallments, installmentType, startDate } =
        req.body;

      // Validate required fields
      if (
        !memberId ||
        !plotId ||
        !totalAmount ||
        !numberOfInstallments ||
        !installmentType ||
        !startDate
      ) {
        throw new AppError(
          400,
          'All fields are required: memberId, plotId, totalAmount, numberOfInstallments, installmentType, startDate'
        );
      }

      if (totalAmount <= 0) {
        throw new AppError(400, 'Total Amount must be positive');
      }

      if (numberOfInstallments <= 0) {
        throw new AppError(400, 'Number of Installments must be positive');
      }

      if (!Object.values(InstallmentType).includes(installmentType)) {
        throw new AppError(400, 'Invalid Installment Type');
      }

      const installments = await installmentService.generateInstallments(
        memberId,
        plotId,
        totalAmount,
        numberOfInstallments,
        installmentType,
        new Date(startDate),
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: installments,
        message: `${installments.length} installments generated successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  makePayment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;
      const paymentData = req.body;

      // Validate payment data
      if (!paymentData.amountPaid || paymentData.amountPaid <= 0) {
        throw new AppError(400, 'Valid payment amount is required');
      }

      if (!paymentData.paymentModeID) {
        throw new AppError(400, 'Payment Mode is required');
      }

      if (!paymentData.paidDate) {
        throw new AppError(400, 'Payment Date is required');
      }

      const existingInstallment = await installmentService.getInstallmentById(id);
      if (!existingInstallment || (existingInstallment as any).isDeleted) {
        throw new AppError(404, 'Installment not found');
      }

      // Check if payment exceeds remaining amount
      const remainingAmount = (existingInstallment as any).remainingAmount;
      if (paymentData.amountPaid > remainingAmount) {
        throw new AppError(
          400,
          `Payment amount cannot exceed remaining amount of ${remainingAmount}`
        );
      }

      const updatedInstallment = await installmentService.makePayment(
        id,
        paymentData,
        req.user.userId
      );

      if (!updatedInstallment) {
        throw new AppError(500, 'Failed to process payment');
      }

      res.json({
        success: true,
        data: updatedInstallment,
        message: 'Payment processed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateInstallment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;
      const updateData = req.body;

      const existingInstallment = await installmentService.getInstallmentById(id);
      if (!existingInstallment || (existingInstallment as any).isDeleted) {
        throw new AppError(404, 'Installment not found');
      }

      const updatedInstallment = await installmentService.updateInstallment(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedInstallment) {
        throw new AppError(500, 'Failed to update Installment');
      }

      res.json({
        success: true,
        data: updatedInstallment,
        message: 'Installment updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteInstallment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;

      const existingInstallment = await installmentService.getInstallmentById(id);
      if (!existingInstallment || (existingInstallment as any).isDeleted) {
        throw new AppError(404, 'Installment not found');
      }

      const deleted = await installmentService.deleteInstallment(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Installment');
      }

      res.json({
        success: true,
        message: 'Installment deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
